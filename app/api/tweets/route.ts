import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/server/db';
import { saveTweetRequestSchema } from '@/lib/shared/schemas';
import { fetchTweetOEmbed } from '@/lib/server/tweets/oembed';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = saveTweetRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please paste a valid X/Twitter status link (e.g. https://x.com/username/status/12345)' },
        { status: 400 }
      );
    }

    const { url, article_id, cluster_id } = parsed.data;
    const oembed = await fetchTweetOEmbed(url);

    const db = getDb();
    const { data: tweet, error } = await db
      .from('tweets')
      .upsert(
        {
          article_id: article_id || null,
          cluster_id: cluster_id || null,
          tweet_url: url,
          author_handle: oembed.authorHandle,
          author_name: oembed.authorName,
          embed_html: oembed.embedHtml,
          added_by: 'manual',
        },
        { onConflict: 'tweet_url' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: tweet,
      warning: !oembed.success ? oembed.error : undefined,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to save tweet' }, { status: 500 });
  }
}

