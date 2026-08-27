/**
 * Verification service: run the deterministic verifier against a job,
 * persist the append-only verification record and any status transition,
 * then re-score.
 */

import { getStore, isDemoMode } from '@/lib/db';
import { verifyJob } from '@/lib/verify/verifier';
import { rescoreJob } from './rescore';
import type { JobVerification } from '@/lib/types';
import type { JobBundle } from '@/lib/db/store';

/**
 * Demo mode has no real employer endpoints to hit (seed URLs are
 * illustrative), so verification replays the job's last known source
 * state with a fresh timestamp instead of making network calls.
 */
function simulateVerification(bundle: JobBundle, now: Date): Omit<JobVerification, 'id'> {
  const last = bundle.verifications[0];
  return {
    job_id: bundle.job.id,
    checked_at: now.toISOString(),
    source_checked: last?.source_checked ?? 'ats',
    status_code: last?.status_code ?? 200,
    still_exists: last?.still_exists ?? bundle.job.status === 'active',
    application_link_valid: last?.application_link_valid ?? null,
    found_on_company_site: last?.found_on_company_site ?? null,
    found_on_ats: last?.found_on_ats ?? null,
    detected_repost: false,
    description_changed: false,
    hiring_signal_score: null,
    notes: 'Demo-mode verification: replayed last known source state',
  };
}

export async function verifyAndRescore(jobId: string): Promise<Omit<JobVerification, 'id'> | null> {
  const store = getStore();
  const bundle = await store.getJob(jobId);
  if (!bundle) return null;

  const now = new Date();
  const verification = isDemoMode()
    ? simulateVerification(bundle, now)
    : await verifyJob(bundle.job, bundle.company, now);
  await store.insertVerification(verification);

  if (!verification.still_exists && bundle.job.status === 'active') {
    await store.saveJob({ ...bundle.job, status: 'stale' });
    await store.insertEvents(
      jobId,
      [{ kind: 'removed', detail: 'Verification could not confirm the listing still exists' }],
      now.toISOString(),
    );
  } else if (verification.still_exists) {
    await store.insertEvents(
      jobId,
      [{ kind: 'verified', detail: verification.notes ?? 'Verification passed' }],
      now.toISOString(),
    );
  }

  await rescoreJob(jobId);
  return verification;
}
