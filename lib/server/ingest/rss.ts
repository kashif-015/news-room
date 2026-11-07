import 'server-only';
import Parser from 'rss-parser';
import { NormalizedArticle } from '@/lib/shared/types';

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'NewsDesk/1.0 (+https://newsdesk.internal; editorial bot)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
});

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();
}

export function canonicalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove UTM and tracking params
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'ref',
      'source',
    ];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch {
    return url;
  }
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchRssFeed(
  sourceId: string,
  sourceName: string,
  url: string,
  category: string | null
): Promise<NormalizedArticle[]> {
  try {
    const feed = await parser.parseURL(url);
    const articles: NormalizedArticle[] = [];

    for (const item of feed.items || []) {
      if (!item.title || !item.link) continue;

      const title = item.title.trim();
      const title_norm = normalizeTitle(title);
      const cleanUrl = canonicalizeUrl(item.link);

      // Extract summary
      const rawSummary = item.contentSnippet || item.summary || item.content || '';
      const summary = stripHtml(rawSummary).slice(0, 320);

      // Extract image URL from enclosure or media tags
      let imageUrl: string | null = null;
      if (item.enclosure?.url) {
        imageUrl = item.enclosure.url;
      } else if ((item as Record<string, unknown>)['media:content']) {
        const media = (item as Record<string, unknown>)['media:content'] as { $?: { url?: string } };
        imageUrl = media?.$?.url || null;
      }

      // Published date
      let published_at: string | null = null;
      if (item.isoDate || item.pubDate) {
        const d = new Date(item.isoDate || item.pubDate || '');
        if (!isNaN(d.getTime())) {
          published_at = d.toISOString();
        }
      }

      articles.push({
        title,
        title_norm,
        url: cleanUrl,
        outlet: sourceName,
        summary: summary || null,
        image_url: imageUrl,
        category: category || 'general',
        published_at,
        source_id: sourceId,
      });
    }

    return articles;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch RSS';
    throw new Error(`[${sourceName}] ${msg}`);
  }
}

