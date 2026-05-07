import * as XLSX from 'xlsx';

export interface ParsedSheet {
  sheetName: string;
  headers: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  wasTruncated: boolean;
  originalRowCount: number;
}

const MAX_ROWS = 10_000;

/**
 * Parses an Excel buffer into an array of ParsedSheet objects.
 * - Always uses cellDates:true to auto-convert Excel serial dates
 * - Truncates to MAX_ROWS (10,000) with a truncation flag
 * - Empty cells become null (not undefined)
 * - Dates normalized to YYYY-MM-DD
 */
export function parseExcelBuffer(buffer: Buffer): ParsedSheet[] {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: true,
    cellNF: true,
    cellStyles: false,
  });

  return workbook.SheetNames.map((sheetName) => {
    const ws = workbook.Sheets[sheetName];
    
    // Auto-detect header row
    const rawData = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, dateNF: 'YYYY-MM-DD' });
    let headerRowIndex = 0;
    let maxScore = -1;

    for (let i = 0; i < Math.min(rawData.length, 20); i++) {
      const row = rawData[i];
      if (!Array.isArray(row)) continue;

      const stringCells = row.filter((cell) => typeof cell === 'string' && cell.trim() !== '');
      let score = stringCells.length;
      
      const text = stringCells.join(' ').toLowerCase();
      if (text.includes('emp') || text.includes('id')) score += 5;
      if (text.includes('name')) score += 5;
      if (text.includes('department')) score += 5;
      if (text.includes('project')) score += 5;
      if (text.includes('po') || text.includes('deployment')) score += 5;
      if (text.includes('revenue') || text.includes('cost')) score += 5;
      
      if (score > maxScore) {
        maxScore = score;
        headerRowIndex = i;
      }
    }

    const allRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      range: headerRowIndex,
      defval: null,
      raw: false,
      dateNF: 'YYYY-MM-DD',
    });

    const originalRowCount = allRows.length;
    const wasTruncated = originalRowCount > MAX_ROWS;
    const rows = wasTruncated ? allRows.slice(0, MAX_ROWS) : allRows;
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      sheetName,
      headers,
      rows,
      rowCount: rows.length,
      wasTruncated,
      originalRowCount,
    };
  });
}
