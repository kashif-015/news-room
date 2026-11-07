import 'server-only';
import { env } from '@/lib/server/env';
import { getDb, isDbConfigured } from '@/lib/server/db';
import { NormalizedArticle } from '@/lib/shared/types';
import { normalizeTitle, canonicalizeUrl } from './rss';

const GNEWS_DAILY_LIMIT = 90; // Free tier is 100/day

export async function fetchGNews(sourceId: string, query: string): Promise<NormalizedArticle[]> {
  if (!env.GNEWS_API_KEY) return [];

  const today = new Date().toISOString().split('T')[0];

  // Check daily usage if DB is configured
  if (isDbConfigured()) {
    try {
      const db = getDb();
      const { data: usage } = await db
        .from('api_usage')
        .select('count')
        .eq('day', today)
        .eq('provider', 'gnews')
        .maybeSingle();

      if (usage && usage.count >= GNEWS_DAILY_LIMIT) {
        return [];
      }
    } catch {
      // Ignore DB usage check failures
    }
  }

  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
      query
    )}&lang=en&max=10&apikey=${env.GNEWS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const json = await res.json();
    const articles: NormalizedArticle[] = [];

    // Increment usage if DB is configured
    if (isDbConfigured()) {
      try {
        const db = getDb();
        const { data: usage } = await db
          .from('api_usage')
          .select('count')
          .eq('day', today)
          .eq('provider', 'gnews')
          .maybeSingle();

        await db.from('api_usage').upsert({
          day: today,
          provider: 'gnews',
          count: (usage?.count || 0) + 1,
        });
      } catch {
        // ignore
      }
    }

    for (const item of json.articles || []) {
      articles.push({
        title: item.title,
        title_norm: normalizeTitle(item.title),
        url: canonicalizeUrl(item.url),
        outlet: item.source?.name || 'GNews',
        summary: item.description?.slice(0, 320) || null,
        image_url: item.image || null,
        category: 'general',
        published_at: item.publishedAt || null,
        source_id: sourceId,
      });
    }

    return articles;
  } catch {
    return [];
  }
}
