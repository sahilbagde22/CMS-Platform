import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { ApiResponse, OverviewData } from '@/types/app.types';

// TODO: Phase 2 — Add Supabase Auth middleware here

export async function GET(): Promise<NextResponse<ApiResponse<OverviewData>>> {
  try {
    const supabase = await createClient();

    // Get the latest upload
    const { data: latestUpload, error: uploadError } = await supabase
      .from('uploads')
      .select('id, uploaded_at')
      .eq('status', 'ready')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    if (uploadError || !latestUpload) {
      return NextResponse.json(
        { success: false, error: 'No data available. Please upload an Excel file first.', code: 'NO_DATA' },
        { status: 404 }
      );
    }

    const { data: metrics, error: metricsError } = await supabase
      .from('company_metrics')
      .select('*')
      .eq('upload_id', latestUpload.id)
      .single();

    if (metricsError || !metrics) {
      logger.error('[overview] Failed to fetch company_metrics', { error: metricsError });
      return NextResponse.json(
        { success: false, error: 'Failed to load overview metrics', code: 'METRICS_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        total_employees: metrics.total_employees,
        deployed_count: metrics.deployed_count,
        bench_count: metrics.bench_count,
        overall_deploy_pct: metrics.overall_deploy_pct ?? 0,
        total_revenue: metrics.total_revenue ?? 0,
        total_cost: metrics.total_cost ?? 0,
        total_profit: metrics.total_profit ?? 0,
        overall_gm_pct: metrics.overall_gm_pct ?? 0,
        calculated_at: metrics.calculated_at,
        last_uploaded_at: latestUpload.uploaded_at,
      },
    });
  } catch (error) {
    logger.error('[overview] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
