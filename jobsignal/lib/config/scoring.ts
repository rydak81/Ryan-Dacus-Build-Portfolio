/**
 * Default scoring weights and confidence labels. These are the fallback
 * configuration; production reads overrides from the scoring_weights table
 * so weights can be tuned without a deploy.
 */

export interface SignalWeight {
  key: string;
  label: string;
  points: number;
  enabled: boolean;
}

export const DEFAULT_WEIGHTS: SignalWeight[] = [
  // Strong positive
  { key: 'on_career_site', label: 'Found on employer’s official career site', points: 20, enabled: true },
  { key: 'application_active', label: 'Application endpoint responds and accepts applicants', points: 15, enabled: true },
  { key: 'posted_within_7d', label: 'First detected within the past 7 days', points: 12, enabled: true },
  { key: 'ats_active', label: 'ATS confirms active requisition', points: 10, enabled: true },
  { key: 'company_hiring_similar', label: 'Company recently posted other similar open roles', points: 8, enabled: true },
  { key: 'description_recently_changed', label: 'Job description changed recently', points: 8, enabled: true },
  { key: 'company_hiring_activity', label: 'Company shows recent hiring activity', points: 6, enabled: true },
  { key: 'multi_source_match', label: 'Appears on multiple authoritative sources with matching IDs', points: 5, enabled: true },

  // Strong negative
  { key: 'missing_from_career_site', label: 'Employer careers page no longer contains the job', points: -30, enabled: true },
  { key: 'ats_closed', label: 'ATS identifies the job as closed', points: -25, enabled: true },
  { key: 'application_dead', label: 'Application URL is dead or redirects to a generic careers page', points: -20, enabled: true },
  { key: 'open_120_days', label: 'Position has continuously existed for 120+ days', points: -18, enabled: true },
  { key: 'repost_cycle', label: 'Listing disappears and reappears repeatedly with identical content', points: -15, enabled: true },
  { key: 'duplicate_ids', label: 'Same job appears under multiple duplicate IDs', points: -12, enabled: true },
  { key: 'date_bumped', label: 'Posting date changes while description stays identical', points: -10, enabled: true },
  { key: 'hiring_freeze', label: 'Company recently announced a hiring freeze or major layoffs', points: -10, enabled: true },
  { key: 'filled_elsewhere', label: 'Equivalent requisition appears marked filled elsewhere', points: -8, enabled: true },
  { key: 'evergreen_language', label: 'Unusually vague language associated with evergreen recruiting', points: -5, enabled: true },
];

export interface ConfidenceBand {
  min: number;
  max: number;
  label: string;
  tone: 'positive' | 'caution' | 'negative';
}

export const CONFIDENCE_BANDS: ConfidenceBand[] = [
  { min: 90, max: 100, label: 'Highly Likely Active', tone: 'positive' },
  { min: 75, max: 89, label: 'Likely Active', tone: 'positive' },
  { min: 60, max: 74, label: 'Probably Active', tone: 'positive' },
  { min: 40, max: 59, label: 'Uncertain', tone: 'caution' },
  { min: 20, max: 39, label: 'Likely Stale', tone: 'negative' },
  { min: 0, max: 19, label: 'Likely Ghost / Closed', tone: 'negative' },
];

/** Score every job starts from before signals are applied. */
export const BASELINE_SCORE = 50;

export function confidenceLabel(score: number): ConfidenceBand {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  return CONFIDENCE_BANDS.find((b) => s >= b.min && s <= b.max) ?? CONFIDENCE_BANDS[3];
}
