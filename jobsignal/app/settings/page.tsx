import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const demo = isDemoMode();

  return (
    <AppShell active="/settings" demo={user.isDemo}>
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <div className="mt-5 space-y-4">
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Account</h2>
          <p className="mt-2 text-sm text-ink-2">
            Signed in as <span className="font-medium">{user.email}</span>
            {user.isDemo && ' (demo identity)'}
          </p>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Privacy</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
            <li>• Your resume and profile are private to your account, protected by row-level security.</li>
            <li>• Candidate data is never sold and never exposed to other users.</li>
            <li>• You can export or delete your account data at any time by contacting support (self-serve export ships next).</li>
            <li>• Contact intelligence uses only publicly listed professional information.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Environment</h2>
          <dl className="mt-2 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
            <div className="flex justify-between sm:block">
              <dt className="text-ink-3">Data backend</dt>
              <dd className="font-medium">{demo ? 'Demo (in-memory, seeded)' : 'Supabase'}</dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-ink-3">AI provider</dt>
              <dd className="font-medium capitalize">
                {process.env.AI_PROVIDER ?? 'none (deterministic fallbacks active)'}
              </dd>
            </div>
          </dl>
          {demo && (
            <p className="mt-3 text-xs text-ink-3">
              To run against real infrastructure, set the Supabase variables from{' '}
              <code className="num">.env.example</code> and apply{' '}
              <code className="num">supabase/migrations</code>.
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
