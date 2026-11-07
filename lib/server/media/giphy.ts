import 'server-only';
import { env } from '@/lib/server/env';
import { MediaItem } from '@/lib/shared/types';

export async function searchGiphy(query: string): Promise<{ results: MediaItem[]; warning?: string }> {
  if (!env.GIPHY_API_KEY) {
    return { results: [], warning: 'GIPHY_API_KEY is not configured.' };
  }

  try {
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${env.GIPHY_API_KEY}&q=${encodeURIComponent(
      query
    )}&limit=20&rating=g`;

    const res = await fetch(url);
    if (!res.ok) {
      return { results: [], warning: `Giphy API error (${res.status})` };
    }

    const data = await res.json();
    const results: MediaItem[] = (data.data || []).map((item: { id: string; title: string; images: { fixed_height_small: { url: string }; original: { url: string } }; user?: { display_name?: string; profile_url?: string } }) => ({
      id: item.id,
      title: item.title || 'GIF',
      thumbUrl: item.images.fixed_height_small.url,
      fullUrl: item.images.original.url,
      credit: item.user?.display_name ? `By ${item.user.display_name} on Giphy` : 'Giphy',
      creditUrl: item.user?.profile_url || 'https://giphy.com',
      provider: 'giphy',
    }));

    return { results };
  } catch (err: unknown) {
    return { results: [], warning: err instanceof Error ? err.message : 'Giphy search failed' };
  }
}

