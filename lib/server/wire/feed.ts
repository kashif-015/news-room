import 'server-only';
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { WIRE_SOURCES, WireSource } from './sources';
import { normalizeTitle, canonicalizeUrl, stripHtml } from '@/lib/server/ingest/rss';
import { calculateTrigramSimilarity } from '@/lib/server/ingest/cluster';
import { getDb, isDbConfigured } from '@/lib/server/db';

export interface WireOutletLink {
  name: string;
  url: string;
}

export interface WireStory {
  id: string;
  region: 'INDIA' | 'WORLD';
  category: string;
  language: 'en' | 'hi';
  dateline: string;
  headline: string;
  snippet: string;
  coveredBy: number;
  outlets: WireOutletLink[];
  minsAgo: number;
  publishedAt: string;
  fetchedAt: string;
  isBreaking: boolean;
  url: string;
  sourceName: string;
}

export interface SourceStatusItem {
  id: string;
  name: string;
  url: string;
  region: 'INDIA' | 'WORLD';
  category: string;
  status: 'ok' | 'slow' | 'failing';
  lastFetchedAt: string;
  error?: string;
}

export interface WireFeedResult {
  stories: WireStory[];
  stats: {
    sourceCount: number;
    storiesLast24h: number;
    lastCheckedMin: number;
  };
  sourcesStatus: SourceStatusItem[];
  breakingStories: WireStory[];
}

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NewsDesk-Wire/2.0 (+https://newsdesk.internal)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
});

const CACHE_FILE = path.join(process.cwd(), '.data', 'wire-cache.json');
let inMemoryCache: {
  result: WireFeedResult;
  timestamp: number;
} | null = null;
let isRefreshing = false;

// Ensure .data folder exists
try {
  const dataDir = path.join(process.cwd(), '.data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch {
  // Ignore
}

function loadCacheFromDisk(): WireFeedResult | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.stories)) {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }
  return null;
}

function saveCacheToDisk(result: WireFeedResult) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(result, null, 2), 'utf-8');
  } catch {
    // Ignore
  }
}

/**
 * Fetch a single source with timing and error isolation
 */
async function fetchSourceItems(
  source: WireSource
): Promise<{ items: any[]; status: 'ok' | 'slow' | 'failing'; error?: string }> {
  const startTime = Date.now();
  try {
    const feed = await parser.parseURL(source.url);
    const duration = Date.now() - startTime;
    const status: 'ok' | 'slow' = duration > 4500 ? 'slow' : 'ok';
    return {
      items: feed.items || [],
      status,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Fetch failed';
    return {
      items: [],
      status: 'failing',
      error: msg,
    };
  }
}

/**
 * Execute promises in batches with concurrency limit
 */
async function batchProcess<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

/**
 * Ingest fresh stories across all sources and cluster them
 */
export async function refreshWireFeed(): Promise<WireFeedResult> {
  const now = new Date();
  const sourcesStatus: SourceStatusItem[] = [];
  const rawArticles: {
    title: string;
    title_norm: string;
    url: string;
    outlet: string;
    summary: string;
    publishedAt: string;
    region: 'INDIA' | 'WORLD';
    category: string;
    language: 'en' | 'hi';
  }[] = [];

  const seenUrls = new Set<string>();

  // Process sources in parallel batches of 8
  const batchOutputs = await batchProcess(WIRE_SOURCES, 8, async (source) => {
    const { items, status, error } = await fetchSourceItems(source);
    sourcesStatus.push({
      id: source.id,
      name: source.name,
      url: source.url,
      region: source.region,
      category: source.category,
      status,
      lastFetchedAt: now.toISOString(),
      error,
    });
    return { source, items };
  });

  for (const { source, items } of batchOutputs) {
    for (const item of items) {
      if (!item.title || !item.link) continue;

      let cleanUrl = canonicalizeUrl(item.link);
      if (seenUrls.has(cleanUrl)) continue;
      seenUrls.add(cleanUrl);

      let title = stripHtml(item.title.trim());
      let outlet = source.name;

      // Clean Google News title formatting (often ends with " - Outlet Name")
      const dashIdx = title.lastIndexOf(' - ');
      if (dashIdx > 20) {
        outlet = title.slice(dashIdx + 3).trim();
        title = title.slice(0, dashIdx).trim();
      }

      const title_norm = normalizeTitle(title);
      if (!title_norm || title_norm.length < 10) continue;

      const rawSummary = item.contentSnippet || item.summary || item.content || '';
      const summary = stripHtml(rawSummary).slice(0, 280);

      let pubDate = now;
      if (item.isoDate || item.pubDate) {
        const parsed = new Date(item.isoDate || item.pubDate);
        if (!isNaN(parsed.getTime())) {
          pubDate = parsed;
        }
      }

      rawArticles.push({
        title,
        title_norm,
        url: cleanUrl,
        outlet,
        summary,
        publishedAt: pubDate.toISOString(),
        region: source.region,
        category: source.category,
        language: source.language,
      });
    }
  }

  // Sort raw articles newest first
  rawArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Cluster similar articles
  const clusteredStories: WireStory[] = [];
  const processedNorms: { storyIndex: number; norm: string; publishedTime: number }[] = [];

  for (const art of rawArticles) {
    const artTime = new Date(art.publishedAt).getTime();
    let matchedStoryIndex = -1;

    // Check similarity with stories within 48h window
    for (const p of processedNorms) {
      if (Math.abs(artTime - p.publishedTime) < 48 * 60 * 60 * 1000) {
        const sim = calculateTrigramSimilarity(art.title_norm, p.norm);
        if (sim >= 0.45) {
          matchedStoryIndex = p.storyIndex;
          break;
        }
      }
    }

    if (matchedStoryIndex >= 0) {
      // Merge into existing cluster
      const existing = clusteredStories[matchedStoryIndex];
      const hasOutlet = existing.outlets.some((o) => o.name.toLowerCase() === art.outlet.toLowerCase());
      if (!hasOutlet) {
        existing.outlets.push({ name: art.outlet, url: art.url });
        existing.coveredBy = existing.outlets.length;
      }
    } else {
      // New story / cluster head
      const id = `wire-${crypto.createHash('md5').update(art.url).digest('hex').slice(0, 12)}`;
      const minsAgo = Math.max(1, Math.round((now.getTime() - artTime) / 60000));

      const newStory: WireStory = {
        id,
        region: art.region,
        category: art.category,
        language: art.language,
        dateline: `${art.outlet.toUpperCase()} · ${art.region} · ${art.category.toUpperCase()} · ${formatMinsAgo(minsAgo)}`,
        headline: art.title,
        snippet: art.summary || 'Click original to read full reporting.',
        coveredBy: 1,
        outlets: [{ name: art.outlet, url: art.url }],
        minsAgo,
        publishedAt: art.publishedAt,
        fetchedAt: now.toISOString(),
        isBreaking: false,
        url: art.url,
        sourceName: art.outlet,
      };

      const newIndex = clusteredStories.length;
      clusteredStories.push(newStory);
      processedNorms.push({
        storyIndex: newIndex,
        norm: art.title_norm,
        publishedTime: artTime,
      });
    }
  }

  // Determine breaking stories: covered by 4+ outlets within last 60 minutes
  for (const story of clusteredStories) {
    if (story.coveredBy >= 4 && story.minsAgo <= 90) {
      story.isBreaking = true;
    }
  }

  // Count stories published in last 24h
  const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
  const storiesLast24h = clusteredStories.filter(
    (s) => new Date(s.publishedAt).getTime() >= oneDayAgo
  ).length;

  const breakingStories = clusteredStories.filter((s) => s.isBreaking);

  const result: WireFeedResult = {
    stories: clusteredStories,
    stats: {
      sourceCount: WIRE_SOURCES.length,
      storiesLast24h: Math.max(storiesLast24h, clusteredStories.length),
      lastCheckedMin: 1,
    },
    sourcesStatus,
    breakingStories,
  };

  // Update in-memory and disk cache
  inMemoryCache = {
    result,
    timestamp: Date.now(),
  };
  saveCacheToDisk(result);

  // Optional: Save to Supabase if configured
  if (isDbConfigured()) {
    try {
      const db = getDb();
      for (const story of clusteredStories.slice(0, 60)) {
        await db.from('articles').upsert(
          {
            title: story.headline,
            title_norm: normalizeTitle(story.headline),
            url: story.url,
            outlet: story.sourceName,
            summary: story.snippet,
            category: story.category.toLowerCase(),
            published_at: story.publishedAt,
            fetched_at: story.fetchedAt,
          },
          { onConflict: 'url' }
        );
      }
    } catch {
      // Continue safely
    }
  }

  return result;
}

function formatMinsAgo(mins: number): string {
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins} MIN AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  return `${days}D AGO`;
}

/**
 * Get the wire feed with Stale-While-Revalidate caching
 */
export async function getWireFeed(): Promise<WireFeedResult> {
  const now = Date.now();
  const THREE_MINUTES = 3 * 60 * 1000;

  // 1. Check in-memory cache
  if (inMemoryCache && now - inMemoryCache.timestamp < THREE_MINUTES) {
    const elapsedMins = Math.max(1, Math.floor((now - inMemoryCache.timestamp) / 60000));
    return {
      ...inMemoryCache.result,
      stats: {
        ...inMemoryCache.result.stats,
        lastCheckedMin: elapsedMins,
      },
    };
  }

  // 2. Check disk cache if inMemoryCache is empty
  if (!inMemoryCache) {
    const fromDisk = loadCacheFromDisk();
    if (fromDisk) {
      inMemoryCache = {
        result: fromDisk,
        timestamp: now,
      };
      // Trigger background refresh
      if (!isRefreshing) {
        isRefreshing = true;
        refreshWireFeed().finally(() => {
          isRefreshing = false;
        });
      }
      return fromDisk;
    }
  }

  // 3. Stale-while-revalidate: return current cache and refresh in background
  if (inMemoryCache) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshWireFeed().finally(() => {
        isRefreshing = false;
      });
    }
    const elapsedMins = Math.max(1, Math.floor((now - inMemoryCache.timestamp) / 60000));
    return {
      ...inMemoryCache.result,
      stats: {
        ...inMemoryCache.result.stats,
        lastCheckedMin: elapsedMins,
      },
    };
  }

  // 4. Initial synchronous fetch
  isRefreshing = true;
  try {
    return await refreshWireFeed();
  } finally {
    isRefreshing = false;
  }
}
