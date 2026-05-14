/**
 * PDF export utilities using jsPDF + jsPDF-AutoTable.
 * All exports generate branded OpsHive reports.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Branding & Layout Constants ──────────────────────────────────────────────

const BRAND = {
  name: 'OpsHive',
  tagline: 'Operations Intelligence Platform',
  primaryColor: [124, 58, 237] as [number, number, number],   // violet-600
  secondaryColor: [99, 102, 241] as [number, number, number], // indigo-500
  textColor: [30, 41, 59] as [number, number, number],        // slate-800
  mutedColor: [100, 116, 139] as [number, number, number],    // slate-500
  bgColor: [248, 250, 252] as [number, number, number],       // slate-50
};

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Gradient-like header bar
  doc.setFillColor(...BRAND.primaryColor);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(BRAND.name, 14, 12);

  // Report title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 20);

  // Date
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - 14, 12, { align: 'right' });

  if (subtitle) {
    doc.text(subtitle, pageWidth - 14, 20, { align: 'right' });
  }

  return 34; // Y position after header
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.mutedColor);
    doc.text(`${BRAND.name} · ${BRAND.tagline}`, 14, pageHeight - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }
}

// ─── Employee Report PDF ──────────────────────────────────────────────────────

export interface PdfEmployee {
  emp_id: string;
  name: string;
  department: string;
  designation: string | null;
  status: string;
  total_revenue: number | null;
  gross_margin_pct: number | null;
  deployment_status: string | null;
}

export function exportEmployeesPdf(employees: PdfEmployee[], filename = 'OpsHive_Employees') {
  const doc = new jsPDF('landscape');
  const startY = addHeader(doc, 'Employee Report', `${employees.length} employees`);

  autoTable(doc, {
    startY,
    head: [['Emp ID', 'Name', 'Department', 'Designation', 'Status', 'Revenue', 'GM%', 'Deploy Status']],
    body: employees.map((e) => [
      e.emp_id,
      e.name,
      e.department,
      e.designation ?? '—',
      e.status,
      e.total_revenue != null ? `₹${new Intl.NumberFormat('en-IN').format(e.total_revenue)}` : '—',
      e.gross_margin_pct != null ? `${e.gross_margin_pct.toFixed(1)}%` : '—',
      e.deployment_status ?? '—',
    ]),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: {
      fillColor: BRAND.primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: BRAND.bgColor },
  });

  addFooter(doc);
  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Department Report PDF ────────────────────────────────────────────────────

export interface PdfDepartment {
  department: string;
  headcount: number;
  deployed_count: number;
  bench_count: number;
  deployment_pct: number;
  total_revenue: number;
  total_profit: number;
  gross_margin_pct: number;
}

export function exportDepartmentsPdf(departments: PdfDepartment[], filename = 'OpsHive_Departments') {
  const doc = new jsPDF('landscape');
  const startY = addHeader(doc, 'Department Summary Report', `${departments.length} departments`);

  autoTable(doc, {
    startY,
    head: [['Department', 'Headcount', 'Deployed', 'Bench', 'Deploy %', 'Revenue', 'Profit', 'GM%']],
    body: departments.map((d) => [
      d.department,
      d.headcount.toString(),
      d.deployed_count.toString(),
      d.bench_count.toString(),
      `${d.deployment_pct.toFixed(1)}%`,
      `₹${new Intl.NumberFormat('en-IN').format(d.total_revenue)}`,
      `₹${new Intl.NumberFormat('en-IN').format(d.total_profit)}`,
      `${d.gross_margin_pct.toFixed(1)}%`,
    ]),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: BRAND.primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: BRAND.bgColor },
  });

  addFooter(doc);
  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Project Report PDF ──────────────────────────────────────────────────────

export interface PdfProject {
  po_number: string;
  project_name: string | null;
  client: string | null;
  resource_count: number;
  total_revenue: number;
  gross_margin_pct: number;
}

export function exportProjectsPdf(projects: PdfProject[], filename = 'OpsHive_Projects') {
  const doc = new jsPDF('landscape');
  const startY = addHeader(doc, 'Projects / PO Report', `${projects.length} projects`);

  autoTable(doc, {
    startY,
    head: [['PO Number', 'Project Name', 'Client', 'Resources', 'Revenue', 'GM%']],
    body: projects.map((p) => [
      p.po_number,
      p.project_name ?? '—',
      p.client ?? '—',
      p.resource_count.toString(),
      `₹${new Intl.NumberFormat('en-IN').format(p.total_revenue)}`,
      `${p.gross_margin_pct.toFixed(1)}%`,
    ]),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: BRAND.primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: BRAND.bgColor },
  });

  addFooter(doc);
  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Company Overview Report PDF ──────────────────────────────────────────────

export interface PdfOverview {
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

export function exportOverviewPdf(
  overview: PdfOverview,
  departments: PdfDepartment[],
  filename = 'OpsHive_Company_Report'
) {
  const doc = new jsPDF();
  const startY = addHeader(doc, 'Company Overview Report');

  // KPI Summary table
  autoTable(doc, {
    startY,
    head: [['Metric', 'Value']],
    body: [
      ['Total Employees', overview.total_employees.toString()],
      ['Deployed', overview.deployed_count.toString()],
      ['On Bench', overview.bench_count.toString()],
      ['Deploy Rate', `${overview.overall_deploy_pct.toFixed(1)}%`],
      ['Total Revenue', `₹${new Intl.NumberFormat('en-IN').format(overview.total_revenue)}`],
      ['Total Cost', `₹${new Intl.NumberFormat('en-IN').format(overview.total_cost)}`],
      ['Total Profit', `₹${new Intl.NumberFormat('en-IN').format(overview.total_profit)}`],
      ['Overall GM%', `${overview.overall_gm_pct.toFixed(1)}%`],
    ],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: {
      fillColor: BRAND.primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: BRAND.bgColor } },
  });

  // Department breakdown on next page if there are departments
  if (departments.length > 0) {
    doc.addPage();
    const y2 = addHeader(doc, 'Department Breakdown');

    autoTable(doc, {
      startY: y2,
      head: [['Department', 'Head', 'Deployed', 'Bench', 'Deploy%', 'Revenue', 'Profit', 'GM%']],
      body: departments.map((d) => [
        d.department,
        d.headcount.toString(),
        d.deployed_count.toString(),
        d.bench_count.toString(),
        `${d.deployment_pct.toFixed(1)}%`,
        `₹${new Intl.NumberFormat('en-IN').format(d.total_revenue)}`,
        `₹${new Intl.NumberFormat('en-IN').format(d.total_profit)}`,
        `${d.gross_margin_pct.toFixed(1)}%`,
      ]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: BRAND.primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: BRAND.bgColor },
    });
  }

  addFooter(doc);
  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
