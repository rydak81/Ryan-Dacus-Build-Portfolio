/**
 * Duplicate detection: deterministic first (normalized title + company +
 * location + description similarity + ATS identifiers). Embedding-based
 * semantic dedup can be layered on later via pgvector.
 */

import type { Job, JobDuplicate } from '@/lib/types';
import { normalizeTitle, textSimilarity } from '@/lib/utils';

const SIMILARITY_THRESHOLD = 0.7;

export interface DuplicateGroup {
  canonical: Job;
  duplicates: Array<{ job: Job; similarity: number; reason: string }>;
}

/**
 * Application-source preference order: employer ATS > career site >
 * job board > aggregator. The canonical job in a group is the one from the
 * most authoritative source.
 */
const SOURCE_RANK: Record<string, number> = {
  greenhouse: 0,
  lever: 0,
  ashby: 0,
  career_site: 1,
  job_board: 2,
  aggregator: 3,
  manual: 4,
};

export function sourceRank(source: string): number {
  return SOURCE_RANK[source] ?? 5;
}

export function findDuplicates(jobs: Job[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const assigned = new Set<string>();

  const sorted = [...jobs].sort((a, b) => sourceRank(a.source) - sourceRank(b.source));

  for (const candidate of sorted) {
    if (assigned.has(candidate.id)) continue;
    const group: DuplicateGroup = { canonical: candidate, duplicates: [] };
    assigned.add(candidate.id);

    for (const other of sorted) {
      if (assigned.has(other.id)) continue;
      const match = compareJobs(candidate, other);
      if (match) {
        group.duplicates.push({ job: other, ...match });
        assigned.add(other.id);
      }
    }
    groups.push(group);
  }
  return groups;
}

function compareJobs(
  a: Job,
  b: Job,
): { similarity: number; reason: string } | null {
  if (a.company_id !== b.company_id) return null;

  // Exact external ID match across sources is definitive.
  if (a.external_job_id && a.external_job_id === b.external_job_id) {
    return { similarity: 1, reason: 'matching ATS identifiers at same company' };
  }

  const sameTitle = normalizeTitle(a.title) === normalizeTitle(b.title);
  const sameLocation = (a.location ?? '').toLowerCase() === (b.location ?? '').toLowerCase();
  const descSim = textSimilarity(a.description, b.description);

  if (sameTitle && sameLocation && descSim >= SIMILARITY_THRESHOLD) {
    return {
      similarity: descSim,
      reason: 'same company, normalized title, location, and near-identical description',
    };
  }
  if (sameTitle && descSim >= 0.9) {
    return { similarity: descSim, reason: 'same company and title with near-identical description' };
  }
  return null;
}

export function toDuplicateRecords(groups: DuplicateGroup[]): JobDuplicate[] {
  return groups.flatMap((g) =>
    g.duplicates.map((d) => ({
      canonical_job_id: g.canonical.id,
      duplicate_job_id: d.job.id,
      similarity_score: d.similarity,
      reason: d.reason,
    })),
  );
}
