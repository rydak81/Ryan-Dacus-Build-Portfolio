/**
 * Ingestion reconciliation: given what a provider returned and what we
 * already know, decide what changed. Pure functions so the history rules
 * (age never resets, reposts are counted, wording changes are recorded)
 * are directly testable.
 */

import type { Job, JobEvent, SourceKind } from '@/lib/types';
import { hashText, normalizeTitle, textSimilarity } from '@/lib/utils';
import type { RawJobPosting } from './types';

export interface ReconcileResult {
  job: Job;
  events: Array<Pick<JobEvent, 'kind' | 'detail'>>;
  isNew: boolean;
}

export function reconcilePosting(
  raw: RawJobPosting,
  existing: Job | null,
  companyId: string,
  source: SourceKind,
  now: Date,
): ReconcileResult {
  const nowIso = now.toISOString();
  const descriptionHash = hashText(raw.description);

  if (!existing) {
    return {
      isNew: true,
      job: {
        id: crypto.randomUUID(),
        company_id: companyId,
        external_job_id: raw.externalId,
        title: raw.title,
        normalized_title: normalizeTitle(raw.title),
        description: raw.description,
        location: raw.location,
        employment_type: raw.employmentType,
        salary_min: raw.salaryMin,
        salary_max: raw.salaryMax,
        source,
        source_url: raw.sourceUrl,
        application_url: raw.applicationUrl,
        careers_page_url: null,
        first_seen_at: nowIso,
        last_seen_at: nowIso,
        original_posted_at: raw.postedAt,
        latest_repost_at: null,
        repost_count: 0,
        last_verified_at: null,
        status: 'active',
        raw_data: raw.raw,
        description_hash: descriptionHash,
      },
      events: [{ kind: 'first_seen', detail: `Ingested from ${source}` }],
    };
  }

  const events: Array<Pick<JobEvent, 'kind' | 'detail'>> = [];
  const job: Job = { ...existing, last_seen_at: nowIso };

  // A job we had marked removed/closed is back: that is a repost, and its
  // first_seen_at is deliberately NOT reset.
  if (existing.status === 'closed' || existing.status === 'stale') {
    job.repost_count = existing.repost_count + 1;
    job.latest_repost_at = nowIso;
    job.status = existing.repost_count + 1 >= 2 ? 'ghost_suspect' : 'active';
    const identical = existing.description_hash === descriptionHash;
    events.push({
      kind: 'reappeared',
      detail: identical
        ? 'Listing reappeared with identical content'
        : 'Listing reappeared with modified content',
    });
  } else {
    job.status = existing.status === 'unknown' ? 'active' : existing.status;
  }

  // Source moved its claimed posting date forward while content stayed the
  // same — classic date bumping.
  if (
    raw.postedAt &&
    existing.original_posted_at &&
    new Date(raw.postedAt).getTime() > new Date(existing.original_posted_at).getTime() &&
    existing.description_hash === descriptionHash
  ) {
    job.latest_repost_at = raw.postedAt;
    job.repost_count = existing.repost_count + 1;
    events.push({
      kind: 'reposted',
      detail: 'Source posting date moved forward while description stayed identical',
    });
  }

  if (existing.description_hash !== descriptionHash) {
    const sim = textSimilarity(existing.description, raw.description);
    job.description = raw.description;
    job.description_hash = descriptionHash;
    events.push({
      kind: 'description_changed',
      detail: `Description updated (${Math.round(sim * 100)}% similar to previous version)`,
    });
  }

  if (
    (raw.salaryMin ?? null) !== existing.salary_min ||
    (raw.salaryMax ?? null) !== existing.salary_max
  ) {
    job.salary_min = raw.salaryMin;
    job.salary_max = raw.salaryMax;
    events.push({ kind: 'salary_changed', detail: 'Posted salary range changed' });
  }

  job.title = raw.title;
  job.normalized_title = normalizeTitle(raw.title);
  job.location = raw.location;
  job.application_url = raw.applicationUrl;
  job.raw_data = raw.raw;

  return { isNew: false, job, events };
}

/**
 * Jobs we previously saw from this source that no longer appear in the
 * provider's response have been removed at the source.
 */
export function detectRemovals(
  knownJobs: Job[],
  fetchedExternalIds: Set<string>,
  now: Date,
): Array<{ job: Job; event: Pick<JobEvent, 'kind' | 'detail'> }> {
  return knownJobs
    .filter(
      (j) =>
        j.external_job_id !== null &&
        !fetchedExternalIds.has(j.external_job_id) &&
        j.status !== 'closed',
    )
    .map((j) => ({
      job: { ...j, status: 'closed' as const, last_seen_at: now.toISOString() },
      event: { kind: 'removed' as const, detail: 'No longer present in source feed' },
    }));
}
