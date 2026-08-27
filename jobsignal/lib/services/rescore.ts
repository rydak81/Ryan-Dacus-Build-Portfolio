/**
 * Re-scoring service: rebuilds facts from stored history and runs the
 * deterministic engine. Called after ingestion and verification.
 */

import { getStore } from '@/lib/db';
import { scoreJob, toJobScore } from '@/lib/scoring/engine';
import { buildFacts } from '@/lib/scoring/facts';

export async function rescoreJob(jobId: string): Promise<void> {
  const store = getStore();
  const bundle = await store.getJob(jobId);
  if (!bundle) return;
  const companyJobs = (await store.getCompanyJobs(bundle.job.company_id)).map((i) => i.job);
  const weights = await store.getScoringWeights();
  const facts = buildFacts({
    job: bundle.job,
    company: bundle.company,
    verifications: bundle.verifications,
    duplicates: bundle.duplicates,
    companyJobs,
  });
  const result = scoreJob(facts, weights);
  await store.saveScore(
    toJobScore(jobId, result, bundle.score?.match_score ?? null, new Date()),
  );
}
