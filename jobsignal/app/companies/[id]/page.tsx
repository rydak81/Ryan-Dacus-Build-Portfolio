import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { JobCard } from '@/components/JobCard';
import { getCurrentUser } from '@/lib/auth';
import { getStore } from '@/lib/db';
import { daysAgo } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { id } = await params;

  const store = getStore();
  const company = await store.getCompany(id);
  if (!company) notFound();
  const [jobs, contacts] = await Promise.all([store.getCompanyJobs(id), store.listContacts(id)]);

  const open = jobs.filter((j) => j.job.status === 'active');
  const closed = jobs.filter((j) => j.job.status === 'closed');
  const suspects = jobs.filter((j) => j.job.repost_count >= 2);
  const avgAge =
    open.length > 0
      ? Math.round(open.reduce((sum, j) => sum + daysAgo(j.job.first_seen_at), 0) / open.length)
      : 0;
  const recent30 = jobs.filter((j) => daysAgo(j.job.first_seen_at) <= 30).length;
  const trend = recent30 >= Math.max(2, jobs.length / 3) ? 'Increasing' : recent30 > 0 ? 'Steady' : 'Quiet';

  const stats: Array<[string, string]> = [
    ['Hiring Activity', trend],
    ['Current Verified Roles', String(open.length)],
    ['Average Posting Age', `${avgAge} days`],
    ['Suspected Reposts', String(suspects.length)],
    ['Recently Closed', String(closed.length)],
    ['ATS', company.ats_provider ? company.ats_provider[0].toUpperCase() + company.ats_provider.slice(1) : '—'],
  ];

  return (
    <AppShell active="/companies" demo={user.isDemo}>
      <Link href="/companies" className="text-sm text-ink-3 hover:text-ink-2">
        ← All companies
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
          <p className="mt-1 text-sm text-ink-2">
            {company.industry} · {company.headquarters} ·{' '}
            <span className="num">{company.employee_count?.toLocaleString()}</span> employees
          </p>
        </div>
        {company.hiring_freeze && (
          <span className="rounded-md border border-bad-line bg-bad-soft px-2.5 py-1 text-sm font-medium text-bad">
            Hiring freeze publicly reported
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-surface p-4">
            <div className="text-xs text-ink-3">{label}</div>
            <div className="num mt-1 text-lg font-semibold">{value}</div>
          </div>
        ))}
      </div>

      {contacts.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight">Known Stakeholders</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {contacts.map((c) => (
              <div key={c.id} className="rounded-lg border border-line bg-surface p-4">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-ink-2">{c.title}</div>
                <div className="mt-1 text-xs capitalize text-brand">{c.relationship_type.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold tracking-tight">Tracked Jobs</h2>
        <div className="mt-3 grid gap-3">
          {jobs.length === 0 ? (
            <p className="text-sm text-ink-3">No jobs tracked yet for this company.</p>
          ) : (
            jobs.map((j) => <JobCard key={j.job.id} item={j} />)
          )}
        </div>
      </section>
    </AppShell>
  );
}
