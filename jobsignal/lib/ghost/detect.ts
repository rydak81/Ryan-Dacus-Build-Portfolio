/**
 * Ghost-job detection: deterministic pattern analysis over a job's observed
 * event history. Reposting must never erase historical age — the module
 * reports the job's true age from first_seen_at regardless of what the
 * source claims.
 */

import type { Job, JobEvent } from '@/lib/types';
import { daysAgo } from '@/lib/utils';

export interface GhostAnalysis {
  /** days since JobSignal first observed the posting (true age) */
  trueAgeDays: number;
  /** days since the source claims it was posted (untrusted) */
  claimedAgeDays: number | null;
  /** source claims a much younger age than we observed */
  ageDiscrepancy: boolean;
  repostCount: number;
  repeatedRepostPattern: boolean;
  disappearReappearCycles: number;
  flags: string[];
}

export function analyzeGhostSignals(
  job: Job,
  events: JobEvent[],
  now: Date = new Date(),
): GhostAnalysis {
  const trueAgeDays = daysAgo(job.first_seen_at, now);
  const claimedAgeDays = job.original_posted_at ? daysAgo(job.original_posted_at, now) : null;

  // Count removal → reappearance cycles from the event history.
  const ordered = [...events].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime(),
  );
  let cycles = 0;
  let removed = false;
  for (const e of ordered) {
    if (e.kind === 'removed') removed = true;
    if ((e.kind === 'reappeared' || e.kind === 'reposted') && removed) {
      cycles++;
      removed = false;
    }
  }

  const repostCount = Math.max(job.repost_count, cycles);
  const repeatedRepostPattern = repostCount >= 2;
  const ageDiscrepancy =
    claimedAgeDays !== null && trueAgeDays - claimedAgeDays >= 30;

  const flags: string[] = [];
  if (repeatedRepostPattern) {
    flags.push(`Repeated reposting pattern — removed and reposted ${repostCount} times with near-identical content`);
  }
  if (ageDiscrepancy) {
    flags.push(
      `Source claims posted ${claimedAgeDays} day${claimedAgeDays === 1 ? '' : 's'} ago, but JobSignal first detected it ${trueAgeDays} days ago`,
    );
  }
  if (trueAgeDays >= 120) {
    flags.push(`Continuously open for ${trueAgeDays} days`);
  }

  return {
    trueAgeDays,
    claimedAgeDays,
    ageDiscrepancy,
    repostCount,
    repeatedRepostPattern,
    disappearReappearCycles: cycles,
    flags,
  };
}
