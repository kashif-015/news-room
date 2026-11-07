import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { env } from '@/lib/server/env';
import { getDb } from '@/lib/server/db';
import { fetchRssFeed } from '@/lib/server/ingest/rss';
import { fetchGNews } from '@/lib/server/ingest/gnews';
import { fetchNewsData } from '@/lib/server/ingest/newsdata';
import { clusterArticle } from '@/lib/server/ingest/cluster';
import { NormalizedArticle, IngestSummary } from '@/lib/shared/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // 1. Verify CRON_SECRET bearer token
  const authHeader = request.headers.get('Authorization');
  const expectedAuth = `Bearer ${env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
  }

  const db = getDb();
  const summary: IngestSummary = {
    sources_processed: 0,
    new_articles: 0,
    clusters_updated: 0,
    articles_cleaned: 0,
    errors: [],
    duration_ms: 0,
  };

  try {
    // 2. Fetch up to 8 active sources (oldest last_fetched_at first)
    const { data: sources, error: sourceErr } = await db
      .from('sources')
      .select('id, name, type, url, category, last_fetched_at')
      .eq('active', true)
      .order('last_fetched_at', { ascending: true, nullsFirst: true })
      .limit(8);

    if (sourceErr || !sources || sources.length === 0) {
      summary.duration_ms = Date.now() - startTime;
      return NextResponse.json({ message: 'No active sources to process', summary });
    }

    // 3. Process sources concurrently
    const results = await Promise.allSettled(
      sources.map(async (src) => {
        let fetchedArticles: NormalizedArticle[] = [];
        try {
          if (src.type === 'rss' && src.url) {
            fetchedArticles = await fetchRssFeed(src.id, src.name, src.url, src.category);
          } else if (src.type === 'gnews' && src.url) {
            fetchedArticles = await fetchGNews(src.id, src.url);
          } else if (src.type === 'newsdata' && src.url) {
            fetchedArticles = await fetchNewsData(src.id, src.url);
          }

          // Mark source success
          await db
            .from('sources')
            .update({
              last_fetched_at: new Date().toISOString(),
              last_error: null,
            })
            .eq('id', src.id);

          return { sourceId: src.id, articles: fetchedArticles };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Unknown source error';
          await db
            .from('sources')
            .update({
              last_fetched_at: new Date().toISOString(),
              last_error: msg,
            })
            .eq('id', src.id);

          throw err;
        }
      })
    );

    // 4. Collect and insert new articles
    for (const res of results) {
      summary.sources_processed++;
      if (res.status === 'rejected') {
        summary.errors.push(String(res.reason));
        continue;
      }

      const { articles } = res.value;
      for (const article of articles) {
        // Insert with on conflict do nothing
        const { data: inserted, error: insertErr } = await db
          .from('articles')
          .insert(article)
          .select('id, title_norm, outlet')
          .single();

        if (inserted && !insertErr) {
          summary.new_articles++;
          // Trigger clustering
          const clusterId = await clusterArticle(inserted.id, inserted.title_norm, inserted.outlet || 'Unknown');
          if (clusterId) {
            summary.clusters_updated++;
          }
        }
      }
    }

    // 5. Cleanup articles older than 14 days that have no draft
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: draftedArticles } = await db.from('drafts').select('article_id').not('article_id', 'is', null);
    const draftedIds = (draftedArticles || []).map((d) => d.article_id).filter(Boolean);

    let deleteQuery = db.from('articles').delete().lt('fetched_at', fourteenDaysAgo);
    if (draftedIds.length > 0) {
      deleteQuery = deleteQuery.not('id', 'in', `(${draftedIds.join(',')})`);
    }

    const { count: cleanedCount } = await deleteQuery;
    summary.articles_cleaned = cleanedCount || 0;
  } catch (err: unknown) {
    summary.errors.push(err instanceof Error ? err.message : 'Ingest pipeline failed');
  }

  summary.duration_ms = Date.now() - startTime;
  return NextResponse.json({ success: true, summary });
}

