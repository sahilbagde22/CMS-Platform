import { SHEET_NAMES, REQUIRED_SHEETS, type SheetName } from '@/lib/constants/sheets';
import {
  EMPLOYEE_MASTER_COLUMNS,
  PROJECT_MASTER_COLUMNS,
  DEPLOYMENT_LOG_COLUMNS,
  COLUMN_ALIASES,
} from '@/lib/constants/columns';
import type { ParsedSheet, ValidationResult, ColumnNormalizationResult, SheetValidationWarning, SheetValidationError } from '@/types/app.types';

const REQUIRED_COLUMNS: Record<SheetName, readonly string[]> = {
  [SHEET_NAMES.EMPLOYEE_MASTER]: EMPLOYEE_MASTER_COLUMNS,
  [SHEET_NAMES.PROJECT_MASTER]: PROJECT_MASTER_COLUMNS,
  [SHEET_NAMES.DEPLOYMENT_LOG]: DEPLOYMENT_LOG_COLUMNS,
};

/**
 * Compute similarity score between two lowercase strings.
 * Uses simple token overlap + character similarity heuristic.
 */
function fuzzyScore(a: string, b: string): number {
  const cleanA = a.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
  const cleanB = b.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
  const normalA = cleanA.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const normalB = cleanB.toLowerCase().replace(/[^a-z0-9]+/g, '');

  if (normalA === normalB) return 1;
  if (normalA.length === 0 || normalB.length === 0) return 0;
  
  if (normalA.includes(normalB) || normalB.includes(normalA)) {
    const ratio = Math.min(normalA.length, normalB.length) / Math.max(normalA.length, normalB.length);
    return 0.7 + (0.3 * ratio);
  }

  return 0; // Strict: no anagram matching to prevent false positives
}

function findBestMatch(rawHeader: string, threshold = 0.6): ColumnNormalizationResult | null {
  let bestScore = 0;
  let bestCanonical: string | null = null;

  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const score = fuzzyScore(rawHeader, alias);
      if (score > bestScore) {
        bestScore = score;
        bestCanonical = canonical;
      }
    }
  }

  if (!bestCanonical || bestScore < threshold) return null;

  return {
    originalName: rawHeader,
    canonicalName: bestCanonical,
    matchScore: bestScore,
    wasExactMatch: bestScore >= 0.99,
  };
}

/**
 * Validates that all 3 required sheets are present and checks column coverage.
 * Returns a structured ValidationResult with errors and warnings.
 * Errors = hard failure (missing sheet, missing critical column).
 * Warnings = soft issues (column normalized, extras ignored).
 */
export function validateSheets(sheets: ParsedSheet[]): ValidationResult {
  const errors: SheetValidationError[] = [];
  const warnings: SheetValidationWarning[] = [];
  const normalizations: Record<string, ColumnNormalizationResult[]> = {};

  const sheetMap = new Map(sheets.map((s) => [s.sheetName, s]));

  // 1. Check all required sheets are present
  for (const required of REQUIRED_SHEETS) {
    if (!sheetMap.has(required)) {
      // Try fuzzy match on sheet name
      const fuzzyMatch = sheets.find(
        (s) => fuzzyScore(s.sheetName.toLowerCase(), required.toLowerCase()) > 0.8
      );

      if (fuzzyMatch) {
        warnings.push({
          sheet: required,
          message: `Sheet "${fuzzyMatch.sheetName}" was matched to expected sheet "${required}" by name similarity.`,
        });
      } else {
        errors.push({
          sheet: required,
          message: `Required sheet "${required}" is missing. Found sheets: ${sheets.map((s) => `"${s.sheetName}"`).join(', ') || 'none'}.`,
        });
      }
    }
  }

  // If sheets are missing, no point validating columns
  if (errors.length > 0) {
    return { isValid: false, errors, warnings, normalizations };
  }

  // 2. Validate columns for each sheet
  for (const sheetName of REQUIRED_SHEETS) {
    const sheet = sheetMap.get(sheetName);
    if (!sheet) continue;

    const requiredCols = REQUIRED_COLUMNS[sheetName];
    const sheetNormalizations: ColumnNormalizationResult[] = [];
    const foundCanonicals = new Set<string>();

    for (const header of sheet.headers) {
      const match = findBestMatch(header);
      if (match) {
        sheetNormalizations.push(match);
        foundCanonicals.add(match.canonicalName);

        if (!match.wasExactMatch) {
          warnings.push({
            sheet: sheetName,
            message: `Column "${header}" was normalized to "${match.canonicalName}" (score: ${(match.matchScore * 100).toFixed(0)}%).`,
            columns: [header, match.canonicalName],
          });
        }
      } else {
        warnings.push({
          sheet: sheetName,
          message: `Column "${header}" could not be mapped to a known field and will be ignored.`,
          columns: [header],
        });
      }
    }

    // Check that critical columns were found
    const missingCritical: string[] = [];
    for (const col of requiredCols) {
      // emp_id and po_number are always critical
      if ((col === 'emp_id' || col === 'po_number' || col === 'name') && !foundCanonicals.has(col)) {
        missingCritical.push(col);
      }
    }

    if (missingCritical.length > 0) {
      errors.push({
        sheet: sheetName,
        message: `Sheet "${sheetName}" is missing critical columns: ${missingCritical.join(', ')}. These cannot be inferred.`,
      });
    }

    normalizations[sheetName] = sheetNormalizations;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    normalizations,
  };
}
