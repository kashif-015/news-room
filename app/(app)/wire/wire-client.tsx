'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, ChevronUp, ExternalLink, X } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { ScrollReveal } from '@/components/layout/scroll-reveal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WireStats {
  sourceCount: number;
  storiesLast24h: number;
  lastCheckedMin: number;
}

interface WireClientProps {
  stats: WireStats;
  isBreaking?: boolean;
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
// Mock data
// ---------------------------------------------------------------------------

interface MockSource {
  name: string;
  status: 'ok' | 'slow' | 'failing';
  lastFetchedMin: number;
}

const MOCK_SOURCES: MockSource[] = [
  { name: 'The Hindu', status: 'ok', lastFetchedMin: 2 },
  { name: 'NDTV', status: 'ok', lastFetchedMin: 3 },
  { name: 'Indian Express', status: 'slow', lastFetchedMin: 11 },
  { name: 'Times of India', status: 'ok', lastFetchedMin: 4 },
  { name: 'Reuters', status: 'ok', lastFetchedMin: 1 },
  { name: 'Al Jazeera', status: 'failing', lastFetchedMin: 38 },
];

const COVERED_OUTLETS = ['The Hindu', 'NDTV', 'Indian Express', 'Times of India', 'Reuters', 'Al Jazeera', 'Mint', 'Business Standard', 'The Wire', 'Scroll'];

interface MockStory {
  id: string;
  region: 'INDIA' | 'WORLD';
  category: Category;
  dateline: string;
  headline: string;
  snippet: string;
  coveredBy: number;
  outlets: string[];
  minsAgo: number;
  isBreaking?: boolean;
  url: string;
}

const MOCK_STORIES: MockStory[] = [
  {
    id: 's1',
    region: 'INDIA',
    category: 'Politics',
    dateline: 'THE HINDU · INDIA · POLITICS',
    headline:
      'Parliament session: Winter session begins amid opposition walkout over prices and unemployment',
    snippet:
      'Opposition members staged a walkout on the opening day of the winter session, demanding a discussion on rising food prices and unemployment figures released last week.',
    coveredBy: 8,
    outlets: COVERED_OUTLETS.slice(0, 8),
    minsAgo: 12,
    url: 'https://news.google.com/search?q=Parliament+winter+session+opposition+walkout+India&hl=en-IN&gl=IN&ceid=IN:en',
  },
  {
    id: 's2',
    region: 'INDIA',
    category: 'Business',
    dateline: 'MINT · INDIA · BUSINESS',
    headline:
      'RBI holds repo rate at 6.5% for seventh consecutive time amid easing inflation',
    snippet:
      'The Monetary Policy Committee voted unanimously to keep the benchmark rate unchanged, citing moderating retail inflation and steady GDP growth projections for FY25.',
    coveredBy: 12,
    outlets: COVERED_OUTLETS.slice(0, 10),
    minsAgo: 28,
    isBreaking: true,
    url: 'https://news.google.com/search?q=RBI+repo+rate+unchanged+MPC+India&hl=en-IN&gl=IN&ceid=IN:en',
  },
  {
    id: 's3',
    region: 'WORLD',
    category: 'Tech',
    dateline: 'REUTERS · WORLD · TECH',
    headline:
      'OpenAI announces GPT-5 Turbo with real-time reasoning; Microsoft expanding access to enterprise customers',
    snippet:
      "OpenAI's latest model demonstrates significant gains in multi-step reasoning tasks and reduces response latency by 40%, according to internal benchmarks released Tuesday.",
    coveredBy: 6,
    outlets: COVERED_OUTLETS.slice(0, 6),
    minsAgo: 45,
    url: 'https://news.google.com/search?q=OpenAI+GPT-5+Turbo+announcement&hl=en&gl=US&ceid=US:en',
  },
  {
    id: 's4',
    region: 'INDIA',
    category: 'Sports',
    dateline: 'NDTV SPORTS · INDIA · SPORTS',
    headline:
      'India vs Australia Test series: Rohit Sharma century puts India in strong position on Day 2',
    snippet:
      "Captain Rohit Sharma's unbeaten 108 guided India to 324/4 at stumps on Day 2, putting the hosts in a commanding position heading into tomorrow's play at the Gabba.",
    coveredBy: 5,
    outlets: COVERED_OUTLETS.slice(0, 5),
    minsAgo: 67,
    url: 'https://news.google.com/search?q=India+Australia+Test+Rohit+Sharma+century&hl=en-IN&gl=IN&ceid=IN:en',
  },
  {
    id: 's5',
    region: 'WORLD',
    category: 'Politics',
    dateline: 'AL JAZEERA · WORLD · POLITICS',
    headline:
      'UN Security Council emergency session called on Middle East ceasefire resolution',
    snippet:
      'The United States and France jointly requested the emergency session after a fresh escalation over the weekend. Envoys are set to present a revised ceasefire text this afternoon.',
    coveredBy: 9,
    outlets: COVERED_OUTLETS.slice(0, 9),
    minsAgo: 93,
    url: 'https://news.google.com/search?q=UN+Security+Council+Middle+East+ceasefire&hl=en&gl=US&ceid=US:en',
  },
  {
    id: 's6',
    region: 'INDIA',
    category: 'Health',
    dateline: 'THE WIRE · INDIA · HEALTH',
    headline:
      'WHO approves new malaria vaccine for high-burden countries; India among first recipients',
    snippet:
      "The R21/Matrix-M vaccine has shown 77% efficacy in Phase 3 trials. India's health ministry confirmed it will begin rollout in high-endemic districts by Q1 next year.",
    coveredBy: 4,
    outlets: COVERED_OUTLETS.slice(0, 4),
    minsAgo: 142,
    url: 'https://news.google.com/search?q=WHO+malaria+vaccine+R21+India&hl=en-IN&gl=IN&ceid=IN:en',
  },
];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function formatMinsAgo(mins: number): string {
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h ago` : `${h}h ${m}m ago`;
}

// ---------------------------------------------------------------------------
// Status dot
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: 'ok' | 'slow' | 'failing' }) {
  const color =
    status === 'ok'
      ? 'bg-pine'
      : status === 'slow'
        ? 'bg-orange'
        : 'bg-alert';
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${color}`}
      aria-hidden="true"
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
      className={`px-3 py-1 font-mono text-xs uppercase tracking-wider rounded-[2px] transition-colors whitespace-nowrap ${
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
// Coverage panel
// ---------------------------------------------------------------------------

function CoveragePanel() {
  return (
    <div className="border border-rule rounded-[2px] bg-paper p-4 mt-3">
      <h2 className="font-mono text-xs uppercase tracking-widest text-ink-mute mb-3">
        Source Coverage
      </h2>
      <ul className="space-y-2">
        {MOCK_SOURCES.map((src) => (
          <li key={src.name} className="flex items-center gap-2">
            <StatusDot status={src.status} />
            <span className="font-inter text-sm text-ink flex-1">{src.name}</span>
            <span className="font-mono text-[11px] text-ink-mute">
              {formatMinsAgo(src.lastFetchedMin)}
            </span>
          </li>
        ))}
      </ul>
      <p className="font-mono text-[10px] text-ink-mute mt-3 pt-3 border-t border-rule">
        Full list available after setup.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story row
// ---------------------------------------------------------------------------

function StoryRow({ story }: { story: MockStory }) {
  const [outletsOpen, setOutletsOpen] = useState(false);

  return (
    <article
      role="article"
      className="group relative py-4 px-0 border-t border-rule border-l-2 border-l-transparent hover:border-l-orange transition-colors duration-150"
    >
      {/* Dateline */}
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-mute mb-1">
        {story.dateline} · {formatMinsAgo(story.minsAgo)}
      </p>

      {/* Headline */}
      <h3 className="font-fraunces text-[20px] leading-7 text-ink mb-1.5">
        {story.headline}
      </h3>

      {/* Snippet */}
      <p className="font-inter text-sm text-ink-soft mb-3 max-w-[72ch]">
        {story.snippet.length > 300 ? story.snippet.slice(0, 300) + '…' : story.snippet}
      </p>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <button
          type="button"
          onClick={() => setOutletsOpen((o) => !o)}
          className="font-mono text-xs text-orange hover:text-orange-deep transition-colors flex items-center gap-1"
          aria-expanded={outletsOpen}
        >
          Covered by {story.coveredBy} outlets
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
        <ul className="mt-2 ml-2 space-y-0.5">
          {story.outlets.map((outlet) => (
            <li key={outlet} className="font-mono text-[11px] text-ink-mute">
              — {outlet}
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

function BreakingBand({ headline }: { headline: string }) {
  return (
    <div
      className="bg-orange text-paper py-2 px-4 font-mono text-xs uppercase tracking-wider flex items-center gap-2"
      role="alert"
      aria-live="assertive"
    >
      <span className="inline-block w-2 h-2 rounded-full bg-paper animate-pulse" aria-hidden="true" />
      BREAKING — {headline} covered by 7 outlets
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export function WireClient({ stats, isBreaking = false }: WireClientProps) {
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [region, setRegion] = useState<Region>('ALL');
  const [category, setCategory] = useState<Category>('All');
  const [language, setLanguage] = useState<Language>('EN');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const NEW_STORIES_COUNT = 12;

  // Tab title with unread count
  useEffect(() => {
    document.title = `(${NEW_STORIES_COUNT}) Live Wire · Latest News`;
    return () => {
      document.title = 'Live Wire · Latest News';
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMsg(null), 3500);
  };

  // Filtered stories
  const visibleStories = MOCK_STORIES.filter((story) => {
    if (region !== 'ALL' && story.region !== region) return false;
    if (category !== 'All' && story.category !== category) return false;
    if (
      searchQuery.trim() &&
      !story.headline.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !story.snippet.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

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

      <AppShell>
        {/* Breaking band (shown when isBreaking) */}
        {isBreaking && (
          <BreakingBand headline="RBI holds repo rate at 6.5% for seventh consecutive time" />
        )}

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

            {/* Coverage button */}
            <button
              type="button"
              onClick={() => setCoverageOpen((o) => !o)}
              className="font-mono text-xs uppercase tracking-wider px-3 py-1 border border-rule rounded-[2px] text-ink-mute hover:border-ink-soft transition-colors flex items-center gap-1.5 self-start mt-1"
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

          {/* Stats bar */}
          <p className="font-mono text-[11px] text-ink-mute mt-2">
            {stats.sourceCount} sources tracked · {stats.storiesLast24h} stories in the last 24h ·{' '}
            Last checked {stats.lastCheckedMin} min ago
          </p>

          {/* Disclaimer */}
          <p className="font-inter text-xs italic text-ink-mute mt-1.5">
            Coverage is broad but not exhaustive — no aggregator sees every story.
          </p>

          {/* Coverage panel */}
          {coverageOpen && (
            <div id="coverage-panel">
              <CoveragePanel />
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
              placeholder="Search stories…"
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
          {visibleStories.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-fraunces text-xl text-ink-mute">No stories match your filters.</p>
              <p className="font-mono text-xs text-ink-mute mt-2">
                Try adjusting the region, category, or search query.
              </p>
            </div>
          ) : (
            <div>
              {visibleStories.map((story, i) => (
                <ScrollReveal key={story.id} delayMs={i * 40}>
                  <StoryRow story={story} />
                </ScrollReveal>
              ))}
            </div>
          )}

          {/* Load older stories */}
          {visibleStories.length > 0 && (
            <div className="mt-4 pb-8 border-t border-rule pt-4">
              <button
                type="button"
                className="font-mono text-xs text-ink-mute border border-rule px-4 py-2 rounded-[2px] hover:border-orange hover:text-orange transition-colors"
              >
                Load older stories
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
            <div className="flex items-center gap-2 bg-ink text-paper font-mono text-xs px-3 py-2 rounded-[2px] shadow-md max-w-xs">
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

          {/* Pill */}
          <button
            type="button"
            onClick={() => showToast('Will scroll to new stories when live.')}
            className="bg-orange text-paper font-fraunces text-sm px-4 py-2 rounded-[2px] shadow-md hover:bg-orange-deep transition-colors flex items-center gap-2"
          >
            ↑ {NEW_STORIES_COUNT} new stories
          </button>
        </div>
      </AppShell>
    </>
  );
}
