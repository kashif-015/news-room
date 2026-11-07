import 'server-only';

export interface OEmbedResult {
  tweetUrl: string;
  authorHandle: string | null;
  authorName: string | null;
  embedHtml: string | null;
  success: boolean;
  error?: string;
}

export function isValidTweetUrl(url: string): boolean {
  return /^https?:\/\/(?:twitter|x)\.com\/[A-Za-z0-9_]+\/status\/\d+/i.test(url);
}

export async function fetchTweetOEmbed(url: string): Promise<OEmbedResult> {
  if (!isValidTweetUrl(url)) {
    return {
      tweetUrl: url,
      authorHandle: null,
      authorName: null,
      embedHtml: null,
      success: false,
      error: 'Invalid X/Twitter status URL.',
    };
  }

  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(
      url
    )}&omit_script=1&theme=light&dnt=true`;

    const res = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'NewsDesk/1.0',
      },
    });

    if (!res.ok) {
      // Parse handle directly from URL if oembed is unavailable or tweet deleted
      const match = url.match(/(?:twitter|x)\.com\/([A-Za-z0-9_]+)\/status/i);
      const handle = match ? match[1] : null;

      return {
        tweetUrl: url,
        authorHandle: handle ? `@${handle}` : null,
        authorName: handle || null,
        embedHtml: null,
        success: false,
        error: 'Tweet is private, deleted, or unreadable by oEmbed.',
      };
    }

    const data = await res.json();
    const authorHandle = data.author_url ? `@${data.author_url.split('/').pop()}` : null;

    return {
      tweetUrl: url,
      authorHandle: authorHandle,
      authorName: data.author_name || null,
      embedHtml: data.html || null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      tweetUrl: url,
      authorHandle: null,
      authorName: null,
      embedHtml: null,
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch tweet embed.',
    };
  }
}

