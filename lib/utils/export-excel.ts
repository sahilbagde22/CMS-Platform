/**
 * Excel export utilities using SheetJS (xlsx).
 * All exports use the .xlsx format.
 */
import * as XLSX from 'xlsx';

// ─── Types ────────────────────────────────────────────────────────────────────

type CellValue = string | number | null | undefined;
type Row = Record<string, CellValue>;

interface SheetConfig {
  name: string;
  rows: Row[];
  /** Column widths in characters */
  colWidths?: number[];
}

// ─── Core builder ─────────────────────────────────────────────────────────────

function buildWorkbook(sheets: SheetConfig[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  for (const { name, rows, colWidths } of sheets) {
    const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });

    if (colWidths) {
      ws['!cols'] = colWidths.map((w) => ({ wch: w }));
    }

    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  return wb;
}

function triggerDownload(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

// ─── Employees export ─────────────────────────────────────────────────────────

export interface ExportEmployee {
  emp_id: string;
  name: string;
  department: string;
  designation: string | null;
  status: string;
  monthly_ctc: number | null;
  annual_ctc: number | null;
  deployment_status?: string | null;
  total_revenue?: number | null;
  total_cost?: number | null;
  gross_margin?: number | null;
  gross_margin_pct?: number | null;
  active_po_count?: number | null;
  total_days_deployed?: number | null;
}

export function exportEmployees(employees: ExportEmployee[], filename = 'OpsHive_Employees') {
  const generatedAt = new Date().toLocaleString('en-IN');

  const rows = employees.map((e) => ({
    'Employee ID': e.emp_id,
    'Name': e.name,
    'Department': e.department,
    'Designation': e.designation ?? '—',
    'Status': e.status,
    'Deploy Status': e.deployment_status ?? '—',
    'Monthly CTC (₹)': e.monthly_ctc ?? 0,
    'Annual CTC (₹)': e.annual_ctc ?? 0,
    'Total Revenue (₹)': e.total_revenue ?? 0,
    'Total Cost (₹)': e.total_cost ?? 0,
    'Gross Margin (₹)': e.gross_margin ?? 0,
    'GM%': e.gross_margin_pct != null ? Number(e.gross_margin_pct.toFixed(2)) : 0,
    'Active POs': e.active_po_count ?? 0,
    'Days Deployed': e.total_days_deployed ?? 0,
  }));

  const metaSheet: Row[] = [
    { 'Report': 'OpsHive — Employee Report' },
    { 'Report': `Generated: ${generatedAt}` },
    { 'Report': `Total Employees: ${employees.length}` },
  ];

  const wb = buildWorkbook([
    {
      name: 'Employees',
      rows,
      colWidths: [14, 22, 18, 24, 10, 14, 16, 16, 18, 16, 18, 8, 10, 14],
    },
    { name: 'Meta', rows: metaSheet, colWidths: [40] },
  ]);

  triggerDownload(wb, `${filename}_${new Date().toISOString().slice(0, 10)}`);
}

// ─── Departments export ───────────────────────────────────────────────────────

export interface ExportDepartment {
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

export function exportDepartments(departments: ExportDepartment[], filename = 'OpsHive_Departments') {
  const generatedAt = new Date().toLocaleString('en-IN');

  const rows = departments.map((d) => ({
    'Department': d.department,
    'Headcount': d.headcount,
    'Deployed': d.deployed_count,
    'On Bench': d.bench_count,
    'Deploy Rate%': Number(d.deployment_pct.toFixed(1)),
    'Total Revenue (₹)': d.total_revenue,
    'Total Cost (₹)': d.total_cost,
    'Total Profit (₹)': d.total_profit,
    'GM%': Number(d.gross_margin_pct.toFixed(2)),
  }));

  const metaSheet: Row[] = [
    { 'Report': 'OpsHive — Department Summary Report' },
    { 'Report': `Generated: ${generatedAt}` },
    { 'Report': `Total Departments: ${departments.length}` },
  ];

  const wb = buildWorkbook([
    {
      name: 'Departments',
      rows,
      colWidths: [22, 12, 12, 12, 14, 20, 18, 18, 10],
    },
    { name: 'Meta', rows: metaSheet, colWidths: [40] },
  ]);

  triggerDownload(wb, `${filename}_${new Date().toISOString().slice(0, 10)}`);
}

// ─── Company overview export ──────────────────────────────────────────────────

export interface ExportOverview {
  total_employees: number;
  deployed_count: number;
  bench_count: number;
  overall_deploy_pct: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  overall_gm_pct: number;
  last_uploaded_at: string | null;
}

export function exportOverview(overview: ExportOverview, departments: ExportDepartment[], filename = 'OpsHive_Company_Report') {
  const generatedAt = new Date().toLocaleString('en-IN');

  const summaryRows: Row[] = [
    { 'Metric': 'Generated At', 'Value': generatedAt },
    { 'Metric': 'Last Data Upload', 'Value': overview.last_uploaded_at ? new Date(overview.last_uploaded_at).toLocaleString('en-IN') : '—' },
    { 'Metric': '', 'Value': '' },
    { 'Metric': '── Workforce ──', 'Value': '' },
    { 'Metric': 'Total Employees', 'Value': overview.total_employees },
    { 'Metric': 'Deployed', 'Value': overview.deployed_count },
    { 'Metric': 'On Bench', 'Value': overview.bench_count },
    { 'Metric': 'Deployment Rate', 'Value': Number(overview.overall_deploy_pct.toFixed(1)) },
    { 'Metric': '', 'Value': '' },
    { 'Metric': '── Financials ──', 'Value': '' },
    { 'Metric': 'Total Revenue (₹)', 'Value': overview.total_revenue },
    { 'Metric': 'Total Cost (₹)', 'Value': overview.total_cost },
    { 'Metric': 'Total Profit (₹)', 'Value': overview.total_profit },
    { 'Metric': 'Overall GM%', 'Value': Number(overview.overall_gm_pct.toFixed(2)) },
  ];

  const deptRows = departments.map((d) => ({
    'Department': d.department,
    'Headcount': d.headcount,
    'Deployed': d.deployed_count,
    'Bench': d.bench_count,
    'Deploy Rate%': Number(d.deployment_pct.toFixed(1)),
    'Revenue (₹)': d.total_revenue,
    'Cost (₹)': d.total_cost,
    'Profit (₹)': d.total_profit,
    'GM%': Number(d.gross_margin_pct.toFixed(2)),
  }));

  const wb = buildWorkbook([
    { name: 'Company Summary', rows: summaryRows, colWidths: [28, 22] },
    { name: 'By Department', rows: deptRows, colWidths: [22, 12, 12, 10, 14, 18, 16, 16, 10] },
  ]);

  triggerDownload(wb, `${filename}_${new Date().toISOString().slice(0, 10)}`);
}
