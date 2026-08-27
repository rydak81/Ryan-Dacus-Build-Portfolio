/**
 * Deterministic Job Confidence scoring engine.
 *
 * The engine evaluates facts (verification results, observed history,
 * duplicate records) against configurable signal weights and produces a
 * 0–100 score with a full per-signal breakdown. No LLM is involved in the
 * number itself — AI only summarizes the breakdown afterwards.
 */

import {
  BASELINE_SCORE,
  DEFAULT_WEIGHTS,
  confidenceLabel,
  type SignalWeight,
} from '@/lib/config/scoring';
import type {
  Job,
  JobDuplicate,
  JobScore,
  JobVerification,
  SignalContribution,
} from '@/lib/types';

export interface ScoringFacts {
  job: Job;
  /** most recent verification first */
  verifications: JobVerification[];
  duplicates: JobDuplicate[];
  /** other open roles at the company observed in the last 30 days */
  companyOpenRoles30d: number;
  /** company posted a similar-title role in the last 30 days */
  companySimilarRoles30d: number;
  companyHiringFreeze: boolean;
  filledElsewhere: boolean;
  /** evaluation timestamp — injected so scoring is reproducible/testable */
  now: Date;
}

const EVERGREEN_PHRASES = [
  'always looking for talented',
  'always hiring',
  'join our talent community',
  'talent pipeline',
  'future opportunities',
  'general application',
  'we are constantly seeking',
];

function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

type SignalCheck = (facts: ScoringFacts) => boolean;

/**
 * Each signal key maps to a deterministic predicate over the facts.
 * Weights (points, labels, enabled) come from configuration.
 */
const SIGNAL_CHECKS: Record<string, SignalCheck> = {
  on_career_site: (f) => latest(f)?.found_on_company_site === true,
  application_active: (f) => latest(f)?.application_link_valid === true,
  posted_within_7d: (f) => daysBetween(new Date(f.job.first_seen_at), f.now) <= 7,
  ats_active: (f) => latest(f)?.found_on_ats === true,
  company_hiring_similar: (f) => f.companySimilarRoles30d > 0,
  description_recently_changed: (f) =>
    f.verifications.some(
      (v) => v.description_changed && daysBetween(new Date(v.checked_at), f.now) <= 14,
    ),
  company_hiring_activity: (f) => f.companyOpenRoles30d >= 3,
  multi_source_match: (f) =>
    f.duplicates.some((d) => d.canonical_job_id === f.job.id && d.similarity_score >= 0.9),

  missing_from_career_site: (f) => latest(f)?.found_on_company_site === false,
  ats_closed: (f) => latest(f)?.found_on_ats === false && latest(f)?.source_checked === 'ats',
  application_dead: (f) => latest(f)?.application_link_valid === false,
  open_120_days: (f) => daysBetween(new Date(f.job.first_seen_at), f.now) >= 120,
  repost_cycle: (f) => f.job.repost_count >= 2,
  duplicate_ids: (f) =>
    f.duplicates.filter((d) => d.canonical_job_id === f.job.id && d.reason.includes('same company'))
      .length >= 2,
  date_bumped: (f) =>
    f.verifications.some((v) => v.detected_repost && !v.description_changed),
  hiring_freeze: (f) => f.companyHiringFreeze,
  filled_elsewhere: (f) => f.filledElsewhere,
  evergreen_language: (f) => {
    const text = f.job.description.toLowerCase();
    return EVERGREEN_PHRASES.some((p) => text.includes(p));
  },
};

function latest(f: ScoringFacts): JobVerification | undefined {
  return f.verifications[0];
}

export interface EngineResult {
  overall: number;
  label: string;
  signals: SignalContribution[];
  activity: number;
  freshness: number;
  legitimacy: number;
  confidence: 'high' | 'medium' | 'low';
}

export function scoreJob(
  facts: ScoringFacts,
  weights: SignalWeight[] = DEFAULT_WEIGHTS,
): EngineResult {
  const signals: SignalContribution[] = [];

  for (const w of weights) {
    if (!w.enabled) continue;
    const check = SIGNAL_CHECKS[w.key];
    if (!check) continue;
    if (check(facts)) {
      signals.push({ key: w.key, label: w.label, points: w.points });
    }
  }

  const raw = BASELINE_SCORE + signals.reduce((sum, s) => sum + s.points, 0);
  const overall = Math.max(0, Math.min(100, raw));

  // Sub-scores: same signal set partitioned by concern, normalized to 0–100.
  const activity = subScore(signals, [
    'on_career_site',
    'application_active',
    'ats_active',
    'missing_from_career_site',
    'ats_closed',
    'application_dead',
  ]);
  const freshness = subScore(signals, [
    'posted_within_7d',
    'description_recently_changed',
    'open_120_days',
    'date_bumped',
  ]);
  const legitimacy = subScore(signals, [
    'repost_cycle',
    'duplicate_ids',
    'evergreen_language',
    'multi_source_match',
    'hiring_freeze',
    'filled_elsewhere',
  ]);

  // Confidence in the score itself: how much direct evidence do we have?
  const verifiedRecently =
    facts.verifications.length > 0 &&
    daysBetween(new Date(facts.verifications[0].checked_at), facts.now) <= 3;
  const confidence: EngineResult['confidence'] =
    verifiedRecently && facts.verifications.length >= 2
      ? 'high'
      : facts.verifications.length > 0
        ? 'medium'
        : 'low';

  return {
    overall,
    label: confidenceLabel(overall).label,
    signals,
    activity,
    freshness,
    legitimacy,
    confidence,
  };
}

function subScore(signals: SignalContribution[], keys: string[]): number {
  const relevant = signals.filter((s) => keys.includes(s.key));
  const raw = BASELINE_SCORE + relevant.reduce((sum, s) => sum + s.points, 0);
  return Math.max(0, Math.min(100, raw));
}

export function toJobScore(
  jobId: string,
  result: EngineResult,
  matchScore: number | null,
  generatedAt: Date,
): JobScore {
  return {
    job_id: jobId,
    activity_score: result.activity,
    freshness_score: result.freshness,
    legitimacy_score: result.legitimacy,
    match_score: matchScore,
    outreach_score: null,
    competition_score: null,
    overall_score: result.overall,
    confidence: result.confidence,
    signals: result.signals,
    explanation: null,
    generated_at: generatedAt.toISOString(),
  };
}
