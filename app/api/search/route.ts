import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { ApiResponse } from '@/types/app.types';

export interface SearchResult {
  id: string;
  type: 'employee' | 'project' | 'department';
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'rose' | 'slate' | 'violet';
}

export interface SearchData {
  results: SearchResult[];
  query: string;
  total: number;
}

// Fuzzy-ish match: query tokens must all appear in target
function matches(target: string, query: string): boolean {
  const t = target.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => t.includes(token));
}

export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<SearchData>>> {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') ?? '').trim();

    if (query.length < 1) {
      return NextResponse.json({
        success: true,
        data: { results: [], query, total: 0 },
      });
    }

    const supabase = await createClient();

    // Get latest upload
    const { data: latestUpload } = await supabase
      .from('uploads')
      .select('id')
      .eq('status', 'ready')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    if (!latestUpload) {
      return NextResponse.json({
        success: true,
        data: { results: [], query, total: 0 },
      });
    }

    const uploadId = latestUpload.id;

    // Fetch all three datasets in parallel
    const [
      { data: employees },
      { data: projects },
      { data: deptMetrics },
      { data: empMetrics },
    ] = await Promise.all([
      supabase
        .from('employees')
        .select('emp_id, name, department, designation, status')
        .eq('upload_id', uploadId),
      supabase
        .from('projects')
        .select('po_number, project_name, client, vertical, end_date')
        .eq('upload_id', uploadId),
      supabase
        .from('department_metrics')
        .select('department, headcount, deployment_pct, gross_margin_pct')
        .eq('upload_id', uploadId),
      supabase
        .from('employee_metrics')
        .select('emp_id, deployment_status, gross_margin_pct')
        .eq('upload_id', uploadId),
    ]);

    const results: SearchResult[] = [];

    // ── Employees ─────────────────────────────────────────────────────────────
    const metricsMap = new Map(
      (empMetrics ?? []).map((m) => [m.emp_id, m]),
    );

    for (const emp of employees ?? []) {
      const searchStr = [emp.name, emp.emp_id, emp.department, emp.designation]
        .filter(Boolean)
        .join(' ');
      if (!matches(searchStr, query)) continue;

      const m = metricsMap.get(emp.emp_id);
      const deployStatus = m?.deployment_status ?? null;
      const badgeColor =
        deployStatus === 'Deployed'
          ? 'emerald'
          : deployStatus === 'Bench'
            ? 'amber'
            : 'slate';

      results.push({
        id: `emp-${emp.emp_id}`,
        type: 'employee',
        title: emp.name,
        subtitle: `${emp.designation ?? 'Employee'} · ${emp.department} · ${emp.emp_id}`,
        href: `/employees/${emp.emp_id}`,
        badge: deployStatus ?? emp.status,
        badgeColor,
      });
    }

    // ── Projects ──────────────────────────────────────────────────────────────
    for (const proj of projects ?? []) {
      const searchStr = [proj.project_name, proj.po_number, proj.client, proj.vertical]
        .filter(Boolean)
        .join(' ');
      if (!matches(searchStr, query)) continue;

      const isActive = proj.end_date ? new Date(proj.end_date) > new Date() : true;

      results.push({
        id: `proj-${proj.po_number}`,
        type: 'project',
        title: proj.project_name ?? proj.po_number,
        subtitle: `PO: ${proj.po_number}${proj.client ? ` · ${proj.client}` : ''}${proj.vertical ? ` · ${proj.vertical}` : ''}`,
        href: `/projects/${proj.po_number}`,
        badge: isActive ? 'Active' : 'Closed',
        badgeColor: isActive ? 'emerald' : 'slate',
      });
    }

    // ── Departments ───────────────────────────────────────────────────────────
    for (const dept of deptMetrics ?? []) {
      if (!matches(dept.department, query)) continue;

      const gm = dept.gross_margin_pct ?? 0;
      const badgeColor =
        gm >= 30 ? 'emerald' : gm >= 0 ? 'amber' : 'rose';

      results.push({
        id: `dept-${dept.department}`,
        type: 'department',
        title: dept.department,
        subtitle: `${dept.headcount} employees · ${(dept.deployment_pct ?? 0).toFixed(0)}% deployed · GM: ${gm.toFixed(1)}%`,
        href: `/departments/${encodeURIComponent(dept.department)}`,
        badge: `${dept.headcount} people`,
        badgeColor,
      });
    }

    // Sort: employees first, then projects, then departments
    const typeOrder: Record<string, number> = {
      employee: 0,
      project: 1,
      department: 2,
    };
    results.sort(
      (a, b) => typeOrder[a.type] - typeOrder[b.type],
    );

    // Cap at 20 results
    const capped = results.slice(0, 20);

    return NextResponse.json({
      success: true,
      data: { results: capped, query, total: results.length },
    });
  } catch (error) {
    logger.error('[search] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
