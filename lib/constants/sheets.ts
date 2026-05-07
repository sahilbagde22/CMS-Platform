/**
 * Canonical sheet names for the OpsHive Excel upload.
 * The upload pipeline validates that ALL THREE sheets are present.
 */
export const SHEET_NAMES = {
  EMPLOYEE_MASTER: 'Employee_Master',
  PROJECT_MASTER: 'Project_Master',
  DEPLOYMENT_LOG: 'Deployment_Log',
} as const;

export type SheetName = (typeof SHEET_NAMES)[keyof typeof SHEET_NAMES];

export const REQUIRED_SHEETS: SheetName[] = [
  SHEET_NAMES.EMPLOYEE_MASTER,
  SHEET_NAMES.PROJECT_MASTER,
  SHEET_NAMES.DEPLOYMENT_LOG,
];
