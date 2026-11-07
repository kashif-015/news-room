'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { ReadingColumn } from '@/components/story/reading-column';
import { TweetPreview } from '@/components/story/tweet-preview';
import { TweetPaste } from '@/components/story/tweet-paste';
import { SearchOnX } from '@/components/story/search-on-x';
import { MediaPanel } from '@/components/story/media-panel';
import { NotesStrip } from '@/components/story/notes-strip';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { Article, Tweet } from '@/lib/shared/types';
import { Sparkles, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StoryWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [warning, setWarning] = useState<string | undefined>();
  const [mobileTab, setMobileTab] = useState<'read' | 'coverage' | 'tweets' | 'media'>('read');

  useEffect(() => {
    async function loadStory() {
      try {
        setLoading(true);
        let currentArticle: Article | null = null;
        let currentRelated: Article[] = [];
        let currentTweets: Tweet[] = [];

        const res = await fetch(`/api/stories/${id}`);
        if (res.ok) {
          const data = await res.json();
          currentArticle = data.article;
          currentRelated = data.relatedArticles || [];
          currentTweets = data.tweets || [];
        } else {
          // Check local storage backup if server reloaded
          try {
            const rawStored = localStorage.getItem('newsroom_articles');
            if (rawStored) {
              const parsed = JSON.parse(rawStored);
              const fallback = parsed[id];
              if (fallback) {
                currentArticle = fallback;
                // Re-register with server store
                await fetch('/api/stories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(fallback),
                }).catch(() => {});
              }
            }
          } catch {
            // ignore
          }
        }

        if (!currentArticle) {
          throw new Error('Story not found');
        }

        setArticle(currentArticle);
        setRelatedArticles(currentRelated);
        setTweets(currentTweets);

        // Trigger or load extracted text
        setExtracting(true);
        const extractRes = await fetch(`/api/stories/${id}/article`, { method: 'POST' });
        if (extractRes.ok) {
          const extractData = await extractRes.json();
          setTextContent(extractData.textContent || currentArticle.summary || '');
          if (extractData.tweets) {
            setTweets((prev) => {
              const existingUrls = new Set(prev.map((t) => t.tweet_url));
              const newTweets = extractData.tweets.filter((t: Tweet) => !existingUrls.has(t.tweet_url));
              return [...prev, ...newTweets];
            });
          }
          if (extractData.warning) setWarning(extractData.warning);
        } else {
          setTextContent(currentArticle.summary || '');
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false);
        setExtracting(false);
      }
    }

    if (id) {
      loadStory();
    }
  }, [id]);

  const handleCreatePost = async () => {
    if (!article) return;

    setGenerating(true);
    setGenerationStatus('Reading the article. Drafting headlines.');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          language: 'en',
          mode: 'full',
        }),
      });

      const genData = await res.json();
      if (!res.ok) {
        throw new Error(genData.error || 'Failed to generate post');
      }

      setGenerationStatus('Draft generated. Saving to workspace...');

      const output = genData.data?.output || genData.data || genData.output || {};
      const headlines = Array.isArray(output.headlines) ? output.headlines : [];
      const headline = headlines[0]?.text || article.title;
      const caption = output.caption || '';
      const hashtags = Array.isArray(output.hashtags) ? output.hashtags : [];
      const facts = Array.isArray(output.facts) ? output.facts : [];

      // Save initial draft
      const draftRes = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: article.id,
          headline_options: headlines,
          headline: headline,
          caption: caption,
          hashtags: hashtags,
          fact_table: facts,
          language: 'en',
          template_id: 'template-a',
          source_url: article.url,
          source_outlet: article.outlet,
        }),
      });

      const draftJson = await draftRes.json();
      if (!draftRes.ok) throw new Error('Failed to create draft');

      router.push(`/drafts/${draftJson.data.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Generation failed. Try again.');
      setGenerating(false);
      setGenerationStatus('');
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="py-12 text-center font-mono text-xs text-ink-mute">
          Opening story workspace...
        </div>
      </AppShell>
    );
  }

  if (!article) {
    return (
      <AppShell>
        <div className="py-12 text-center">
          <p className="font-fraunces text-xl text-ink">Story not found</p>
          <Link href="/" className="font-mono text-xs text-orange hover:underline mt-2 inline-block">
            Return to Feed
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Top Workspace Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-rule mb-6 flex-wrap gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-mute hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Feed</span>
        </Link>

        {/* Primary Create Post Button */}
        <div className="flex items-center gap-3">
          {generationStatus && (
            <span className="font-mono text-xs text-orange animate-pulse">
              {generationStatus}
            </span>
          )}
          <Button
            variant="primary"
            onClick={handleCreatePost}
            loading={generating}
            leadingIcon={<Sparkles className="w-4 h-4" />}
          >
            Create post
          </Button>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden mb-4">
        <Tabs
          tabs={[
            { id: 'read', label: 'Read' },
            { id: 'coverage', label: `Coverage (${relatedArticles.length})` },
            { id: 'tweets', label: `Tweets (${tweets.length})` },
            { id: 'media', label: 'Media' },
          ]}
          activeTab={mobileTab}
          onChange={(tab: string) => setMobileTab(tab as typeof mobileTab)}
        />
      </div>

      {/* Main Grid: Reading Column vs Coverage Column */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Centre / Wide Reading Column */}
        <div className={`md:col-span-7 lg:col-span-8 ${mobileTab !== 'read' ? 'hidden md:block' : ''}`}>
          <ReadingColumn
            title={article.title}
            sourceUrl={article.url}
            outlet={article.outlet}
            category={article.category}
            publishedAt={article.published_at}
            textContent={textContent}
            isExtracted={!extracting}
            warning={warning}
          />
          <NotesStrip articleId={article.id} />
        </div>

        {/* Right / Narrow Coverage & Tweet Column */}
        <div
          className={`md:col-span-5 lg:col-span-4 space-y-6 ${
            mobileTab === 'read' ? 'hidden md:block' : ''
          }`}
        >
          {/* Related Coverage Box */}
          {(mobileTab === 'coverage' || mobileTab === 'read') && (
            <div className="border border-rule rounded-[2px] bg-paper p-4">
              <h3 className="font-mono text-xs uppercase tracking-wider text-ink-mute mb-3 pb-2 border-b border-rule">
                Related Coverage ({relatedArticles.length + 1} Outlets)
              </h3>
              {relatedArticles.length === 0 ? (
                <p className="font-inter text-xs text-ink-mute">
                  No other outlets in this cluster yet.
                </p>
              ) : (
                <ul className="divide-y divide-rule font-sans text-xs">
                  {relatedArticles.map((rel) => (
                    <li key={rel.id} className="py-2.5">
                      <div className="font-mono text-[10px] text-ink-mute mb-1">
                        {rel.outlet || 'Other Source'}
                      </div>
                      <a
                        href={rel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-fraunces text-sm font-semibold text-ink hover:text-orange leading-snug line-clamp-2 block transition-colors"
                      >
                        {rel.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Tweets Section */}
          {(mobileTab === 'tweets' || mobileTab === 'read') && (
            <div className="border border-rule rounded-[2px] bg-paper p-4 space-y-4">
              <h3 className="font-mono text-xs uppercase tracking-wider text-ink-mute pb-2 border-b border-rule">
                Related Tweets ({tweets.length})
              </h3>

              <SearchOnX headline={article.title} />

              <TweetPaste
                articleId={article.id}
                clusterId={article.cluster_id}
                onTweetSaved={(newTweet) => setTweets((prev) => [newTweet, ...prev])}
              />

              <div className="space-y-3 pt-2">
                {tweets.map((tweet) => (
                  <TweetPreview key={tweet.id} tweet={tweet} />
                ))}
              </div>
            </div>
          )}

          {/* Memes & Images */}
          {(mobileTab === 'media' || mobileTab === 'read') && (
            <div className="border border-rule rounded-[2px] bg-paper p-4">
              <h3 className="font-mono text-xs uppercase tracking-wider text-ink-mute mb-3 pb-2 border-b border-rule">
                Media & Inspiration
              </h3>
              <MediaPanel initialQuery={article.category || 'news'} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
