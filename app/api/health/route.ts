import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('uploads').select('id').limit(1);
    return NextResponse.json({
      status: 'ok',
      db: error ? 'error' : 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ status: 'error', db: 'unreachable' }, { status: 503 });
  }
}
