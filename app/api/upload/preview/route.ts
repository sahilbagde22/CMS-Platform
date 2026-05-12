import { NextRequest, NextResponse } from 'next/server';
import { parseExcelBuffer } from '@/lib/excel/parser';
import { getSuggestedMappings } from '@/lib/excel/normalizer';
import { validateSheets } from '@/lib/excel/sheet-validator';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel
    const parsedSheets = parseExcelBuffer(buffer);

    if (parsedSheets.length === 0) {
      return NextResponse.json({ success: false, error: 'No sheets found' }, { status: 400 });
    }

    // Validate if the 3 required sheets exist
    const validation = validateSheets(parsedSheets);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => e.message).join(' | ');
      return NextResponse.json({ success: false, error: errorMessages }, { status: 422 });
    }

    // Generate suggested mappings
    const sheetsWithMappings = parsedSheets.map(sheet => {
      return {
        sheetName: sheet.sheetName,
        headers: sheet.headers,
        suggestedMappings: getSuggestedMappings(sheet.headers)
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        sheets: sheetsWithMappings,
        warnings: validation.warnings
      }
    });
  } catch (error) {
    logger.error('[upload/preview] Error parsing file', { error });
    return NextResponse.json({ success: false, error: 'Failed to parse Excel file' }, { status: 500 });
  }
}
