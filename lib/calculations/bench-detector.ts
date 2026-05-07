import type { EmployeeMetrics } from '@/types/app.types';
import { DEPLOYMENT_STATUS } from '@/lib/constants/status';

/**
 * Identify bench employees: Active employees with no active deployments.
 * Returns the list of emp_ids on bench.
 */
export function detectBenchEmployees(employeeMetrics: EmployeeMetrics[]): string[] {
  return employeeMetrics
    .filter((m) => m.deployment_status === DEPLOYMENT_STATUS.BENCH)
    .map((m) => m.emp_id);
}

/**
 * Bench rate = bench_count / total_active_employees * 100
 */
export function calcBenchRate(employeeMetrics: EmployeeMetrics[]): number {
  const total = employeeMetrics.length;
  if (total === 0) return 0;
  const bench = employeeMetrics.filter(
    (m) => m.deployment_status === DEPLOYMENT_STATUS.BENCH
  ).length;
  return parseFloat(((bench / total) * 100).toFixed(2));
}
