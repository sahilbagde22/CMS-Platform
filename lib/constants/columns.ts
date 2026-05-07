/**
 * Canonical column names (snake_case) expected per sheet after normalization.
 * Used by the normalizer for fuzzy-matching raw Excel headers.
 */

export const EMPLOYEE_MASTER_COLUMNS = [
  'emp_id',
  'name',
  'department',
  'designation',
  'annual_ctc',
  'monthly_ctc',
  'status',
] as const;

export type EmployeeMasterColumn = (typeof EMPLOYEE_MASTER_COLUMNS)[number];

export const PROJECT_MASTER_COLUMNS = [
  'po_number',
  'project_name',
  'client',
  'vertical',
  'po_value',
  'start_date',
  'end_date',
  'gm_target_pct',
] as const;

export type ProjectMasterColumn = (typeof PROJECT_MASTER_COLUMNS)[number];

export const DEPLOYMENT_LOG_COLUMNS = [
  'emp_id',
  'po_number',
  'deployment_start',
  'deployment_end',
  'revenue',
  'proprietary_charges',
  'blended_revenue_multiplier',
] as const;

export type DeploymentLogColumn = (typeof DEPLOYMENT_LOG_COLUMNS)[number];

/**
 * Common aliases for fuzzy-matching headers.
 * Key = canonical name, Value = list of recognized aliases (lowercase).
 */
export const COLUMN_ALIASES: Record<string, string[]> = {
  emp_id: ['emp_id', 'employee_id', 'empid', 'employee id', 'id', 'emp id', 'staff_id', 'resource_id', 'resource id', 'employee code', 'emp code', 'emp_code', 'user id'],
  name: ['name', 'employee_name', 'full_name', 'fullname', 'employee name', 'staff name', 'resource_name', 'resource name', 'user name'],
  department: ['department', 'dept', 'division', 'team', 'practice', 'business unit', 'bu'],
  designation: ['designation', 'title', 'position', 'role', 'job_title', 'job title', 'level', 'grade'],
  annual_ctc: ['annual_ctc', 'annual ctc', 'ctc', 'yearly_ctc', 'annual salary', 'yearly salary'],
  monthly_ctc: ['monthly_ctc', 'monthly ctc', 'monthly salary', 'salary per month', 'monthly_salary'],
  status: ['status', 'emp_status', 'employee_status', 'active', 'employment_status', 'notes', 'notes status'],
  po_number: ['po_number', 'po number', 'po_no', 'po no', 'purchase_order', 'po', 'project_code', 'project code', 'sow', 'sow number'],
  project_name: ['project_name', 'project name', 'project', 'name', 'title', 'engagement'],
  client: ['client', 'client_name', 'customer', 'account', 'client name', 'funder', 'client funder'],
  vertical: ['vertical', 'business_vertical', 'industry', 'sector', 'practice', 'domain', 'product line', 'sub vertical', 'product line vertical'],
  po_value: ['po_value', 'po value', 'contract_value', 'project_value', 'value', 'order_value', 'amount', 'total po value'],
  start_date: ['start_date', 'start date', 'from_date', 'from date', 'commencement_date', 'start', 'from', 'project start'],
  end_date: ['end_date', 'end date', 'to_date', 'to date', 'expiry_date', 'completion_date', 'end', 'to', 'project end'],
  gm_target_pct: ['gm_target_pct', 'gm target', 'target gm', 'target_gm', 'gm%', 'gross margin target', 'margin target', 'po gross margin', 'required gross margin'],
  deployment_start: ['deployment_start', 'start_date', 'start date', 'from_date', 'from', 'joining_date', 'start'],
  deployment_end: ['deployment_end', 'end_date', 'end date', 'to_date', 'to', 'release_date', 'end'],
  revenue: ['revenue', 'billing', 'billed_amount', 'billed amount', 'amount', 'total revenue', 'billing amount', 'revenue this po', 'billing to the client'],
  proprietary_charges: ['proprietary_charges', 'prop_charges', 'charges', 'overheads', 'expenses'],
  blended_revenue_multiplier: ['blended_revenue_multiplier', 'multiplier', 'revenue_multiplier', 'billing_multiplier'],
};
