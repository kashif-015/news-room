# DESIGN: NewsDesk (working name)

Read with `PRD.md` and `ARCHITECTURE.md`. This file defines how the app looks, feels and reads. The goal: it should look like a tool designed by a person with a point of view, **not** like a generated template.

---

## 1. Design idea

**A newsroom desk, not a SaaS dashboard.** Think of a printed newspaper and an editor's marked-up proofs: warm paper, black ink, a single burnt-orange pen for emphasis, and pine green for "verified" and "done". Information is dense but calm. Type does most of the work, not boxes and shadows.

Keywords: editorial, warm, tactile, confident, quiet.

## 2. What makes it not look AI-generated (hard rules)

**Never do:**
- Purple, blue or pink gradients. No gradient text. No glowing blobs.
- Glassmorphism, frosted cards, neon borders, or heavy drop shadows.
- A centered hero with a big headline, subtext and two buttons.
- Grids of identical rounded cards with an icon on top and three lines of text.
- Emoji used as icons or section markers.
- Generic copy: "Welcome to", "Supercharge", "Unlock", "Seamless", "All-in-one", "Your AI-powered assistant".
- Lorem ipsum or placeholder names like "John Doe".
- Default component-library look (stock shadcn/ui, Material or Bootstrap styling left unchanged).
- Everything rounded to the same large radius.

**Do:**
- Use real content and real labels everywhere, including empty and loading states.
- Use hairline rules (1px lines) and whitespace to separate things, instead of boxes.
- Mix type sizes with strong contrast (large serif headlines against small mono metadata).
- Use asymmetry: a wide main column, a narrow side column, uneven spacing that feels intentional.
- Keep radii small (2px to 6px) and consistent.
- Use one accent colour sparingly, so it actually means something.
- Add small, specific details: a dateline above headlines, folio numbers, a tiny "edition" stamp, ruled dividers with centred labels.

## 3. Colour tokens

Warm palette: bone, ink, burnt orange, pine green.

```css
:root {
  /* surface */
  --bone: #F3EEE3;          /* page background */
  --paper: #FAF7F0;         /* raised areas, inputs */
  --bone-deep: #E8E1D2;     /* hover, subtle fills */
  --rule: #CFC6B2;          /* hairlines */

  /* text */
  --ink: #1A1814;           /* primary text */
  --ink-soft: #4A453B;      /* secondary text */
  --ink-mute: #7A7364;      /* metadata (check contrast, use only at 14px+ or bold) */

  /* accent */
  --orange: #B8501A;        /* burnt orange: primary action, emphasis, links on hover */
  --orange-deep: #8F3B10;   /* pressed state */
  --orange-wash: #F0DCCB;   /* light highlight background */

  /* status */
  --pine: #1F4A38;          /* verified, success, "posted" */
  --pine-wash: #D6E3DA;
  --alert: #A3281B;         /* errors, unsupported claims */
  --alert-wash: #F2D8D3;
}

[data-theme="dark"] {
  --bone: #151310;
  --paper: #1D1A16;
  --bone-deep: #26221C;
  --rule: #3A352C;
  --ink: #F0EADC;
  --ink-soft: #C9C1AE;
  --ink-mute: #988F7B;
  --orange: #E0763A;
  --orange-deep: #F08F57;
  --orange-wash: #3A2517;
  --pine: #7DB596;
  --pine-wash: #1B2D24;
  --alert: #E5776B;
  --alert-wash: #3A1E1A;
}
```

Usage: bone is the page, ink is text, orange appears on at most 1 or 2 elements per screen (primary button, active filter, key highlight). Pine marks "verified", "posted" and success. Respect `prefers-color-scheme` for the default theme and let the user switch.

All text and interactive colour pairs must meet WCAG AA contrast (4.5:1 for body text, 3:1 for large text and UI components). Verify `--ink-mute` on `--bone` and adjust if it fails.

## 4. Typography

Fonts (load with `next/font`, self-hosted, `display: swap`):
- **Fraunces** for headlines and story titles (variable, use optical size and a slightly soft setting).
- **Inter** for UI text and body copy.
- **IBM Plex Mono** for metadata: timestamps, sources, counts, labels, keyboard hints.

Scale (desktop; scale down about 10% on mobile):

| Role | Font | Size / line height | Weight |
|---|---|---|---|
| Page title | Fraunces | 40 / 44 | 600 |
| Story headline (feed) | Fraunces | 22 / 28 | 600 |
| Story headline (workspace) | Fraunces | 32 / 38 | 600 |
| Section label | IBM Plex Mono | 12 / 16, uppercase, 0.08em tracking | 500 |
| Body | Inter | 16 / 26 | 400 |
| UI text | Inter | 14 / 20 | 500 |
| Metadata | IBM Plex Mono | 12 / 16 | 400 |

Rules:
- Body line length 60 to 72 characters.
- Left-aligned text. No justified text.
- Use italic Fraunces for pull quotes and for tweet text in previews.
- Support Devanagari fallback for Hinglish: add `Noto Serif Devanagari` / `Noto Sans Devanagari` to the font stacks.

## 5. Spacing, shape, depth

- Base unit 4px. Common steps: 4, 8, 12, 16, 24, 32, 48, 72.
- Radii: `2px` for inputs and chips, `4px` for buttons and panels. Nothing larger except full circles for avatars.
- Borders: 1px `--rule`. Prefer a rule line to a box.
- Shadows: almost none. Allowed: a single `0 1px 0 rgba(26,24,20,0.06)` for lifted panels, and a stronger one only for popovers and modals.
- Subtle paper grain on the page background (a very low-opacity noise image, under 4% opacity, tiled, and removed when `prefers-reduced-motion` or data-saver is on).

## 6. Layout

### App shell
- Left: a slim vertical rail (72px) with text-and-icon navigation: Feed, Drafts, Style, Sources, Log. Use a simple line-icon set (for example Lucide) at 1.5px stroke; no filled coloured icons.
- Top strip: dateline in mono ("Saturday, 31 October 2026 · Edition 304"), refresh status ("Last updated 12 min ago"), theme toggle, logout. The edition number can be a running count of days since the first draft.
- Content area has a max width of 1280px and uses asymmetric columns.

### Feed page
- Left column (about 62%): story list as a **ruled list**, not cards. Each row: mono dateline (source, time ago, category), Fraunces headline, one-line summary in `--ink-soft`, and a small coverage marker ("Covered by 7 outlets") in pine when 3 or more.
- Right column (about 38%, sticky): filters and a "Most covered right now" short list of the top 5 clusters, numbered with large Fraunces numerals.
- Selecting a row opens the story workspace.
- Used stories show a struck-through tag "Used" in mono, with a lighter row.

### Story workspace
Three zones on desktop:
1. **Reading column** (centre, wide): headline, dateline, source link, article text in a readable serif or Inter body. A sticky top bar holds the **Create post** button (orange).
2. **Coverage column** (right, narrow): related outlets listed with links, then saved tweets, then meme and image search tabs.
3. **Notes strip** (bottom, collapsible): the creator's own notes about the story.

On mobile these become tabs: Read, Coverage, Tweets, Media.

### Draft editor and designer
- Left: text fields. The five headline options appear as a ruled list with an angle label in mono ("blunt", "question", "number", "hinglish", "short"). Click to choose; double-click to edit.
- Below: caption editor with word count, and the **fact table**: two columns, "What the caption says" and "Where the article says it". Supported rows get a pine tick (an SVG, not an emoji). Unsupported rows get a red left border and a label "No source found".
- Right: the post preview at scale, template switcher as small thumbnails, background picker, size toggle, and the **Download PNG** button.

### Other pages
- **Style library:** two columns (headlines, captions), each a ruled list with an "Add example" row at the top.
- **Sources:** a table-like ruled list with a status dot (pine, orange, red) and last-fetched time in mono.
- **Log (Phase 2):** a simple table and one honest chart (bar chart by headline angle), drawn with plain SVG, using palette colours.

## 7. Components

**Buttons**
- Primary: solid `--orange`, text `--paper`, 4px radius, 40px height, no shadow. Hover darkens to `--orange-deep`. Only one primary button per view.
- Secondary: transparent with a 1px `--ink` border. Hover fills `--bone-deep`.
- Tertiary: text only, underlined on hover with a 2px orange underline offset.
- Focus: a 2px `--orange` outline with a 2px offset, always visible.
- Disabled: lower opacity plus a not-allowed cursor, and still keep readable contrast.

**Inputs**
- `--paper` background, 1px `--rule` border, 2px radius. Focus border `--ink` plus the orange focus ring.
- Labels always visible above the field, in mono small caps. No placeholder-only labels.

**Chips and filters**
- Rectangular (2px radius), mono text. Active chip: ink background with bone text, plus a small orange marker. Not pill-shaped.

**Tabs**
- Text tabs with an underline that slides to the active tab.

**Toasts**
- Small bar at the bottom left, ink background, bone text, auto-dismiss after 4 seconds, and `aria-live="polite"`.

**Modals**
- Used rarely (confirm delete). Paper background, strong shadow, trapped focus, closes on Escape.

**Tweet preview**
- Show the official embed, framed with a thin rule and a mono caption "Tweet by @handle · saved from article" or "· pasted". Include the "Open on X" link.

**Empty and loading states**
- Written, specific and calm. Skeletons are ruled grey lines shaped like the real content, with no shimmer when reduced motion is on.

## 8. Motion

Motion should feel like turning a page, not like a sales site.

- **Scroll reveals:** list rows and sections fade up by 8px over 280ms as they enter the viewport, staggered by 40ms, once only (IntersectionObserver).
- **Page transitions:** a quick 180ms opacity change; headlines can slide up 6px.
- **Hover:** row hover shifts a 2px orange bar in at the left edge and nudges the headline 2px right.
- **Number counters:** counts (outlets, words) tick briefly when they change.
- **Progress:** during generation, show a slim orange line under the top strip and a plain-language status ("Reading the article", "Drafting headlines", "Checking facts").
- Easing: `cubic-bezier(0.2, 0.7, 0.2, 1)`. Durations 150 to 350ms.
- **Reduced motion:** when `prefers-reduced-motion: reduce`, remove transforms and parallax, keep only instant opacity changes.

### Custom cursor (desktop with a fine pointer only)
- A small ink dot (8px) that follows the pointer with a light lag, growing to a 28px ring with an orange stroke over interactive elements, and turning into a small "Read" or "Open" label over story rows.
- Enable only when `(pointer: fine)` and not reduced motion. Never hide the system cursor over text inputs, and keep the normal cursor on touch devices.
- The cursor is decorative and must never block clicks (`pointer-events: none`).

## 9. Responsive behaviour

- Breakpoints: 480, 768, 1024, 1280.
- Mobile first. Left rail becomes a bottom bar with 5 items (label under each icon, 48px minimum touch targets).
- Feed rows keep the same structure on mobile, with the right column's filters moving into a bottom sheet opened by a "Filters" button.
- The workspace uses tabs. The designer preview scales to fit the width, with the export button pinned at the bottom.
- Test at 360px width. No horizontal scrolling except inside tables or code blocks.
- Use `dvh` units for full-height layouts to avoid mobile browser UI issues.

## 10. Post templates (exported images)

All templates render at 1080x1350 (and a 1080x1080 variant), use the same fonts as the app, and keep a 72px safe margin on all sides. Every post includes a small source credit line in mono at the bottom ("Source: Outlet Name") and the creator's handle placeholder in settings.

**Template A: Headline on photo**
- Full-bleed photo with an ink overlay at 55% to 70% opacity for legibility.
- Headline in Fraunces 600, 84 to 108px, bone colour, bottom-aligned, left-aligned, max 5 lines.
- Orange short rule (96px wide, 6px thick) above the headline.
- Small mono label top-left (category and date).

**Template B: Bold text card**
- Bone or ink solid background, no photo.
- Huge Fraunces headline, 110 to 140px, filling most of the card.
- One word or phrase highlighted with an orange underline stroke, chosen by the user.
- Footer: source and handle in mono.

**Template C: Tweet quote**
- Paper background with a thin ink border inset by 48px.
- Tweet text in Fraunces italic, 56 to 68px, with the handle and display name in mono below.
- Above the quote, a short headline in Inter 600 explaining why it matters.
- No X logo reproduction beyond plain text such as "via X".

**Template rules**
- Automatic text fitting with a minimum font size, plus a visible warning in the editor if text would be cut off.
- Each template has 2 colour variants (light, dark). Allowed accent colours come from the palette only.
- Photo credits are shown in small mono text when the provider requires it.

## 11. Voice of the interface (microcopy)

Plain, direct, a little dry. Written like a sharp editor, not like a chatbot.

| Place | Write | Not |
|---|---|---|
| Empty feed | "Nothing new in the last 3 hours. Try 24 hours or add a source." | "Oops! Nothing to see here yet!" |
| Generating | "Reading the article. Drafting headlines." | "Our AI is working its magic!" |
| Fact table, unsupported | "No source sentence found. Cut it or check the article." | "We couldn't verify this claim." |
| Rate limit | "Gemini's free limit is used up for now. Switching to the backup." | "Something went wrong." |
| Copy done | "Copied." | "Successfully copied to clipboard!" |
| Delete confirm | "Delete this draft? This can't be undone." | "Are you sure you want to proceed?" |

- Buttons are verbs: "Create post", "Regenerate", "Download PNG", "Add source".
- Dates in the mono style: `31 Oct 2026, 14:20`. Use the user's local time zone.
- Never use exclamation marks in the interface.

## 12. Accessibility

- Semantic HTML: `nav`, `main`, `article`, `ul` for lists, real `button` and `a` elements.
- Skip link to main content as the first focusable element.
- Visible focus on every interactive element.
- Full keyboard use: all actions reachable without a mouse, logical tab order, Escape closes modals and popovers, arrow keys move between tabs.
- Labels and `aria-label` for icon-only buttons. `aria-live` for toasts and generation status.
- Do not rely on colour alone: pair status colours with text or icons (tick, cross, label).
- Alt text for all meaningful images; decorative images get empty alt.
- Minimum touch target 44x44px.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- Language attributes: set `lang="en"` and mark Hinglish or Hindi spans where relevant.
- Test with keyboard only and with a screen reader on the main flow (feed, workspace, generate, export).

## 13. Implementation notes for the AI

- Put all tokens in `app/globals.css` as CSS variables and map them into `tailwind.config` so classes like `bg-bone`, `text-ink`, `border-rule` and `text-orange` exist.
- Build components from scratch or restyle any library component completely to match this file. Strip default shadows, radii and colours.
- Build a small set of shared primitives first (Button, Input, Chip, Tabs, RuleList, Dateline, Toast), then compose pages from them.
- Use real sample data during development (real-looking headlines, outlets and dates), never lorem ipsum.
- Before finishing each page, check it against section 2 ("What makes it not look AI-generated") and remove anything that breaks a rule.
