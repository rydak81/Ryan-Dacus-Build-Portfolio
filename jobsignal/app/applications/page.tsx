import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ConfidenceBadge, MatchBadge } from '@/components/ui/badges';
import { getCurrentUser } from '@/lib/auth';
import { getStore } from '@/lib/db';
import type { ApplicationStatus } from '@/lib/types';
import { relativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const PIPELINE: Array<[ApplicationStatus, string]> = [
  ['saved', 'Saved'],
  ['contacted', 'Contacted'],
  ['applied', 'Applied'],
  ['interview', 'Interview'],
  ['followup', 'Follow-up'],
  ['rejected', 'Rejected'],
  ['offer', 'Offer'],
];

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const applications = (await getStore().listApplications(user.id)).filter((a) => a.intel);

  return (
    <AppShell active="/applications" demo={user.isDemo}>
      <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
      <p className="mt-1 text-sm text-ink-2">Your pipeline, with live intelligence on every job in it.</p>

      <div className="mt-6 space-y-8">
        {PIPELINE.map(([status, label]) => {
          const items = applications.filter((a) => a.status === status);
          if (items.length === 0) return null;
          return (
            <section key={status}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-3">
                {label} <span className="num">({items.length})</span>
              </h2>
              <div className="mt-2 overflow-hidden rounded-xl border border-line bg-surface">
                {items.map((a, i) => (
                  <Link
                    key={a.id}
                    href={`/jobs/${a.job_id}`}
                    className={`flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-canvas ${
                      i > 0 ? 'border-t border-line' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{a.intel!.job.title}</div>
                      <div className="text-sm text-ink-3">
                        {a.intel!.company.name} · updated {relativeTime(a.created_at)}
                        {a.applied_at ? ` · applied ${relativeTime(a.applied_at)}` : ''}
                      </div>
                    </div>
                    {a.intel!.score && <ConfidenceBadge score={a.intel!.score.overall_score} />}
                    {a.intel!.score?.match_score != null && (
                      <MatchBadge score={a.intel!.score.match_score} />
                    )}
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
        {applications.length === 0 && (
          <div className="rounded-xl border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-3">
            No tracked applications yet. Save or apply to jobs from{' '}
            <Link href="/jobs" className="font-medium text-brand hover:underline">
              Search
            </Link>
            .
          </div>
        )}
      </div>
    </AppShell>
  );
}
