import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { searchNews } from '@/lib/server/ingest/search';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (!q.trim()) {
      return NextResponse.json({ items: [] });
    }

    const items = await searchNews(q.trim());
    return NextResponse.json({
      query: q,
      count: items.length,
      items,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Search failed', items: [] },
      { status: 500 }
    );
  }
}

