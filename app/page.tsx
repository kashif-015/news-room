'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { StoryRow } from '@/components/feed/story-row';
import { FilterBar } from '@/components/feed/filter-bar';
import { TrendingSidebar } from '@/components/feed/trending-sidebar';
import { StoryRowSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArticleWithCluster, Cluster } from '@/lib/shared/types';
import { Search, X, Loader2, Sparkles, Globe } from 'lucide-react';

const QUICK_TOPICS = [
  'Artificial Intelligence',
  'Indian Tech',
  'Markets & Economy',
  'Cricket',
  'Global Politics',
  'Space & Science',
];

export default function FeedPage() {
  const [articles, setArticles] = useState<ArticleWithCluster[]>([]);
  const [topClusters, setTopClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('just now');
  const [dbWarning, setDbWarning] = useState<string | null>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ArticleWithCluster[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filters
  const [category, setCategory] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [unusedOnly, setUnusedOnly] = useState<boolean>(false);
  const [sort, setSort] = useState<'trend' | 'newest'>('trend');
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (timeRange) params.set('time_range', timeRange);
      if (unusedOnly) params.set('unused', 'true');
      if (sort) params.set('sort', sort);

      const res = await fetch(`/api/stories?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load stories');

      const data = await res.json();
      setArticles(data.items || []);
      setTopClusters(data.topClusters || []);
      if (data.dbConfigured === false) {
        setDbWarning(
          data.warning ||
          'Database not connected. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local to save and view articles.'
        );
      } else {
        setDbWarning(null);
      }
      setLastUpdated('just now');
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, timeRange, unusedOnly, sort]);

  useEffect(() => {
    setLoading(true);
    fetchFeed();
  }, [fetchFeed]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/cron/ingest', {
        headers: {
          Authorization: `Bearer test-cron-secret-123456`,
        },
      });
    } catch {
      // Ignore background ingest error
    }
    await fetchFeed();
  };

  const executeSearch = async (term: string) => {
    const q = term.trim();
    if (!q) return;

    setIsSearching(true);
    setActiveSearch(q);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const items = data.items || [];
      setSearchResults(items);
      try {
        const stored = JSON.parse(localStorage.getItem('newsroom_articles') || '{}');
        for (const it of items) {
          stored[it.id] = it;
        }
        localStorage.setItem('newsroom_articles', JSON.stringify(stored));
      } catch {
        // ignore
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setActiveSearch(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const displayedArticles = activeSearch
    ? searchResults
    : selectedClusterId
      ? articles.filter((a) => a.cluster_id === selectedClusterId)
      : articles;

  return (
    <AppShell
      lastUpdated={lastUpdated}
      onRefresh={handleRefresh}
      isRefreshing={refreshing}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (~62%): Search bar + Ruled story list */}
        <section className="lg:col-span-8 min-w-0" aria-label="News Feed">
          {/* Search Box Card */}
          <div className="mb-6 p-4 sm:p-5 border border-rule bg-paper rounded-[2px] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs uppercase tracking-wider text-ink font-medium flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-orange" />
                Live News Wire Search
              </span>
              <span className="font-mono text-[11px] text-ink-mute hidden sm:inline">
                Searches GNews, NewsData & Live Feeds
              </span>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-ink-mute absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="news-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any news topic, company, person, or event..."
                  className="w-full bg-bone border border-rule focus:border-ink rounded-[2px] pl-9 pr-8 py-2 text-sm font-sans text-ink placeholder:text-ink-mute focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink p-0.5 rounded-[2px]"
                    aria-label="Clear input"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                variant="primary"
                className="whitespace-nowrap flex items-center gap-1.5 px-4 py-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </>
                )}
              </Button>
            </form>

            {/* Quick Topic Chips */}
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[10px] text-ink-mute uppercase tracking-wider mr-1">
                Trending:
              </span>
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => {
                    setSearchQuery(topic);
                    executeSearch(topic);
                  }}
                  className="font-mono text-[11px] text-ink-soft hover:text-ink bg-bone/70 hover:bg-bone border border-rule px-2 py-0.5 rounded-[2px] transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Section Folio Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-rule mb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-ink-mute">
                {activeSearch ? (
                  <span className="text-orange font-semibold">
                    SEARCH: &quot;{activeSearch}&quot;
                  </span>
                ) : (
                  `Section: ${category ? category.toUpperCase() : 'ALL STORIES'}`
                )}
              </span>

              {activeSearch && (
                <button
                  onClick={handleClearSearch}
                  className="font-mono text-[11px] text-ink-mute hover:text-ink underline ml-2 flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" /> Back to Wire
                </button>
              )}
            </div>

            <span className="font-mono text-xs text-ink-mute">
              {displayedArticles.length} {displayedArticles.length === 1 ? 'story' : 'stories'}
            </span>
          </div>



          {/* Loading state */}
          {(loading || isSearching) && (
            <div className="divide-y divide-rule border-y border-rule">
              <StoryRowSkeleton />
              <StoryRowSkeleton />
              <StoryRowSkeleton />
              <StoryRowSkeleton />
            </div>
          )}

          {/* Empty search state */}
          {!loading && !isSearching && activeSearch && displayedArticles.length === 0 && (
            <div className="border border-rule p-8 text-center bg-paper rounded-[2px] my-6">
              <p className="font-fraunces text-xl font-semibold text-ink mb-2">
                No stories found for &quot;{activeSearch}&quot;
              </p>
              <p className="font-inter text-sm text-ink-soft max-w-md mx-auto mb-4">
                Try searching for broader keywords like AI, Technology, India, or Markets.
              </p>
              <Button variant="secondary" onClick={handleClearSearch}>
                Return to Wire Feed
              </Button>
            </div>
          )}

          {/* Empty feed state */}
          {!loading && !isSearching && !activeSearch && displayedArticles.length === 0 && (
            <div className="border border-rule p-8 text-center bg-paper rounded-[2px] my-6">
              <p className="font-fraunces text-xl font-semibold text-ink mb-2">
                Quiet on the wire
              </p>
              <p className="font-inter text-sm text-ink-soft max-w-md mx-auto mb-4">
                Use the search box above to instantly fetch news on any topic, or click &quot;Refresh now&quot; to ingest feeds.
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setSearchQuery('Artificial Intelligence');
                    executeSearch('Artificial Intelligence');
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Search AI News
                </Button>
              </div>
            </div>
          )}

          {/* Ruled story list */}
          {!loading && !isSearching && displayedArticles.length > 0 && (
            <div className="divide-y divide-rule border-y border-rule">
              {displayedArticles.map((article) => (
                <StoryRow key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>

        {/* Right Column (~38%, sticky): Filters & Trending */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-16" aria-label="Filters and Trending">
          {/* Filters */}
          <div className="border border-rule p-5 bg-paper rounded-[2px]">
            <h3 className="font-mono text-xs uppercase tracking-wider text-ink-mute mb-4 pb-2 border-b border-rule">
              Desk Filters
            </h3>
            <FilterBar
              selectedCategory={category}
              onSelectCategory={setCategory}
              selectedTimeRange={timeRange}
              onSelectTimeRange={setTimeRange}
              unusedOnly={unusedOnly}
              onToggleUnusedOnly={setUnusedOnly}
              sort={sort}
              onToggleSort={setSort}
            />
          </div>

          {/* Trending Clusters */}
          <TrendingSidebar
            clusters={topClusters}
            selectedClusterId={selectedClusterId}
            onSelectCluster={setSelectedClusterId}
          />
        </aside>
      </div>
    </AppShell>
  );
}
