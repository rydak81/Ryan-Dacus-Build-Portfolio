import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { JobCard } from '@/components/JobCard';
import { getCurrentUser } from '@/lib/auth';
import { getStore } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const applications = await getStore().listApplications(user.id);
  const saved = applications.filter((a) => a.status === 'saved' && a.intel);

  return (
    <AppShell active="/saved" demo={user.isDemo}>
      <h1 className="text-2xl font-bold tracking-tight">Saved Jobs</h1>
      <p className="mt-1 text-sm text-ink-2">
        JobSignal keeps re-checking saved jobs and flags them when confidence drops.
      </p>
      <div className="mt-5 grid gap-3">
        {saved.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-3">
            Nothing saved yet.{' '}
            <Link href="/jobs" className="font-medium text-brand hover:underline">
              Search jobs
            </Link>{' '}
            and use “Save / track” on any listing.
          </div>
        ) : (
          saved.map((a) => <JobCard key={a.id} item={a.intel!} />)
        )}
      </div>
    </AppShell>
  );
}
