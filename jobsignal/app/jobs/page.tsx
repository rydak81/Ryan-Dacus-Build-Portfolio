import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { JobCard } from '@/components/JobCard';
import { getCurrentUser } from '@/lib/auth';
import { getStore } from '@/lib/db';
import type { JobFilter } from '@/lib/db/store';

export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  location?: string;
  remote?: string;
  fresh?: string;
  minConfidence?: string;
  minMatch?: string;
  minSalary?: string;
  maxAge?: string;
  source?: string;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const params = await searchParams;

  const filter: JobFilter = {
    query: params.q || undefined,
    location: params.location || undefined,
    remote: params.remote === '1' || undefined,
    verifiedWithinHours: params.fresh ? Number(params.fresh) : undefined,
    minConfidence: params.minConfidence ? Number(params.minConfidence) : undefined,
    minMatch: params.minMatch ? Number(params.minMatch) : undefined,
    minSalary: params.minSalary ? Number(params.minSalary) : undefined,
    maxAgeDays: params.maxAge ? Number(params.maxAge) : undefined,
    source: params.source || undefined,
  };

  const jobs = await getStore().listJobs(filter);

  return (
    <AppShell active="/jobs" demo={user.isDemo}>
      <h1 className="text-2xl font-bold tracking-tight">Search</h1>
      <p className="mt-1 text-sm text-ink-2">
        One row per real job — duplicates are folded into their canonical listing.
      </p>

      <form method="get" className="mt-5 rounded-xl border border-line bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-xs font-medium text-ink-2">Keywords</span>
            <input
              name="q"
              defaultValue={params.q ?? ''}
              placeholder="Director of Partnerships"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-2">Location</span>
            <input
              name="location"
              defaultValue={params.location ?? ''}
              placeholder="Remote, Atlanta, Charlotte…"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-2">Verified Fresh</span>
            <select
              name="fresh"
              defaultValue={params.fresh ?? ''}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
            >
              <option value="">Any verification age</option>
              <option value="24">Verified within 24 hours</option>
              <option value="48">Verified within 48 hours</option>
              <option value="72">Verified within 72 hours</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-2">Min. Job Confidence</span>
            <select
              name="minConfidence"
              defaultValue={params.minConfidence ?? ''}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
            >
              <option value="">Any</option>
              <option value="90">90+ Highly Likely Active</option>
              <option value="75">75+ Likely Active</option>
              <option value="60">60+ Probably Active</option>
              <option value="40">40+ exclude likely stale</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-2">Min. Candidate Match</span>
            <select
              name="minMatch"
              defaultValue={params.minMatch ?? ''}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
            >
              <option value="">Any</option>
              <option value="85">85%+</option>
              <option value="70">70%+</option>
              <option value="50">50%+</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-2">Min. Salary</span>
            <select
              name="minSalary"
              defaultValue={params.minSalary ?? ''}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
            >
              <option value="">Any</option>
              <option value="100000">$100K+</option>
              <option value="150000">$150K+</option>
              <option value="200000">$200K+</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-2">Posting Age</span>
            <select
              name="maxAge"
              defaultValue={params.maxAge ?? ''}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
            >
              <option value="">Any age</option>
              <option value="7">First seen ≤ 7 days</option>
              <option value="30">First seen ≤ 30 days</option>
              <option value="90">First seen ≤ 90 days</option>
            </select>
          </label>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 pb-2 text-sm text-ink-2">
              <input type="checkbox" name="remote" value="1" defaultChecked={params.remote === '1'} />
              Remote only
            </label>
            <button
              type="submit"
              className="ml-auto rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-strong"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      <p className="num mt-4 text-xs text-ink-3">{jobs.length} jobs</p>
      <div className="mt-2 grid gap-3">
        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-3">
            No jobs match these filters. Try widening confidence or verification windows.
          </div>
        ) : (
          jobs.map((j) => <JobCard key={j.job.id} item={j} />)
        )}
      </div>
    </AppShell>
  );
}
