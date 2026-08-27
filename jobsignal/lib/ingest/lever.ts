/**
 * Lever public postings API.
 * https://api.lever.co/v0/postings/{site}?mode=json
 * Public, documented, no auth required.
 */

import { z } from 'zod';
import type { IngestionProvider, RawJobPosting } from './types';

const LeverPosting = z.object({
  id: z.string(),
  text: z.string(),
  hostedUrl: z.string(),
  applyUrl: z.string().optional(),
  createdAt: z.number().optional(),
  categories: z
    .object({
      location: z.string().nullable().optional(),
      commitment: z.string().nullable().optional(),
      team: z.string().nullable().optional(),
    })
    .optional(),
  descriptionPlain: z.string().optional(),
  salaryRange: z
    .object({ min: z.number().optional(), max: z.number().optional() })
    .nullable()
    .optional(),
});

export const leverProvider: IngestionProvider = {
  kind: 'lever',
  async fetchJobs(siteTag: string): Promise<RawJobPosting[]> {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(siteTag)}?mode=json`;
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`Lever site "${siteTag}" returned ${res.status}`);
    }
    const parsed = z.array(LeverPosting).parse(await res.json());
    return parsed.map((p) => ({
      externalId: p.id,
      title: p.text,
      description: p.descriptionPlain ?? '',
      location: p.categories?.location ?? null,
      employmentType: p.categories?.commitment ?? null,
      salaryMin: p.salaryRange?.min ?? null,
      salaryMax: p.salaryRange?.max ?? null,
      sourceUrl: p.hostedUrl,
      applicationUrl: p.applyUrl ?? p.hostedUrl,
      postedAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      raw: p as unknown as Record<string, unknown>,
    }));
  },
};
