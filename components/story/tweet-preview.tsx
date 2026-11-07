'use client';

import React, { useEffect } from 'react';
import { Tweet } from '@/lib/shared/types';
import { ExternalLink } from 'lucide-react';

interface TweetPreviewProps {
  tweet: Tweet;
}

export function TweetPreview({ tweet }: TweetPreviewProps) {
  useEffect(() => {
    // Load X (Twitter) widgets script safely if not present
    if (typeof window !== 'undefined' && !(window as unknown as { twttr?: unknown }).twttr) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      document.body.appendChild(script);
    } else if ((window as unknown as { twttr?: { widgets?: { load?: () => void } } }).twttr?.widgets?.load) {
      (window as unknown as { twttr: { widgets: { load: () => void } } }).twttr.widgets.load();
    }
  }, [tweet.embed_html]);

  const sourceLabel = tweet.added_by === 'auto' ? 'saved from article' : 'pasted by editor';

  return (
    <div className="border border-rule rounded-[2px] bg-paper p-3 font-sans text-xs">
      {/* Mono caption header */}
      <div className="flex items-center justify-between pb-2 border-b border-rule mb-2 font-mono text-[10px] text-ink-mute">
        <span>
          Tweet by {tweet.author_handle || '@user'} · {sourceLabel}
        </span>
        <a
          href={tweet.tweet_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-orange hover:underline"
        >
          <span>Open on X</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      {/* Tweet Body / Embed */}
      {tweet.embed_html ? (
        <div
          className="tweet-embed-container overflow-hidden text-ink"
          dangerouslySetInnerHTML={{ __html: tweet.embed_html }}
        />
      ) : (
        <blockquote className="font-fraunces italic text-ink-soft py-2 border-l-2 border-orange pl-3">
          {tweet.tweet_url}
        </blockquote>
      )}
    </div>
  );
}

