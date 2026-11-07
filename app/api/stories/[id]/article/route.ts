import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/server/db';
import { extractArticleText } from '@/lib/server/article/extract';
import { fetchTweetOEmbed } from '@/lib/server/tweets/oembed';
import { getInMemoryArticle } from '@/lib/server/stories-store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let article: { id: string; url: string; summary: string | null; title: string; cluster_id?: string | null } | null = null;
    let existingText: string | null = null;
    let existingTweets: any[] = [];

    // 1. Fetch article metadata from DB if configured
    if (isDbConfigured()) {
      try {
        const db = getDb();
        const { data: dbArticle } = await db
          .from('articles')
          .select('id, url, summary, title, cluster_id')
          .eq('id', id)
          .maybeSingle();

        if (dbArticle) {
          article = dbArticle;

          const { data: textRow } = await db
            .from('article_text')
            .select('text_content, fetched_at')
            .eq('article_id', id)
            .maybeSingle();
          existingText = textRow?.text_content || null;

          const { data: tweets } = await db
            .from('tweets')
            .select('*')
            .eq('article_id', id);
          existingTweets = tweets || [];
        }
      } catch {
        // Fallback
      }
    }

    // 2. Check in-memory store
    if (!article) {
      const memArt = getInMemoryArticle(id);
      if (memArt) {
        article = {
          id: memArt.id,
          url: memArt.url,
          summary: memArt.summary,
          title: memArt.title,
          cluster_id: memArt.cluster_id,
        };
      }
    }

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (existingText) {
      return NextResponse.json({
        textContent: existingText,
        tweets: existingTweets,
        extracted: true,
      });
    }

    // 3. Extract article text on demand
    const extraction = await extractArticleText(article.url, article.summary);

    // Save extracted text to DB if configured
    if (isDbConfigured()) {
      try {
        const db = getDb();
        await db.from('article_text').upsert({
          article_id: id,
          text_content: extraction.textContent,
          fetched_at: new Date().toISOString(),
        });
      } catch {
        // Ignore DB save failure
      }
    }

    // 4. Extract and save tweet links
    const savedTweets = [...existingTweets];
    for (const tweetUrl of extraction.tweetUrls.slice(0, 5)) {
      try {
        const oembed = await fetchTweetOEmbed(tweetUrl);
        const tweetObj = {
          article_id: id,
          cluster_id: article.cluster_id || null,
          tweet_url: tweetUrl,
          author_handle: oembed.authorHandle,
          author_name: oembed.authorName,
          embed_html: oembed.embedHtml,
          added_by: 'auto',
        };

        if (isDbConfigured()) {
          try {
            const db = getDb();
            const { data: insertedTweet } = await db
              .from('tweets')
              .upsert(tweetObj, { onConflict: 'tweet_url' })
              .select()
              .maybeSingle();

            if (insertedTweet) {
              savedTweets.push(insertedTweet);
              continue;
            }
          } catch {
            // ignore
          }
        }
        savedTweets.push(tweetObj);
      } catch {
        // Skip individual tweet failure
      }
    }

    return NextResponse.json({
      textContent: extraction.textContent,
      tweets: savedTweets,
      extracted: extraction.success,
      warning: extraction.warning,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Article extraction failed' },
      { status: 500 }
    );
  }
}
