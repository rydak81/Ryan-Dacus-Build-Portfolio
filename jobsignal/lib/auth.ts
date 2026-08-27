/**
 * Auth: Supabase when configured; a fixed demo identity otherwise so the
 * whole product is navigable without setup.
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { DEMO_USER_ID } from '@/lib/db/seed-data';
import { isDemoMode } from '@/lib/db';

export interface SessionUser {
  id: string;
  email: string;
  isDemo: boolean;
}

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — middleware handles refresh.
          }
        },
      },
    },
  );
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (isDemoMode()) {
    return { id: DEMO_USER_ID, email: 'demo@jobsignal.app', isDemo: true };
  }
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email ?? '', isDemo: false };
}
