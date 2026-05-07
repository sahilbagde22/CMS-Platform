/**
 * Employee and deployment status enums for OpsHive.
 * Must match the Supabase `employee_status` and `deployment_status` enum types.
 */
export const EMPLOYEE_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
} as const;

export type EmployeeStatus = (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS];

export const DEPLOYMENT_STATUS = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  BENCH: 'Bench',
} as const;

export type DeploymentStatus = (typeof DEPLOYMENT_STATUS)[keyof typeof DEPLOYMENT_STATUS];

export const UPLOAD_STATUS = {
  PROCESSING: 'processing',
  READY: 'ready',
  ERROR: 'error',
} as const;

export type UploadStatus = (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS];
