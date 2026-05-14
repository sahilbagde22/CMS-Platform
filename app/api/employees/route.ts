import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { ApiResponse, EmployeeListItem } from '@/types/app.types';

// Allowed sort columns whitelist — never pass raw user input to SQL
const ALLOWED_SORT_COLUMNS = new Set([
  'name', 'department', 'designation', 'status',
  'total_revenue', 'gross_margin_pct', 'deployment_status',
]);


export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<EmployeeListItem[]>>> {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const sortRaw = searchParams.get('sort') ?? 'name';
    const order = searchParams.get('order') === 'desc' ? false : true;

    // Sanitize sort column
    const sortColumn = ALLOWED_SORT_COLUMNS.has(sortRaw) ? sortRaw : 'name';

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

    // Fetch employees
    let empQuery = supabase
      .from('employees')
      .select('*')
      .eq('upload_id', latestUpload.id);

    if (department) empQuery = empQuery.eq('department', department);
    if (status) empQuery = empQuery.eq('status', status);

    const { data: employees, error: empError } = await empQuery;

    if (empError) {
      logger.error('[employees] Failed to fetch employees', { error: empError });
      return NextResponse.json(
        { success: false, error: 'Failed to load employees', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Fetch employee metrics for this upload
    const { data: allMetrics } = await supabase
      .from('employee_metrics')
      .select('*')
      .eq('upload_id', latestUpload.id);

    const metricsMap = new Map(
      (allMetrics ?? []).map((m) => [m.emp_id, m])
    );

    const result: EmployeeListItem[] = (employees ?? []).map((emp) => ({
      id: emp.id,
      upload_id: emp.upload_id,
      emp_id: emp.emp_id,
      name: emp.name,
      department: emp.department,
      designation: emp.designation,
      annual_ctc: emp.annual_ctc,
      monthly_ctc: emp.monthly_ctc,
      status: emp.status,
      created_at: emp.created_at,
      metrics: metricsMap.has(emp.emp_id)
        ? {
            emp_id: emp.emp_id,
            total_revenue: metricsMap.get(emp.emp_id)!.total_revenue ?? 0,
            total_cost: metricsMap.get(emp.emp_id)!.total_cost ?? 0,
            gross_margin: metricsMap.get(emp.emp_id)!.gross_margin ?? 0,
            gross_margin_pct: metricsMap.get(emp.emp_id)!.gross_margin_pct ?? 0,
            deployment_status: metricsMap.get(emp.emp_id)!.deployment_status,
            active_po_count: metricsMap.get(emp.emp_id)!.active_po_count,
            total_days_deployed: metricsMap.get(emp.emp_id)!.total_days_deployed,
          }
        : null,
    }));

    // Sort client-side since we're joining metrics
    result.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortColumn === 'total_revenue') {
        valA = a.metrics?.total_revenue ?? 0;
        valB = b.metrics?.total_revenue ?? 0;
      } else if (sortColumn === 'gross_margin_pct') {
        valA = a.metrics?.gross_margin_pct ?? 0;
        valB = b.metrics?.gross_margin_pct ?? 0;
      } else if (sortColumn === 'deployment_status') {
        valA = a.metrics?.deployment_status ?? '';
        valB = b.metrics?.deployment_status ?? '';
      } else {
        valA = (a as unknown as Record<string, unknown>)[sortColumn] as string ?? '';
        valB = (b as unknown as Record<string, unknown>)[sortColumn] as string ?? '';
      }

      if (valA < valB) return order ? -1 : 1;
      if (valA > valB) return order ? 1 : -1;
      return 0;
    });

    return NextResponse.json({
      success: true,
      data: result,
      meta: { total: result.length },
    });
  } catch (error) {
    logger.error('[employees] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
