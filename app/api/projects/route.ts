import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { ApiResponse, ProjectListItem } from '@/types/app.types';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<ProjectListItem[]>>> {
  try {
    const supabase = await createClient();

    // Get latest ready upload
    const { data: latestUpload } = await supabase
      .from('uploads')
      .select('id')
      .eq('status', 'ready')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    if (!latestUpload) {
      return NextResponse.json({ success: true, data: [], meta: { total: 0 } });
    }

    // Fetch all projects for this upload
    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('*')
      .eq('upload_id', latestUpload.id);

    if (projError) {
      logger.error('[projects] Failed to fetch projects', { error: projError });
      return NextResponse.json(
        { success: false, error: 'Failed to load projects', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Fetch all deployments to compute project metrics
    const { data: deployments } = await supabase
      .from('deployments')
      .select('po_number, emp_id, revenue, status')
      .eq('upload_id', latestUpload.id);

    // Fetch all employees to compute costs
    const { data: employees } = await supabase
      .from('employees')
      .select('emp_id, monthly_ctc, annual_ctc')
      .eq('upload_id', latestUpload.id);

    const empMap = new Map((employees ?? []).map((e) => [e.emp_id, e]));

    // Group deployments by PO number
    // We explicitly cast the deployments array type so we can push into it safely
    type DeploymentType = NonNullable<typeof deployments>[0];
    const depsByPo = new Map<string, DeploymentType[]>();
    for (const d of (deployments ?? [])) {
      const arr = depsByPo.get(d.po_number) ?? [];
      arr.push(d);
      depsByPo.set(d.po_number, arr);
    }

    const result: ProjectListItem[] = (projects ?? []).map((proj) => {
      const projDeps = depsByPo.get(proj.po_number) ?? [];
      
      const uniqueEmps = new Set(projDeps.map((d) => d.emp_id));
      const activeEmps = new Set(
        projDeps.filter((d) => d.status === 'Active').map((d) => d.emp_id)
      );
      
      const totalRevenue = projDeps.reduce((sum, d) => sum + (d.revenue ?? 0), 0);
      const totalCost = [...uniqueEmps].reduce((sum, empId) => {
        const e = empMap.get(empId);
        return sum + (e?.monthly_ctc ?? (e?.annual_ctc ? e.annual_ctc / 12 : 0));
      }, 0);
      
      const grossMarginPct = totalRevenue > 0
        ? parseFloat((((totalRevenue - totalCost) / totalRevenue) * 100).toFixed(2))
        : 0;

      return {
        id: proj.id,
        upload_id: proj.upload_id,
        po_number: proj.po_number,
        project_name: proj.project_name,
        client: proj.client,
        vertical: proj.vertical,
        po_value: proj.po_value,
        start_date: proj.start_date,
        end_date: proj.end_date,
        gm_target_pct: proj.gm_target_pct,
        created_at: proj.created_at,
        resource_count: uniqueEmps.size,
        active_resource_count: activeEmps.size,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        gross_margin_pct: grossMarginPct,
      };
    });

    // Optional sorting: let's sort by total_revenue descending by default
    result.sort((a, b) => b.total_revenue - a.total_revenue);

    return NextResponse.json({
      success: true,
      data: result,
      meta: { total: result.length },
    });

  } catch (error) {
    logger.error('[projects] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
