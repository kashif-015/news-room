-- NewsDesk: Initial database schema
-- Run as a Supabase migration. Enables pg_trgm for article title similarity matching.

create extension if not exists pg_trgm;

-- ============================================================================
-- SOURCES: RSS feeds and API query sources
-- ============================================================================
create table sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('rss','gnews','newsdata')),
  url text,                      -- RSS url, or query for API sources
  category text,
  active boolean not null default true,
  last_fetched_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- CLUSTERS: Groups of articles about the same event
-- ============================================================================
create table clusters (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  outlet_count int not null default 1,
  trend_score numeric not null default 0,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

-- ============================================================================
-- ARTICLES: Individual news items from any source
-- ============================================================================
create table articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete set null,
  cluster_id uuid references clusters(id) on delete set null,
  title text not null,
  title_norm text not null,       -- lowercased, punctuation stripped
  url text not null unique,
  outlet text,
  summary text,
  image_url text,
  category text,
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  used boolean not null default false
);
create index articles_title_trgm on articles using gin (title_norm gin_trgm_ops);
create index articles_published on articles (published_at desc);
create index articles_cluster on articles (cluster_id);

-- ============================================================================
-- ARTICLE_TEXT: Full extracted article content (fetched on demand)
-- ============================================================================
create table article_text (
  article_id uuid primary key references articles(id) on delete cascade,
  text_content text not null,
  fetched_at timestamptz not null default now()
);

-- ============================================================================
-- TWEETS: Saved tweet references (auto-extracted or manually pasted)
-- ============================================================================
create table tweets (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references articles(id) on delete cascade,
  cluster_id uuid references clusters(id) on delete set null,
  tweet_url text not null unique,
  author_handle text,
  author_name text,
  embed_html text,
  added_by text not null check (added_by in ('auto','manual')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- STYLE_EXAMPLES: Creator's own past headlines and captions for voice matching
-- ============================================================================
create table style_examples (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('headline','caption')),
  language text not null default 'en' check (language in ('en','hinglish')),
  body text not null,
  note text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- DRAFTS: Working posts with headline options, caption, facts
-- ============================================================================
create table drafts (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references articles(id) on delete set null,
  headline_options jsonb,         -- array of {angle, text}
  headline text,
  caption text,
  hashtags text[],
  fact_table jsonb,               -- array of {claim, source_sentence, supported}
  language text not null default 'en',
  template_id text,
  design_config jsonb,
  source_url text not null,
  source_outlet text,
  outcome text check (outcome in ('used_as_is','edited','discarded')),
  status text not null default 'draft' check (status in ('draft','posted')),
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- POST_LOG: Performance metrics logged after posting (Phase 2)
-- ============================================================================
create table post_log (
  draft_id uuid primary key references drafts(id) on delete cascade,
  likes int, comments int, saves int, shares int, reach int,
  logged_at timestamptz not null default now()
);

-- ============================================================================
-- GENERATION_CACHE: Cached AI generation outputs
-- ============================================================================
create table generation_cache (
  cache_key text primary key,
  output jsonb not null,
  provider text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- API_USAGE: Daily counters per provider to stay within free-tier limits
-- ============================================================================
create table api_usage (
  day date not null,
  provider text not null,
  count int not null default 0,
  primary key (day, provider)
);

-- ============================================================================
-- LOGIN_ATTEMPTS: Rate limiting for the login endpoint
-- ============================================================================
create table login_attempts (
  ip text not null,
  attempted_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY: Enabled with no policies, so only service role can access
-- ============================================================================
alter table sources enable row level security;
alter table clusters enable row level security;
alter table articles enable row level security;
alter table article_text enable row level security;
alter table tweets enable row level security;
alter table style_examples enable row level security;
alter table drafts enable row level security;
alter table post_log enable row level security;
alter table generation_cache enable row level security;
alter table api_usage enable row level security;
alter table login_attempts enable row level security;
