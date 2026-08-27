import { DemoStore } from './demo';
import { SupabaseStore } from './supabase-store';
import type { JobSignalStore } from './store';

let cached: JobSignalStore | undefined;

/**
 * Store selection: Supabase when configured, otherwise the seeded demo
 * store. Server-side only.
 */
export function getStore(): JobSignalStore {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  cached = url && serviceKey ? new SupabaseStore(url, serviceKey) : new DemoStore();
  return cached;
}

export function isDemoMode(): boolean {
  return !(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
