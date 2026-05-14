import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { ApiResponse, DepartmentListItem } from '@/types/app.types';


export async function GET(): Promise<NextResponse<ApiResponse<DepartmentListItem[]>>> {
  try {
    const supabase = await createClient();

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

    const { data: deptMetrics, error } = await supabase
      .from('department_metrics')
      .select('*')
      .eq('upload_id', latestUpload.id)
      .order('total_revenue', { ascending: false });

    if (error) {
      logger.error('[departments] Failed to fetch department_metrics', { error });
      return NextResponse.json(
        { success: false, error: 'Failed to load department data', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    const result: DepartmentListItem[] = (deptMetrics ?? []).map((m) => ({
      department: m.department,
      headcount: m.headcount,
      deployed_count: m.deployed_count,
      bench_count: m.bench_count,
      deployment_pct: m.deployment_pct ?? 0,
      total_revenue: m.total_revenue ?? 0,
      total_cost: m.total_cost ?? 0,
      total_profit: m.total_profit ?? 0,
      gross_margin_pct: m.gross_margin_pct ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data: result,
      meta: { total: result.length },
    });
  } catch (error) {
    logger.error('[departments] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
