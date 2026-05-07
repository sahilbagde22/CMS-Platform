import type { EmployeeMetrics, DepartmentMetrics, CompanyMetrics } from '@/types/app.types';
import { DEPLOYMENT_STATUS } from '@/lib/constants/status';

/**
 * Aggregate company-level metrics from all employee metrics and department metrics.
 */
export function calcCompanyMetrics(
  employeeMetrics: EmployeeMetrics[],
  departmentMetrics: DepartmentMetrics[]
): Omit<CompanyMetrics, 'calculated_at'> {
  const totalEmployees = employeeMetrics.length;

  const deployedCount = employeeMetrics.filter(
    (m) => m.deployment_status === DEPLOYMENT_STATUS.ACTIVE
  ).length;

  const benchCount = employeeMetrics.filter(
    (m) => m.deployment_status === DEPLOYMENT_STATUS.BENCH
  ).length;

  const overallDeployPct = totalEmployees > 0
    ? parseFloat(((deployedCount / totalEmployees) * 100).toFixed(2))
    : 0;

  const totalRevenue = employeeMetrics.reduce((sum, m) => sum + m.total_revenue, 0);
  const totalCost = employeeMetrics.reduce((sum, m) => sum + m.total_cost, 0);
  const totalProfit = totalRevenue - totalCost;

  const overallGmPct = totalRevenue > 0
    ? parseFloat(((totalProfit / totalRevenue) * 100).toFixed(2))
    : 0;

  return {
    total_employees: totalEmployees,
    deployed_count: deployedCount,
    bench_count: benchCount,
    overall_deploy_pct: overallDeployPct,
    total_revenue: totalRevenue,
    total_cost: totalCost,
    total_profit: totalProfit,
    overall_gm_pct: overallGmPct,
  };
}
