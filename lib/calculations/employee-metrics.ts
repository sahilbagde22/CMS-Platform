import type { DeploymentRowInput } from '@/lib/validators/deployment.schema';
import type { EmployeeRowInput } from '@/lib/validators/employee.schema';
import type { DeploymentStatus } from '@/lib/constants/status';
import { DEPLOYMENT_STATUS } from '@/lib/constants/status';
import { calcDeploymentStatus, calcDurationDays } from './deployment-calculator';
import type { EmployeeMetrics } from '@/types/app.types';

type EnrichedDeployment = DeploymentRowInput & {
  status: DeploymentStatus;
  duration_days: number;
};

/**
 * Calculate per-employee metrics from their deployment rows.
 *
 * Revenue = sum of all deployment revenue rows for this emp_id
 * Cost = monthly_ctc (derived from annual_ctc / 12 if not set directly)
 * Gross Margin = Revenue - Cost
 * GM% = (Gross Margin / Revenue) * 100 — guard div/0
 * Deployment status = Active if ANY deployment is still active, else Bench
 */
export function calcEmployeeMetrics(
  employee: EmployeeRowInput,
  deployments: EnrichedDeployment[]
): EmployeeMetrics {
  const empDeployments = deployments.filter((d) => d.emp_id === employee.emp_id);

  const totalRevenue = empDeployments.reduce((sum, d) => sum + (d.revenue ?? 0), 0);

  const monthlyCost =
    employee.monthly_ctc ?? (employee.annual_ctc !== null && employee.annual_ctc !== undefined
      ? employee.annual_ctc / 12
      : 0);

  const totalCost = monthlyCost;

  const grossMargin = totalRevenue - totalCost;
  const grossMarginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

  const isDeployed = empDeployments.some((d) => d.status === DEPLOYMENT_STATUS.ACTIVE);
  const deploymentStatus: DeploymentStatus =
    employee.status === 'Inactive'
      ? DEPLOYMENT_STATUS.COMPLETED
      : isDeployed
        ? DEPLOYMENT_STATUS.ACTIVE
        : DEPLOYMENT_STATUS.BENCH;

  const activePoCount = empDeployments.filter((d) => d.status === DEPLOYMENT_STATUS.ACTIVE).length;

  const totalDaysDeployed = empDeployments.reduce((sum, d) => {
    if (!d.deployment_start) return sum;
    return sum + calcDurationDays(d.deployment_start, d.deployment_end);
  }, 0);

  return {
    emp_id: employee.emp_id,
    total_revenue: totalRevenue,
    total_cost: totalCost,
    gross_margin: grossMargin,
    gross_margin_pct: parseFloat(grossMarginPct.toFixed(2)),
    deployment_status: deploymentStatus,
    active_po_count: activePoCount,
    total_days_deployed: totalDaysDeployed,
  };
}

/**
 * Calculate metrics for all employees in a batch.
 */
export function calcAllEmployeeMetrics(
  employees: EmployeeRowInput[],
  deployments: EnrichedDeployment[]
): EmployeeMetrics[] {
  return employees.map((emp) => calcEmployeeMetrics(emp, deployments));
}

// Re-export for convenience
export { calcDeploymentStatus };
