import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/db';
import { analyzeGhostSignals } from '@/lib/ghost/detect';
import { confidenceLabel } from '@/lib/config/scoring';

export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs/check?url=… — the browser-extension contract: given a job
 * URL the user is looking at anywhere on the web, return what JobSignal
 * knows about it.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url parameter required' }, { status: 400 });

  const bundle = await getStore().findJobByUrl(url);
  if (!bundle) {
    return NextResponse.json({ known: false });
  }

  const ghost = analyzeGhostSignals(bundle.job, bundle.events);
  const latest = bundle.verifications[0];
  return NextResponse.json({
    known: true,
    job_id: bundle.job.id,
    title: bundle.job.title,
    company: bundle.company.name,
    confidence: bundle.score?.overall_score ?? null,
    confidence_label: bundle.score ? confidenceLabel(bundle.score.overall_score).label : null,
    candidate_match: bundle.score?.match_score ?? null,
    first_seen_days_ago: ghost.trueAgeDays,
    repeatedly_reposted: ghost.repeatedRepostPattern,
    currently_on_employer_site: latest?.found_on_company_site ?? null,
    last_verified_at: bundle.job.last_verified_at,
    status: bundle.job.status,
  });
}
