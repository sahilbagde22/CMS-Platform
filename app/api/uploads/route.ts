import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Get all uploads ordered chronologically (newest first)
    const { data: uploads, error: uploadError } = await supabase
      .from('uploads')
      .select('id, uploaded_at, file_name, file_size, status, error_msg')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (uploadError) {
      logger.error('[uploads] Failed to fetch uploads', { error: uploadError });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch upload history', code: 'UPLOAD_ERROR' },
        { status: 500 }
      );
    }

    if (!uploads || uploads.length === 0) {
      return NextResponse.json({
        success: true,
        data: { uploads: [] },
      });
    }

    // Get company_metrics for ready uploads
    const readyUploadIds = uploads.filter(u => u.status === 'ready').map((u) => u.id);
    let metricsMap = new Map();
    
    if (readyUploadIds.length > 0) {
      const { data: metrics, error: metricsError } = await supabase
        .from('company_metrics')
        .select('*')
        .in('upload_id', readyUploadIds);

      if (!metricsError && metrics) {
        metricsMap = new Map(metrics.map((m) => [m.upload_id, m]));
      }
    }

    // Build history list
    const history = uploads.map((u) => {
      const m = metricsMap.get(u.id);
      return {
        id: u.id,
        uploaded_at: u.uploaded_at,
        file_name: u.file_name,
        file_size: u.file_size,
        status: u.status,
        error_msg: u.error_msg,
        metrics: m ? {
          total_employees: m.total_employees,
          total_revenue: m.total_revenue,
          overall_gm_pct: m.overall_gm_pct,
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        uploads: history,
      },
    });
  } catch (error) {
    logger.error('[uploads] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
