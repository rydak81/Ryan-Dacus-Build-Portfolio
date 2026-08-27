/**
 * Domain types shared across the ingestion, verification, scoring, and UI
 * layers. These mirror the Supabase schema in supabase/migrations.
 */

export type JobStatus = 'active' | 'stale' | 'closed' | 'ghost_suspect' | 'unknown';
export type RemotePreference = 'remote' | 'hybrid' | 'onsite' | 'flexible';
export type SourceKind =
  | 'greenhouse'
  | 'lever'
  | 'ashby'
  | 'career_site'
  | 'job_board'
  | 'aggregator'
  | 'manual';

export interface Company {
  id: string;
  name: string;
  website: string | null;
  careers_url: string | null;
  industry: string | null;
  employee_count: number | null;
  headquarters: string | null;
  linkedin_company_url: string | null;
  ats_provider: string | null;
  /** provider-side identifier, e.g. the Greenhouse board token */
  ats_token: string | null;
  /** deterministic flag set from public announcements, never inferred by AI */
  hiring_freeze: boolean;
  last_verified_at: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  company_id: string;
  external_job_id: string | null;
  title: string;
  normalized_title: string;
  description: string;
  location: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  source: SourceKind;
  source_url: string | null;
  application_url: string | null;
  careers_page_url: string | null;
  /** when JobSignal itself first observed the posting — never reset by reposts */
  first_seen_at: string;
  last_seen_at: string;
  /** the date the source claims it was posted (untrusted) */
  original_posted_at: string | null;
  latest_repost_at: string | null;
  repost_count: number;
  last_verified_at: string | null;
  status: JobStatus;
  raw_data: Record<string, unknown> | null;
  description_hash: string;
}

export interface JobVerification {
  id: string;
  job_id: string;
  checked_at: string;
  source_checked: string;
  status_code: number | null;
  still_exists: boolean;
  application_link_valid: boolean | null;
  found_on_company_site: boolean | null;
  found_on_ats: boolean | null;
  detected_repost: boolean;
  description_changed: boolean;
  hiring_signal_score: number | null;
  notes: string | null;
}

export interface SignalContribution {
  key: string;
  label: string;
  points: number;
}

export interface JobScore {
  job_id: string;
  activity_score: number;
  freshness_score: number;
  legitimacy_score: number;
  match_score: number | null;
  outreach_score: number | null;
  competition_score: number | null;
  overall_score: number;
  confidence: 'high' | 'medium' | 'low';
  /** ordered signal breakdown — every score must be explainable */
  signals: SignalContribution[];
  explanation: string | null;
  generated_at: string;
}

export interface JobDuplicate {
  canonical_job_id: string;
  duplicate_job_id: string;
  similarity_score: number;
  reason: string;
}

export type ApplicationStatus =
  | 'saved'
  | 'contacted'
  | 'applied'
  | 'interview'
  | 'followup'
  | 'rejected'
  | 'offer';

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  applied_at: string | null;
  application_method: string | null;
  notes: string | null;
  last_followup_at: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  company_id: string;
  name: string;
  title: string;
  public_profile_url: string | null;
  public_contact_data: string | null;
  relationship_type:
    | 'hiring_manager'
    | 'recruiter'
    | 'department_head'
    | 'talent_acquisition'
    | 'team_lead'
    | 'executive';
  source: string;
  reason: string | null;
}

export interface UserProfile {
  user_id: string;
  current_title: string | null;
  desired_titles: string[];
  seniority: string | null;
  preferred_locations: string[];
  remote_preference: RemotePreference;
  salary_min: number | null;
  industries: string[];
  skills: string[];
  years_experience: number | null;
  resume_text: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
}

export interface JobEvent {
  id: string;
  job_id: string;
  occurred_at: string;
  kind:
    | 'first_seen'
    | 'verified'
    | 'description_changed'
    | 'reposted'
    | 'removed'
    | 'reappeared'
    | 'salary_changed'
    | 'closed'
    | 'score_changed';
  detail: string | null;
}

export interface MatchResult {
  score: number;
  strong_matches: string[];
  weak_or_missing: string[];
  explanation: string | null;
}

export interface UserFeedback {
  id: string;
  user_id: string;
  job_id: string;
  kind:
    | 'applied'
    | 'recruiter_responded'
    | 'interview_scheduled'
    | 'already_filled'
    | 'position_frozen'
    | 'rejected'
    | 'link_broken'
    | 'posting_disappeared';
  created_at: string;
}
