# PRD: NewsDesk (working name)

A private web tool for an Instagram news creator. It finds stories, helps verify them, finds related tweets and memes, writes human-sounding headlines and captions, and exports a ready-to-post image.

> **Instructions for the AI building this:** Read `PRD.md`, `ARCHITECTURE.md` and `DESIGN.md` fully before writing any code. Build in the order given in section 9. Do not invent features, APIs or paid services that are not listed. Everything must run on free tiers. All secrets live in a server-side `.env.local` file (see `ARCHITECTURE.md`). No secret may ever reach the browser.

---

## 1. Problem

The creator posts news on Instagram and spends too long on three things:

1. Finding good stories and checking them against other sources.
2. Writing headlines and captions that sound like a person, not like AI.
3. Collecting related tweets and memes, then turning everything into a post image.

## 2. Goal

Cut the time from "I need a post" to "post is ready to upload" to under 10 minutes, without lowering accuracy or originality.

## 3. User

One user: the creator (single-user app, no public signup). Works mostly on a phone and a laptop. Writes in English and Hinglish. Audience is Indian.

## 4. Constraints

- **Free only.** Free tiers of APIs, hosting and database. No paid plan may be required to run the app.
- **No frontend secrets.** All API keys are read on the server from environment variables.
- **No auto-posting** to Instagram. The user posts manually.
- **Copyright-safe.** The app summarises in original words, always stores and shows the source link, and never copies article text or images into a post.

## 5. Non-goals

- Public accounts, multi-user teams or billing.
- Auto-posting to Instagram.
- Scraping X or Instagram.
- Video editing.

---

## 6. Features

### 6.1 MVP (Phase 1)

#### F1. News feed
- Pulls stories from RSS feeds (primary) and GNews / NewsData.io (backup search).
- Cards show: headline, source, time ago, category, a one-line summary, and how many outlets cover it.
- Filters: category, source, time range (last 3h / 12h / 24h / 3 days), "not yet used".
- Sorted by trend score (see F3), with a toggle for "newest first".
- Refreshes automatically on a schedule; a manual "Refresh now" button exists.
- **Acceptance:** a fresh story from a configured feed appears within 30 minutes of publication.

#### F2. Source manager
- Add, disable and categorise RSS feeds from a settings page.
- Ships with a starter list of about 15 Indian and global feeds (editable).
- **Acceptance:** adding a valid RSS URL fetches its stories on the next run; an invalid URL shows a clear error.

#### F3. Related coverage and trend score
- Stories about the same event are grouped into one cluster.
- The cluster page lists every outlet covering it, with links.
- Trend score = number of distinct outlets in the cluster, weighted by recency.
- **Acceptance:** two articles with near-identical headlines from different outlets end up in one cluster.

#### F4. Story workspace
Opens when a story is selected. Shows:
- Readable article text (fetched on demand, extracted with Readability) and the original link.
- Related coverage from the same cluster.
- Related tweets (F5), memes (F6), and related YouTube videos (optional).
- A "Create post" button.

#### F5. Related tweets (free methods only)
1. **Auto-extract:** scan the fetched article HTML for tweet links and attach them.
2. **Paste a link:** user pastes any tweet URL; the app fetches the oEmbed preview and saves it.
3. **Search on X button:** opens `https://x.com/search?q=<keywords>&f=top` in a new tab with keywords generated from the headline.
- Saved tweets store: URL, handle, display text, embed HTML.
- **Acceptance:** pasting a valid tweet URL shows a preview within 3 seconds; an invalid or deleted tweet shows a clear message.

#### F6. Memes and images
- Meme templates from the Imgflip `get_memes` endpoint, searchable by name.
- GIFs from Giphy search.
- Background photos from Pexels (Unsplash as backup).
- Memes are **inspiration and templates**. The app never re-hosts other people's memes.
- **Acceptance:** searching "cricket" returns results from at least one provider; a failure of one provider does not break the page.

#### F7. Post generator
Given a story, the AI returns, in one request:
- **5 headline options**, each with a different angle: blunt, question, number-led, Hinglish, and short punchy (under 8 words).
- **1 caption** of 60 to 120 words, following the voice rules in section 7.
- **8 to 12 hashtags**, mixed broad and specific.
- **A fact table:** each claim in the caption mapped to the sentence in the source article that supports it.
- Language toggle: English / Hinglish.
- "Regenerate" per headline, and "Make shorter / Make sharper / Add context" buttons for the caption.
- **Acceptance:** every claim in the caption has a matching source sentence in the fact table; if not, it is flagged in red.

#### F8. Draft editor
- Plain editable text for headline and caption, with live character and word counts.
- Autosave. Status: draft or posted.
- Source link is saved with every draft and cannot be removed.
- A "copy caption" button that copies caption plus hashtags.

#### F9. Post designer and export
- 3 templates at launch (see `DESIGN.md`, section 10): headline-on-photo, text-only bold, and tweet-quote.
- Sizes: 1080x1350 (default) and 1080x1080.
- Choose background (Pexels photo, solid colour, or uploaded image).
- Live preview and one-click PNG download. Export happens in the browser.
- **Acceptance:** exported PNG is exactly the selected size and the text never overflows its box.

#### F10. Style library
- A page where the creator pastes past headlines and captions that performed well.
- These are used as examples in every generation (see `ARCHITECTURE.md`, section 8).
- **Acceptance:** adding an example changes the next generation's examples without a code change.

#### F11. Auth
- Single password login (set in `.env.local`). Session cookie, server-verified.
- **Acceptance:** every page and API route except the cron endpoint redirects or returns 401 when not logged in.

### 6.2 Phase 2

- Carousel splitter: one story becomes 5 to 7 slides of text, with matching template.
- Duplicate guard: warns when a story is similar to a draft or a post already marked posted.
- Content calendar (simple week view of planned and posted items).
- Telegram bot alert for breaking stories (stories with trend score above a threshold).
- Performance log: after posting, the creator enters likes, comments, saves, reach. A page shows which headline angles perform best.
- Keyboard shortcuts.

### 6.3 Phase 3

- Browser bookmarklet or share target: send any URL straight to the workspace.
- Saved searches and keyword watchlists ("alert me about IPL").
- Export/import of style library and drafts as JSON.
- Light multi-brand support (different template sets and voices).

---

## 7. Content voice rules (critical)

The output must not read like AI. These rules are part of the product, not optional polish.

**Do**
- Use short sentences. Mix very short ones with the occasional longer one.
- Lead with the most surprising or most useful fact.
- Use concrete numbers, names and places.
- Sound like a friend telling you the news, not a press release.
- Match the creator's own examples from the style library.

**Do not use (blocklist):** delve, landscape, realm, tapestry, testament, game-changer, game changing, revolutionize, unlock, elevate, navigate (as a metaphor), "in today's fast-paced world", "in an era of", "it's important to note", "it's worth noting", "buckle up", "let's dive in", "here's the thing", "the bottom line", "stay tuned", "only time will tell", "a stark reminder", "sends shockwaves", "amid", "sparks debate", "raises questions".

**Format rules**
- No em dashes. Use commas or full stops.
- No more than one exclamation mark per caption.
- No more than 2 emojis, and none in the headline.
- No "not just X, but Y" constructions.
- No lists of three adjectives.
- No closing summary sentence that repeats the caption.
- Do not end with a generic question to the audience unless the style library shows the creator does this.

**Accuracy rules**
- Use only facts present in the supplied article text. Never add outside facts, quotes or numbers.
- Never invent a quote. Quote only if it appears in the source, and keep it short.
- If the article is thin, say so in the fact table instead of padding.

The blocklist and format rules are enforced twice: in the prompt, and by a code check that rejects and retries any output that breaks them (max 2 retries).

---

## 8. Success metrics

- Time from selecting a story to downloading a post image: under 10 minutes.
- At least 70% of generated headlines accepted with light edits only (tracked via a simple "used as is / edited / discarded" flag on drafts).
- Zero secrets exposed in browser network tab or JS bundles.
- App stays inside all free-tier limits during normal use (about 20 to 30 posts a week).

---

## 9. Build order for the AI

1. Project setup, `.env.example`, auth, base layout and design tokens.
2. Database schema and migrations.
3. Source manager and RSS ingestion with deduping.
4. Feed page and filters.
5. Clustering and trend score.
6. Story workspace with article extraction.
7. Tweet features (auto-extract, paste, search button).
8. Meme, GIF and image search.
9. Style library.
10. Post generator with fallback provider, caching and voice checks.
11. Draft editor.
12. Post designer and PNG export.
13. Cron endpoint and the GitHub Actions workflow.
14. Accessibility and responsive pass, then Phase 2 items one by one.

At each step, run the app, check it works and fix errors before moving on.

---

## 10. Legal and ethics notes

- Always credit the source. Show the outlet name and link on every draft and in the suggested caption.
- Store only headline, summary, link and extracted text needed for the session. Do not republish full articles.
- Tweet embeds use X's official oEmbed. Credit the handle in the post.
- News photos are usually copyrighted. Use Pexels/Unsplash images, the creator's own templates, or images the creator uploads.
- Respect `robots.txt` and fetch article pages only on demand, with a clear User-Agent and a delay between requests.
