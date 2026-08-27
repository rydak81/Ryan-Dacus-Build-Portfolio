import { describe, expect, it } from 'vitest';
import { detectRemovals, reconcilePosting } from '@/lib/ingest/pipeline';
import type { RawJobPosting } from '@/lib/ingest/types';
import { NOW, daysBefore, makeJob } from './helpers';
import { hashText } from '@/lib/utils';

function raw(overrides: Partial<RawJobPosting> = {}): RawJobPosting {
  return {
    externalId: 'ext-1',
    title: 'Director of Partnerships',
    description: 'A standard job description with meaningful detail.',
    location: 'Remote — United States',
    employmentType: 'Full-time',
    salaryMin: null,
    salaryMax: null,
    sourceUrl: 'https://example.com/job',
    applicationUrl: 'https://example.com/job/apply',
    postedAt: daysBefore(5),
    raw: {},
    ...overrides,
  };
}

describe('ingestion reconciliation', () => {
  it('creates new jobs with first_seen event', () => {
    const result = reconcilePosting(raw(), null, 'co-1', 'greenhouse', NOW);
    expect(result.isNew).toBe(true);
    expect(result.events).toEqual([{ kind: 'first_seen', detail: 'Ingested from greenhouse' }]);
    expect(result.job.repost_count).toBe(0);
  });

  it('never resets first_seen_at when a closed job reappears', () => {
    const existing = makeJob({ status: 'closed', first_seen_at: daysBefore(90) });
    const result = reconcilePosting(raw(), existing, 'co-1', 'greenhouse', NOW);
    expect(result.job.first_seen_at).toBe(daysBefore(90));
    expect(result.job.repost_count).toBe(1);
    expect(result.events.some((e) => e.kind === 'reappeared')).toBe(true);
  });

  it('marks repeated reappearances as ghost suspects', () => {
    const existing = makeJob({ status: 'closed', repost_count: 1, first_seen_at: daysBefore(120) });
    const result = reconcilePosting(raw(), existing, 'co-1', 'greenhouse', NOW);
    expect(result.job.status).toBe('ghost_suspect');
    expect(result.job.repost_count).toBe(2);
  });

  it('detects date bumping: posted date moves, description identical', () => {
    const existing = makeJob({ original_posted_at: daysBefore(60) });
    const result = reconcilePosting(raw({ postedAt: daysBefore(2) }), existing, 'co-1', 'greenhouse', NOW);
    expect(result.events.some((e) => e.kind === 'reposted')).toBe(true);
    expect(result.job.repost_count).toBe(1);
    // first_seen_at unchanged — historical age preserved.
    expect(result.job.first_seen_at).toBe(existing.first_seen_at);
  });

  it('records description changes with similarity', () => {
    const existing = makeJob();
    const newDesc = 'A completely rewritten description about growth marketing leadership roles.';
    const result = reconcilePosting(raw({ description: newDesc }), existing, 'co-1', 'greenhouse', NOW);
    const change = result.events.find((e) => e.kind === 'description_changed');
    expect(change).toBeDefined();
    expect(result.job.description_hash).toBe(hashText(newDesc));
  });

  it('records salary changes', () => {
    const existing = makeJob({ salary_min: 100000, salary_max: 120000 });
    const result = reconcilePosting(
      raw({ salaryMin: 110000, salaryMax: 130000 }),
      existing,
      'co-1',
      'greenhouse',
      NOW,
    );
    expect(result.events.some((e) => e.kind === 'salary_changed')).toBe(true);
  });

  it('detects removals of jobs missing from the feed', () => {
    const kept = makeJob({ id: 'a', external_job_id: 'x1' });
    const gone = makeJob({ id: 'b', external_job_id: 'x2' });
    const removals = detectRemovals([kept, gone], new Set(['x1']), NOW);
    expect(removals).toHaveLength(1);
    expect(removals[0].job.id).toBe('b');
    expect(removals[0].job.status).toBe('closed');
  });
});
