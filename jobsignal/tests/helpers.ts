import type { Job, JobVerification } from '@/lib/types';
import { hashText, normalizeTitle } from '@/lib/utils';

export const NOW = new Date('2026-08-27T12:00:00Z');

export function daysBefore(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

export function makeJob(overrides: Partial<Job> = {}): Job {
  const description = overrides.description ?? 'A standard job description with meaningful detail.';
  const title = overrides.title ?? 'Director of Partnerships';
  return {
    id: 'job-1',
    company_id: 'co-1',
    external_job_id: 'ext-1',
    title,
    normalized_title: normalizeTitle(title),
    description,
    location: 'Remote — United States',
    employment_type: 'Full-time',
    salary_min: null,
    salary_max: null,
    source: 'greenhouse',
    source_url: 'https://example.com/job',
    application_url: 'https://example.com/job/apply',
    careers_page_url: null,
    first_seen_at: daysBefore(5),
    last_seen_at: daysBefore(0),
    original_posted_at: daysBefore(5),
    latest_repost_at: null,
    repost_count: 0,
    last_verified_at: null,
    status: 'active',
    raw_data: null,
    description_hash: hashText(description),
    ...overrides,
  };
}

export function makeVerification(overrides: Partial<JobVerification> = {}): JobVerification {
  return {
    id: 'ver-1',
    job_id: 'job-1',
    checked_at: daysBefore(0),
    source_checked: 'ats',
    status_code: 200,
    still_exists: true,
    application_link_valid: true,
    found_on_company_site: true,
    found_on_ats: true,
    detected_repost: false,
    description_changed: false,
    hiring_signal_score: null,
    notes: null,
    ...overrides,
  };
}
