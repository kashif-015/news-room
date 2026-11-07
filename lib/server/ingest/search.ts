import 'server-only';
import Parser from 'rss-parser';
import { getDb, isDbConfigured } from '@/lib/server/db';
import { fetchGNews } from './gnews';
import { fetchNewsData } from './newsdata';
import { normalizeTitle, canonicalizeUrl, stripHtml } from './rss';
import { saveInMemoryArticles } from '../stories-store';
import { ArticleWithCluster } from '@/lib/shared/types';
import crypto from 'crypto';

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'NewsDesk/1.0 (+https://newsdesk.internal; editorial bot)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
});

export async function searchNews(query: string): Promise<ArticleWithCluster[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const results: ArticleWithCluster[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  // 1. Search in local DB if configured
  if (isDbConfigured()) {
    try {
      const db = getDb();
      const { data: dbArticles } = await db
        .from('articles')
        .select('*, cluster:clusters(*), source:sources(name, type)')
        .ilike('title', `%${cleanQuery}%`)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(15);

      if (dbArticles) {
        for (const art of dbArticles) {
          seenUrls.add(art.url);
          seenTitles.add(art.title_norm || normalizeTitle(art.title));
          results.push(art as ArticleWithCluster);
        }
      }
    } catch {
      // Continue to live search
    }
  }

  // 2. Search GNews API (if key available)
  try {
    const gnewsArticles = await fetchGNews('search-gnews', cleanQuery);
    for (const art of gnewsArticles) {
      if (!seenUrls.has(art.url) && !seenTitles.has(art.title_norm)) {
        seenUrls.add(art.url);
        seenTitles.add(art.title_norm);
        const id = `art-${crypto.createHash('md5').update(art.url).digest('hex').slice(0, 12)}`;
        results.push({
          id,
          source_id: 'search-gnews',
          title: art.title,
          title_norm: art.title_norm,
          url: art.url,
          outlet: art.outlet,
          summary: art.summary,
          image_url: art.image_url,
          category: art.category,
          published_at: art.published_at || new Date().toISOString(),
          fetched_at: new Date().toISOString(),
          used: false,
          cluster_id: null,
          cluster: {
            id: `cl-${id}`,
            headline: cleanQuery,
            trend_score: 4,
            outlet_count: 1,
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString(),
          },
        });
      }
    }
  } catch {
    // Continue
  }

  // 3. Search NewsData API (if key available)
  try {
    const newsDataArticles = await fetchNewsData('search-newsdata', cleanQuery);
    for (const art of newsDataArticles) {
      if (!seenUrls.has(art.url) && !seenTitles.has(art.title_norm)) {
        seenUrls.add(art.url);
        seenTitles.add(art.title_norm);
        const id = `art-${crypto.createHash('md5').update(art.url).digest('hex').slice(0, 12)}`;
        results.push({
          id,
          source_id: 'search-newsdata',
          title: art.title,
          title_norm: art.title_norm,
          url: art.url,
          outlet: art.outlet,
          summary: art.summary,
          image_url: art.image_url,
          category: art.category,
          published_at: art.published_at || new Date().toISOString(),
          fetched_at: new Date().toISOString(),
          used: false,
          cluster_id: null,
          cluster: {
            id: `cl-${id}`,
            headline: cleanQuery,
            trend_score: 4,
            outlet_count: 1,
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString(),
          },
        });
      }
    }
  } catch {
    // Continue
  }

  // 4. Search Google News RSS (Universal real-time fallback)
  try {
    const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
      cleanQuery
    )}&hl=en-IN&gl=IN&ceid=IN:en`;
    const feed = await parser.parseURL(googleNewsUrl);

    for (const item of (feed.items || []).slice(0, 15)) {
      if (!item.title || !item.link) continue;

      const norm = normalizeTitle(item.title);
      const url = canonicalizeUrl(item.link);

      if (seenUrls.has(url) || seenTitles.has(norm)) continue;

      seenUrls.add(url);
      seenTitles.add(norm);

      let title = item.title;
      let outlet = (item as any).source || 'Google News';
      const dashIdx = title.lastIndexOf(' - ');
      if (dashIdx > 0) {
        outlet = title.slice(dashIdx + 3).trim();
        title = title.slice(0, dashIdx).trim();
      }

      const id = `art-${crypto.createHash('md5').update(url).digest('hex').slice(0, 12)}`;
      results.push({
        id,
        source_id: 'search-rss',
        title,
        title_norm: norm,
        url,
        outlet,
        summary: item.contentSnippet ? stripHtml(item.contentSnippet).slice(0, 320) : null,
        image_url: null,
        category: 'general',
        published_at: item.isoDate || item.pubDate || new Date().toISOString(),
        fetched_at: new Date().toISOString(),
        used: false,
        cluster_id: null,
        cluster: {
          id: `cl-${id}`,
          headline: cleanQuery,
          trend_score: 3,
          outlet_count: 1,
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
        },
      });
    }
  } catch {
    // Continue
  }

  // Save all into in-memory store
  saveInMemoryArticles(results);

  // If DB is configured, upsert articles
  if (isDbConfigured()) {
    try {
      const db = getDb();
      for (const art of results) {
        await db.from('articles').upsert(
          {
            title: art.title,
            title_norm: art.title_norm,
            url: art.url,
            outlet: art.outlet,
            summary: art.summary,
            image_url: art.image_url,
            category: art.category,
            published_at: art.published_at,
            fetched_at: art.fetched_at,
            used: art.used,
          },
          { onConflict: 'url' }
        );
      }
    } catch {
      // Continue even if DB write fails
    }
  }

  return results;
}
