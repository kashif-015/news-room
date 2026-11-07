import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/server/db';
import { saveInMemoryArticle } from '@/lib/server/stories-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({
        items: [],
        nextCursor: null,
        topClusters: [],
        dbConfigured: false,
        warning: 'Database not connected. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local',
      });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sourceId = searchParams.get('source_id');
    const timeRange = searchParams.get('time_range') || '24h';
    const notUsedOnly = searchParams.get('unused') === 'true';
    const sort = searchParams.get('sort') || 'trend'; // 'trend' | 'newest'
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100);
    const cursor = searchParams.get('cursor');

    const db = getDb();

    // Calculate time threshold
    const hoursMap: Record<string, number> = {
      '3h': 3,
      '12h': 12,
      '24h': 24,
      '3d': 72,
    };
    const hours = hoursMap[timeRange] || 24;
    const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    let query = db
      .from('articles')
      .select('*, cluster:clusters(*), source:sources(name, type)')
      .gte('fetched_at', sinceDate);

    if (category) {
      query = query.eq('category', category);
    }
    if (sourceId) {
      query = query.eq('source_id', sourceId);
    }
    if (notUsedOnly) {
      query = query.eq('used', false);
    }

    if (sort === 'newest') {
      query = query.order('published_at', { ascending: false, nullsFirst: false });
    } else {
      // Sort by cluster trend_score or fallback to fetched_at
      query = query.order('fetched_at', { ascending: false });
    }

    query = query.limit(limit + 1);

    const { data: articles, error } = await query;

    if (error) {
      console.warn('Supabase query error in /api/stories:', error.message);
      return NextResponse.json({
        items: [],
        nextCursor: null,
        topClusters: [],
        dbConfigured: false,
        error: error.message,
      });
    }

    const items = articles || [];
    let nextCursor: string | null = null;

    if (items.length > limit) {
      items.pop();
      nextCursor = items[items.length - 1]?.id || null;
    }

    // Sort in memory by cluster trend_score if requested
    if (sort === 'trend') {
      items.sort((a, b) => {
        const scoreA = Number(a.cluster?.trend_score || 1);
        const scoreB = Number(b.cluster?.trend_score || 1);
        return scoreB - scoreA;
      });
    }

    // Top 5 clusters for sidebar
    const { data: topClusters } = await db
      .from('clusters')
      .select('*')
      .gte('last_seen', sinceDate)
      .order('trend_score', { ascending: false })
      .limit(5);

    return NextResponse.json({
      items,
      nextCursor,
      topClusters: topClusters || [],
      dbConfigured: true,
    });
  } catch (err: unknown) {
    console.warn('Unhandled error in /api/stories:', err);
    return NextResponse.json({
      items: [],
      nextCursor: null,
      topClusters: [],
      dbConfigured: false,
      error: err instanceof Error ? err.message : 'Failed to fetch stories',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const article = await request.json();
    if (!article || !article.id) {
      return NextResponse.json({ error: 'Invalid article' }, { status: 400 });
    }
    saveInMemoryArticle(article);
    return NextResponse.json({ success: true, article });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to save article' }, { status: 500 });
  }
}
