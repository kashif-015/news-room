import 'server-only';
import { env } from '@/lib/server/env';
import { MediaItem } from '@/lib/shared/types';

export async function searchPexels(query: string): Promise<{ results: MediaItem[]; warning?: string }> {
  if (!env.PEXELS_API_KEY) {
    return { results: [], warning: 'PEXELS_API_KEY is not configured.' };
  }

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&orientation=portrait`;
    const res = await fetch(url, {
      headers: {
        Authorization: env.PEXELS_API_KEY,
      },
    });

    if (!res.ok) {
      return { results: [], warning: `Pexels error ${res.status}` };
    }

    const data = await res.json();
    const results: MediaItem[] = (data.photos || []).map((p: { id: number; alt?: string; photographer?: string; photographer_url?: string; src: { medium: string; original: string } }) => ({
      id: String(p.id),
      title: p.alt || 'Pexels Photo',
      thumbUrl: p.src.medium,
      fullUrl: p.src.original,
      credit: `Photo by ${p.photographer || 'Photographer'} on Pexels`,
      creditUrl: p.photographer_url || 'https://pexels.com',
      provider: 'pexels',
    }));

    return { results };
  } catch (err: unknown) {
    return { results: [], warning: err instanceof Error ? err.message : 'Pexels search failed' };
  }
}

