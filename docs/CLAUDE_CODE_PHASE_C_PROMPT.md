# WeatherApex — Phase C: new URL structure + month and country pages (for Claude Code)

All rules from `docs/CLAUDE_CODE_BUILD_PROMPT.md` still apply:
- The React project and the Django backend are read-only.
- No git commands in those repos.
- Explain each step to Zain in simple Roman Urdu before doing it.
- Log everything in `docs/PROGRESS.md`.

**This phase starts with a PREVIEW. Zain wants to see the real pages before anything becomes live.**

---

## 0. Decisions Zain has already made (final)

| # | Decision |
|---|---|
| 1 | The country goes in the URL: `/weather/{country}/{city}` |
| 2 | Month pages: `/weather/{country}/{city}/{month}` (full English month name, lowercase) |
| 3 | Country pages: `/weather/{country}`, and a hub at `/weather` |
| 4 | **No trailing slash.** Redirect `/x/` → `/x` with 308, **except `/api/*`** (keep the existing proxy rules untouched) |
| 5 | **All** month pages for all whitelisted cities go live together (no staged rollout) |
| 6 | Lowercase, hyphens, units never in the URL |

Target structure:
```
/weather                                   hub: all countries grouped by region
/weather/united-kingdom                    country page
/weather/united-kingdom/london             city climate guide (today's /weather/london page, moved)
/weather/united-kingdom/london/october     month page
```

Old URL `/weather/london` must return a **308 to `/weather/united-kingdom/london`**, with no chains and no loops.
- Do this in `proxy.js`, together with the existing lowercase redirect, so there is one hop only: `/weather/London` → `/weather/united-kingdom/london` directly.
- Update every internal link: Climate Guides, Popular Destinations ("Climate guide →"), More cities, sitemap, breadcrumbs, OG and canonical, and any tests.

---

## 1. Data prerequisites

### 1.1 Country slugs (must fix first)
`data/cities.js` uses short or inconsistent country names: `USA` (27 cities), `UAE`, `Czech Republic`, `Turkey`, and so on. The URL needs one stable slug per country.
- Add a country table: `name` (display, e.g. "United States"), `slug` (`united-states`), `iso2` (`US`), `region`.
- Map every `country` value in `cities.js` to it.
  - Examples: `USA`→united-states, `UAE`→united-arab-emirates, `Czech Republic`→czech-republic (keep that name), `Turkey`→turkey.
  - Show Zain the full list of 51 countries (name → slug) for approval before using it.
- The page must display the proper name ("United States"), never "USA".

### 1.2 Duplicate city names
- Verify that no two whitelisted cities share a slug inside the same country.
- For the USA, check for cities that exist in several states. If any exist, report them. The future rule is `portland-oregon`; do not rename anything without asking.

### 1.3 Countries with only one city (ask)
About 12 countries have a single city (Singapore, Egypt, Nigeria, Malaysia, …). A country page with one city is thin content. Show Zain these options:
- **A (recommended):** the country page exists and is indexable only if the country has **2 or more** cities. For a 1-city country, `/weather/{country}` → 308 to its only city page, and that country is not in the sitemap.
- **B:** every country gets a page, but 1-city countries are `noindex`.
- **C:** every country page is indexable.

### 1.4 Cities outside the whitelist (important — Zain's point)
Users can look up **any** city in the tools (weather card, Trip Planner, Event Risk). The database therefore grows beyond the 155 curated cities. For now:
- SEO pages (city, month, country) exist **only for whitelisted cities**. The tools keep working for any city exactly as today.
- Do not generate pages for arbitrary cities. That would let bots trigger 20-year Open-Meteo fetches and create junk pages.
- Write the future plan into `PROGRESS.md` under "Backend requests": a read-only endpoint that lists cities with **complete** 20-year history, so popular user-requested cities can be promoted to SEO pages automatically. Promote a city only if its data is complete, so rendering a page never calls Open-Meteo.

### 1.5 Data source for month pages
- Reuse the existing history response, which already contains all 12 months, fetched on the server with the same cache as the city page. **One backend call per city serves the city page and all 12 month pages.**
- No new backend endpoint.
- Never call the history endpoint at build time. Pages are generated on demand with ISR, as today.
- Country pages need the histories of their cities. Fetch them in parallel with the same cache, max 27 (USA).

---

## 2. PREVIEW FIRST (no redirects, no sitemap, no link changes yet)

Build the three new page types for real, but keep them hidden until Zain approves:
- `noindex`
- not in the sitemap
- not linked from anywhere

Then send Zain screenshots at **390px and 1440px**, full page, of:
1. `/weather/united-kingdom/london/october`
2. `/weather/united-states/new-york/july` (tests °F default, many cities in the country, a summer month)
3. `/weather/united-kingdom` (country page)
4. `/weather` (hub)
5. `/weather/united-kingdom/london` (moved city page; must look the same as today)

Use the existing design system only: the same colors, fonts, cards, hero-with-photo style and table style. No new libraries.

### 2.1 Month page content
It must be genuinely useful and different per page. Google penalises templated pages that only swap the name ("scaled content abuse"), so every sentence must come from the page's own numbers.

1. **Hero:** the city photo (same as the city page, with overlay), breadcrumb Home › Weather › United Kingdom › London › October, and the H1 **"London Weather in October"**.
2. **Quick answer (first paragraph, for Google snippets and AI answers).** One or two plain sentences with real numbers, for example: "In October, London averages a high of 15.2°C (59.4°F) and a low of 8.1°C (46.6°F), with about 12 rainy days and 3.1 hours of sunshine per day."
3. **Stat cards:** avg high, avg low, rainfall (mm and in), rainy days, sunshine hours, humidity. Each shows dual units in the server HTML, like the city page.
4. **Compared with the neighbouring months:** vs September and November, e.g. "4.1° cooler than September, 11 mm wetter". Add the month's rank in the year, e.g. "3rd wettest month", "2nd coolest".
5. **Year strip:** 12 small month chips or a mini bar chart with this month highlighted. **Each chip links to that month's page.** This is internal linking.
6. **"Is October a good time to visit London?"** A verdict of Great / Good / Fair / Poor, calculated from comfort temperature, rain chance and rainy days.
   - Use the same idea as the trip scoring, with transparent reasons such as "mild temperatures, frequent light rain".
   - Say it is based on historical averages, not a forecast.
7. **What to pack in October:** rules based on the numbers. Reuse the logic from the city page's packing section.
8. **October in other cities:**
   - the same month in other cities of the same country (with links)
   - "Warmest places in October" and "Driest places in October" among whitelisted cities (top 5, with links)
   - This only reads data you already fetch. Do not call history for all 155 cities on one page: use only the country's cities plus a precomputed or cached list. If that is not possible without many backend calls, skip the global lists and tell Zain.
9. **CTA:** "Plan a trip to London in October" → Trip Planner, with the city and October dates prefilled via query params if the Trip Planner supports them.
10. **Data note (trust):** "Based on 20 years of historical weather data (YYYY–YYYY) from Open-Meteo." Use the real year range.

**SEO for the month page:**
- Title: "London Weather in October: Temperature, Rain & Tips". Keep it at 60 characters or fewer if possible.
- Unique meta description with the real numbers.
- Canonical, og, breadcrumb JSON-LD. No FAQ schema.

### 2.2 Country page
- H1: "United Kingdom Weather & Climate by City".
- Intro text computed from the cities' data (warmest and coolest city, wettest month in general).
- City cards (photo style, like Climate Guides) linking to the city pages.
- A **month × city table**: average high per month for each city, with dual units and a subtle colour scale. Each month header links to that month's page for the first city, or each cell links to its city/month page. Choose what is cleanest and show Zain.
- "Best months to visit" summary.

### 2.3 Hub `/weather`
- The list of countries grouped by region, each linking to its country page (or to the city page, depending on the 1.3 decision). Show city counts.

---

## 3. After Zain approves the preview (only then)

1. Remove `noindex`. Add the new URLs to the sitemap: city, month and country pages plus the hub.
   - That is about 1,860 month URLs, so the sitemap stays well under the 50,000-URL limit.
   - Give every page a correct canonical.
2. `proxy.js`: redirect the old `/weather/{city}` → new, apply the lowercase and trailing-slash rules, one hop only, and skip `/api/*`.
3. Update all internal links and tests listed in section 0. Old URLs must never appear in the HTML.
4. `seo-check.mjs`: add checks for
   - the month, country and hub pages (one h1, unique title/description, canonical, breadcrumb JSON-LD)
   - old URL → one 308 hop
   - trailing slash → 308
   - `/api/` untouched
   - a non-whitelisted city → 404 with 0 backend calls
   - a random month name (e.g. `/weather/united-kingdom/london/smarch`) → 404
5. Playwright: add the new pages to the no-console-error / no-horizontal-scroll / CLS checks at 390, 768 and 1440 px.
6. Create **`public/llms.txt`**: a short plain-English description of WeatherApex, what the pages contain (city climate guides, month pages, tools, API), and links to `/weather`, `/climate-guides`, `/trip-planner`, `/api-docs` and `/sitemap.xml`. Keep `robots.js` allowing all bots except `/api/`; AI crawlers must not be blocked.
7. `npm run build`, `npm run seo-check`, `npm run test:e2e`, `npm run check:icons`. All must pass. Report the numbers.

---

## 4. Risks to watch and report

- **Open-Meteo:** a city page, and now its month and country pages, call history for their cities.
  - For cities whose 20-year history is **not yet complete** in the database, the backend fetches from Open-Meteo.
  - Launching 1,860+ URLs at once means Googlebot may request many cities in a short time.
  - Tell Zain to confirm the VPS seeding loop has finished for all cities **before deploy** (`tail -n 20 /root/seed.log` on the VPS).
- Country pages fan out to up to 27 history calls (USA) on the first render. Measure the render time and the backend calls, and report both.
