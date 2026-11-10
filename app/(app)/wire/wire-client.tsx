'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, ExternalLink, X, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { ScrollReveal } from '@/components/layout/scroll-reveal';
import { WireStory, SourceStatusItem } from '@/lib/server/wire/feed';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WireStats {
  sourceCount: number;
  storiesLast24h: number;
  lastCheckedMin: number;
}

interface WireClientProps {
  initialStats?: WireStats;
}

type Region = 'ALL' | 'INDIA' | 'WORLD';
type TimeRange = '1h' | '6h' | '24h' | '3d';
type SortOrder = 'newest' | 'most-covered';
type Language = 'EN' | 'HI';

type Category =
  | 'All'
  | 'Politics'
  | 'Business'
  | 'Tech'
  | 'Sports'
  | 'Health'
  | 'Science'
  | 'Entertainment';

// ---------------------------------------------------------------------------
// Status dot for source coverage
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: 'ok' | 'slow' | 'failing' }) {
  const colorClass =
    status === 'ok' ? 'bg-pine' : status === 'slow' ? 'bg-orange' : 'bg-alert';
  const label =
    status === 'ok' ? 'Healthy' : status === 'slow' ? 'Slow response' : 'Failing';

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colorClass} flex-shrink-0`}
      title={label}
      aria-label={label}
    />
  );
}

// ---------------------------------------------------------------------------
// Pulsing dot for "Live"
// ---------------------------------------------------------------------------

function PulsingDot() {
  return (
    <span
      className="relative inline-flex items-center justify-center w-3 h-3 mr-2 flex-shrink-0"
      aria-hidden="true"
    >
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert opacity-60" />
      <span className="relative inline-flex rounded-full w-2 h-2 bg-alert" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Filter pill
// ---------------------------------------------------------------------------

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 font-mono text-xs uppercase tracking-wider rounded-[2px] transition-colors whitespace-nowrap cursor-pointer ${
        active
          ? 'bg-orange text-paper'
          : 'bg-transparent border border-rule text-ink-mute hover:border-ink-soft'
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helper: format relative time
// ---------------------------------------------------------------------------

function formatMinsAgo(mins: number): string {
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins} MIN AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  return `${days}D AGO`;
}

function timeAgoFromDate(dateStr: string): string {
  try {
    const d = new Date(dateStr).getTime();
    if (isNaN(d)) return 'RECENT';
    const mins = Math.max(0, Math.floor((Date.now() - d) / 60000));
    return formatMinsAgo(mins);
  } catch {
    return 'RECENT';
  }
}

// ---------------------------------------------------------------------------
// Coverage panel
// ---------------------------------------------------------------------------

function CoveragePanel({ sources }: { sources: SourceStatusItem[] }) {
  const [filterRegion, setFilterRegion] = useState<'ALL' | 'INDIA' | 'WORLD'>('ALL');

  const filtered = sources.filter((s) => {
    if (filterRegion === 'ALL') return true;
    return s.region === filterRegion;
  });

  const healthyCount = sources.filter((s) => s.status === 'ok').length;
  const slowCount = sources.filter((s) => s.status === 'slow').length;
  const failCount = sources.filter((s) => s.status === 'failing').length;

  return (
    <div className="border border-rule rounded-[2px] bg-paper p-4 mt-3">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-ink font-semibold">
          Source Coverage ({sources.length} Tracked)
        </h2>
        <div className="flex items-center gap-3 font-mono text-[11px] text-ink-mute">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pine inline-block" /> {healthyCount} OK
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange inline-block" /> {slowCount} Slow
          </span>
          {failCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-alert inline-block" /> {failCount} Offline
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        {(['ALL', 'INDIA', 'WORLD'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setFilterRegion(r)}
            className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-[2px] border ${
              filterRegion === r
                ? 'bg-ink text-paper border-ink'
                : 'text-ink-mute border-rule hover:border-ink-soft'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
        {filtered.map((src) => (
          <div
            key={src.id}
            className="flex items-center justify-between gap-2 py-1 px-1.5 hover:bg-bone-deep/30 rounded-[2px] transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <StatusDot status={src.status} />
              <span className="font-inter text-xs text-ink truncate">{src.name}</span>
              <span className="font-mono text-[10px] text-ink-mute uppercase border border-rule px-1 rounded-[2px]">
                {src.category}
              </span>
            </div>
            <span className="font-mono text-[10px] text-ink-mute whitespace-nowrap">
              {timeAgoFromDate(src.lastFetchedAt)}
            </span>
          </div>
        ))}
      </div>

      <p className="font-mono text-[10px] text-ink-mute mt-3 pt-3 border-t border-rule">
        Free multi-source wire · Verified live RSS &amp; wire endpoints
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story row
// ---------------------------------------------------------------------------

function StoryRow({ story }: { story: WireStory }) {
  const [outletsOpen, setOutletsOpen] = useState(false);

  return (
    <article
      role="article"
      className="group relative py-4 px-0 border-t border-rule border-l-2 border-l-transparent hover:border-l-orange transition-colors duration-150"
    >
      {/* Dateline */}
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-mute mb-1">
        {story.sourceName.toUpperCase()} · {story.region} · {story.category.toUpperCase()} ·{' '}
        {timeAgoFromDate(story.publishedAt)}
      </p>

      {/* Headline */}
      <h3 className="font-fraunces text-[20px] leading-7 text-ink mb-1.5 font-medium">
        <a
          href={story.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-orange transition-colors"
        >
          {story.headline}
        </a>
      </h3>

      {/* Snippet */}
      <p className="font-inter text-sm text-ink-soft mb-3 max-w-[72ch] leading-relaxed">
        {story.snippet.length > 300 ? story.snippet.slice(0, 300) + '…' : story.snippet}
      </p>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <button
          type="button"
          onClick={() => setOutletsOpen((o) => !o)}
          className="font-mono text-xs text-orange hover:text-orange-deep transition-colors flex items-center gap-1 cursor-pointer"
          aria-expanded={outletsOpen}
        >
          Covered by {story.coveredBy} {story.coveredBy === 1 ? 'outlet' : 'outlets'}
          {outletsOpen ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>

        <a
          href={story.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-ink-mute hover:text-orange transition-colors flex items-center gap-1"
        >
          Original <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Expanded outlets */}
      {outletsOpen && (
        <ul className="mt-2.5 ml-2 p-2.5 bg-paper border border-rule rounded-[2px] space-y-1.5 max-w-lg">
          {story.outlets.map((outlet, idx) => (
            <li key={`${outlet.name}-${idx}`} className="font-mono text-[11px] text-ink-soft flex items-center justify-between gap-2">
              <span>— {outlet.name}</span>
              <a
                href={outlet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange hover:underline text-[10px] flex items-center gap-1"
              >
                Read ↗
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* Bottom rule */}
      <div className="border-b border-rule mt-4" />
    </article>
  );
}

// ---------------------------------------------------------------------------
// Breaking band
// ---------------------------------------------------------------------------

function BreakingBand({ story }: { story: WireStory }) {
  return (
    <div
      className="bg-orange text-paper py-2.5 px-4 font-mono text-xs uppercase tracking-wider flex items-center justify-between gap-3 mb-6 rounded-[2px]"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="inline-block w-2 h-2 rounded-full bg-paper animate-pulse flex-shrink-0" aria-hidden="true" />
        <span className="font-bold">BREAKING:</span>
        <a
          href={story.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-bone-deep truncate"
        >
          {story.headline}
        </a>
      </div>
      <span className="text-[11px] whitespace-nowrap hidden sm:inline opacity-90">
        Covered by {story.coveredBy} outlets
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton row for loading
// ---------------------------------------------------------------------------

function WireStorySkeleton() {
  return (
    <div className="py-4 border-t border-rule animate-pulse">
      <div className="h-3 w-48 bg-rule/50 rounded mb-2" />
      <div className="h-6 w-3/4 bg-rule/60 rounded mb-2" />
      <div className="h-4 w-full bg-rule/40 rounded mb-1" />
      <div className="h-4 w-2/3 bg-rule/40 rounded mb-3" />
      <div className="h-3 w-32 bg-rule/50 rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export function WireClient({ initialStats }: WireClientProps) {
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [region, setRegion] = useState<Region>('ALL');
  const [category, setCategory] = useState<Category>('All');
  const [language, setLanguage] = useState<Language>('EN');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [stories, setStories] = useState<WireStory[]>([]);
  const [pendingNewStories, setPendingNewStories] = useState<WireStory[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [stats, setStats] = useState<WireStats>(
    initialStats || { sourceCount: 60, storiesLast24h: 0, lastCheckedMin: 1 }
  );
  const [sourcesStatus, setSourcesStatus] = useState<SourceStatusItem[]>([]);
  const [breakingStory, setBreakingStory] = useState<WireStory | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch stories function
  const fetchFeed = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      try {
        const params = new URLSearchParams({
          region,
          category,
          lang: language.toLowerCase(),
          timeRange,
          sort: sortOrder === 'most-covered' ? 'covered' : 'newest',
          limit: '25',
        });
        if (debouncedQuery.trim()) {
          params.set('q', debouncedQuery.trim());
        }
        if (isManualRefresh) {
          params.set('refresh', 'true');
        }

        const res = await fetch(`/api/feed?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load feed');
        const data = await res.json();

        setStories(data.stories || []);
        setNextCursor(data.nextCursor || null);
        if (data.stats) setStats(data.stats);
        if (data.sourcesStatus) setSourcesStatus(data.sourcesStatus);
        if (data.breakingStories && data.breakingStories.length > 0) {
          setBreakingStory(data.breakingStories[0]);
        } else {
          setBreakingStory(null);
        }
        setPendingNewStories([]);
      } catch (err: unknown) {
        showToast('Failed to load news feed. Retrying...');
      } finally {
        setLoading(false);
        if (isManualRefresh) setIsRefreshing(false);
      }
    },
    [region, category, language, timeRange, sortOrder, debouncedQuery]
  );

  // Initial load and on filter changes
  useEffect(() => {
    setLoading(true);
    fetchFeed();
  }, [fetchFeed]);

  // Load more older stories
  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        region,
        category,
        lang: language.toLowerCase(),
        timeRange,
        sort: sortOrder === 'most-covered' ? 'covered' : 'newest',
        cursor: nextCursor,
        limit: '25',
      });
      if (debouncedQuery.trim()) {
        params.set('q', debouncedQuery.trim());
      }

      const res = await fetch(`/api/feed?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load more');
      const data = await res.json();

      setStories((prev) => [...prev, ...(data.stories || [])]);
      setNextCursor(data.nextCursor || null);
    } catch {
      showToast('Could not load older stories');
    } finally {
      setLoadingMore(false);
    }
  };

  // Poll for new stories every 45s
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      // Don't poll if document is hidden or while searching
      if (document.hidden || debouncedQuery.trim()) return;
      if (stories.length === 0) return;

      try {
        const latestTime = stories[0]?.publishedAt;
        if (!latestTime) return;

        const params = new URLSearchParams({
          since: latestTime,
          region,
          category,
          lang: language.toLowerCase(),
          timeRange,
          limit: '15',
        });

        const res = await fetch(`/api/feed?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();

        const incoming = (data.stories || []).filter(
          (newArt: WireStory) => !stories.some((s) => s.id === newArt.id)
        );

        if (incoming.length > 0) {
          setPendingNewStories((prev) => {
            const combined = [...incoming, ...prev];
            // Deduplicate
            const uniqueMap = new Map<string, WireStory>();
            combined.forEach((item) => uniqueMap.set(item.id, item));
            return Array.from(uniqueMap.values());
          });
        }
      } catch {
        // Silently ignore polling network errors
      }
    }, 45000);

    return () => clearInterval(pollInterval);
  }, [stories, region, category, language, timeRange, debouncedQuery]);

  // Update tab title with unread count
  useEffect(() => {
    if (pendingNewStories.length > 0) {
      document.title = `(${pendingNewStories.length}) Live Wire · Latest News`;
    } else {
      document.title = 'Live Wire · Latest News';
    }
    return () => {
      document.title = 'NewsDesk · Editorial Intelligence';
    };
  }, [pendingNewStories.length]);

  // Insert pending new stories when user clicks the sticky pill
  const handleInsertNewStories = () => {
    if (pendingNewStories.length === 0) return;
    setStories((prev) => [...pendingNewStories, ...prev]);
    showToast(`Inserted ${pendingNewStories.length} new stories at the top.`);
    setPendingNewStories([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories: Category[] = [
    'All',
    'Politics',
    'Business',
    'Tech',
    'Sports',
    'Health',
    'Science',
    'Entertainment',
  ];

  return (
    <>
      {/* Skip link */}
      <a
        href="#wire-feed"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-orange focus:text-paper focus:font-mono focus:text-xs focus:px-3 focus:py-1 focus:rounded-[2px]"
      >
        Skip to feed
      </a>

      <AppShell
        lastUpdated={stats.lastCheckedMin <= 1 ? 'just now' : `${stats.lastCheckedMin} min ago`}
        onRefresh={() => fetchFeed(true)}
        isRefreshing={isRefreshing}
      >
        {/* Breaking band */}
        {breakingStory && <BreakingBand story={breakingStory} />}

        {/* ---------------------------------------------------------------- */}
        {/* Wire Header                                                       */}
        {/* ---------------------------------------------------------------- */}
        <header className="mb-6 border-b border-rule pb-5">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <PulsingDot />
                <h1 className="font-fraunces text-4xl font-bold text-ink leading-none tracking-tight">
                  Live Wire
                </h1>
              </div>
              <p className="font-mono text-xs text-ink-mute mt-1">
                Real-time news aggregator · India &amp; World
              </p>
            </div>

            {/* Coverage button & Refresh button */}
            <div className="flex items-center gap-2 self-start mt-1">
              <button
                type="button"
                onClick={() => fetchFeed(true)}
                disabled={isRefreshing}
                className="font-mono text-xs uppercase tracking-wider px-2.5 py-1 border border-rule rounded-[2px] text-ink-mute hover:text-ink hover:border-ink-soft transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Fetch latest news from all sources now"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-orange' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Checking...' : 'Refresh'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCoverageOpen((o) => !o)}
                className="font-mono text-xs uppercase tracking-wider px-3 py-1 border border-rule rounded-[2px] text-ink-mute hover:border-ink-soft hover:text-ink transition-colors flex items-center gap-1.5 cursor-pointer"
                aria-expanded={coverageOpen}
                aria-controls="coverage-panel"
              >
                Coverage
                {coverageOpen ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <p className="font-mono text-[11px] text-ink-mute mt-2">
            {stats.sourceCount} sources tracked · {stats.storiesLast24h} stories in the last 24h ·{' '}
            Last checked {stats.lastCheckedMin <= 1 ? '1 min' : `${stats.lastCheckedMin} mins`} ago
          </p>

          {/* Disclaimer */}
          <p className="font-inter text-xs italic text-ink-mute mt-1.5">
            Coverage is broad across free wires and official agencies — no single aggregator sees every story.
          </p>

          {/* Coverage panel */}
          {coverageOpen && (
            <div id="coverage-panel">
              <CoveragePanel sources={sourcesStatus} />
            </div>
          )}
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Filter bar                                                        */}
        {/* ---------------------------------------------------------------- */}
        <div className="mb-6 space-y-3">
          {/* Row 1: Region + Language + Time range + Sort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Region */}
            <div className="flex gap-1" role="group" aria-label="Filter by region">
              {(['ALL', 'INDIA', 'WORLD'] as Region[]).map((r) => (
                <Pill key={r} active={region === r} onClick={() => setRegion(r)}>
                  {r}
                </Pill>
              ))}
            </div>

            <div className="w-px h-5 bg-rule mx-1 hidden sm:block" aria-hidden="true" />

            {/* Language */}
            <div className="flex gap-1" role="group" aria-label="Filter by language">
              {(['EN', 'HI'] as Language[]).map((l) => (
                <Pill key={l} active={language === l} onClick={() => setLanguage(l)}>
                  {l}
                </Pill>
              ))}
            </div>

            <div className="w-px h-5 bg-rule mx-1 hidden sm:block" aria-hidden="true" />

            {/* Time range */}
            <div className="flex gap-1" role="group" aria-label="Filter by time range">
              {(['1h', '6h', '24h', '3d'] as TimeRange[]).map((t) => (
                <Pill key={t} active={timeRange === t} onClick={() => setTimeRange(t)}>
                  {t}
                </Pill>
              ))}
            </div>

            <div className="w-px h-5 bg-rule mx-1 hidden sm:block" aria-hidden="true" />

            {/* Sort */}
            <div className="flex gap-1" role="group" aria-label="Sort order">
              {([
                { value: 'newest', label: 'Newest' },
                { value: 'most-covered', label: 'Most Covered' },
              ] as { value: SortOrder; label: string }[]).map((s) => (
                <Pill
                  key={s.value}
                  active={sortOrder === s.value}
                  onClick={() => setSortOrder(s.value)}
                >
                  {s.label}
                </Pill>
              ))}
            </div>
          </div>

          {/* Row 2: Category chips (scrollable) */}
          <div
            className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none"
            role="group"
            aria-label="Filter by category"
          >
            {categories.map((cat) => (
              <Pill key={cat} active={category === cat} onClick={() => setCategory(cat)}>
                {cat}
              </Pill>
            ))}
          </div>

          {/* Row 3: Search */}
          <div className="relative max-w-sm">
            <label htmlFor="wire-search" className="sr-only">
              Search stories
            </label>
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-mute pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="wire-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories or outlets…"
              className="w-full bg-paper border border-rule rounded-[2px] pl-8 pr-16 py-1.5 font-mono text-xs text-ink placeholder:text-ink-mute focus:outline-none focus:border-orange transition-colors"
            />
            <span
              className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-mute select-none hidden sm:block"
              aria-hidden="true"
            >
              ⌘K
            </span>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Feed                                                              */}
        {/* ---------------------------------------------------------------- */}
        <main
          id="wire-feed"
          aria-label="Live news feed"
          className="focus:outline-none"
          tabIndex={-1}
        >
          {loading ? (
            <div className="divide-y divide-rule border-b border-rule">
              <WireStorySkeleton />
              <WireStorySkeleton />
              <WireStorySkeleton />
              <WireStorySkeleton />
              <WireStorySkeleton />
            </div>
          ) : stories.length === 0 ? (
            <div className="py-16 text-center border border-rule bg-paper rounded-[2px] p-8 my-6">
              <p className="font-fraunces text-2xl text-ink mb-2">No recent stories found</p>
              <p className="font-mono text-xs text-ink-mute max-w-md mx-auto">
                No articles matched {region !== 'ALL' ? `${region} · ` : ''}{category} in the last {timeRange}. Try broadening your filters or clicking &quot;Refresh&quot; above.
              </p>
              <button
                type="button"
                onClick={() => {
                  setRegion('ALL');
                  setCategory('All');
                  setTimeRange('24h');
                  setSearchQuery('');
                }}
                className="mt-4 font-mono text-xs uppercase px-3 py-1.5 bg-orange text-paper rounded-[2px] hover:bg-orange-deep transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div>
              {stories.map((story, i) => (
                <ScrollReveal key={story.id} delayMs={Math.min(i * 30, 300)}>
                  <StoryRow story={story} />
                </ScrollReveal>
              ))}
            </div>
          )}

          {/* Load older stories */}
          {!loading && nextCursor && (
            <div className="mt-6 pb-8 border-t border-rule pt-4 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="font-mono text-xs text-ink border border-rule px-5 py-2.5 rounded-[2px] hover:border-orange hover:text-orange transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? 'Loading older stories…' : 'Load older stories'}
              </button>
            </div>
          )}
        </main>

        {/* ---------------------------------------------------------------- */}
        {/* New stories pill + toast                                          */}
        {/* ---------------------------------------------------------------- */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
        >
          {/* Toast */}
          {toastMsg && (
            <div className="flex items-center gap-2 bg-ink text-paper font-mono text-xs px-3 py-2 rounded-[2px] shadow-md max-w-xs animate-in fade-in slide-in-from-bottom-2">
              <span>{toastMsg}</span>
              <button
                type="button"
                onClick={() => setToastMsg(null)}
                className="text-paper/60 hover:text-paper transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Sticky New Stories Pill */}
          {pendingNewStories.length > 0 && (
            <button
              type="button"
              onClick={handleInsertNewStories}
              className="bg-orange text-paper font-fraunces text-sm px-4 py-2.5 rounded-[2px] shadow-lg hover:bg-orange-deep transition-all flex items-center gap-2 cursor-pointer transform hover:scale-105 active:scale-95 animate-bounce"
            >
              ↑ {pendingNewStories.length} new {pendingNewStories.length === 1 ? 'story' : 'stories'}
            </button>
          )}
        </div>
      </AppShell>
    </>
  );
}
