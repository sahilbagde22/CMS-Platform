import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { ApiResponse, DepartmentDetail, EmployeeListItem } from '@/types/app.types';

// TODO: Phase 2 — Add Supabase Auth middleware here

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ dept: string }> }
): Promise<NextResponse<ApiResponse<DepartmentDetail>>> {
  try {
    const { dept } = await params;
    const department = decodeURIComponent(dept);
    const supabase = await createClient();

    const { data: latestUpload } = await supabase
      .from('uploads')
      .select('id')
      .eq('status', 'ready')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    if (!latestUpload) {
      return NextResponse.json(
        { success: false, error: 'No data available', code: 'NO_DATA' },
        { status: 404 }
      );
    }

    // Fetch department metrics
    const { data: deptMetrics, error: deptError } = await supabase
      .from('department_metrics')
      .select('*')
      .eq('upload_id', latestUpload.id)
      .eq('department', department)
      .single();

    if (deptError || !deptMetrics) {
      return NextResponse.json(
        { success: false, error: `Department "${department}" not found`, code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Fetch employees in this department
    const { data: employees } = await supabase
      .from('employees')
      .select('*')
      .eq('upload_id', latestUpload.id)
      .eq('department', department);

    const { data: allMetrics } = await supabase
      .from('employee_metrics')
      .select('*')
      .eq('upload_id', latestUpload.id);

    const metricsMap = new Map((allMetrics ?? []).map((m) => [m.emp_id, m]));

    const enrichedEmployees: EmployeeListItem[] = (employees ?? []).map((emp) => {
      const m = metricsMap.get(emp.emp_id);
      return {
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
        metrics: m
          ? {
              emp_id: emp.emp_id,
              total_revenue: m.total_revenue ?? 0,
              total_cost: m.total_cost ?? 0,
              gross_margin: m.gross_margin ?? 0,
              gross_margin_pct: m.gross_margin_pct ?? 0,
              deployment_status: m.deployment_status,
              active_po_count: m.active_po_count,
              total_days_deployed: m.total_days_deployed,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          department: deptMetrics.department,
          headcount: deptMetrics.headcount,
          deployed_count: deptMetrics.deployed_count,
          bench_count: deptMetrics.bench_count,
          deployment_pct: deptMetrics.deployment_pct ?? 0,
          total_revenue: deptMetrics.total_revenue ?? 0,
          total_cost: deptMetrics.total_cost ?? 0,
          total_profit: deptMetrics.total_profit ?? 0,
          gross_margin_pct: deptMetrics.gross_margin_pct ?? 0,
        },
        employees: enrichedEmployees,
      },
    });
  } catch (error) {
    logger.error('[departments/[dept]] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
