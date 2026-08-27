/**
 * Verification engine — deterministic checks that a job still exists and
 * still accepts applicants. HTTP status, ATS presence, and redirect
 * behavior are facts; no AI is involved here.
 */

import type { Company, Job, JobVerification } from '@/lib/types';
import { greenhouseProvider } from '@/lib/ingest/greenhouse';
import { leverProvider } from '@/lib/ingest/lever';

interface UrlCheck {
  ok: boolean;
  status: number | null;
  redirectedToGeneric: boolean;
}

async function checkUrl(url: string, careersRoot: string | null): Promise<UrlCheck> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'user-agent': 'JobSignalBot/0.1 (+job verification)' },
      signal: AbortSignal.timeout(10_000),
    });
    // A dead application link often redirects to the generic careers root.
    const finalUrl = res.url ?? url;
    const redirectedToGeneric =
      careersRoot !== null &&
      finalUrl !== url &&
      finalUrl.replace(/\/$/, '') === careersRoot.replace(/\/$/, '');
    return { ok: res.ok && !redirectedToGeneric, status: res.status, redirectedToGeneric };
  } catch {
    return { ok: false, status: null, redirectedToGeneric: false };
  }
}

/**
 * Re-check a job against its ATS feed and its application URL. Returns an
 * append-only verification record; the caller persists it and re-scores.
 */
export async function verifyJob(
  job: Job,
  company: Company,
  now: Date = new Date(),
): Promise<Omit<JobVerification, 'id'>> {
  let foundOnAts: boolean | null = null;
  let sourceChecked = 'http';
  const notes: string[] = [];

  // 1. ATS check: is the requisition still in the public feed?
  if (company.ats_token && (job.source === 'greenhouse' || job.source === 'lever')) {
    sourceChecked = 'ats';
    try {
      const provider = job.source === 'greenhouse' ? greenhouseProvider : leverProvider;
      const postings = await provider.fetchJobs(company.ats_token);
      foundOnAts = postings.some((p) => p.externalId === job.external_job_id);
      notes.push(
        foundOnAts
          ? `Requisition present in ${job.source} feed (${postings.length} open roles)`
          : `Requisition absent from ${job.source} feed`,
      );
    } catch (err) {
      notes.push(`ATS feed unreachable: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }

  // 2. Application URL check.
  let applicationLinkValid: boolean | null = null;
  let statusCode: number | null = null;
  if (job.application_url) {
    const check = await checkUrl(job.application_url, company.careers_url);
    applicationLinkValid = check.ok;
    statusCode = check.status;
    if (check.redirectedToGeneric) notes.push('Application URL redirects to generic careers page');
    else if (!check.ok) notes.push(`Application URL returned ${check.status ?? 'network error'}`);
  }

  // "Found on company site" is inferred from the ATS-hosted page for ATS
  // sources; a dedicated career-site crawler can refine this later.
  const foundOnCompanySite =
    foundOnAts !== null ? foundOnAts : applicationLinkValid;

  const stillExists = (foundOnAts ?? applicationLinkValid) === true;

  return {
    job_id: job.id,
    checked_at: now.toISOString(),
    source_checked: sourceChecked,
    status_code: statusCode,
    still_exists: stillExists,
    application_link_valid: applicationLinkValid,
    found_on_company_site: foundOnCompanySite,
    found_on_ats: foundOnAts,
    detected_repost: false,
    description_changed: false,
    hiring_signal_score: null,
    notes: notes.join('; ') || null,
  };
}
