import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { JobCard } from '@/components/JobCard';
import { getCurrentUser } from '@/lib/auth';
import { getStore } from '@/lib/db';
import { daysAgo } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const store = getStore();
  const [jobs, applications, profile] = await Promise.all([
    store.listJobs(),
    store.listApplications(user.id),
    store.getProfile(user.id),
  ]);

  const highPriority = jobs.filter(
    (j) => (j.score?.overall_score ?? 0) >= 75 && (j.score?.match_score ?? 0) >= 70,
  );
  const recentlyVerified = jobs
    .filter((j) => j.job.last_verified_at && daysAgo(j.job.last_verified_at) <= 2)
    .sort(
      (a, b) =>
        new Date(b.job.last_verified_at!).getTime() - new Date(a.job.last_verified_at!).getTime(),
    )
    .slice(0, 4);
  const newMatches = jobs.filter(
    (j) => daysAgo(j.job.first_seen_at) <= 7 && (j.score?.match_score ?? 0) >= 60,
  );
  const losingConfidence = jobs.filter(
    (j) =>
      (j.score?.overall_score ?? 100) < 45 ||
      j.job.status === 'ghost_suspect' ||
      j.job.status === 'stale',
  );

  const statusCounts = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell active="/dashboard" demo={user.isDemo}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-2">
            {profile?.current_title
              ? `Tracking the market for ${profile.desired_titles[0] ?? profile.current_title}`
              : 'Set up your profile to unlock candidate matching.'}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          {(['saved', 'applied', 'interview'] as const).map((s) => (
            <Link
              key={s}
              href="/applications"
              className="rounded-lg border border-line bg-surface px-3 py-1.5 hover:border-line-strong"
            >
              <span className="num font-semibold">{statusCounts[s] ?? 0}</span>{' '}
              <span className="capitalize text-ink-2">{s}</span>
            </Link>
          ))}
        </div>
      </div>

      <Section
        title="High Priority Opportunities"
        subtitle="High job confidence and high candidate match"
      >
        {highPriority.length === 0 ? (
          <Empty text="Nothing currently clears both bars. Loosen filters in Search to see more." />
        ) : (
          <div className="grid gap-3">{highPriority.map((j) => <JobCard key={j.job.id} item={j} />)}</div>
        )}
      </Section>

      <Section title="Recently Verified" subtitle="Confirmed against employer sources in the last 48 hours">
        {recentlyVerified.length === 0 ? (
          <Empty text="No verifications in the last 48 hours." />
        ) : (
          <div className="grid gap-3">{recentlyVerified.map((j) => <JobCard key={j.job.id} item={j} />)}</div>
        )}
      </Section>

      <Section title="New Matches" subtitle="First seen within 7 days, matching your profile">
        {newMatches.length === 0 ? (
          <Empty text="No new matches this week." />
        ) : (
          <div className="grid gap-3">{newMatches.map((j) => <JobCard key={j.job.id} item={j} />)}</div>
        )}
      </Section>

      <Section title="Jobs Losing Confidence" subtitle="Signals have turned negative — deprioritize these">
        {losingConfidence.length === 0 ? (
          <Empty text="No tracked jobs are deteriorating." />
        ) : (
          <div className="grid gap-3">
            {losingConfidence.map((j) => (
              <div key={j.job.id}>
                <JobCard item={j} />
                {j.job.status !== 'active' && (
                  <p className="mt-1 pl-1 text-xs text-bad">
                    {j.job.status === 'ghost_suspect'
                      ? 'Repeated repost pattern detected.'
                      : 'Could not be confirmed at its source on the latest check.'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </AppShell>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mb-3 mt-0.5 text-sm text-ink-3">{subtitle}</p>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface p-6 text-center text-sm text-ink-3">
      {text}
    </div>
  );
}
