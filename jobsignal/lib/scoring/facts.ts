/**
 * Builds ScoringFacts for a job from stored data. This is the only place
 * company-level context (open roles, similar roles, freeze flags) is
 * derived, so the scoring engine stays a pure function of its inputs.
 */

import type { Company, Job, JobDuplicate, JobVerification } from '@/lib/types';
import type { ScoringFacts } from './engine';
import { daysAgo, normalizeTitle } from '@/lib/utils';

export function buildFacts(opts: {
  job: Job;
  company: Company;
  verifications: JobVerification[];
  duplicates: JobDuplicate[];
  companyJobs: Job[];
  filledElsewhere?: boolean;
  now?: Date;
}): ScoringFacts {
  const { job, company, verifications, duplicates, companyJobs } = opts;
  const now = opts.now ?? new Date();

  const others = companyJobs.filter((j) => j.id !== job.id && j.status !== 'closed');
  const companyOpenRoles30d = others.filter((j) => daysAgo(j.first_seen_at, now) <= 30).length;

  const titleWords = new Set(normalizeTitle(job.title).split(' ').filter((w) => w.length > 3));
  const companySimilarRoles30d = others.filter((j) => {
    if (daysAgo(j.first_seen_at, now) > 30) return false;
    const words = normalizeTitle(j.title).split(' ');
    return words.filter((w) => titleWords.has(w)).length >= 1;
  }).length;

  return {
    job,
    verifications: [...verifications].sort(
      (a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime(),
    ),
    duplicates,
    companyOpenRoles30d,
    companySimilarRoles30d,
    companyHiringFreeze: company.hiring_freeze,
    filledElsewhere: opts.filledElsewhere ?? false,
    now,
  };
}
