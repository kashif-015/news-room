import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/server/db';
import { getInMemoryArticle } from '@/lib/server/stories-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let article: any = null;
    let relatedArticles: unknown[] = [];
    let tweets: unknown[] = [];
    let extractedText: string | null = null;

    // 1. Try fetching from Supabase if configured
    if (isDbConfigured()) {
      try {
        const db = getDb();
        const { data: dbArticle } = await db
          .from('articles')
          .select('*, cluster:clusters(*), source:sources(name, type)')
          .eq('id', id)
          .maybeSingle();

        if (dbArticle) {
          article = dbArticle;

          if (article.cluster_id) {
            const { data: clusterItems } = await db
              .from('articles')
              .select('id, title, url, outlet, published_at, category')
              .eq('cluster_id', article.cluster_id)
              .neq('id', article.id);
            relatedArticles = clusterItems || [];
          }

          const { data: tweetRows } = await db
            .from('tweets')
            .select('*')
            .or(`article_id.eq.${id},cluster_id.eq.${article.cluster_id || '00000000-0000-0000-0000-000000000000'}`);
          tweets = tweetRows || [];

          const { data: textRow } = await db
            .from('article_text')
            .select('text_content')
            .eq('article_id', id)
            .maybeSingle();
          extractedText = textRow?.text_content || null;
        }
      } catch {
        // Continue to fallback
      }
    }

    // 2. Fallback to in-memory store
    if (!article) {
      article = getInMemoryArticle(id) || null;
    }

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({
      article,
      relatedArticles,
      tweets,
      extractedText,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to fetch story' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { used } = body;

    if (isDbConfigured()) {
      const db = getDb();
      const { data, error } = await db
        .from('articles')
        .update({ used: Boolean(used) })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ data });
      }
    }

    const memArt = getInMemoryArticle(id);
    if (memArt) {
      memArt.used = Boolean(used);
      return NextResponse.json({ data: memArt });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}
