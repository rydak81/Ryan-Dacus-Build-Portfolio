/**
 * Ingestion provider contract. Each ATS/source implements fetchJobs() and
 * the shared upsert pipeline handles history, hashing, repost detection,
 * and events. Adding a provider means adding one file that maps its API
 * shape to RawJobPosting.
 */

import type { SourceKind } from '@/lib/types';

export interface RawJobPosting {
  externalId: string;
  title: string;
  description: string;
  location: string | null;
  employmentType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  sourceUrl: string;
  applicationUrl: string;
  postedAt: string | null;
  raw: Record<string, unknown>;
}

export interface IngestionProvider {
  kind: SourceKind;
  /** e.g. the Greenhouse board token or Lever site tag */
  fetchJobs(companyToken: string): Promise<RawJobPosting[]>;
}
