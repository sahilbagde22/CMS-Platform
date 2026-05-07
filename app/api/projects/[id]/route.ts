import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { ApiResponse, ProjectDetail } from '@/types/app.types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ProjectDetail>>> {
  try {
    const { id } = await params;
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

    const { data: project, error: projError } = await supabase
      .from('projects')
      .select('*')
      .eq('upload_id', latestUpload.id)
      .eq('po_number', id)
      .single();

    if (projError || !project) {
      return NextResponse.json(
        { success: false, error: `Project "${id}" not found`, code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const { data: deployments } = await supabase
      .from('deployments')
      .select('*')
      .eq('upload_id', latestUpload.id)
      .eq('po_number', id);

    const { data: employees } = await supabase
      .from('employees')
      .select('emp_id, name, department, designation, monthly_ctc, annual_ctc')
      .eq('upload_id', latestUpload.id);

    const empMap = new Map((employees ?? []).map((e) => [e.emp_id, e]));

    const enrichedDeployments = (deployments ?? []).map((d) => {
      const emp = empMap.get(d.emp_id);
      return {
        ...d,
        employee_name: emp?.name ?? d.emp_id,
        department: emp?.department ?? '',
        designation: emp?.designation ?? null,
      };
    });

    const uniqueEmps = new Set((deployments ?? []).map((d) => d.emp_id));
    const activeEmps = new Set(
      (deployments ?? []).filter((d) => d.status === 'Active').map((d) => d.emp_id)
    );
    const totalRevenue = (deployments ?? []).reduce((s, d) => s + (d.revenue ?? 0), 0);
    const totalCost = [...uniqueEmps].reduce((s, empId) => {
      const e = empMap.get(empId);
      return s + (e?.monthly_ctc ?? (e?.annual_ctc ? e.annual_ctc / 12 : 0));
    }, 0);
    const grossMarginPct = totalRevenue > 0
      ? parseFloat((((totalRevenue - totalCost) / totalRevenue) * 100).toFixed(2))
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: project.id,
          upload_id: project.upload_id,
          po_number: project.po_number,
          project_name: project.project_name,
          client: project.client,
          vertical: project.vertical,
          po_value: project.po_value,
          start_date: project.start_date,
          end_date: project.end_date,
          gm_target_pct: project.gm_target_pct,
          created_at: project.created_at,
        },
        resource_count: uniqueEmps.size,
        active_resource_count: activeEmps.size,
        total_revenue: totalRevenue,
        gross_margin_pct: grossMarginPct,
        deployments: enrichedDeployments,
      },
    });
  } catch (error) {
    logger.error('[projects/[id]] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
