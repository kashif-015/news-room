import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getWireFeed, refreshWireFeed, WireStory } from '@/lib/server/wire/feed';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const since = searchParams.get('since');
    const region = searchParams.get('region') || 'ALL';
    const category = searchParams.get('category') || 'All';
    const lang = searchParams.get('lang'); // 'en' | 'hi'
    const timeRange = searchParams.get('timeRange') || '24h';
    const query = searchParams.get('q')?.trim().toLowerCase() || '';
    const sort = searchParams.get('sort') || 'newest';
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100);
    const cursor = searchParams.get('cursor');

    const feedResult = forceRefresh ? await refreshWireFeed() : await getWireFeed();

    let filtered = feedResult.stories;

    // Filter by 'since' timestamp (for polling new stories)
    if (since) {
      const sinceTime = new Date(since).getTime();
      if (!isNaN(sinceTime)) {
        filtered = filtered.filter((s) => new Date(s.publishedAt).getTime() > sinceTime);
      }
    }

    // Filter by Region
    if (region && region !== 'ALL') {
      filtered = filtered.filter((s) => s.region === region);
    }

    // Filter by Category
    if (category && category !== 'All') {
      filtered = filtered.filter(
        (s) => s.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by Language
    if (lang && (lang === 'en' || lang === 'hi')) {
      filtered = filtered.filter((s) => s.language === lang);
    }

    // Filter by Time Range
    const now = Date.now();
    const hoursMap: Record<string, number> = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '3d': 72,
    };
    const hours = hoursMap[timeRange] || 24;
    const thresholdTime = now - hours * 60 * 60 * 1000;
    filtered = filtered.filter((s) => new Date(s.publishedAt).getTime() >= thresholdTime);

    // Search query filter (matches headline or snippet or outlet)
    if (query) {
      filtered = filtered.filter((s) => {
        const h = s.headline.toLowerCase();
        const sn = s.snippet.toLowerCase();
        const o = s.sourceName.toLowerCase();
        return h.includes(query) || sn.includes(query) || o.includes(query);
      });
    }

    // Sort
    if (sort === 'covered') {
      filtered.sort((a, b) => b.coveredBy - a.coveredBy);
    } else {
      // Default: newest first
      filtered.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    }

    // Pagination via cursor (cursor is story ID)
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = filtered.findIndex((s) => s.id === cursor);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginated = filtered.slice(startIndex, startIndex + limit);
    const nextCursor =
      startIndex + limit < filtered.length ? paginated[paginated.length - 1]?.id : null;

    return NextResponse.json({
      stories: paginated,
      totalCount: filtered.length,
      nextCursor,
      stats: feedResult.stats,
      sourcesStatus: feedResult.sourcesStatus,
      breakingStories: feedResult.breakingStories,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch wire feed';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

