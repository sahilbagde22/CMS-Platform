import type { DeploymentRowInput } from '@/lib/validators/deployment.schema';
import type { DeploymentStatus } from '@/lib/constants/status';
import { DEPLOYMENT_STATUS } from '@/lib/constants/status';

/**
 * Calculate duration in days between two dates.
 * Uses today as end date if deployment_end is null (ongoing).
 */
export function calcDurationDays(
  start: string | null | undefined,
  end: string | null | undefined
): number {
  if (!start) return 0;
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diff = endDate.getTime() - startDate.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Determine deployment status for a single deployment row.
 * Active: deployment_end is null OR deployment_end > today
 * Completed: deployment_end <= today
 */
export function calcDeploymentStatus(
  deploymentEnd: string | null | undefined
): DeploymentStatus {
  if (!deploymentEnd) return DEPLOYMENT_STATUS.ACTIVE;
  return new Date(deploymentEnd) > new Date()
    ? DEPLOYMENT_STATUS.ACTIVE
    : DEPLOYMENT_STATUS.COMPLETED;
}

/**
 * Enrich raw deployment rows with calculated status + duration_days.
 */
export function enrichDeployments(
  deployments: DeploymentRowInput[]
): (DeploymentRowInput & { status: DeploymentStatus; duration_days: number })[] {
  return deployments.map((d) => ({
    ...d,
    status: calcDeploymentStatus(d.deployment_end),
    duration_days: calcDurationDays(d.deployment_start, d.deployment_end),
  }));
}
