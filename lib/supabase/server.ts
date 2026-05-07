import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// NOTE: Using untyped client here because the hand-crafted database.types.ts
// causes insert() to resolve to 'never' until `supabase gen types` is run
// against a live Supabase project. Swap back to createServerClient<Database>
// once you've run: npx supabase gen types typescript --project-id YOUR_ID > types/database.types.ts

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore
          }
        },
      },
    }
  );
}

/**
 * Service-role client — bypasses RLS. Use ONLY in trusted server contexts.
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */
export async function createServiceClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignore
          }
        },
      },
    }
  );
}
