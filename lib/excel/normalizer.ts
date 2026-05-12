import { SHEET_NAMES } from '@/lib/constants/sheets';
import {
  EMPLOYEE_MASTER_COLUMNS,
  PROJECT_MASTER_COLUMNS,
  DEPLOYMENT_LOG_COLUMNS,
  COLUMN_ALIASES,
} from '@/lib/constants/columns';
import type { ParsedSheet } from '@/types/app.types';
import type { EmployeeRowInput } from '@/lib/validators/employee.schema';
import type { ProjectRowInput } from '@/lib/validators/project.schema';
import type { DeploymentRowInput } from '@/lib/validators/deployment.schema';

// ─── Column Normalization ─────────────────────────────────────────────────────

/**
 * Normalizes a raw header to its canonical snake_case name.
 * Uses fuzzy matching via COLUMN_ALIASES.
 */
function normalizeHeader(rawHeader: string): string | null {
  const cleanHeader = rawHeader.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
  const lower = cleanHeader.toLowerCase().replace(/[^a-z0-9]+/g, '');

  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const normalizedAlias = alias.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (lower === normalizedAlias) return canonical;
    }
  }

  let bestScore = 0;
  let bestCanonical: string | null = null;

  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const normalizedAlias = alias.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (normalizedAlias.length === 0) continue;
      
      if (lower.includes(normalizedAlias) || normalizedAlias.includes(lower)) {
        const ratio = Math.min(lower.length, normalizedAlias.length) / Math.max(lower.length, normalizedAlias.length);
        const score = 0.7 + (0.3 * ratio);
        
        if (score > bestScore && score > 0.7) {
          bestScore = score;
          bestCanonical = canonical;
        }
      }
    }
  }

  return bestCanonical;
}

/**
 * Build a header mapping: originalHeader → canonicalName | null
 */
export function getSuggestedMappings(headers: string[]): Record<string, string | null> {
  const map: Record<string, string | null> = {};
  const usedCanonicals = new Set<string>();

  for (const header of headers) {
    const canonical = normalizeHeader(header);
    // Avoid mapping two different original columns to the same canonical name
    if (canonical && !usedCanonicals.has(canonical)) {
      map[header] = canonical;
      usedCanonicals.add(canonical);
    } else {
      map[header] = null;
    }
  }
  return map;
}

function buildHeaderMap(headers: string[]): Map<string, string | null> {
  const suggested = getSuggestedMappings(headers);
  const map = new Map<string, string | null>();
  for (const [k, v] of Object.entries(suggested)) {
    map.set(k, v);
  }
  return map;
}

// ─── Value Cleaners ───────────────────────────────────────────────────────────

/** Strip ₹, commas, spaces → parse as float. Returns null if unparseable. */
function parseCurrency(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') return raw;
  const cleaned = String(raw).replace(/[₹,\s]/g, '').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

/**
 * Detect and normalize percentage values.
 * If stored as 0.45 (fraction) → return 45.
 * If stored as 45 (already percent) → return 45.
 */
function parsePercentage(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') {
    // If between 0 and 1 (exclusive), treat as fraction
    return raw > 0 && raw < 1 ? raw * 100 : raw;
  }
  const cleaned = String(raw).replace('%', '').trim();
  const val = parseFloat(cleaned);
  if (isNaN(val)) return null;
  return val > 0 && val < 1 ? val * 100 : val;
}

/**
 * Parse date value from Excel.
 * SheetJS with cellDates:true already converts to Date objects or ISO strings.
 * We just ensure ISO YYYY-MM-DD format.
 */
function parseDate(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (raw instanceof Date) {
    return raw.toISOString().split('T')[0];
  }
  if (typeof raw === 'string') {
    // Already ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.split('T')[0];
    // Try to parse other formats
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  }
  if (typeof raw === 'number') {
    // Excel serial date number (fallback if cellDates didn't convert)
    const epoch = new Date(Date.UTC(1899, 11, 30));
    epoch.setUTCDate(epoch.getUTCDate() + raw);
    return epoch.toISOString().split('T')[0];
  }
  return null;
}

/** Coerce to string or null */
function parseString(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  return String(raw).trim() || null;
}

// ─── Sheet-Specific Normalizers ───────────────────────────────────────────────

/**
 * Normalize a raw Employee_Master sheet into typed rows.
 * Applies column mapping + value coercion + status normalization.
 */
export function normalizeEmployeeSheet(sheet: ParsedSheet, customMappings?: Record<string, string | null>): EmployeeRowInput[] {
  let headerMap: Map<string, string | null>;
  if (customMappings) {
    headerMap = new Map(Object.entries(customMappings));
  } else {
    headerMap = buildHeaderMap(sheet.headers);
  }

  return sheet.rows.map((raw) => {
    const get = (canonical: string): unknown => {
      for (const [orig, mapped] of headerMap.entries()) {
        if (mapped === canonical) return raw[orig];
      }
      return null;
    };

    const statusRaw = parseString(get('status'));
    const status: 'Active' | 'Inactive' =
      statusRaw?.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';

    const annualCtc = parseCurrency(get('annual_ctc'));
    const monthlyCtc = parseCurrency(get('monthly_ctc'));

    return {
      emp_id: parseString(get('emp_id')) ?? '',
      name: parseString(get('name')) ?? '',
      department: parseString(get('department')) ?? '',
      designation: parseString(get('designation')),
      annual_ctc: annualCtc,
      // Derive monthly from annual if monthly not present
      monthly_ctc: monthlyCtc ?? (annualCtc !== null ? annualCtc / 12 : null),
      status,
    };
  });
}

/**
 * Normalize a raw Project_Master sheet into typed rows.
 */
export function normalizeProjectSheet(sheet: ParsedSheet, customMappings?: Record<string, string | null>): ProjectRowInput[] {
  let headerMap: Map<string, string | null>;
  if (customMappings) {
    headerMap = new Map(Object.entries(customMappings));
  } else {
    headerMap = buildHeaderMap(sheet.headers);
  }

  return sheet.rows.map((raw) => {
    const get = (canonical: string): unknown => {
      for (const [orig, mapped] of headerMap.entries()) {
        if (mapped === canonical) return raw[orig];
      }
      return null;
    };

    return {
      po_number: parseString(get('po_number')) ?? '',
      project_name: parseString(get('project_name')),
      client: parseString(get('client')),
      vertical: parseString(get('vertical')),
      po_value: parseCurrency(get('po_value')),
      start_date: parseDate(get('start_date')),
      end_date: parseDate(get('end_date')),
      gm_target_pct: parsePercentage(get('gm_target_pct')),
    };
  });
}

/**
 * Normalize a raw Deployment_Log sheet into typed rows.
 */
export function normalizeDeploymentSheet(sheet: ParsedSheet, customMappings?: Record<string, string | null>): DeploymentRowInput[] {
  let headerMap: Map<string, string | null>;
  if (customMappings) {
    headerMap = new Map(Object.entries(customMappings));
  } else {
    headerMap = buildHeaderMap(sheet.headers);
  }

  return sheet.rows.map((raw) => {
    const get = (canonical: string): unknown => {
      for (const [orig, mapped] of headerMap.entries()) {
        if (mapped === canonical) return raw[orig];
      }
      return null;
    };

    return {
      emp_id: parseString(get('emp_id')) ?? '',
      po_number: parseString(get('po_number')) ?? '',
      deployment_start: parseDate(get('deployment_start')),
      deployment_end: parseDate(get('deployment_end')),
      revenue: parseCurrency(get('revenue')),
      proprietary_charges: parseCurrency(get('proprietary_charges')),
      blended_revenue_multiplier:
        typeof get('blended_revenue_multiplier') === 'number'
          ? (get('blended_revenue_multiplier') as number)
          : null,
    };
  });
}

/**
 * Find a parsed sheet by canonical name (fuzzy-tolerant).
 */
export function findSheet(sheets: ParsedSheet[], targetName: string): ParsedSheet | undefined {
  return (
    sheets.find((s) => s.sheetName === targetName) ??
    sheets.find((s) => s.sheetName.toLowerCase().replace(/[\s_-]/g, '') ===
      targetName.toLowerCase().replace(/[\s_-]/g, ''))
  );
}

// Re-export sheet name constants for convenience
export { SHEET_NAMES };
export const ALL_CANONICAL_COLUMNS = [
  ...EMPLOYEE_MASTER_COLUMNS,
  ...PROJECT_MASTER_COLUMNS,
  ...DEPLOYMENT_LOG_COLUMNS,
] as const;
