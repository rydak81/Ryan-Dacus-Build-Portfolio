import { describe, expect, it } from 'vitest';
import { findDuplicates, toDuplicateRecords } from '@/lib/dedup/duplicates';
import { makeJob } from './helpers';

const DESC = `We are hiring a Director of Partnerships to lead our partner ecosystem across
SaaS integrations, marketplace channels, and enterprise business development. You will
own partnership strategy and work closely with product and sales leadership.`;

describe('duplicate detection', () => {
  it('groups the same posting seen on multiple sources into one job', () => {
    const a = makeJob({ id: 'a', source: 'greenhouse', external_job_id: 'x1', description: DESC });
    const b = makeJob({ id: 'b', source: 'job_board', external_job_id: 'x1', description: DESC });
    const c = makeJob({ id: 'c', source: 'aggregator', external_job_id: 'x1', description: DESC });
    const groups = findDuplicates([b, c, a]);
    expect(groups).toHaveLength(1);
    // The employer ATS wins as canonical.
    expect(groups[0].canonical.id).toBe('a');
    expect(groups[0].duplicates).toHaveLength(2);
  });

  it('matches near-identical descriptions with same title and location', () => {
    const a = makeJob({ id: 'a', external_job_id: 'x1', description: DESC });
    const b = makeJob({
      id: 'b',
      source: 'job_board',
      external_job_id: 'y9',
      description: DESC + ' Apply today.',
    });
    const groups = findDuplicates([a, b]);
    expect(groups).toHaveLength(1);
    expect(groups[0].duplicates[0].similarity).toBeGreaterThan(0.7);
  });

  it('does not merge different roles at the same company', () => {
    const a = makeJob({ id: 'a', title: 'Director of Partnerships', description: DESC });
    const b = makeJob({
      id: 'b',
      title: 'Staff Software Engineer',
      external_job_id: 'z2',
      description: 'Build distributed systems in Go and Kubernetes for our data platform team.',
    });
    expect(findDuplicates([a, b])).toHaveLength(2);
  });

  it('does not merge across companies', () => {
    const a = makeJob({ id: 'a', company_id: 'co-1', description: DESC });
    const b = makeJob({ id: 'b', company_id: 'co-2', external_job_id: 'x1', description: DESC });
    expect(findDuplicates([a, b])).toHaveLength(2);
  });

  it('normalizes title variants', () => {
    const a = makeJob({ id: 'a', title: 'Sr. Director, Partnerships', description: DESC });
    const b = makeJob({
      id: 'b',
      title: 'Senior Director Partnerships',
      source: 'job_board',
      external_job_id: 'q1',
      description: DESC,
    });
    expect(findDuplicates([a, b])).toHaveLength(1);
  });

  it('emits duplicate records with reasons', () => {
    const a = makeJob({ id: 'a', description: DESC });
    const b = makeJob({ id: 'b', source: 'aggregator', external_job_id: 'x1', description: DESC });
    const records = toDuplicateRecords(findDuplicates([a, b]));
    expect(records).toHaveLength(1);
    expect(records[0].canonical_job_id).toBe('a');
    expect(records[0].reason.length).toBeGreaterThan(0);
  });
});
