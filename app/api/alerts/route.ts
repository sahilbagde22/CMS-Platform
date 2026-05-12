import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Alert, AlertsData, ApiResponse } from '@/types/app.types';

// ─── Alert Thresholds ─────────────────────────────────────────────────────────
const THRESHOLDS = {
  /** GM% below this triggers a CRITICAL margin alert per department */
  MARGIN_CRITICAL: 0,
  /** GM% below this triggers a WARNING margin alert per department */
  MARGIN_WARNING: 20,
  /** Bench rate above this triggers a CRITICAL utilization alert */
  BENCH_RATE_CRITICAL: 60,
  /** Bench rate above this triggers a WARNING utilization alert */
  BENCH_RATE_WARNING: 40,
  /** Days until project end triggers an expiry warning */
  PROJECT_EXPIRY_DAYS: 30,
  /** Number of employees on bench threshold for company-level critical */
  BENCH_COUNT_CRITICAL: 5,
};

export async function GET(): Promise<NextResponse<ApiResponse<AlertsData>>> {
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
      return NextResponse.json({
        success: true,
        data: { alerts: [], critical_count: 0, warning_count: 0, info_count: 0, total: 0 },
      });
    }

    const uploadId = latestUpload.id;
    const alerts: Alert[] = [];

    // ── Fetch data in parallel ────────────────────────────────────────────────
    const [
      { data: companyMetrics },
      { data: deptMetrics },
      { data: projects },
      { data: employeeMetrics },
    ] = await Promise.all([
      supabase.from('company_metrics').select('*').eq('upload_id', uploadId).single(),
      supabase.from('department_metrics').select('*').eq('upload_id', uploadId),
      supabase.from('projects').select('*').eq('upload_id', uploadId),
      supabase.from('employee_metrics').select('*').eq('upload_id', uploadId),
    ]);

    // ── 1. Company-level bench alert ──────────────────────────────────────────
    if (companyMetrics) {
      const benchRate = companyMetrics.overall_deploy_pct
        ? 100 - companyMetrics.overall_deploy_pct
        : 0;

      if (companyMetrics.bench_count >= THRESHOLDS.BENCH_COUNT_CRITICAL) {
        alerts.push({
          id: 'company-bench-critical',
          severity: benchRate >= THRESHOLDS.BENCH_RATE_CRITICAL ? 'critical' : 'warning',
          category: 'bench',
          title: `${companyMetrics.bench_count} employees on bench`,
          description: `${benchRate.toFixed(0)}% of the workforce is currently undeployed. This is directly impacting revenue and profitability.`,
          href: '/employees?status=Active',
          value: companyMetrics.bench_count,
        });
      }

      // Company-level negative profit
      if ((companyMetrics.total_profit ?? 0) < 0) {
        alerts.push({
          id: 'company-negative-profit',
          severity: 'critical',
          category: 'margin',
          title: 'Company is operating at a loss',
          description: `Total profit is ₹${Math.abs(companyMetrics.total_profit ?? 0).toLocaleString('en-IN')} negative. Immediate review of cost structure is recommended.`,
          href: '/overview',
          value: companyMetrics.total_profit ?? 0,
        });
      }

      // Low overall GM%
      if ((companyMetrics.overall_gm_pct ?? 0) < THRESHOLDS.MARGIN_WARNING && (companyMetrics.overall_gm_pct ?? 0) >= 0) {
        alerts.push({
          id: 'company-low-gm',
          severity: 'warning',
          category: 'margin',
          title: `Low overall gross margin: ${(companyMetrics.overall_gm_pct ?? 0).toFixed(1)}%`,
          description: `Company-wide GM% is below the 20% target. Review high-cost deployments and project pricing.`,
          href: '/departments',
          value: companyMetrics.overall_gm_pct ?? 0,
        });
      }
    }

    // ── 2. Department-level alerts ────────────────────────────────────────────
    for (const dept of deptMetrics ?? []) {
      const benchRate = dept.headcount > 0
        ? (dept.bench_count / dept.headcount) * 100
        : 0;

      // Department negative GM
      if ((dept.gross_margin_pct ?? 0) < THRESHOLDS.MARGIN_CRITICAL) {
        alerts.push({
          id: `dept-negative-gm-${dept.department}`,
          severity: 'critical',
          category: 'margin',
          title: `${dept.department}: Negative margin (${(dept.gross_margin_pct ?? 0).toFixed(1)}%)`,
          description: `This department is generating a loss. Revenue (₹${dept.total_revenue.toLocaleString('en-IN')}) is less than cost (₹${dept.total_cost.toLocaleString('en-IN')}).`,
          href: `/departments/${encodeURIComponent(dept.department)}`,
          value: dept.gross_margin_pct ?? 0,
        });
      } else if ((dept.gross_margin_pct ?? 0) < THRESHOLDS.MARGIN_WARNING) {
        alerts.push({
          id: `dept-low-gm-${dept.department}`,
          severity: 'warning',
          category: 'margin',
          title: `${dept.department}: GM% below target (${(dept.gross_margin_pct ?? 0).toFixed(1)}%)`,
          description: `Below the 20% gross margin target. Consider rebalancing project allocations or reviewing billing rates.`,
          href: `/departments/${encodeURIComponent(dept.department)}`,
          value: dept.gross_margin_pct ?? 0,
        });
      }

      // High bench rate per department
      if (benchRate >= THRESHOLDS.BENCH_RATE_CRITICAL && dept.bench_count > 0) {
        alerts.push({
          id: `dept-high-bench-${dept.department}`,
          severity: 'critical',
          category: 'utilization',
          title: `${dept.department}: ${benchRate.toFixed(0)}% bench rate`,
          description: `${dept.bench_count} of ${dept.headcount} employees are on bench in this department. Urgent redeployment needed.`,
          href: `/departments/${encodeURIComponent(dept.department)}`,
          value: benchRate,
        });
      } else if (benchRate >= THRESHOLDS.BENCH_RATE_WARNING && dept.bench_count > 0) {
        alerts.push({
          id: `dept-warn-bench-${dept.department}`,
          severity: 'warning',
          category: 'utilization',
          title: `${dept.department}: Elevated bench rate (${benchRate.toFixed(0)}%)`,
          description: `${dept.bench_count} employees are currently undeployed. Consider proactive redeployment planning.`,
          href: `/departments/${encodeURIComponent(dept.department)}`,
          value: benchRate,
        });
      }
    }

    // ── 3. Project expiry alerts ──────────────────────────────────────────────
    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + THRESHOLDS.PROJECT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    for (const project of projects ?? []) {
      if (!project.end_date) continue;
      const endDate = new Date(project.end_date);
      if (endDate <= now) continue; // already expired, not an upcoming warning

      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (endDate <= thirtyDaysOut) {
        alerts.push({
          id: `project-expiring-${project.po_number}`,
          severity: daysLeft <= 7 ? 'critical' : 'warning',
          category: 'project',
          title: `Project expiring in ${daysLeft} day${daysLeft === 1 ? '' : 's'}: ${project.project_name ?? project.po_number}`,
          description: `PO ${project.po_number}${project.client ? ` (${project.client})` : ''} ends on ${new Date(project.end_date).toLocaleDateString('en-IN')}. Plan resource redeployment.`,
          href: `/projects/${project.po_number}`,
          value: daysLeft,
        });
      }
    }

    // ── 4. Zero-revenue employees (info) ──────────────────────────────────────
    const zeroRevenueDeployed = (employeeMetrics ?? []).filter(
      (m) => m.deployment_status === 'Deployed' && (m.total_revenue ?? 0) === 0
    );

    if (zeroRevenueDeployed.length > 0) {
      alerts.push({
        id: 'zero-revenue-deployed',
        severity: 'info',
        category: 'utilization',
        title: `${zeroRevenueDeployed.length} deployed employee${zeroRevenueDeployed.length > 1 ? 's' : ''} with ₹0 revenue`,
        description: 'These employees are marked as Deployed but have no revenue recorded. Check if billing data is missing in the Deployment Log.',
        href: '/employees',
        value: zeroRevenueDeployed.length,
      });
    }

    // ── Sort: critical → warning → info ──────────────────────────────────────
    const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const critical_count = alerts.filter((a) => a.severity === 'critical').length;
    const warning_count = alerts.filter((a) => a.severity === 'warning').length;
    const info_count = alerts.filter((a) => a.severity === 'info').length;

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        critical_count,
        warning_count,
        info_count,
        total: alerts.length,
      },
    });
  } catch (error) {
    logger.error('[alerts] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
