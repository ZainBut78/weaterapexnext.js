# WeatherApex — Phase C (FINAL, replaces earlier Phase C decisions)

This file **replaces** these earlier decisions: section 0 of `CLAUDE_CODE_PHASE_C_PROMPT.md`, the "old URL → 308" rule, and the "both URLs + canonical" idea. Everything else in `CLAUDE_CODE_BUILD_PROMPT.md` still applies:
- The React project and the Django backend are read-only.
- No git commands in those repos.
- Explain every step to Zain in simple Roman Urdu before doing it.
- Log everything in `docs/PROGRESS.md`.

**SEO is the first priority.** Every new page must be a separate, indexable page with its own unique title, description, H1, content and self-canonical, rendered on the server.

---

## 1. Final site structure: two separate sections

### SECTION 1 — "City Climate Guides" (already built, DO NOT CHANGE)
| Page | URL | Notes |
|---|---|---|
| Climate Guides | `/climate-guides` | existing cards stay exactly as they are; add Section 2 below (see 4) |
| City historical page | `/weather/{city}` e.g. `/weather/london` | the existing 20-year-average page. Same design, same URL, self-canonical, in sitemap |

The **only** addition to `/weather/{city}`:
- A small box near the bottom: **"See {City} weather month by month →"**, linking to `/weather/{country}/{city}`.
- Plus a row of 12 month links (Jan … Dec) to the month pages. This is the internal linking.
- Nothing else on this page changes. Show before/after screenshots.

### SECTION 2 — "Month-by-Month Weather Guides" (new, separate pages, SEO)
| Page | URL | H1 |
|---|---|---|
| Hub | `/weather` | "Weather by Country" |
| Country | `/weather/{country}` e.g. `/weather/united-kingdom` | "{Country} Weather by City & Month" |
| City by month | `/weather/{country}/{city}` e.g. `/weather/united-kingdom/london` | "{City} Weather by Month" |
| Month | `/weather/{country}/{city}/{month}` e.g. `/weather/united-kingdom/london/october` | "{City} Weather in {Month}" |

Examples:
- `/weather/united-states/new-york/july`
- `/weather/japan/tokyo/april`
- `/weather/united-arab-emirates/dubai/december`

**Each of the 12 months is its own separate page and URL**, and every one of those pages is indexable. All 155 cities × 12 months (~1,860 pages) go live together after approval.

URL rules:
- lowercase, hyphens, full English month names, no trailing slash
- uppercase → 308 to lowercase; trailing slash → 308 to no slash (not for `/api/*`)
- **no redirect** for `/weather/{city}`; it stays a live page (Section 1)
- the country table from `QUESTIONS_PHASE_C.md` (53 countries/territories, Hong Kong separate, 6 regions) is approved

Countries with one city:
- `/weather/{country}` → 308 to `/weather/{country}/{city}`, and the country page is not in the sitemap.
- **Exception:** `singapore` and `hong-kong`. There `/weather/singapore` is the Section 1 city page (keep it 200, no redirect). Section 2 is `/weather/singapore/singapore`.
- Test that there is no redirect loop.

---

## 2. Page content

Rules for all of Section 2:
- Every sentence is generated from **that page's own numbers**. No copy that only swaps the name (Google "scaled content abuse").
- Never state facts that are not in the data (events, festivals, prices).
- Dual units in the server HTML ("15.2°C (59.4°F)"); in the browser the chosen unit shows first.
- Existing design system only: colours, fonts, cards, photo hero, tables. No new libraries without asking.

### 2.1 City-by-month page `/weather/{country}/{city}` (NOT a copy of the historical page)
1. **Hero:** the city photo (existing cached photo), the H1, and a breadcrumb: Home › Weather › {Country} › {City}.
2. **Intro paragraph** from the data: warmest month, coolest month, wettest month, driest month, sunniest month.
3. **"Best months to visit {City}":** the top 3 months ranked **within this city's own year** (relative). Tropical cities (Singapore, Bangkok, Mumbai) must still get best months.
4. **12 month cards.** Each card shows **that month's own data**:
   - High / Low (dual unit)
   - rainfall (mm / in)
   - rainy days
   - sunshine h/day
   - verdict badge (Great / Good / Fair / Poor)
   - a link to that month's page ("October →")

   Layout: 1–2 columns on mobile, 3–4 on desktop.
5. **Link back to Section 1:** "Full 20-year climate guide →" to `/weather/{city}`.
6. Other cities in the same country (links to their by-month pages).

### 2.2 Month page `/weather/{country}/{city}/{month}`
Build on the preview and add the following. Order:
1. **Hero:** photo, breadcrumb Home › Weather › {Country} › {City} › {Month}, H1.
2. **Quick answer** (first paragraph, for Google snippets and AI answers), for example: "In October, London averages a high of 15.2°C (59.4°F) and a low of 8.1°C (46.6°F), with about 12 rainy days and 3.1 hours of sunshine a day."
3. **Stat cards:** high, low, rainfall (mm/in), rainy days, sunshine, humidity.
4. **"{Month} vs the rest of the year": a 12-row table.** It replaces the Sep/Nov-only comparison.
   - This month's row is highlighted.
   - Columns: Month, High (dual), "vs {Month}" difference, Rain, Rainy days.
   - **Every row links to that month's page.**
   - A summary line above it, e.g. "warmer than 6 months of the year, 3rd wettest".
   - On mobile the table scrolls inside its box, with a sticky first column.
5. **12 month chips** (Jan … Dec) linking to each month page.
6. **Article (blog-style, H2 sections, 3–4 paragraphs total, data-driven):**
   - "What's the weather like in {City} in {Month}?"
   - "How {Month} compares to the rest of the year"
   - "Who {Month} suits": sightseeing, beach, hiking, indoor. Use the same thresholds as the backend `trip_planner/activity.py`.
   - "Tips for visiting {City} in {Month}": packing and layers.
7. **"Is {Month} a good time to visit {City}?"** An absolute verdict with reasons, **plus** the relative rank, e.g. "one of the 3 best months in {City}", so tropical cities are not always "Poor". Before fixing, show Zain Singapore's 12 verdicts with local data.
8. **Travel notes (optional, hand-written):** if `content/guides/{city}/{month}.md` exists, render it here. If not, render nothing.
   - Create one sample: `content/guides/london/october.md`. Include only facts Zain can verify; mark it clearly as a sample.
   - Explain to Zain how to add new files.
   - Ask before adding a Markdown library.
9. **{Month} in other {Country} cities** (links to their month pages).
10. **Related articles:** blog posts whose title or slug contains the city name, from the existing blog endpoint with cache. Hide the section if there are none.
11. **CTA:** "Plan a trip to {City}" → Trip Planner.
12. **Data note:** "Based on 20 years of historical weather data (2006–2025) from Open-Meteo." Use the real range.

### 2.3 Country page `/weather/{country}`
- H1 and an intro computed from the data.
- City cards linking to the by-month pages.
- A month × city table (cell links to the month page; sticky first column; scrolls on mobile).
- "Best months to visit {Country}".

### 2.4 Hub `/weather`
- Countries grouped into 6 regions, with city counts, linking to the country page (or the city by-month page for 1-city countries).

---

## 3. SEO requirements (first priority)

| Page | Title pattern (≤ 60 chars if possible) | Description |
|---|---|---|
| Month | "{City} Weather in {Month}: Temperature, Rain & Tips" | real numbers of that month |
| City by month | "{City} Weather by Month: Climate & Best Time to Visit" | warmest/coolest/best months |
| Country | "{Country} Weather by Month & City" | cities + best months |
| Hub | "Weather by Country & Month — WeatherApex" | — |

Every Section 2 page needs:
- a unique title and description (seo-check must prove there are no duplicates across all generated pages)
- exactly one H1
- a **self-canonical**
- og/twitter tags, with the share image including the city photo
- `BreadcrumbList` JSON-LD (no FAQ schema)

Other requirements:
- **Internal links:** hub → country → city-by-month → month; month ↔ month (chips + table); Section 1 ↔ Section 2 links both ways; `/climate-guides` links to both sections.
- **Sitemap:** Section 1 city pages, all Section 2 pages (hub, 41 country pages, 155 city-by-month, ~1,860 month pages), and the existing static and blog pages. `lastModified` only where a real date exists.
- Everything important is in the **server HTML**, including tables, article text and links. Nothing SEO-critical is client-only.
- **Performance:**
  - CLS 0
  - hero photo `fetchPriority="high"` with srcset
  - below-the-fold images lazy
  - check LCP on mobile

---

## 4. `/climate-guides` page: two sections
1. **"City Climate Guides"**: the existing cards, unchanged, linking to `/weather/{city}`.
2. **"Month-by-Month Weather Guides"**: a new section in the same card style, linking to `/weather/{country}/{city}`, with a link to `/weather` ("Browse all countries").

---

## 5. Data and limits (must respect)
- A month page, the city-by-month page and the Section 1 page all use the **same single history call** (12 rows, cached 24 h). No extra calls for the 12 cards.
- Pages with several cities (country page, "other cities", the country table) are **capped at 6 history calls**. No history calls at build time.
- `data/historyReady.js` is a snapshot of the **local** DB. It must **not** decide anything in production.
  - Guard it so it is used only in local dev (for example behind an env flag).
  - In production, treat all whitelisted cities as available but keep the 6-call cap.
  - Document this in PROGRESS.md.
- Backend requests (write them, don't build): **#6** a list of cities with complete 20-year history, **#7** a DB-only multi-city climate summary in one call. Without #7, production country pages show at most 6 cities; say this clearly.
- Before deploy, Zain must confirm the VPS seeding loop is complete.

---

## 6. Process (approval gates)
1. Tell Zain the plan in simple Roman Urdu. Wait for "haan".
2. Build everything above as a **PREVIEW**:
   - Section 2 pages `noindex`, not in the sitemap
   - the Section 1 addition and the `/climate-guides` Section 2 cards visible only in the preview
3. Send screenshots at **390px and 1440px** (full page) of:
   - `/climate-guides`
   - `/weather/london` (new bottom box)
   - `/weather/united-kingdom/london` (12 cards)
   - `/weather/united-kingdom/london/october`
   - `/weather/united-kingdom`
   - `/weather`
   - `/weather/singapore/singapore`

   Report the backend call count per page, CLS/LCP and console errors.
4. **Only after Zain's separate "haan":**
   - remove `noindex`
   - add everything to the sitemap
   - wire all internal links
   - add redirects (lowercase, trailing slash, 1-city countries)
   - create `public/llms.txt`
   - update `seo-check` and Playwright:
     - new pages
     - no duplicate titles/descriptions
     - one H1
     - canonicals
     - breadcrumbs
     - `/weather/london` 200 + self-canonical
     - singapore/hong-kong no loop
     - bad month → 404
     - non-whitelisted city → 404 with 0 backend calls
   - run `npm run build`, `seo-check`, `test:e2e`, `check:icons` and report the numbers
