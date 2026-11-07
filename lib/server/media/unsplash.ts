import 'server-only';
import { env } from '@/lib/server/env';
import { MediaItem } from '@/lib/shared/types';

export async function searchUnsplash(query: string): Promise<{ results: MediaItem[]; warning?: string }> {
  if (!env.UNSPLASH_ACCESS_KEY) {
    return { results: [], warning: 'UNSPLASH_ACCESS_KEY is not configured.' };
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query
    )}&per_page=20&orientation=portrait`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (!res.ok) {
      return { results: [], warning: `Unsplash error ${res.status}` };
    }

    const data = await res.json();
    const results: MediaItem[] = (data.results || []).map((p: { id: string; alt_description?: string; user?: { name?: string; links?: { html?: string } }; urls: { small: string; regular: string } }) => ({
      id: p.id,
      title: p.alt_description || 'Unsplash Photo',
      thumbUrl: p.urls.small,
      fullUrl: p.urls.regular,
      credit: `Photo by ${p.user?.name || 'Photographer'} on Unsplash`,
      creditUrl: p.user?.links?.html || 'https://unsplash.com',
      provider: 'unsplash',
    }));

    return { results };
  } catch (err: unknown) {
    return { results: [], warning: err instanceof Error ? err.message : 'Unsplash search failed' };
  }
}

