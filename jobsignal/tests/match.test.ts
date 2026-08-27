import { describe, expect, it } from 'vitest';
import { matchJob } from '@/lib/match/engine';
import { demoProfile } from '@/lib/db/seed-data';
import { makeJob } from './helpers';

describe('candidate matching', () => {
  it('scores a strongly aligned role high with named strengths', () => {
    const job = makeJob({
      title: 'Director of Partnerships',
      location: 'Remote — United States',
      salary_min: 150000,
      salary_max: 190000,
      description:
        'Lead partnerships and business development for our SaaS marketplace platform. Enterprise negotiation and channel go-to-market experience required.',
    });
    const result = matchJob(demoProfile, job);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.strong_matches.length).toBeGreaterThan(2);
  });

  it('is candid about weak fits and does not exaggerate', () => {
    const job = makeJob({
      title: 'Staff Machine Learning Engineer',
      location: 'San Francisco, CA (On-site)',
      salary_min: 90000,
      salary_max: 120000,
      description:
        'Build machine learning pipelines in Python with SQL and Kubernetes. PhD preferred. Salesforce integration experience a plus.',
    });
    const result = matchJob(demoProfile, job);
    expect(result.score).toBeLessThan(50);
    expect(result.weak_or_missing.length).toBeGreaterThan(0);
  });

  it('surfaces named requirement gaps like Salesforce', () => {
    const job = makeJob({
      title: 'Director of Partnerships',
      description:
        'Partnerships leadership for SaaS. Deep Salesforce ecosystem experience and cybersecurity domain knowledge required.',
    });
    const result = matchJob(demoProfile, job);
    expect(result.weak_or_missing.join(' ')).toContain('Salesforce');
  });

  it('keeps match independent from job confidence', () => {
    // Same job facts, different verification state, must produce the same
    // match score — matching reads only profile + job content.
    const job = makeJob({ status: 'ghost_suspect', repost_count: 5 });
    const fresh = makeJob({ status: 'active' });
    expect(matchJob(demoProfile, job).score).toBe(matchJob(demoProfile, fresh).score);
  });

  it('flags below-minimum salary', () => {
    const job = makeJob({ salary_min: 80000, salary_max: 100000 });
    const result = matchJob(demoProfile, job);
    expect(result.weak_or_missing.join(' ')).toContain('below your minimum');
  });
});
