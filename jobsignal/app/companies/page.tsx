import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { getStore } from '@/lib/db';
import { relativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const store = getStore();
  const companies = await store.listCompanies();
  const jobsByCompany = await Promise.all(
    companies.map(async (c) => ({ company: c, jobs: await store.getCompanyJobs(c.id) })),
  );

  return (
    <AppShell active="/companies" demo={user.isDemo}>
      <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
      <p className="mt-1 text-sm text-ink-2">Hiring behavior across tracked employers.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {jobsByCompany.map(({ company, jobs }) => {
          const open = jobs.filter((j) => j.job.status === 'active');
          const suspects = jobs.filter((j) => j.job.repost_count >= 2);
          return (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              className="rounded-xl border border-line bg-surface p-4 hover:border-line-strong hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{company.name}</h3>
                  <p className="text-sm text-ink-3">
                    {company.industry} · {company.headquarters}
                  </p>
                </div>
                {company.hiring_freeze && (
                  <span className="rounded-md border border-bad-line bg-bad-soft px-2 py-0.5 text-xs font-medium text-bad">
                    Hiring freeze reported
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
                <span>
                  <span className="num font-semibold">{open.length}</span> verified open roles
                </span>
                <span>
                  <span className="num font-semibold">{suspects.length}</span> suspected reposts
                </span>
                <span className="capitalize">{company.ats_provider ?? 'no ATS'} </span>
                {company.last_verified_at && (
                  <span className="text-ink-3">checked {relativeTime(company.last_verified_at)}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
