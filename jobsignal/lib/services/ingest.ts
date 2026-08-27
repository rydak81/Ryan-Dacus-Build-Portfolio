/**
 * Ingestion runner: pull a company's postings from its ATS, reconcile
 * against known jobs (history-preserving), detect removals and
 * duplicates, and re-score.
 */

import { greenhouseProvider } from '@/lib/ingest/greenhouse';
import { leverProvider } from '@/lib/ingest/lever';
import { detectRemovals, reconcilePosting } from '@/lib/ingest/pipeline';
import { findDuplicates, toDuplicateRecords } from '@/lib/dedup/duplicates';
import { rescoreJob } from './rescore';
import { getStore } from '@/lib/db';
import type { Company, Job } from '@/lib/types';
import type { IngestionProvider } from '@/lib/ingest/types';

const PROVIDERS: Record<string, IngestionProvider> = {
  greenhouse: greenhouseProvider,
  lever: leverProvider,
};

export interface IngestSummary {
  company: string;
  fetched: number;
  created: number;
  updated: number;
  removed: number;
  duplicatesFound: number;
}

export async function ingestCompany(company: Company): Promise<IngestSummary> {
  if (!company.ats_provider || !company.ats_token) {
    throw new Error(`Company ${company.name} has no ATS configuration`);
  }
  const provider = PROVIDERS[company.ats_provider];
  if (!provider) {
    throw new Error(`No ingestion provider for "${company.ats_provider}"`);
  }

  const store = getStore();
  const now = new Date();
  const postings = await provider.fetchJobs(company.ats_token);

  let created = 0;
  let updated = 0;
  const touched: Job[] = [];

  for (const raw of postings) {
    const existing = await store.findJobByExternalId(company.id, provider.kind, raw.externalId);
    const result = reconcilePosting(raw, existing, company.id, provider.kind, now);
    await store.saveJob(result.job);
    await store.insertEvents(result.job.id, result.events, now.toISOString());
    touched.push(result.job);
    if (result.isNew) created++;
    else if (result.events.length > 0) updated++;
  }

  // Removals: previously-known jobs from this source that vanished.
  const knownJobs = (await store.getCompanyJobs(company.id))
    .map((i) => i.job)
    .filter((j) => j.source === provider.kind);
  const removals = detectRemovals(knownJobs, new Set(postings.map((p) => p.externalId)), now);
  for (const { job, event } of removals) {
    await store.saveJob(job);
    await store.insertEvents(job.id, [event], now.toISOString());
  }

  // Duplicate detection across everything now known for this company.
  const allJobs = (await store.getCompanyJobs(company.id)).map((i) => i.job);
  const groups = findDuplicates(allJobs);
  const dupRecords = toDuplicateRecords(groups);
  await store.saveDuplicates(dupRecords);

  for (const job of touched) {
    await rescoreJob(job.id);
  }

  return {
    company: company.name,
    fetched: postings.length,
    created,
    updated,
    removed: removals.length,
    duplicatesFound: dupRecords.length,
  };
}
