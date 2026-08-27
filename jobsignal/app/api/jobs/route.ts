import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs — job list with intelligence, for the future browser
 * extension and API consumers. Same filter surface as the search UI.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const p = req.nextUrl.searchParams;
  const jobs = await getStore().listJobs({
    query: p.get('q') ?? undefined,
    location: p.get('location') ?? undefined,
    remote: p.get('remote') === '1' || undefined,
    minConfidence: p.get('minConfidence') ? Number(p.get('minConfidence')) : undefined,
    verifiedWithinHours: p.get('fresh') ? Number(p.get('fresh')) : undefined,
  });
  return NextResponse.json({
    jobs: jobs.map(({ job, company, score }) => ({
      id: job.id,
      title: job.title,
      company: company.name,
      location: job.location,
      confidence: score?.overall_score ?? null,
      match: score?.match_score ?? null,
      first_seen_at: job.first_seen_at,
      last_verified_at: job.last_verified_at,
      status: job.status,
      source: job.source,
      application_url: job.application_url,
    })),
  });
}
