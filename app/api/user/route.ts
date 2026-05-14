import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  initials: string;
  role: 'admin' | 'viewer';
  avatar_url?: string | null;
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Try to get role from user_metadata, default to 'admin' for first user
    const role = (user.user_metadata?.role as 'admin' | 'viewer') ?? 'admin';
    const displayName =
      user.user_metadata?.display_name ??
      user.user_metadata?.full_name ??
      user.email?.split('@')[0] ??
      'User';

    const initials = displayName
      .split(' ')
      .map((n: string) => n[0]?.toUpperCase())
      .join('')
      .slice(0, 2);

    const profile: UserProfile = {
      id: user.id,
      email: user.email ?? '',
      display_name: displayName,
      initials,
      role,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    };

    return NextResponse.json({ success: true, data: profile });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
