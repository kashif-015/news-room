# ARCHITECTURE: NewsDesk (working name)

Read `PRD.md` first for what to build and `DESIGN.md` for how it should look. This file says how to build it.

---

## 1. Principles

1. **Server holds every secret.** The browser never sees an API key, a database key or a service token.
2. **Fetch once, store, reuse.** External APIs are called by scheduled jobs or on explicit user actions, never on every page view.
3. **Free tier first.** Every choice must work on free plans. Add caching and fallbacks so limits are not hit.
4. **Fail softly.** If one provider fails (news, AI, memes), the rest of the app keeps working and shows a clear message.
5. **Single user.** Keep it simple. No roles, no teams.

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) with TypeScript |
| Styling | Tailwind CSS with custom tokens from `DESIGN.md`. Do not leave shadcn/ui default styles unmodified |
| Database | Supabase Postgres (free tier), accessed **only from the server** |
| Hosting | Vercel (hobby plan) |
| Scheduler | GitHub Actions cron calling a protected endpoint (Vercel hobby cron is too infrequent) |
| AI | Gemini API (primary), OpenRouter free model (fallback) |
| RSS | `rss-parser` |
| Article extraction | `@mozilla/readability` with `jsdom` |
| Image export | `html-to-image`, run in the browser |
| Validation | `zod` |
| Session | `jose` for signed cookie |

## 3. Environment file (required)

Create **`.env.local`** for local development and add the same variables in the Vercel project settings for production. Also create **`.env.example`** with the same names and empty values, and commit only that file. Add `.env*` (except `.env.example`) to `.gitignore`.

**Rules for the AI building this:**
- Do **not** prefix any variable with `NEXT_PUBLIC_`. There must be no public environment variables at all.
- Read variables only in server code: route handlers, server components, server actions and `lib/server/*`.
- Never import a server module into a client component. Mark server-only files with `import "server-only"`.
- Validate all variables at startup in `lib/server/env.ts` using zod. If a required variable is missing, throw a clear error naming it. Optional providers are skipped gracefully when their key is empty.
- Never log key values.

```bash
# .env.example

# --- App security (required) ---
APP_PASSWORD=
SESSION_SECRET=            # random 32+ character string
CRON_SECRET=               # random string; cron endpoint requires it

# --- Database (required) ---
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY= # server only; never expose

# --- AI (Gemini required; OpenRouter optional fallback) ---
GEMINI_API_KEY=
GEMINI_MODEL=              # a free-tier Flash or Flash-Lite model name, check Google AI Studio
OPENROUTER_API_KEY=
OPENROUTER_MODEL=          # a free model id from OpenRouter

# --- News (all optional; RSS needs no key) ---
GNEWS_API_KEY=
NEWSDATA_API_KEY=

# --- Memes, GIFs, images (all optional) ---
IMGFLIP_USERNAME=          # only needed if you later generate captioned memes
IMGFLIP_PASSWORD=
GIPHY_API_KEY=
PEXELS_API_KEY=
UNSPLASH_ACCESS_KEY=

# --- Video (optional) ---
YOUTUBE_API_KEY=

# --- Alerts (Phase 2, optional) ---
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# --- Config ---
APP_URL=                   # e.g. http://localhost:3000 or the Vercel URL
```

Because all Supabase access goes through the server with the service role key, also enable **Row Level Security with no public policies** on every table, so the database stays closed even if a key leaks elsewhere.

GitHub Actions needs its own repository secrets: `CRON_SECRET` and `APP_URL`.

## 4. Folder structure

```
/app
  /(auth)/login/page.tsx
  /(app)/layout.tsx               # shell: nav, custom cursor, theme
  /(app)/page.tsx                 # feed
  /(app)/story/[id]/page.tsx      # story workspace
  /(app)/drafts/page.tsx
  /(app)/drafts/[id]/page.tsx     # editor + designer
  /(app)/style/page.tsx           # style library
  /(app)/sources/page.tsx         # source manager
  /(app)/log/page.tsx             # performance log (Phase 2)
  /api
    /auth/login/route.ts
    /auth/logout/route.ts
    /cron/ingest/route.ts         # protected by CRON_SECRET
    /stories/route.ts             # list + filters
    /stories/[id]/route.ts
    /stories/[id]/article/route.ts   # fetch + extract article text, tweet links
    /tweets/route.ts              # save pasted tweet link (oEmbed)
    /memes/search/route.ts
    /gifs/search/route.ts
    /images/search/route.ts
    /generate/route.ts            # post generator
    /drafts/route.ts
    /drafts/[id]/route.ts
    /style-examples/route.ts
    /sources/route.ts
/components                       # UI only, no secrets
/lib
  /server                         # server-only code
    env.ts
    db.ts                         # Supabase client (service role)
    auth.ts
    ai/index.ts                   # provider interface + fallback
    ai/gemini.ts
    ai/openrouter.ts
    ai/prompt.ts
    ai/checks.ts                  # blocklist and format checks
    ingest/rss.ts
    ingest/gnews.ts
    ingest/newsdata.ts
    ingest/cluster.ts
    article/extract.ts
    tweets/oembed.ts
    media/imgflip.ts
    media/giphy.ts
    media/pexels.ts
    media/unsplash.ts
  /shared                         # types, zod schemas, constants (no secrets)
/middleware.ts                    # session check on all routes except login and cron
/supabase/migrations
/.github/workflows/ingest.yml
```

## 5. Authentication

- `POST /api/auth/login` compares the submitted password to `APP_PASSWORD` using a constant-time comparison, then sets an `httpOnly`, `secure`, `sameSite=lax` cookie containing a JWT signed with `SESSION_SECRET` (30 day expiry).
- `middleware.ts` verifies the cookie on every request except `/login`, `/api/auth/login` and `/api/cron/*`.
- `/api/cron/*` requires the header `Authorization: Bearer <CRON_SECRET>`.
- Add a simple rate limit on the login route (for example 5 attempts per 10 minutes per IP, stored in the database).

## 6. Database schema

Run as a Supabase migration. Enable the `pg_trgm` extension.

```sql
create extension if not exists pg_trgm;

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

create table clusters (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  outlet_count int not null default 1,
  trend_score numeric not null default 0,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

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

create table article_text (
  article_id uuid primary key references articles(id) on delete cascade,
  text_content text not null,
  fetched_at timestamptz not null default now()
);

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

create table style_examples (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('headline','caption')),
  language text not null default 'en' check (language in ('en','hinglish')),
  body text not null,
  note text,
  created_at timestamptz not null default now()
);

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

create table post_log (
  draft_id uuid primary key references drafts(id) on delete cascade,
  likes int, comments int, saves int, shares int, reach int,
  logged_at timestamptz not null default now()
);

create table generation_cache (
  cache_key text primary key,
  output jsonb not null,
  provider text,
  created_at timestamptz not null default now()
);

create table api_usage (
  day date not null,
  provider text not null,
  count int not null default 0,
  primary key (day, provider)
);

create table login_attempts (
  ip text not null,
  attempted_at timestamptz not null default now()
);

-- Row Level Security on, no policies: only the service role (server) can access
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
```

Seed `sources` with about 15 starter RSS feeds (general Indian news, tech, business, sports, world). Use feed URLs that the builder verifies are live at build time. Do not hard-code URLs from memory without checking them.

## 7. Ingestion pipeline

Triggered by `GET /api/cron/ingest` (with the bearer secret), called every 30 minutes by GitHub Actions.

```yaml
# .github/workflows/ingest.yml
name: ingest
on:
  schedule:
    - cron: "*/30 * * * *"
  workflow_dispatch:
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - run: >
          curl -fsS -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
          "${{ secrets.APP_URL }}/api/cron/ingest"
```

Steps inside the endpoint:

1. Load active sources. Process a limited batch per run (for example 8 sources, oldest `last_fetched_at` first) so the function finishes within serverless time limits. Use a per-source timeout of about 8 seconds and fetch sources in parallel with a small concurrency limit.
2. For RSS sources, parse the feed with `rss-parser`. Extract title, link, published date, summary (plain text, trimmed to about 300 characters) and image (media or enclosure tag if present).
3. For API sources (GNews, NewsData), call the API only if the key exists and the daily counter in `api_usage` is below a safe limit set in code. Increment the counter.
4. Normalise: `title_norm` is lowercase with punctuation and extra spaces removed. Canonicalise URLs (strip tracking parameters such as `utm_*`).
5. Insert with `on conflict (url) do nothing`.
6. **Cluster** each new article:
   - Find articles from the last 48 hours where `similarity(title_norm, new.title_norm) > 0.5` (tune after testing), using `pg_trgm`.
   - If a match has a cluster, join it; otherwise create a cluster with both articles.
   - Update the cluster's `outlet_count` (distinct outlets) and `trend_score` = `outlet_count` weighted by recency, for example `outlet_count * exp(-hours_since_last_seen / 12)`.
7. Delete articles older than 14 days that are not attached to a draft (keeps the database small on the free tier).
8. Update `last_fetched_at` or `last_error` on each source.
9. Return a JSON summary: sources processed, new articles, errors.

## 8. Post generation

`POST /api/generate` with `{ articleId, language, mode }`.

**Flow**
1. Load the article text. If it is not stored yet, fetch it (section 9) and store it.
2. Load up to 8 style examples (random mix, matching the requested language).
3. Build a cache key from `articleId + language + mode + hash(examples)`. Return the cached output if present.
4. Call the AI service (Gemini first). On rate-limit or error, retry once, then fall back to OpenRouter. Record usage in `api_usage`.
5. Parse the response as JSON and validate it with zod.
6. Run the checks in `lib/server/ai/checks.ts`: blocklist, em dashes, emoji count, exclamation marks, word counts, and fact-table completeness. If a check fails, retry with the failures listed in the prompt (max 2 retries).
7. Save to `generation_cache` and return.

**Prompt structure** (in `lib/server/ai/prompt.ts`, versioned in code):
- Role: "You write Instagram news posts for an Indian audience, in the voice shown in the examples."
- Voice and accuracy rules copied from `PRD.md`, section 7, including the full blocklist.
- The style examples, clearly labelled as "the creator's own writing; match its rhythm and word choice".
- The article text, labelled as the **only** allowed source of facts.
- Output schema:

```json
{
  "headlines": [{ "angle": "blunt|question|number|hinglish|short", "text": "" }],
  "caption": "",
  "hashtags": [""],
  "facts": [{ "claim": "", "source_sentence": "" }],
  "thin_source_warning": ""
}
```

- Instruction: respond with JSON only. Each claim in the caption must appear in `facts` with the exact supporting sentence copied from the article. If no supporting sentence exists, remove the claim from the caption.
- Use a moderate temperature so that wording varies between regenerations.

**Limits:** AI calls only happen when the user clicks a button. Keep a daily counter and show remaining capacity in the UI. If both providers fail, show "Couldn't generate right now. Your draft is saved. Try again in a minute."

**Provider interface**

```ts
export interface AiProvider {
  name: string;
  generateJson(input: { system: string; user: string }): Promise<unknown>;
}
```

Model names come from env vars so they can be changed without code edits.

## 9. Article extraction and tweets

`POST /api/stories/[id]/article`

1. If `article_text` exists, return it.
2. Fetch the article URL server-side with a clear User-Agent, a 10 second timeout and a size limit (about 2 MB). Reject non-HTML responses and private/local IP addresses (basic SSRF protection).
3. Run Readability on the HTML to get the main text. Store it in `article_text`.
4. Scan the raw HTML for tweet URLs with a regex like `https?://(?:twitter|x)\.com/[A-Za-z0-9_]+/status/\d+`, dedupe them, and for each one call oEmbed. Store results in `tweets` with `added_by = 'auto'`.
5. Return text, tweets and extraction status. If extraction fails (paywall, block), return the RSS summary and a message saying the full text could not be read.

`POST /api/tweets` with `{ url }`: validate it is an X/Twitter status URL, call `https://publish.twitter.com/oembed?url=...&omit_script=1`, store the result with `added_by = 'manual'`. The frontend renders `embed_html` using X's widget script loaded on the client, which carries no secret. If the embed fails, show the link and the stored handle.

"Search on X" is a plain link built on the frontend from AI-suggested keywords. It needs no API.

## 10. Media endpoints

All are thin server proxies so keys stay private. Each validates the query, calls the provider, returns a small normalised shape (`id, title, thumbUrl, fullUrl, credit, creditUrl, provider`), and caches results in memory or in the database for about 1 hour.

- `/api/memes/search`: Imgflip `get_memes` (no key needed), filtered by name on the server.
- `/api/gifs/search`: Giphy search.
- `/api/images/search`: Pexels, with Unsplash as fallback.
- Always carry credit information through to the UI.

If a provider key is missing or the call fails, return an empty list with a `warning` field. Do not throw.

## 11. Post designer and export

- Templates are React components rendering at a fixed design size (1080x1350 or 1080x1080) and scaled down with CSS transforms for the preview.
- Export uses `html-to-image` (`toPng`) on the unscaled node, with `pixelRatio: 1`, so the file is exactly the target size. Wait for fonts to load (`document.fonts.ready`) before exporting.
- Background images come from the proxy endpoint. To keep the canvas from being blocked by cross-origin rules, fetch the image through a server route (`/api/images/proxy?url=...`) that checks the host against an allowlist (Pexels, Unsplash, and user uploads) and streams it back.
- Text fitting: use a function that shrinks font size in steps until the text fits the box, with a minimum size and a warning if it still overflows.

## 12. Security checklist

- No `NEXT_PUBLIC_` variables. No secrets in client bundles. Check the production build output for key strings before deploying.
- `import "server-only"` in every module under `lib/server`.
- All route handlers validate input with zod and return generic error messages (log details server-side only).
- SSRF protection on any route that fetches a user-supplied URL: allow only `http`/`https`, block private IP ranges and `localhost`, limit redirects.
- Sanitize `embed_html` before rendering (allow only the blockquote and anchor markup that X returns) or render tweets through the official widget loader.
- Security headers via `next.config`: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and a Content Security Policy that allows X's widget script and the image hosts in use.
- Never commit `.env.local`. Add a pre-commit check or a README warning.

## 13. Performance and free-tier safety

- Paginate the feed (30 per page) with cursor pagination.
- Index columns used in filters (see schema).
- Cache AI outputs and media search results.
- Keep every serverless function short. Heavy jobs run in small batches.
- A `/settings` section shows daily API usage per provider from `api_usage`, so the user can see how close each is to its limit.

## 14. Error handling and logging

- Wrap each external call in a helper with timeout, one retry, and structured error results.
- Source-level errors are saved to `sources.last_error` and shown in the source manager.
- The UI shows plain-language errors next to the failing section, never a blank page.

## 15. Testing

- Unit tests for: URL canonicalisation, title normalisation, blocklist/format checks, tweet URL regex, SSRF guard.
- A script to run ingestion against two sample feeds and print results.
- A manual checklist before release: login works, cron endpoint rejects bad secrets, a missing optional key does not crash anything, export size is exact, mobile layout works.

## 16. Deployment steps

1. Create a Supabase project and run the migration.
2. Create the Vercel project from the Git repo and add every environment variable from section 3.
3. Add `CRON_SECRET` and `APP_URL` to the GitHub repository secrets.
4. Deploy, log in, add the style examples, and trigger the ingest workflow once manually to confirm it works.
