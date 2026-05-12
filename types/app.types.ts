import type { DeploymentStatus, EmployeeStatus } from '@/lib/constants/status';

// ─── Smart Alerts ──────────────────────────────────────────────────────────────

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory = 'bench' | 'margin' | 'project' | 'utilization';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  /** Optional deep-link to the relevant page */
  href?: string;
  /** Optional numeric value driving the alert */
  value?: number;
}

export interface AlertsData {
  alerts: Alert[];
  critical_count: number;
  warning_count: number;
  info_count: number;
  total: number;
}

// ─── API Response Envelope ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    total: number;
    page?: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Upload / Excel Pipeline ──────────────────────────────────────────────────

export interface ParsedSheet {
  sheetName: string;
  headers: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  wasTruncated: boolean;
  originalRowCount: number;
}

export interface ColumnNormalizationResult {
  originalName: string;
  canonicalName: string;
  matchScore: number;
  wasExactMatch: boolean;
}

export interface SheetValidationWarning {
  sheet: string;
  message: string;
  columns?: string[];
}

export interface SheetValidationError {
  sheet?: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: SheetValidationError[];
  warnings: SheetValidationWarning[];
  normalizations: Record<string, ColumnNormalizationResult[]>;
}

export interface UploadResult {
  uploadId: string;
  warnings: SheetValidationWarning[];
}

// ─── Domain Rows (raw DB data) ────────────────────────────────────────────────

export interface EmployeeRow {
  id: string;
  upload_id: string;
  emp_id: string;
  name: string;
  department: string;
  designation: string | null;
  annual_ctc: number | null;
  monthly_ctc: number | null;
  status: EmployeeStatus;
  created_at: string;
}

export interface ProjectRow {
  id: string;
  upload_id: string;
  po_number: string;
  project_name: string | null;
  client: string | null;
  vertical: string | null;
  po_value: number | null;
  start_date: string | null;
  end_date: string | null;
  gm_target_pct: number | null;
  created_at: string;
}

export interface DeploymentRow {
  id: string;
  upload_id: string;
  emp_id: string;
  po_number: string;
  deployment_start: string | null;
  deployment_end: string | null;
  revenue: number | null;
  proprietary_charges: number | null;
  blended_revenue_multiplier: number | null;
  status: DeploymentStatus;
  duration_days: number | null;
  created_at: string;
}

// ─── Calculated Metrics ───────────────────────────────────────────────────────

export interface EmployeeMetrics {
  emp_id: string;
  total_revenue: number;
  total_cost: number;
  gross_margin: number;
  gross_margin_pct: number;
  deployment_status: DeploymentStatus;
  active_po_count: number;
  total_days_deployed: number;
}

export interface DepartmentMetrics {
  department: string;
  headcount: number;
  deployed_count: number;
  bench_count: number;
  deployment_pct: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  gross_margin_pct: number;
}

export interface CompanyMetrics {
  total_employees: number;
  deployed_count: number;
  bench_count: number;
  overall_deploy_pct: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  overall_gm_pct: number;
  calculated_at: string;
}

// ─── API Response Data Shapes ─────────────────────────────────────────────────

/** Overview API response */
export interface OverviewData extends CompanyMetrics {
  last_uploaded_at: string | null;
}

/** Employee list item (joined employee + metrics) */
export interface EmployeeListItem extends EmployeeRow {
  metrics: EmployeeMetrics | null;
}

/** Employee detail (full profile + metrics + deployments) */
export interface EmployeeDetail {
  employee: EmployeeRow;
  metrics: EmployeeMetrics | null;
  deployments: (DeploymentRow & { project_name: string | null; client: string | null })[];
}

/** Department list item */
export interface DepartmentListItem extends DepartmentMetrics {}

/** Department detail */
export interface DepartmentDetail {
  metrics: DepartmentMetrics;
  employees: EmployeeListItem[];
}

/** Project list item (project + computed resource count + margin) */
export interface ProjectListItem extends ProjectRow {
  resource_count: number;
  active_resource_count: number;
  total_revenue: number;
  total_cost: number;
  gross_margin_pct: number;
}

/** Project detail */
export interface ProjectDetail {
  project: ProjectRow;
  resource_count: number;
  active_resource_count: number;
  total_revenue: number;
  gross_margin_pct: number;
  deployments: (DeploymentRow & {
    employee_name: string;
    department: string;
    designation: string | null;
  })[];
}
