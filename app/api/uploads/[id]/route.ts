import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Upload ID is required' },
        { status: 400 }
      );
    }

    // Delete the upload from the database
    // Assuming Supabase has ON DELETE CASCADE for foreign keys on metrics/employee tables
    const { error: deleteError } = await supabase
      .from('uploads')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error('[uploads] Failed to delete upload', { error: deleteError });
      return NextResponse.json(
        { success: false, error: 'Failed to delete upload', code: 'DELETE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[uploads] Unexpected error during delete', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
