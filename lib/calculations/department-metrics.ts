import type { EmployeeRowInput } from '@/lib/validators/employee.schema';
import type { EmployeeMetrics, DepartmentMetrics } from '@/types/app.types';
import { DEPLOYMENT_STATUS } from '@/lib/constants/status';

/**
 * Calculate per-department aggregated metrics.
 *
 * headcount = all employees in dept (Active + Inactive)
 * deployed_count = employees with deployment_status === 'Active'
 * bench_count = Active employees with deployment_status !== 'Active'
 * deployment_pct = deployed / headcount * 100
 * total_revenue = sum of emp_metrics.total_revenue
 * total_cost = sum of monthly_ctc across all employees
 * gross_margin_pct = (profit / revenue) * 100
 */
export function calcDepartmentMetrics(
  department: string,
  employees: EmployeeRowInput[],
  employeeMetrics: EmployeeMetrics[]
): DepartmentMetrics {
  const deptEmployees = employees.filter((e) => e.department === department);

  const headcount = deptEmployees.length;

  const deptMetrics = employeeMetrics.filter((m) =>
    deptEmployees.some((e) => e.emp_id === m.emp_id)
  );

  const deployedCount = deptMetrics.filter(
    (m) => m.deployment_status === DEPLOYMENT_STATUS.ACTIVE
  ).length;

  // Bench = active employees not deployed
  const activeEmployeeCount = deptEmployees.filter((e) => e.status === 'Active').length;
  const benchCount = Math.max(0, activeEmployeeCount - deployedCount);

  const deploymentPct = headcount > 0
    ? parseFloat(((deployedCount / headcount) * 100).toFixed(2))
    : 0;

  const totalRevenue = deptMetrics.reduce((sum, m) => sum + m.total_revenue, 0);

  const totalCost = deptEmployees.reduce((sum, e) => {
    const cost = e.monthly_ctc ?? (e.annual_ctc !== null && e.annual_ctc !== undefined ? e.annual_ctc / 12 : 0);
    return sum + cost;
  }, 0);

  const totalProfit = totalRevenue - totalCost;
  const grossMarginPct = totalRevenue > 0
    ? parseFloat(((totalProfit / totalRevenue) * 100).toFixed(2))
    : 0;

  return {
    department,
    headcount,
    deployed_count: deployedCount,
    bench_count: benchCount,
    deployment_pct: deploymentPct,
    total_revenue: totalRevenue,
    total_cost: totalCost,
    total_profit: totalProfit,
    gross_margin_pct: grossMarginPct,
  };
}

/**
 * Calculate metrics for all departments found in the employee list.
 */
export function calcAllDepartmentMetrics(
  employees: EmployeeRowInput[],
  employeeMetrics: EmployeeMetrics[]
): DepartmentMetrics[] {
  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];
  return departments.map((dept) =>
    calcDepartmentMetrics(dept, employees, employeeMetrics)
  );
}
