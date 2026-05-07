import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { ApiResponse, EmployeeDetail } from '@/types/app.types';

// TODO: Phase 2 — Add Supabase Auth middleware here

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ empId: string }> }
): Promise<NextResponse<ApiResponse<EmployeeDetail>>> {
  try {
    const { empId } = await params;
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
      return NextResponse.json(
        { success: false, error: 'No data available', code: 'NO_DATA' },
        { status: 404 }
      );
    }

    // Fetch employee
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('upload_id', latestUpload.id)
      .eq('emp_id', empId)
      .single();

    if (empError || !employee) {
      return NextResponse.json(
        { success: false, error: `Employee "${empId}" not found`, code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Fetch metrics
    const { data: metricsRow } = await supabase
      .from('employee_metrics')
      .select('*')
      .eq('upload_id', latestUpload.id)
      .eq('emp_id', empId)
      .single();

    const metrics = metricsRow
      ? {
          emp_id: empId,
          total_revenue: metricsRow.total_revenue ?? 0,
          total_cost: metricsRow.total_cost ?? 0,
          gross_margin: metricsRow.gross_margin ?? 0,
          gross_margin_pct: metricsRow.gross_margin_pct ?? 0,
          deployment_status: metricsRow.deployment_status,
          active_po_count: metricsRow.active_po_count,
          total_days_deployed: metricsRow.total_days_deployed,
        }
      : null;

    // Fetch deployments joined with project info
    const { data: deployments } = await supabase
      .from('deployments')
      .select(`
        *,
        projects!deployments_po_number_fkey(project_name, client)
      `)
      .eq('upload_id', latestUpload.id)
      .eq('emp_id', empId)
      .order('deployment_start', { ascending: false });

    const enrichedDeployments = (deployments ?? []).map((d) => ({
      id: d.id,
      upload_id: d.upload_id,
      emp_id: d.emp_id,
      po_number: d.po_number,
      deployment_start: d.deployment_start,
      deployment_end: d.deployment_end,
      revenue: d.revenue,
      proprietary_charges: d.proprietary_charges,
      blended_revenue_multiplier: d.blended_revenue_multiplier,
      status: d.status,
      duration_days: d.duration_days,
      created_at: d.created_at,
      project_name: (d.projects as { project_name: string | null } | null)?.project_name ?? null,
      client: (d.projects as { client: string | null } | null)?.client ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          upload_id: employee.upload_id,
          emp_id: employee.emp_id,
          name: employee.name,
          department: employee.department,
          designation: employee.designation,
          annual_ctc: employee.annual_ctc,
          monthly_ctc: employee.monthly_ctc,
          status: employee.status,
          created_at: employee.created_at,
        },
        metrics,
        deployments: enrichedDeployments,
      },
    });
  } catch (error) {
    logger.error('[employees/[empId]] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
