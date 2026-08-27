-- JobSignal core schema.
-- Job-market intelligence: companies, jobs, verification history, scores,
-- duplicates, applications, contacts, user profiles, feedback, watchlists.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- companies
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  careers_url text,
  industry text,
  employee_count integer,
  headquarters text,
  linkedin_company_url text,
  ats_provider text,
  ats_token text,
  hiring_freeze boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (name)
);

-- --------------------------------------------------------------------- jobs
create table jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  external_job_id text,
  title text not null,
  normalized_title text not null,
  description text not null default '',
  location text,
  employment_type text,
  salary_min integer,
  salary_max integer,
  source text not null,
  source_url text,
  application_url text,
  careers_page_url text,
  -- first_seen_at is JobSignal's own observation date. Reposting must never
  -- reset it: historical age is the product's core asset.
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  original_posted_at timestamptz,
  latest_repost_at timestamptz,
  repost_count integer not null default 0,
  last_verified_at timestamptz,
  status text not null default 'unknown',
  raw_data jsonb,
  description_hash text not null default '',
  unique (company_id, source, external_job_id)
);

create index jobs_company_idx on jobs(company_id);
create index jobs_status_idx on jobs(status);
create index jobs_normalized_title_idx on jobs(normalized_title);
create index jobs_first_seen_idx on jobs(first_seen_at);

-- ------------------------------------------------------- job_verifications
-- Append-only: every verification event is a row, history is never
-- overwritten.
create table job_verifications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  checked_at timestamptz not null default now(),
  source_checked text not null,
  status_code integer,
  still_exists boolean not null,
  application_link_valid boolean,
  found_on_company_site boolean,
  found_on_ats boolean,
  detected_repost boolean not null default false,
  description_changed boolean not null default false,
  hiring_signal_score integer,
  notes text
);

create index job_verifications_job_idx on job_verifications(job_id, checked_at desc);

-- ------------------------------------------------------------- job_events
-- Historical memory: appearance, removal, repost, wording/salary changes.
create table job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  kind text not null,
  detail text
);

create index job_events_job_idx on job_events(job_id, occurred_at);

-- ------------------------------------------------------------- job_scores
create table job_scores (
  job_id uuid primary key references jobs(id) on delete cascade,
  activity_score integer not null,
  freshness_score integer not null,
  legitimacy_score integer not null,
  match_score integer,
  outreach_score integer,
  competition_score integer,
  overall_score integer not null,
  confidence text not null default 'medium',
  signals jsonb not null default '[]',
  explanation text,
  generated_at timestamptz not null default now()
);

-- --------------------------------------------------------- job_duplicates
create table job_duplicates (
  canonical_job_id uuid not null references jobs(id) on delete cascade,
  duplicate_job_id uuid not null references jobs(id) on delete cascade,
  similarity_score real not null,
  reason text not null,
  primary key (canonical_job_id, duplicate_job_id)
);

-- -------------------------------------------------------- scoring_weights
-- Configurable signal weights; the engine reads these instead of hardcoding.
create table scoring_weights (
  key text primary key,
  label text not null,
  points integer not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------- user_profiles
create table user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_title text,
  desired_titles text[] not null default '{}',
  seniority text,
  preferred_locations text[] not null default '{}',
  remote_preference text not null default 'flexible',
  salary_min integer,
  industries text[] not null default '{}',
  skills text[] not null default '{}',
  years_experience integer,
  resume_text text,
  linkedin_url text,
  portfolio_url text,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------- applications
create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  status text not null default 'saved',
  applied_at timestamptz,
  application_method text,
  notes text,
  last_followup_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

-- --------------------------------------------------------------- contacts
-- Public professional information only; never private contact data.
create table contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  title text not null,
  public_profile_url text,
  public_contact_data text,
  relationship_type text not null,
  source text not null,
  reason text
);

-- ---------------------------------------------------------- user_feedback
-- Crowdsourced ground truth; weighted, never treated as verified on its own.
create table user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------- watchlists
create table watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null, -- job | company | title | search
  target text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------ row level security
alter table user_profiles enable row level security;
alter table applications enable row level security;
alter table user_feedback enable row level security;
alter table watchlists enable row level security;

create policy "own profile" on user_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own applications" on applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own feedback" on user_feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own watchlists" on watchlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Market data is readable by any authenticated user; written only by the
-- service role (ingestion/verification pipelines).
alter table companies enable row level security;
alter table jobs enable row level security;
alter table job_verifications enable row level security;
alter table job_events enable row level security;
alter table job_scores enable row level security;
alter table job_duplicates enable row level security;
alter table contacts enable row level security;
alter table scoring_weights enable row level security;

create policy "read companies" on companies for select using (auth.role() = 'authenticated');
create policy "read jobs" on jobs for select using (auth.role() = 'authenticated');
create policy "read verifications" on job_verifications for select using (auth.role() = 'authenticated');
create policy "read events" on job_events for select using (auth.role() = 'authenticated');
create policy "read scores" on job_scores for select using (auth.role() = 'authenticated');
create policy "read duplicates" on job_duplicates for select using (auth.role() = 'authenticated');
create policy "read contacts" on contacts for select using (auth.role() = 'authenticated');
create policy "read weights" on scoring_weights for select using (auth.role() = 'authenticated');
