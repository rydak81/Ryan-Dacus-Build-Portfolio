/**
 * Greenhouse public job board API.
 * https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
 * Public, documented, no auth required.
 */

import { z } from 'zod';
import type { IngestionProvider, RawJobPosting } from './types';

const GreenhouseJob = z.object({
  id: z.number(),
  title: z.string(),
  absolute_url: z.string(),
  updated_at: z.string().optional(),
  first_published: z.string().nullable().optional(),
  location: z.object({ name: z.string() }).nullable().optional(),
  content: z.string().optional(),
  metadata: z.array(z.unknown()).nullable().optional(),
});

const GreenhouseResponse = z.object({ jobs: z.array(GreenhouseJob) });

function stripHtml(html: string): string {
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const greenhouseProvider: IngestionProvider = {
  kind: 'greenhouse',
  async fetchJobs(boardToken: string): Promise<RawJobPosting[]> {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`Greenhouse board "${boardToken}" returned ${res.status}`);
    }
    const parsed = GreenhouseResponse.parse(await res.json());
    return parsed.jobs.map((j) => ({
      externalId: String(j.id),
      title: j.title,
      description: stripHtml(j.content ?? ''),
      location: j.location?.name ?? null,
      employmentType: null,
      salaryMin: null,
      salaryMax: null,
      sourceUrl: j.absolute_url,
      applicationUrl: j.absolute_url,
      postedAt: j.first_published ?? j.updated_at ?? null,
      raw: j as unknown as Record<string, unknown>,
    }));
  },
};
