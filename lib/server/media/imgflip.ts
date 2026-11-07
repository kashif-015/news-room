import 'server-only';
import { MediaItem } from '@/lib/shared/types';

interface ImgflipMeme {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
}

let cachedMemes: ImgflipMeme[] | null = null;
let lastFetchTime = 0;

export async function searchImgflipMemes(query: string): Promise<MediaItem[]> {
  try {
    const now = Date.now();
    // Cache templates for 1 hour
    if (!cachedMemes || now - lastFetchTime > 60 * 60 * 1000) {
      const res = await fetch('https://api.imgflip.com/get_memes');
      if (!res.ok) return [];
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.memes)) {
        cachedMemes = json.data.memes;
        lastFetchTime = now;
      }
    }

    if (!cachedMemes) return [];

    const q = query.toLowerCase().trim();
    const filtered = q
      ? cachedMemes.filter((m) => m.name.toLowerCase().includes(q))
      : cachedMemes.slice(0, 24);

    return filtered.slice(0, 24).map((m) => ({
      id: m.id,
      title: m.name,
      thumbUrl: m.url,
      fullUrl: m.url,
      credit: 'Imgflip Template',
      creditUrl: 'https://imgflip.com',
      provider: 'imgflip',
    }));
  } catch {
    return [];
  }
}

