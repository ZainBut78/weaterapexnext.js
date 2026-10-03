# WeatherApex Next.js — Audit fixes, round 1 (for Claude Code)

This round comes from an external audit of your Phase A work. **All rules in `docs/CLAUDE_CODE_BUILD_PROMPT.md` still apply**, with no exceptions:

- React project and Django backend are read-only.
- No git commands in those repos.
- No `git add .` and no push.
- Explain every change to Zain in simple Roman Urdu and wait for his "haan" before making it.
- Keep the design identical.
- Take mobile-first screenshots.
- Log everything in `docs/PROGRESS.md`.

Work top to bottom. Items marked **(ask)** change something visible or open a decision: show Zain the options first. After each group, run `npm run build` and the relevant tests.

---

## How the audit was done (so you can reproduce it)

- The project copy was run with `npm run build && next start` against a mock of the Django API that returns the same response shapes.
- Checks run:
  - raw server HTML for every route
  - Playwright at 390 / 768 / 1440 px
  - console errors
  - horizontal overflow
  - `PerformanceObserver` for CLS and LCP
- **What passed:**
  - build has 0 errors
  - no horizontal scroll on any route at any width
  - no hydration warnings
  - exactly one server-rendered `<h1>` per page
  - 404s return a real HTTP 404
  - `/login` and `/signup` are `noindex`
  - city and blog pages are fully server-rendered
  - `/climate-guides` has real `<a href>` links
- Good work on Phase A. What follows is what still needs fixing.

---

## GROUP 1 — Bugs (fix first)

### 1.1 Popular Destinations shows no data, images or icons on Zain's machine
With the mock API the section works: 16 cards with temperature, image and icon. On Zain's PC with the **local Django backend** it shows nothing, so the cause is environment or data, not layout.

**Diagnose before changing code:**
1. With `npm run dev` and the backend running, open DevTools → Network and filter `current/?city=`. For each of the 16 cities, record the status code, the response time, and whether `image_url` is null. Do the same directly against `http://127.0.0.1:8000/api/weather/current/?city=tokyo` with curl.
2. Watch the Django console for tracebacks or 429/503 responses while the page loads. First-time cities trigger geocoding, an Open-Meteo forecast call and a Pexels lookup; 16 of them in parallel can be slow.
3. Compare with the old React site against the same backend (`npm run dev -- --port 5173` in the old folder). If the old site also fails, it is a backend or data issue: report it under "Backend requests" and do not change the backend.

**Then fix the frontend side:**
- A card whose query **errored** must not show a weather icon. Today `!isLoading` is true on error, so it shows a generic cloud icon with "—". Show "—" with no icon, or the existing skeleton.
- A failed image must fall back to the existing skyline SVG. Add an `onError` handler on the `<img>`.
- Report the root cause in `PROGRESS.md`.

### 1.2 Home page CLS is 0.92–1.0 (Google's "good" threshold is < 0.1)
Measured with `PerformanceObserver('layout-shift')` on `next start`, using a 1.5 s delayed API. Two causes:

**a) `WeatherBackground.jsx` rain animation**
- It animates `top` (`animate={{ top: [...] }}`). Every frame is a layout shift: 227 entries in 3 s, and the value keeps growing while the page is open.
- Animate a transform instead: framer-motion `y` / `translateY` with the same start and end positions and the same timing. The visual result is identical.
- The drops are also re-randomised with `Math.random()` on **every render**. Generate them once (`useState(() => ...)` or `useMemo` with `[]`).

**b) Loading placeholders are much smaller than the loaded content**
- `WeatherCard` ("Loading weather data..." box) and `ForecastTable` ("Loading forecast...") grow when data arrives. On mobile this pushes the whole page down by about 430 px.
- Give each loading state a skeleton with the **same outer size** as the loaded component at each breakpoint: a `min-h-*` or a grey skeleton inside the identical container.
- The loaded design must not change at all.

**Acceptance:** home CLS < 0.1 at 390 px and 1440 px with a 1.5 s API delay. Write this as a test (see Group 4).

### 1.3 Two `<h1>` on the home page after hydration
- `WeatherCard.jsx` line ~274 renders the temperature as `<h1>`. `FeaturesSection` also has an `<h1>`.
- Change the temperature element to `<p>` (or `<div>`) with **exactly the same classes**, so there is no visual change.
- **(ask)** The only remaining home `<h1>` is "Engineered for Accuracy", which is weak for SEO. Propose 2–3 keyword-focused alternatives to Zain, for example "Weather Forecasts, Trip Planning & Climate Guides". Keep the styling.

### 1.4 "TODAY" in Long-range Forecast uses the visitor's clock
- `ForecastTable.jsx` compares each date with `new Date()` in the browser.
- For Sydney viewed from the US, the city's "today" is the visitor's "tomorrow", so the wrong row gets highlighted.
- Compare with the city's own date: `data.current.time.slice(0, 10)`. Also stop building dates with the browser timezone:
  - parse `YYYY-MM-DD` manually, or
  - format with `timeZone: 'UTC'`.

### 1.5 Affiliate links need `rel="sponsored"`
- In `app/blog/[slug]/page.js`, product links (`affiliate_url`) use `rel="noopener noreferrer"`.
- Google requires paid or affiliate links to be marked. Use `rel="sponsored nofollow noopener noreferrer"`.

### 1.6 City page says "10+ years" but the description and data say 20 years
- The subtitle in `app/weather/[citySlug]/page.js` says "based on 10+ years of historical data". The meta description says 20 years.
- **(ask)** Make them consistent (20 years). This was also wrong in the React site.

---

## GROUP 2 — SEO foundation (Phase B from the build brief — not done yet)

Current state:
- no canonical on any page
- no `robots.txt` (404)
- no `sitemap.xml` (404)
- no JSON-LD anywhere
- no `og:url` or `og:image`
- `/favicon.ico` returns 404

### 2.1 City whitelist
Do this first; the sitemap and security depend on it.
- Today `/weather/<anything>` calls the backend history endpoint.
  - For an unknown but real place name, the backend geocodes it, **creates a City row and fetches 20 years from Open-Meteo (~261 weighted calls)**.
  - Bots crawling random URLs can therefore burn the Open-Meteo quota and create junk pages.
  - `/weather/London`, `/weather/LONDON`, `/weather/london/` and `/weather/london` also all return 200. That is duplicate content.
- Create `data/cities.js` with the city list copied (read-only) from the backend file `weather/management/commands/fetch_all_cities.py` (`CITIES`, 154 entries: name, country, region). Also read the backend `City` model and the code that creates slugs, so your slugs match exactly.
- In `/weather/[citySlug]`, if the slug is not in the whitelist, return `notFound()` **before** calling the backend.
- Normalise case: an uppercase slug should `permanentRedirect` to the lowercase URL.
- Keep `generateStaticParams` returning `[]` (on-demand ISR).

### 2.2 Canonical and social tags
- Set `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL)` in the root layout.
- Every indexable page gets `alternates: { canonical: '<path>' }`: lowercase, no trailing slash (the current style), no query string.
  - Exception: `/blog?page=N` has canonical `/blog?page=N` and a unique title "Blog — Page N".
- Add `openGraph.url`, `openGraph.type`, `openGraph.siteName` and `twitter.card = 'summary_large_image'`.
- Blog posts use `featured_image` as `og:image`.
- **(ask)** Other pages need a default 1200×630 OG image. Ask Zain for one, or propose `app/opengraph-image.js` (generated in code, no new dependency).
- The trailing-slash **redirect policy** is still an open decision, so do not add redirects for it. Canonical tags fix the duplicate-content problem for now.

### 2.3 `app/robots.js` and `app/sitemap.js`
- robots:
  - allow `/`
  - disallow `/api/`, `/login`, `/signup`
  - `sitemap: <SITE_URL>/sitemap.xml`
- sitemap should contain:
  - all static public pages
  - all blog posts (walk every page of `/api/blog/posts/` on the server with `revalidate`)
  - all whitelisted city pages
- Never call the history endpoint from the sitemap.

### 2.4 JSON-LD (server-rendered `<script type="application/ld+json">`)
| Page | Types |
|---|---|
| Home | `Organization` + `WebSite` |
| `/weather/[citySlug]` | `BreadcrumbList` (Home › Climate Guides › City) |
| `/blog/[slug]` | `Article` (headline, datePublished, image, author/publisher) + `BreadcrumbList` |

- **No FAQ schema.**
- Escape `<` in the JSON (`.replace(/</g, '\\u003c')`).

### 2.5 Favicon
- `/favicon.ico` returns 404, and browsers request it automatically.
- Add `app/icon.svg` (copy of `public/favicon.svg`) or a `favicon.ico`.
- The final brand favicon is still pending Zain's approval.

### 2.6 Internal linking (ask — these are visible changes)
- **Popular Destinations cards** do not link to the city climate pages, which are the most valuable SEO pages.
  - Propose a small text link on each card, e.g. "Climate guide →" to `/weather/<slug>`.
  - It must not break the card's click-to-switch-city behaviour.
  - Show a screenshot before and after.
- **City page:** propose a server-rendered "More cities in {country}" section, using the whitelist and the existing card styles.
- `/terms`, `/privacy`, `/api-docs` and `/pricing` have **no Navbar or Footer**, so they are dead ends with 0 internal links. This is the same as the React site. Propose adding them.

---

## GROUP 3 — Accuracy and UX (ask before each)

### 3.1 Weather icons: day/night accuracy
- The current mapping is correct: it uses Open-Meteo's `is_day`, which follows real sunrise and sunset per city, and every icon file exists.
- Some conditions always show the same icon day and night, although day and night versions **exist in Meteocons 3.0.0-next.10 `fill`** (verified):

  | WMO codes | Condition | Day icon | Night icon |
  |---|---|---|---|
  | 80–82 | rain showers | `partly-cloudy-day-rain` | `partly-cloudy-night-rain` |
  | 85–86 | snow showers | `partly-cloudy-day-snow` | `partly-cloudy-night-snow` |
  | 45, 48 | fog | `fog-day` | `fog-night` |
  | 95–99 | thunderstorms | `thunderstorms-day` | `thunderstorms-night` |

- Propose extending `NIGHT_VARIANTS` and the map. Test every WMO code × day/night and check that every URL returns 200.

### 3.2 °F for Tier-1 (US) visitors
- The hero shows "°C °F" stacked, but only a °C number and no toggle, which is misleading for US users.
- Popular Destinations and the forecast show °C only.
- Propose a °C/°F toggle that is remembered in `localStorage` (read it in `useEffect`), or showing both values, e.g. "80°F (27°C)".

### 3.3 Mobile Long-range Forecast table
- At 390 px the 12-column grid truncates the text ("Light rai…", "Rain li…").
- Propose a mobile-only stacked row layout and keep the desktop table exactly as it is.

---

## GROUP 4 — Tests (required with this round)

1. `scripts/seo-check.mjs` (plain Node, no dependency), run against `next start`. For every route it checks:
   - status code
   - exactly one `<h1>`
   - unique `<title>` and meta description
   - absolute canonical
   - `noindex` only on login, signup and 404
   - JSON-LD parses as JSON and has `@type`
   - `robots.txt` and `sitemap.xml` return 200 and are valid
   - uppercase city URL → 308/301 to lowercase
   - unknown city → 404 **without** a backend call (check the Django log)
   - affiliate links have `rel` containing `sponsored`
2. A CLS test: Playwright with a mocked `/api/weather/current/` delayed by 1500 ms. Home CLS must be < 0.1 at 390 px and 1440 px. **Ask Zain before installing Playwright** (~150 MB).
3. An icon test (unit or script): every WMO code 0–99 in the map × day/night resolves to a file name that exists.
4. Re-run the full-route check at 390, 768 and 1440 px: no horizontal scroll and no console errors.

---

## Backend notes (report only — do not change the backend)

- `get_historical_overview` uses `round(x, 1) if x else None`. **0.0 °C becomes `None`**, so cold-city months with an average of exactly 0 show as blank.
- A correction to your PROGRESS note: `/api/weather/history/` is a *browsing* endpoint with a per-minute burst guard (`WEATHER_ANON_PER_MINUTE`, default 600/min per IP), **not** the 3-per-day feature quota. Server-side rendering is fine for now. In production all SSR calls share the Hostinger IP, so an internal header or key would still be good to have later.
- Nice to have: a read-only `GET /api/weather/cities/` endpoint (slug, name, country, has_history). The frontend whitelist could then come from the backend instead of a copied list.
