import { describe, expect, it } from 'vitest';
import { analyzeGhostSignals } from '@/lib/ghost/detect';
import type { JobEvent } from '@/lib/types';
import { NOW, daysBefore, makeJob } from './helpers';

function ev(job_id: string, days: number, kind: JobEvent['kind']): JobEvent {
  return { id: `${kind}-${days}`, job_id, occurred_at: daysBefore(days), kind, detail: null };
}

describe('ghost detection', () => {
  it('reports true age from first_seen_at, never the claimed date', () => {
    const job = makeJob({
      first_seen_at: daysBefore(143),
      original_posted_at: daysBefore(3),
    });
    const analysis = analyzeGhostSignals(job, [], NOW);
    expect(analysis.trueAgeDays).toBe(143);
    expect(analysis.claimedAgeDays).toBe(3);
    expect(analysis.ageDiscrepancy).toBe(true);
    expect(analysis.flags.join(' ')).toContain('first detected it 143 days ago');
  });

  it('counts removal/reappearance cycles from event history', () => {
    const job = makeJob({ first_seen_at: daysBefore(200), repost_count: 0 });
    const events = [
      ev('job-1', 200, 'first_seen'),
      ev('job-1', 176, 'removed'),
      ev('job-1', 171, 'reappeared'),
      ev('job-1', 120, 'removed'),
      ev('job-1', 113, 'reappeared'),
      ev('job-1', 60, 'removed'),
      ev('job-1', 55, 'reappeared'),
    ];
    const analysis = analyzeGhostSignals(job, events, NOW);
    expect(analysis.disappearReappearCycles).toBe(3);
    expect(analysis.repeatedRepostPattern).toBe(true);
    expect(analysis.flags.some((f) => f.includes('Repeated reposting'))).toBe(true);
  });

  it('does not flag a fresh, stable posting', () => {
    const job = makeJob({ first_seen_at: daysBefore(4), original_posted_at: daysBefore(4) });
    const analysis = analyzeGhostSignals(job, [ev('job-1', 4, 'first_seen')], NOW);
    expect(analysis.flags).toHaveLength(0);
    expect(analysis.repeatedRepostPattern).toBe(false);
    expect(analysis.ageDiscrepancy).toBe(false);
  });

  it('flags long-open positions', () => {
    const job = makeJob({ first_seen_at: daysBefore(130), original_posted_at: daysBefore(130) });
    const analysis = analyzeGhostSignals(job, [], NOW);
    expect(analysis.flags.some((f) => f.includes('130 days'))).toBe(true);
  });
});
