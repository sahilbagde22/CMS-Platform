import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { ApiResponse, OverviewData } from '@/types/app.types';

export async function GET(): Promise<NextResponse<ApiResponse<OverviewData>>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Get the top 2 latest uploads
    const { data: recentUploads, error: uploadError } = await supabase
      .from('uploads')
      .select('id, uploaded_at')
      .eq('user_id', user.id)
      .eq('status', 'ready')
      .order('uploaded_at', { ascending: false })
      .limit(2);

    if (uploadError || !recentUploads || recentUploads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data available. Please upload an Excel file first.', code: 'NO_DATA' },
        { status: 404 }
      );
    }

    const latestUpload = recentUploads[0];
    const previousUpload = recentUploads.length > 1 ? recentUploads[1] : null;

    const { data: metricsData, error: metricsError } = await supabase
      .from('company_metrics')
      .select('*')
      .in('upload_id', recentUploads.map(u => u.id));

    if (metricsError || !metricsData || metricsData.length === 0) {
      logger.error('[overview] Failed to fetch company_metrics', { error: metricsError });
      return NextResponse.json(
        { success: false, error: 'Failed to load overview metrics', code: 'METRICS_ERROR' },
        { status: 500 }
      );
    }

    const metrics = metricsData.find(m => m.upload_id === latestUpload.id);
    const prevMetrics = previousUpload ? metricsData.find(m => m.upload_id === previousUpload.id) : null;

    if (!metrics) {
      logger.error('[overview] Failed to fetch company_metrics', { error: metricsError });
      return NextResponse.json(
        { success: false, error: 'Failed to load overview metrics', code: 'METRICS_ERROR' },
        { status: 500 }
      );
    }

    const trends = prevMetrics ? {
      revenue: prevMetrics.total_revenue ? ((metrics.total_revenue - prevMetrics.total_revenue) / prevMetrics.total_revenue) * 100 : 0,
      profit: prevMetrics.total_profit ? ((metrics.total_profit - prevMetrics.total_profit) / Math.abs(prevMetrics.total_profit)) * 100 : 0,
      employees: prevMetrics.total_employees ? ((metrics.total_employees - prevMetrics.total_employees) / prevMetrics.total_employees) * 100 : 0,
      deployed: prevMetrics.deployed_count ? ((metrics.deployed_count - prevMetrics.deployed_count) / prevMetrics.deployed_count) * 100 : 0,
      bench: prevMetrics.bench_count ? ((metrics.bench_count - prevMetrics.bench_count) / prevMetrics.bench_count) * 100 : 0,
      gm: metrics.overall_gm_pct - prevMetrics.overall_gm_pct, // Absolute percentage point difference
    } : undefined;

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
        trends,
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
