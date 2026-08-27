import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStore } from '@/lib/db';
import { ingestCompany } from '@/lib/services/ingest';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const bodySchema = z.object({ companyId: z.string().optional() });

/**
 * POST /api/ingest — pull fresh postings from configured ATS providers.
 * Intended for Vercel Cron / scheduled invocation; guarded by a shared
 * secret when one is configured.
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

  const store = getStore();
  const companies = body.data.companyId
    ? [await store.getCompany(body.data.companyId)].filter((c) => c !== null)
    : (await store.listCompanies()).filter((c) => c.ats_provider && c.ats_token);

  const results = [];
  for (const company of companies) {
    try {
      results.push(await ingestCompany(company));
    } catch (err) {
      results.push({
        company: company.name,
        error: err instanceof Error ? err.message : 'ingestion failed',
      });
    }
  }
  return NextResponse.json({ results });
}
