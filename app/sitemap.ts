import type { MetadataRoute } from 'next';
import { projects } from '@/lib/projects';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ryandacus.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: 'monthly', priority: 1 },
    ...projects.map((p) => ({
      url: `${BASE}/projects/${p.slug}`,
      changeFrequency: 'monthly' as const,
      priority: p.tier === 1 ? 0.8 : 0.6,
    })),
  ];
}
