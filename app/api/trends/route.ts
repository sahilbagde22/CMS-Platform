import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export interface TrendPoint {
  upload_id: string;
  uploaded_at: string;
  label: string;
  total_employees: number;
  deployed_count: number;
  bench_count: number;
  overall_deploy_pct: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  overall_gm_pct: number;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all uploads that are in 'ready' status, ordered chronologically
    const { data: uploads, error: uploadError } = await supabase
      .from('uploads')
      .select('id, uploaded_at, file_name')
      .eq('status', 'ready')
      .order('uploaded_at', { ascending: true });

    if (uploadError) {
      logger.error('[trends] Failed to fetch uploads', { error: uploadError });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch upload history', code: 'UPLOAD_ERROR' },
        { status: 500 }
      );
    }

    if (!uploads || uploads.length === 0) {
      return NextResponse.json({
        success: true,
        data: { trends: [], upload_count: 0 },
      });
    }

    // Get company_metrics for each upload
    const uploadIds = uploads.map((u) => u.id);
    const { data: metrics, error: metricsError } = await supabase
      .from('company_metrics')
      .select('*')
      .in('upload_id', uploadIds);

    if (metricsError) {
      logger.error('[trends] Failed to fetch metrics', { error: metricsError });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch trend metrics', code: 'METRICS_ERROR' },
        { status: 500 }
      );
    }

    // Build a map of upload_id → metrics for fast lookup
    const metricsMap = new Map(
      (metrics ?? []).map((m) => [m.upload_id, m])
    );

    // Build trend points
    const trends: TrendPoint[] = uploads
      .filter((u) => metricsMap.has(u.id))
      .map((u) => {
        const m = metricsMap.get(u.id)!;
        const uploadDate = new Date(u.uploaded_at);
        return {
          upload_id: u.id,
          uploaded_at: u.uploaded_at,
          label: uploadDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
          }),
          total_employees: m.total_employees ?? 0,
          deployed_count: m.deployed_count ?? 0,
          bench_count: m.bench_count ?? 0,
          overall_deploy_pct: m.overall_deploy_pct ?? 0,
          total_revenue: m.total_revenue ?? 0,
          total_cost: m.total_cost ?? 0,
          total_profit: m.total_profit ?? 0,
          overall_gm_pct: m.overall_gm_pct ?? 0,
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        trends,
        upload_count: trends.length,
      },
    });
  } catch (error) {
    logger.error('[trends] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
