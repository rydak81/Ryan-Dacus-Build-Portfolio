-- Default scoring weights. Tunable at runtime; the engine falls back to
-- code defaults when this table is empty.

insert into scoring_weights (key, label, points) values
  ('on_career_site', 'Found on employer’s official career site', 20),
  ('application_active', 'Application endpoint responds and accepts applicants', 15),
  ('posted_within_7d', 'First detected within the past 7 days', 12),
  ('ats_active', 'ATS confirms active requisition', 10),
  ('company_hiring_similar', 'Company recently posted other similar open roles', 8),
  ('description_recently_changed', 'Job description changed recently', 8),
  ('company_hiring_activity', 'Company shows recent hiring activity', 6),
  ('multi_source_match', 'Appears on multiple authoritative sources with matching IDs', 5),
  ('missing_from_career_site', 'Employer careers page no longer contains the job', -30),
  ('ats_closed', 'ATS identifies the job as closed', -25),
  ('application_dead', 'Application URL is dead or redirects to a generic careers page', -20),
  ('open_120_days', 'Position has continuously existed for 120+ days', -18),
  ('repost_cycle', 'Listing disappears and reappears repeatedly with identical content', -15),
  ('duplicate_ids', 'Same job appears under multiple duplicate IDs', -12),
  ('date_bumped', 'Posting date changes while description stays identical', -10),
  ('hiring_freeze', 'Company recently announced a hiring freeze or major layoffs', -10),
  ('filled_elsewhere', 'Equivalent requisition appears marked filled elsewhere', -8),
  ('evergreen_language', 'Unusually vague language associated with evergreen recruiting', -5)
on conflict (key) do nothing;
