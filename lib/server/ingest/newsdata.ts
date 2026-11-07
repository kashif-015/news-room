import 'server-only';
import { env } from '@/lib/server/env';
import { getDb, isDbConfigured } from '@/lib/server/db';
import { NormalizedArticle } from '@/lib/shared/types';
import { normalizeTitle, canonicalizeUrl } from './rss';

const NEWSDATA_DAILY_LIMIT = 180; // Free tier is 200/day

export async function fetchNewsData(sourceId: string, query: string): Promise<NormalizedArticle[]> {
  if (!env.NEWSDATA_API_KEY) return [];

  const today = new Date().toISOString().split('T')[0];

  if (isDbConfigured()) {
    try {
      const db = getDb();
      const { data: usage } = await db
        .from('api_usage')
        .select('count')
        .eq('day', today)
        .eq('provider', 'newsdata')
        .maybeSingle();

      if (usage && usage.count >= NEWSDATA_DAILY_LIMIT) {
        return [];
      }
    } catch {
      // Ignore DB usage check failures
    }
  }

  try {
    const url = `https://newsdata.io/api/1/news?apikey=${env.NEWSDATA_API_KEY}&q=${encodeURIComponent(
      query
    )}&language=en`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const json = await res.json();
    const articles: NormalizedArticle[] = [];

    // Increment usage
    if (isDbConfigured()) {
      try {
        const db = getDb();
        const { data: usage } = await db
          .from('api_usage')
          .select('count')
          .eq('day', today)
          .eq('provider', 'newsdata')
          .maybeSingle();

        await db.from('api_usage').upsert({
          day: today,
          provider: 'newsdata',
          count: (usage?.count || 0) + 1,
        });
      } catch {
        // ignore
      }
    }

    for (const item of json.results || []) {
      articles.push({
        title: item.title,
        title_norm: normalizeTitle(item.title),
        url: canonicalizeUrl(item.link),
        outlet: item.source_id || 'NewsData',
        summary: item.description?.slice(0, 320) || null,
        image_url: item.image_url || null,
        category: 'general',
        published_at: item.pubDate || null,
        source_id: sourceId,
      });
    }

    return articles;
  } catch {
    return [];
  }
}
