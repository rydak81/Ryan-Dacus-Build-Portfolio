import Link from 'next/link';
import type { JobWithIntel } from '@/lib/db/store';
import { daysAgo, formatSalary } from '@/lib/utils';
import { ConfidenceBadge, MatchBadge, VerifiedBadge } from './ui/badges';

export function JobCard({ item }: { item: JobWithIntel }) {
  const { job, company, score } = item;
  const salary = formatSalary(job.salary_min, job.salary_max);
  const age = daysAgo(job.first_seen_at);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{job.title}</h3>
          <p className="mt-0.5 text-sm text-ink-2">
            {company.name}
            {job.location ? <span className="text-ink-3"> · {job.location}</span> : null}
            {salary ? <span className="num text-ink-3"> · {salary}</span> : null}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {score && <ConfidenceBadge score={score.overall_score} />}
          {score?.match_score != null && <MatchBadge score={score.match_score} />}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-3">
        <VerifiedBadge verifiedAt={job.last_verified_at} />
        <span className="num">
          first seen {age === 0 ? 'today' : `${age}d ago`}
        </span>
        {job.repost_count > 0 && (
          <span className="rounded-md border border-warn-line bg-warn-soft px-2 py-0.5 font-medium text-warn">
            reposted ×{job.repost_count}
          </span>
        )}
        {item.duplicateCount > 0 && (
          <span className="rounded-md border border-line bg-surface-2 px-2 py-0.5">
            found on {item.duplicateCount + 1} sources
          </span>
        )}
        <span className="ml-auto capitalize">{job.source.replace('_', ' ')}</span>
      </div>
    </Link>
  );
}
