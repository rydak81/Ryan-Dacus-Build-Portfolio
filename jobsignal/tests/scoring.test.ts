import { describe, expect, it } from 'vitest';
import { scoreJob, type ScoringFacts } from '@/lib/scoring/engine';
import { BASELINE_SCORE, confidenceLabel } from '@/lib/config/scoring';
import { NOW, daysBefore, makeJob, makeVerification } from './helpers';

function facts(overrides: Partial<ScoringFacts> = {}): ScoringFacts {
  return {
    job: makeJob(),
    verifications: [],
    duplicates: [],
    companyOpenRoles30d: 0,
    companySimilarRoles30d: 0,
    companyHiringFreeze: false,
    filledElsewhere: false,
    now: NOW,
    ...overrides,
  };
}

describe('scoring engine', () => {
  it('starts from the baseline with no signals', () => {
    const job = makeJob({ first_seen_at: daysBefore(30) });
    const result = scoreJob(facts({ job }));
    expect(result.overall).toBe(BASELINE_SCORE);
    expect(result.signals).toHaveLength(0);
  });

  it('sums the prompt example: career site +20, app active +15, 5 days old +12, minus 120-day age and reposts', () => {
    // "Job exists on employer page +20, application active +15, posted 5
    // days ago +12" — but this job is 5 days old, so the 120-day and
    // repost penalties need a different fixture; here the fresh clean job:
    const job = makeJob({ first_seen_at: daysBefore(5) });
    const v = makeVerification({
      found_on_company_site: true,
      application_link_valid: true,
      found_on_ats: null,
      source_checked: 'http',
    });
    const result = scoreJob(facts({ job, verifications: [v] }));
    // 50 + 20 + 15 + 12 = 97
    expect(result.overall).toBe(97);
    expect(result.signals.map((s) => s.key).sort()).toEqual(
      ['application_active', 'on_career_site', 'posted_within_7d'].sort(),
    );
  });

  it('penalizes the stale reposted job from the spec example', () => {
    const job = makeJob({ first_seen_at: daysBefore(120), repost_count: 3 });
    const v = makeVerification({
      found_on_company_site: true,
      application_link_valid: true,
      found_on_ats: null,
      source_checked: 'http',
    });
    // 50 +20 +15 -18 (120 days) -15 (repost cycle) = 52
    const result = scoreJob(facts({ job, verifications: [v] }));
    expect(result.overall).toBe(52);
  });

  it('scores a fully-verified active ATS job high', () => {
    const job = makeJob({ first_seen_at: daysBefore(4) });
    const result = scoreJob(
      facts({
        job,
        verifications: [makeVerification()],
        companyOpenRoles30d: 5,
        companySimilarRoles30d: 2,
      }),
    );
    // 50 +20 +15 +12 +10 +8 +6 = clamped at 100
    expect(result.overall).toBe(100);
    expect(result.label).toBe('Highly Likely Active');
  });

  it('drives a removed listing toward ghost territory', () => {
    const job = makeJob({ first_seen_at: daysBefore(147), repost_count: 4 });
    const v = makeVerification({
      still_exists: false,
      found_on_company_site: false,
      found_on_ats: false,
      application_link_valid: null,
      detected_repost: true,
    });
    // 50 -30 (missing) -25 (ats closed) -18 (120d) -15 (repost) -10 (bump) = 0
    const result = scoreJob(facts({ job, verifications: [v] }));
    expect(result.overall).toBe(0);
    expect(result.label).toBe('Likely Ghost / Closed');
  });

  it('penalizes dead application links', () => {
    const job = makeJob({ first_seen_at: daysBefore(30) });
    const v = makeVerification({
      application_link_valid: false,
      found_on_company_site: false,
      found_on_ats: false,
      still_exists: false,
    });
    const result = scoreJob(facts({ job, verifications: [v] }));
    expect(result.signals.some((s) => s.key === 'application_dead')).toBe(true);
    expect(result.overall).toBeLessThan(BASELINE_SCORE);
  });

  it('penalizes evergreen recruiting language', () => {
    const job = makeJob({
      first_seen_at: daysBefore(30),
      description: 'We are always looking for talented people to join our talent pipeline.',
    });
    const result = scoreJob(facts({ job }));
    expect(result.signals.map((s) => s.key)).toContain('evergreen_language');
    expect(result.overall).toBe(45);
  });

  it('penalizes a hiring freeze', () => {
    const job = makeJob({ first_seen_at: daysBefore(30) });
    const result = scoreJob(facts({ job, companyHiringFreeze: true }));
    expect(result.overall).toBe(40);
  });

  it('respects disabled weights', () => {
    const job = makeJob({ first_seen_at: daysBefore(3) });
    const weights = [{ key: 'posted_within_7d', label: 'x', points: 12, enabled: false }];
    const result = scoreJob(facts({ job }), weights);
    expect(result.overall).toBe(BASELINE_SCORE);
  });

  it('every contribution is explainable and sums to the total', () => {
    const job = makeJob({ first_seen_at: daysBefore(130), repost_count: 2 });
    const result = scoreJob(facts({ job, verifications: [makeVerification()] }));
    const sum = BASELINE_SCORE + result.signals.reduce((a, s) => a + s.points, 0);
    expect(result.overall).toBe(Math.max(0, Math.min(100, sum)));
    for (const s of result.signals) expect(s.label.length).toBeGreaterThan(0);
  });

  it('confidence reflects verification evidence', () => {
    const job = makeJob();
    expect(scoreJob(facts({ job })).confidence).toBe('low');
    expect(
      scoreJob(facts({ job, verifications: [makeVerification()] })).confidence,
    ).toBe('medium');
    expect(
      scoreJob(
        facts({
          job,
          verifications: [
            makeVerification({ checked_at: daysBefore(0) }),
            makeVerification({ id: 'ver-2', checked_at: daysBefore(1) }),
          ],
        }),
      ).confidence,
    ).toBe('high');
  });
});

describe('confidence labels', () => {
  it.each([
    [95, 'Highly Likely Active'],
    [80, 'Likely Active'],
    [65, 'Probably Active'],
    [50, 'Uncertain'],
    [30, 'Likely Stale'],
    [10, 'Likely Ghost / Closed'],
  ])('labels %i as %s', (score, label) => {
    expect(confidenceLabel(score).label).toBe(label);
  });
});
