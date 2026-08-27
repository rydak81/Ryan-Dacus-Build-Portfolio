import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStore } from '@/lib/db';
import { verifyAndRescore } from '@/lib/services/verify';
import { daysAgo } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const bodySchema = z.object({
  jobId: z.string().optional(),
  /** re-verify everything not checked within this many hours */
  staleHours: z.number().int().min(1).max(720).optional(),
});

/**
 * POST /api/verify — run the deterministic verification engine.
 * With jobId: verify one job. With staleHours: sweep jobs whose last
 * verification is older than the window (cron usage).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.JOBSIGNAL_CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  if (body.data.jobId) {
    const result = await verifyAndRescore(body.data.jobId);
    if (!result) return NextResponse.json({ error: 'job not found' }, { status: 404 });
    return NextResponse.json({ verified: 1, results: [result] });
  }

  const staleHours = body.data.staleHours ?? 24;
  const jobs = await getStore().listJobs();
  const stale = jobs
    .filter(({ job }) => {
      if (job.status === 'closed') return false;
      if (!job.last_verified_at) return true;
      return daysAgo(job.last_verified_at) * 24 >= staleHours;
    })
    .slice(0, 25); // bound each sweep

  const results = [];
  for (const { job } of stale) {
    const v = await verifyAndRescore(job.id);
    if (v) results.push({ job_id: job.id, still_exists: v.still_exists });
  }
  return NextResponse.json({ verified: results.length, results });
}
