'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tweet } from '@/lib/shared/types';

interface TweetPasteProps {
  articleId: string;
  clusterId?: string | null;
  onTweetSaved: (tweet: Tweet) => void;
}

export function TweetPaste({ articleId, clusterId, onTweetSaved }: TweetPasteProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), article_id: articleId, cluster_id: clusterId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch tweet');
      }

      onTweetSaved(json.data);
      setUrl('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid tweet link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        label="PASTE TWEET URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://x.com/username/status/..."
        disabled={loading}
        error={error}
      />
      <Button type="submit" variant="secondary" size="small" loading={loading} className="w-full">
        Attach Tweet
      </Button>
    </form>
  );
}

