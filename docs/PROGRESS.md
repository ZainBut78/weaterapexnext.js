# WeatherApex Next.js migration — progress log

Rules followed: React project and Django backend were only READ (no writes, no git).
No `git` command was run anywhere. Nothing committed or pushed.

---

## 2026-09-26 — Phase A: remaining pages (parity first)

### Step A0 — landing page "data nahi aa raha"
- Cause: `npm run dev` was not running. Backend (127.0.0.1:8000) and the
  `/api` proxy were fine. Started the dev server → 16 `/api/weather/current/`
  calls 200, no console errors.
- Files: none.

### Step A1 — env variables (allowed by brief §2)
- `.env.local`: added `API_INTERNAL_URL=http://127.0.0.1:8000/api`,
  `NEXT_PUBLIC_SITE_URL=https://weatherapex.com`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID=…`.
  (Also fixed a missing newline that had joined two lines.)
- `.env.example`: documented the same three.
- Dev server restarted afterwards (rewrites/env are read at startup).
- **Owner action:** add `http://localhost:3000` to Google Cloud Console →
  Authorized JavaScript origins, otherwise Google Sign-In fails on localhost.

### Step A2 — support files ported (mechanical port, same code)
- `services/authService.js`, `config/googleAuth.js`, `hooks/useBlog.js`,
  `hooks/useHistorical.js` (currently unused — city page fetches on server),
  `components/CityNeededNotice.jsx`, `components/FreeLimitNotice.jsx`,
  `components/GoogleSignInButton.jsx`, `components/events/*` (4 files).
- `'use client'` added to the interactive components.
- `components/events/EventSearchForm.jsx`: "today"/max date for the date
  input now computed in `useEffect` (server timezone ≠ user timezone →
  hydration mismatch). Visually identical.
- `public/favicon.svg`, `public/placeholder-product.svg` copied from old `public/`.
  (`icons.svg` is unused in the old code → not copied.)
- `app/layout.js`: `icons: { icon: '/favicon.svg' }` and `themeColor: '#0077b6'`
  (same as old `index.html`).
- New: `services/serverApi.js` — `serverGet()` for Server Components
  (`API_INTERNAL_URL`, `next.revalidate`, 404 → `null`, other errors throw).
  `server-only` package NOT installed (would be a new dependency).

### Step A3 — pages
| Route | Files | Rendering |
|---|---|---|
| `/about` | `app/about/page.js` | server |
| `/terms` | `app/terms/page.js` | server |
| `/privacy` | `app/privacy/page.js` | server |
| `/pricing` | `app/pricing/page.js` | server ("Coming Soon", same as App.jsx) |
| 404 | `app/not-found.js` | server, HTTP 404, auto `noindex` |
| `/login` | `app/login/page.js` + `SignIn.jsx` | client form, `noindex` |
| `/signup` | `app/signup/page.js` + `SignUp.jsx` | client form + OTP, `noindex` |
| `/climate-guides` | `page.js` + `ClimateGuidesClient.jsx` | server; 24 city cards are real `<a href>` in HTML |
| `/blog` | `app/blog/page.js` | server fetch (revalidate 600s); pager = real `?page=N` links; unknown page → 404 |
| `/blog/[slug]` | `page.js` + `ProductImage.jsx` | server fetch, `generateMetadata`, on-demand ISR, missing → 404 |
| `/trip-planner` | `page.js` + `TripPlannerTool.jsx` | h1/intro server, tool client |
| `/events` | `page.js` + `EventRiskTool.jsx` | h1/intro server, tool client |
| `/api-docs` | `page.js` + `ApiDocs.jsx` | whole page client component (SSR'd, all text in HTML) |
| `/weather/[citySlug]` | `page.js` + `ClimateCharts.jsx` + `MonthlyTable.jsx` | server fetch (revalidate 24h, on-demand ISR, no pre-built cities), charts client, unknown city → 404 |

- Only `src/pages/SignIn.jsx` / `SignUp.jsx` are imported by old `App.jsx`;
  `src/components/SignIn.jsx` / `SignUp.jsx` are unused → not ported.
- Titles/descriptions copied from old `RouteMeta.jsx` (layout template adds
  " — WeatherApex"). Blog post keeps old "`<meta_title>` | WeatherApex Blog".
- Dependency: `recharts@3.10.1` (exact version installed in the old project).

Small deliberate differences (look identical, needed for SEO/Next):
- `/weather/[citySlug]` table: all 12 rows are in HTML; rows 7–12 hidden with
  `hidden` class until "View Full Year" (old code did not render them at all).
- `/blog` Previous/Next: same classes, but enabled ones are `<a href="?page=N">`
  instead of state buttons.
- `/api-docs` code samples: base URL origin now from `NEXT_PUBLIC_SITE_URL`
  instead of `window.location.origin` (only matters when API base is relative,
  i.e. local dev; live uses the absolute `NEXT_PUBLIC_API_BASE_URL`).
- Loading skeletons for blog/city pages are gone — data is in the HTML now.

### Tests done
- Scratch script (raw server HTML, no JS) against dev and against
  `npm run build && next start -p 3001`: all public routes 200, exactly one
  `<h1>`, correct title/description, no `noindex`; `/login` `/signup` noindex;
  `/koi-ghalat-page`, `/blog/nahi-hai-xyz`, `/blog?page=99`,
  `/weather/qzxvnotacity` → HTTP 404 + noindex.
- `npm run build`: success, zero errors.
- Browser (390px): visited every route; no errors in dev log, no hydration
  warnings. London page charts render; "View Full Year" 6 → 12 rows.
- Backend calls used for checks: history `london` + one invalid city only.
- NOT yet done: side-by-side screenshot compare with the React site
  (owner needs to run it on another port, e.g. 5173).

### Notes / open items
- Dynamic 404s (`notFound()` inside `/blog/[slug]`, `/weather/[citySlug]`)
  return 404 status + noindex, but the 404 UI is filled in by the browser
  (raw HTML has no `<h1>`). Status code is what Google uses; fine for SEO.
- `/api-docs` is one large client component → bigger JS. Splitting into
  server/client parts is a Phase B performance task.
- `/climate-guides` "Plan a trip instead" is still a `<button onClick>`
  (parity). Phase B: make it a real link.
- `hooks/useHistorical.js` ported but unused (kept for parity; can be removed).

### Backend requests (not done — owner decides)
1. **SSR calls share one IP (corrected 2026-09-27).** `/api/weather/history/`
   is a *browsing* endpoint: it has only the per-minute burst guard
   (`WEATHER_ANON_PER_MINUTE`, default 600/min per IP) — **not** the
   3-per-day free feature quota (earlier note was wrong). Server-side
   rendering is fine for now. In production all SSR calls come from the
   Hostinger IP, so an internal header/API key that exempts the Next.js
   server would be good to add later. Not urgent.

---

## 2026-09-27 — Audit fixes round 1 (docs/CLAUDE_CODE_FIX_PROMPT_1.md)

### 1.1 Popular Destinations "no data / images" on owner's PC — diagnosed
Findings (dev server + local Django running):
- Django direct, 16 cities in parallel: all **200**, all have `image_url`,
  1.2–1.7 s each (1.8 s total).
- Same through the Next.js `/api` proxy: all **200**, all have `image_url`.
- A Pexels image URL: 200.
- Owner's Chrome (`localhost:3000`, screenshot): cards show temperature,
  photo and icon. Only console error = ColorZilla `cz-shortcut-listen`
  hydration warning (extension, not our code).
- **Root cause:** at the time of the report the servers were not running /
  the Chrome tab was attached to a dev server that had been restarted.
  Not a code, backend or data problem. No backend request needed.
- Note for testers: the Claude in-app browser pane was hidden (innerHeight 0),
  so `loading="lazy"` images never load there — not a site bug.
- Old React site on 5173 was not reachable during the check; comparison
  not needed because the new site works with the same backend.

Frontend hardening (owner said "haan"), `components/PopularDestinations.jsx`:
- Errored query (`isError` and no data) → no weather icon, only "—"
  (before: generic cloud icon suggested real weather).
- Pexels `<img onError>` → city added to `brokenImages` → card falls back
  to the existing skyline SVG + dark text (same as the no-image design).
- Test: in browser, dispatched `error` on Paris photo → skyline SVG shown,
  text dark, icon + temp kept; London card unchanged. Normal state unchanged.
- Not runtime-tested: the `isError` branch (no easy way to force a failed
  query without Playwright mocks — covered by Group 4 tests later).

### How CLS was measured (reproducible, no new dependency)
- Scratch tools (not in repo): `delay-proxy.mjs` on :8001 forwards to Django
  and delays only `/api/weather/current/` by 1500 ms; `cls.mjs` drives the
  installed Chrome headless over the DevTools protocol (Node 24 built-in
  WebSocket), clears localStorage (→ London; or `CITY=...`), sets
  390×844 mobile and 1440×900, records `layout-shift` (no recent input)
  and LCP, section heights while loading vs loaded, screenshots.
- Build for the test: `API_PROXY_TARGET=http://127.0.0.1:8001 npm run build`
  then `next start -p 3001` with the same env (rewrites are baked at build).

### 1.2 Home CLS (owner: haan, a + b)
- Baseline (before): **390px 0.919**, **1440px 0.543** (one big shift when
  data arrives). Section heights loading → loaded:
  WeatherCard 172→585 (390) / 172→665 (1440); **Radar 500→584** (heading
  "Weather Map" only appears after data — also fixed); Forecast 89→769.
- a) `components/WeatherBackground.jsx`: drops generated once
  (`useState(() => …)`); animation is now a transform: each drop sits in an
  `absolute inset-0` wrapper animated `y: 0% → 110%` (wrapper = container
  height, so the drop still travels −5% → 105%, same duration/delay/linear).
- b) New `components/HomeSkeletons.jsx` (`WeatherCardSkeleton`,
  `RadarSkeleton`, `ForecastSkeleton`) using the loaded components' exact
  wrappers/paddings/breakpoints with grey blocks. Used in `WeatherCard.jsx`,
  `ForecastTable.jsx`, `LiveSatelliteRadar.jsx`, `LiveSatelliteRadarLazy.jsx`.
  Forecast rows box is `max-h-[600px]` like the real one (backend sends 15
  days, so the real box is always capped at 600 px). Loaded design untouched.
- After: **390px CLS 0**, **1440px CLS 0**; section heights identical while
  loading and loaded at both widths. With a rainy city (New York, code 61):
  CLS 0 at both widths, drops visibly falling.
- If the loaded layout of these components changes, update the skeletons.

### 1.3 One `<h1>` on home (owner: option 1)
- `WeatherCard.jsx`: temperature `<h1>` → `<div>` with identical classes
  (`<p>` not used: it contains a `<div>`, which is invalid inside `<p>` and
  would cause a hydration error).
- `FeaturesSection.jsx`: `<h1>` text "Engineered for Accuracy" →
  "Weather Forecasts, Trip Planning & Climate Guides" (styling unchanged).
- Test: raw HTML 1 `<h1>`; after hydration 1 `<h1>` at 390 and 1440. CLS 0.

### 1.4 "TODAY" uses the city's date (owner: haan)
- `ForecastTable.jsx`: `isToday = dateStr === data.current.time.slice(0,10)`;
  dates parsed manually (`Date.UTC(y, m-1, d)`) and formatted with
  `timeZone: 'UTC'`.
- Test (Chrome timezone emulation, city Sydney, city date 2026-09-27):
  before, from Pacific/Honolulu (browser date Sep 26): **no row
  highlighted**, first row "SUN Sep 27". After: "TODAY Sep 27" highlighted
  from Honolulu, Asia/Karachi and Australia/Sydney; next rows "MON Sep 28"…
  correct in all three. CLS 0.

### 1.5 Affiliate links (owner: haan)
- `app/blog/[slug]/page.js`: `rel="sponsored nofollow noopener noreferrer"`.
- Test: `/blog/tokyo-guide` raw HTML contains the new rel. 11 posts have
  affiliate products. CLS 0.

### 1.6 "20 years" (owner: haan)
- Backend checked (read-only): `settings.py` `HISTORICAL_YEARS` default 20,
  `.env` `HISTORICAL_YEARS=20`.
- `app/weather/[citySlug]/page.js` subtitle "10+ years" → "20 years"
  (meta description already said 20). Test: HTML shows both. CLS 0.

### Owner notes ("Aakhir mein")
1. `app/layout.js`: `<body suppressHydrationWarning>` (ColorZilla
   `cz-shortcut-listen`). Only `<body>`'s own attributes are ignored.
2. Group 4 Playwright tests must cover the Popular Destinations `isError`
   state (failed query → "—" only, no icon). **TODO in Group 4.**
3. Backend request #1 corrected (see above).
4. Group 2 questions in `docs/QUESTIONS_ROUND2.md`, 2.1 first.

### Builds / checks this round
- `npm run build` after every item: 0 errors each time.
- Final full-route check on `next start`: all public routes 200 with one
  `<h1>`; login/signup noindex; 4 × 404 routes correct.
- Found (not fixed, asked in round 2): blog titles duplicate
  "| WeatherApex Blog" when backend `meta_title` already ends with it
  (e.g. `/blog/tokyo-guide`). Same behaviour as the React site.

---

## 2026-09-27 — Group 2: SEO foundation (answers in docs/QUESTIONS_ROUND2.md)

Test setup: scratch `delay-proxy.mjs` (now a logging proxy, :8001, writes
`backend-calls.log`) + scratch `serve.sh` (build with
`API_PROXY_TARGET`/`API_INTERNAL_URL` → :8001, `next start -p 3001`).
`npm run build` after every item: 0 errors.

### 2.1 City whitelist
- New `data/cities.js`: 154 cities copied (read-only) from backend
  `weather/management/commands/fetch_all_cities.py` `CITIES`, slug rule
  identical to backend (`name.lower().replace(" ", "-").replace(",", "")`;
  verified: no special chars, no duplicates) + `EXTRA_CITIES` Singapore
  (owner 2.1-a option A). Helpers `isKnownCity`, `getCity`, `citiesInCountry`.
- `app/weather/[citySlug]/page.js`: not in whitelist → `notFound()` before
  any backend call (metadata + page).
- New `proxy.js` (Next 16 name for middleware), matcher `/weather/:path*`:
  uppercase path → 308 to lowercase.
  **Why not `permanentRedirect()` in the page:** tested first — the ISR
  cache stored the `/weather/London` redirect and, on Windows'
  case-insensitive disk, served it for `/weather/london` too → redirect
  loop (308 to itself). Redirecting in proxy.js means the uppercase page is
  never rendered/cached. Retested in the failing order: London→308,
  london→200.
- Tests: `/weather/multan`, `/weather/xyz-nahi-hai` → 404 with **0 backend
  calls** in the log; `/weather/London|LONDON|New-York` → 308 lowercase;
  all 24 Climate Guides + 16 Popular Destinations slugs are whitelisted.
- `/weather/london/` still 200 — trailing-slash policy is an open decision
  (no redirect added); canonical covers duplicates.

### 2.2 Canonical + social tags
- `app/layout.js`: `metadataBase = NEXT_PUBLIC_SITE_URL`.
- New `utils/seo.js` `pageMetadata()`: canonical (lowercase, no trailing
  slash, no query except `/blog?page=N`), og:url/type/site_name/image,
  twitter `summary_large_image`. All pages use it (page `openGraph`
  replaces layout's, so the helper repeats siteName/type everywhere).
- `/blog?page=N`: own canonical, title "Blog — Page N", own description.
- Blog post: `type: article`, `featured_image` as og:image when present,
  `publishedTime`; title no longer doubles "| WeatherApex Blog" (2.2-b).
- New `app/og-image/route.js` (`next/og`, built in): 1200×630, brand
  gradient #002244→#0077b6, Navbar logo, page title (+ kicker).
  **Owner request:** city pages get the city photo (backend current
  `image_url`, whitelist only, cached 1 day, fetched only when the image is
  requested) under a dark brand overlay. Only one built-in font → title
  is regular weight (bold needs a font file in the repo — ask).
- Note: `public/favicon.svg` is the **Vite logo**, not WeatherApex —
  not used in the share image.

### 2.3 robots + sitemap
- `app/robots.js`: allow `/`; disallow `/api/`, `/login`, `/signup` (round 4: now only `/api/`);
  sitemap link. `/pricing` is NOT blocked there (Google must read its
  noindex tag).
- `app/sitemap.js` (revalidate 1h): 9 static pages, all blog posts (walks
  `/api/blog/posts/` pages, max 50), 155 whitelist cities = 176 URLs.
  `lastModified` only on blog posts (real `published_at`). History
  endpoint never called; build made 0 history calls.
- `/pricing`: `noindex` + out of sitemap until real pricing (owner).

### 2.4 JSON-LD
- New `components/JsonLd.jsx` (escapes `<` as `<`).
- Home: `@graph` Organization + WebSite. City: BreadcrumbList Home ›
  Climate Guides › City. Blog post: Article (headline, datePublished,
  image = featured or generated, author/publisher = WeatherApex
  Organization) + BreadcrumbList Home › Blog › Post. No FAQ schema.
- Organization logo = `/favicon.svg` (owner 2.4-a) — currently the Vite
  logo; replace when the brand logo arrives. No `sameAs` (2.4-b).

### 2.5 Favicon
- `app/icon.svg` (copy of `public/favicon.svg`) → Next emits
  `<link rel="icon">`; layout `icons` removed (avoid duplicate).
- `next.config.mjs`: `/favicon.ico` → `/favicon.svg` rewrite that is
  always present (also when `API_PROXY_TARGET` is empty in production);
  the two `/api` rewrite rules are unchanged. Dev server needs a restart.

### 2.6 Internal links (visible — screenshots sent, awaiting owner OK)
- a) `components/PopularDestinations.jsx`: "Climate guide →" `<Link>` in
  each card (bottom-right). `stopPropagation` on click/keydown so the
  card's switch-city action does not fire. Tested: card click → city
  saved, URL stays `/`; link click → `/weather/paris`, saved city unchanged.
- b) City page: server-rendered "More cities in {country}" (whitelist,
  max 6, hidden if none), Climate Guides card design.
- c) Navbar + Footer on `/terms`, `/privacy`, `/api-docs`, `/pricing`.
- Owner request (chosen by Claude as "C"): **Climate Guides cards show
  the city photo** (dark overlay, white text; plain white card if no
  photo / image error). Photos fetched on the server, cached 3 h; page
  uses `connection()` so the build does not loop over 24 cities.
  Measured: first visit 24 `current` calls (one per city), repeat visits
  0 calls. CLS 0 at 390/1440.

### scripts/seo-check.mjs (Group 4.1, done this round)
- Plain Node, raw HTML. Checks status, one `<h1>`, unique title +
  description, absolute canonical = own URL, no noindex on public / noindex
  on login, signup, pricing, 404s, og:url/og:image/twitter card, JSON-LD
  parses + `@type` (+ required types), affiliate `sponsored`, no doubled
  blog title, uppercase city → 308, unknown city → 404 (+ 0 backend calls
  with `BACKEND_LOG`), robots rules, sitemap validity, favicon.
- Result on `next start`: **249 passed, 0 failed** (first run found
  `/blog` and `/blog?page=2` sharing a description → fixed).

### Backend requests (added)
2. **Add Singapore to `fetch_all_cities.py` `CITIES`.** It is linked from
   Climate Guides and Popular Destinations and exists in the DB, but is not
   in the list. Frontend whitelist has it as an extra for now.
3. (from audit) `get_historical_overview` uses `round(x, 1) if x else None`
   → an average of exactly 0.0 °C becomes `None` (blank month).
4. (nice to have) read-only `GET /api/weather/cities/` so the whitelist can
   come from the backend instead of a copied list.

---

## 2026-09-27 — Round 3 (answers in docs/QUESTIONS_ROUND3.md)

### Hissa A — approvals
- A1–A4 approved as built (Climate guide link, More cities, Navbar/Footer
  on 4 pages, Climate Guides photo cards).
- A5: share image title/brand in **Inter Bold** — `app/og-image/Inter-Bold-latin.woff`
  (latin subset, 31 KB, from @fontsource/inter 5.2.8 via jsDelivr) +
  `Inter-OFL-LICENSE.txt` (SIL OFL 1.1). Server-only (read with fs in the
  route); never sent to the browser. woff instead of the 300 KB ttf:
  next/og supports woff, same glyphs for English.

### Hissa B — logo (Vite logo removed everywhere)
- `app/icon.svg` and `public/favicon.svg` = WeatherApex mark (blue circle
  #0077b6 + white Navbar cloud-check). `/favicon.ico` rewrite serves it.
- `public/logo.png` 512×512 transparent, rendered from icon.svg with the
  installed Chrome (scratch `svg2png.mjs`). JSON-LD Organization logo →
  `/logo.png`.

### 3.1 day/night icons
- `utils/meteoconsMap.js`: 45/48 → fog-day, 80/81 → partly-cloudy-day-rain,
  85 → partly-cloudy-day-snow, 95/96/99 → thunderstorms-day; night variants
  added to `NIGHT_VARIANTS`.
- New `scripts/check-icons.mjs` (`npm run check:icons`): every WMO code
  0–99 × day/night; 20 unique URLs all **200**; unknown codes → cloudy;
  no day icon at night. All passed.

### 3.2 °C / °F (+ km/h / mph)
- New `context/UnitsContext.jsx` (in `app/providers.jsx`). Server + first
  render always °C (hydration safe); in `useEffect`: saved choice
  (`localStorage.weatherApex_units`) > browser language `en-US` → °F >
  °C. °F pairs with mph, °C with km/h.
- **Bug found & fixed:** the weather card showed wind as "m/s" but the
  backend sends km/h (Open-Meteo default; backend never sets
  `wind_speed_unit`). Same wrong label in the hourly Wind tab.
- WeatherCard: the stacked "°C °F" became the toggle (two buttons, same
  size; active one #0077b6, `aria-pressed`). Converted: WeatherCard
  (temp, hourly, graph, wind), ForecastTable, PopularDestinations, Radar
  subtitle/popup, Event Risk (RiskResult temp + wind label,
  NearbyDatesComparison), Trip Planner cards, city page (stats via
  `UnitTemp`, narrative via `ClimateNarrative` — `generateClimateNarrative`
  got an optional formatter —, MonthlyTable, temperature chart).
  City page server HTML stays °C (SEO), switches in the browser.
- Tests (headless Chrome): en-US → °F + mph, en-GB → °C + km/h; CLS 0 at
  390/1440; no console/hydration errors. Toggle: °C chosen under en-US →
  persisted, city page shows °C; `F` saved → city page 71.4°F, table
  "Jan 45.3°F 35.8°F".
- Note: the toggle exists only in the home weather card (spec); the choice
  applies site-wide.

### 3.3 mobile Long-range Forecast
- `ForecastTable.jsx`: below `md` each day is a stacked row (day/date,
  icon, condition + full description, hi/lo + rain; "Night: …" aligned
  under the condition). Desktop grid row unchanged (`hidden md:grid`).
  Column header hidden below md — also in `ForecastSkeleton`.
- Tests: 390px 0 truncated elements, no horizontal scroll, CLS 0; section
  heights equal loading vs loaded (727 px @390, 769 px @1440).

### Group 4 — Playwright (owner approved install)
- `@playwright/test` 1.63.0 (devDependency, exact). Chromium downloaded
  on the 2nd try (1st: "Download failure"); ~250 MB download, ~700 MB on
  disk in `%LOCALAPPDATA%\ms-playwright`.
- `playwright.config.mjs` (starts `next start -p 3100` or uses
  `PW_BASE_URL`), `tests/e2e/helpers.mjs` (mocks `/api/weather/current/`,
  blocks third-party tiles/geo/GSI), `tests/e2e/site.spec.mjs`,
  fixture `tests/e2e/fixtures/current-london.json` (one real response).
- Covers: landing data, Popular Destinations switch + "Climate guide" link
  + failed-city "—"/no icon (owner note), search, mobile menu, °F/°C +
  persistence, free-limit modal (mocked 429), sign-in validation, OTP paste,
  blog list → post, 404, home CLS < 0.1 @390/1440 with 1.5 s delay, no
  console errors + no horizontal scroll on 13 routes @390/768/1440,
  Trip Planner cards @390/1440.
- npm scripts: `seo-check`, `check:icons`, `test:e2e`. `.gitignore`:
  Playwright output folders.
- Run before N3 implementation: **17/17 passed**, CLS 0.0000 both widths;
  seo-check 249/0; icons all passed.

### N1 / N2 — city page photo (hero + CTA)
- New `services/cityPhoto.js`: `getCityPhoto(slug)` (whitelist only, 3 h
  cache, null on failure) + `pexelsSized/pexelsSrcSet`. Also used by
  Climate Guides cards and the share image (one shared cache).
- Hero: `<img>` absolute behind the text, `srcSet` 640–1920 w,
  `sizes=100vw`, `fetchPriority="high"`, not lazy, width/height set,
  alt "{City}, {Country} skyline". Overlay `#001528` 70 % → 85 %:
  worst case (white photo) white text ≈ 7:1, text-blue-200 ≈ 4.9:1.
  No photo → old blue gradient.
- CTA: same photo, `loading="lazy"`, same overlay.
- Measured (cache disabled): before CLS 0, LCP 356 ms (390, text) /
  140 ms (1440). After: CLS 0, LCP (photo) 0.67–1.0 s (390) /
  0.42–1.2 s (1440) — under the 2.5 s "good" line. Mobile gets w=640.

### N3 — Trip Planner day cards
- Logic (frontend-only), new `app/trip-planner/dayInsights.js`:
  reason line comes ONLY from backend `recommended_activity` with the
  backend's thresholds (rain 50, wind 30, hot 32, mild 18–28; score 20/20);
  wind checked at every temperature; `bestTimeOfDay(day_parts)` using the
  backend score formula (shown only if parts differ); `scoreBand`
  (Excellent ≥ 8.5, Good ≥ 7, Fair ≥ 5, Poor); `formatDay` (UTC, "Fri, Oct 2").
  `ACTIVITY_META` moved here. Old `getActivitySuggestion` removed.
- Two options were built on a temporary noindex page and screenshotted;
  owner chose **Option 2 (big cards)**. Option 1 and the preview page were
  deleted.
- `app/trip-planner/DayCard.jsx` (+ `ScoreLegend`): date + "Best day" /
  "Least ideal" pill, "9.3 / 10" + word badge, icon + condition, labelled
  metrics (High/Low, Rain chance, Wind), "Best for" chip, "Best time"
  chip, reason text-sm gray-600, °C/°F + km/h/mph. Grid 1 / 2 / 3 columns.
- Summary strip: "Worst Day" (red) → "Least ideal" (amber); dates formatted.
  Loading skeleton matches the new grid/card size.
- Playwright test with a mocked `/api/trips/plan/` (5 sample days):
  passes at 390 and 1440 (legend, 5 × "/ 10", all four words, Least ideal,
  Best for/time, no raw YYYY-MM-DD, no horizontal scroll).

### Final checks (round 3, `next start` on :3001)
- `npm run build`: 0 errors (after every item).
- `npm run seo-check`: **249 passed, 0 failed**.
- `npm run check:icons`: all passed.
- `npm run test:e2e`: **19/19 passed** (home CLS 0.0000 @390 and @1440).

### Backend requests (added)
5. **Activity rules (report only):** `trip_planner/activity.py` starts
   `beach_water` at 18 °C (18–28 °C + coastal + rain < 20 %) — 18 °C is
   cold for a beach; activity looks only at `temp_max`, not `weather_code`
   (snow/thunder) or `temp_min`.

---

## 2026-09-27 — Round 4 (small fixes)

1. **robots.txt:** only `/api/` is disallowed now. `/login`, `/signup`
   (like `/pricing`) rely on their `<meta name="robots" noindex>` —
   blocking them in robots.txt would stop Google from reading that tag.
   `scripts/seo-check.mjs` now asserts `/api/` is disallowed and that no
   noindex page (login, signup, pricing) is blocked.
2. **City page temperatures in both units** (narrative, the two
   temperature stats, monthly table): new `tempDual1` in
   `context/UnitsContext.jsx`; server HTML = "21.9°C (71.4°F)"; in the
   browser the chosen unit comes first ("71.4°F (21.9°C)" for °F users).
   Toggle behaviour unchanged; temperature chart axis stays single-unit.
   Why both, not a switch to one unit after load: removing the bracket
   would shorten the narrative and shift the page (CLS).
   Tests (headless Chrome, `next start`): raw HTML has dual values in all
   three places; en-GB and en-US → CLS 0 at 390/1440, 0 console/hydration
   errors, no page overflow. On 390px the table cells wrap to two lines
   (°F / (°C)); the table already scrolls inside its own box.
3. Removed the stale favicon line from "Known issues" (Vite favicon was
   replaced in round 3 B1).
- `npm run build` after each item: 0 errors.

---

## 2026-09-27 — Phase C: PREVIEW (answers in docs/QUESTIONS_PHASE_C.md)

Nothing is live yet: every new page is `noindex`, not in the sitemap and not
linked from any live page. Section 3 (redirects, sitemap, links, tests) waits
for the owner's "haan".

### Local DB check (owner note, point 1) — read-only
- `psql` with `PGOPTIONS=-c default_transaction_read_only=on` (verified
  `on`), one SELECT over `weather_city` / `weather_historicalweather`,
  password taken from backend `.env` into the environment (never printed).
- Complete = 240 rows for 2006–2025 (backend `target_year_range`).
- Whitelist 155: **64 complete**, 3 partial (karachi, islamabad, quetta —
  10 years), **88 empty**, 0 missing. London, New York and all 5 UK cities
  complete; of 27 US cities only New York.
- Snapshot saved as `data/historyReady.js` (temporary, local).

### Data
- `data/countries.js`: 53 countries/territories (backend's 51 + Singapore +
  **Hong Kong split from China** per owner), display name / slug / ISO2 /
  6 regions; `USA`→United States, `UAE`→United Arab Emirates.
  All 155 cities map; 12 one-city countries; 41 country pages (1.3 option A).
- `services/history.js`: shared `getHistory` (one URL + 24 h cache for the
  city page and its 12 month pages) and `getHistories` (only
  `HISTORY_READY` cities, max 6 per page).
- `utils/climateMath.js`: months, year range (2006–2025, like the backend),
  neighbour comparison, ranks, visit verdict (Great/Good/Fair/Poor with
  reasons), month packing, annual mean.

### Routes (preview)
- `app/weather/[citySlug]` → `app/weather/[slug]`: a city slug still renders
  the **live** old city page; a country slug renders the country preview.
  City design moved to `components/climate/CityClimate.jsx` (+ ClimateCharts,
  MonthlyTable, UnitText moved to `components/climate/`).
  **Check:** old `/weather/london` HTML (scripts/asset hashes stripped) is
  byte-identical to the previous build (27,739 chars).
- `/weather/[country]/[city]` (same CityClimate, new breadcrumb, proper
  country name), `/weather/[country]/[city]/[month]` (MonthGuide),
  `/weather` hub, `/weather/[country]` (CountryClimate). Params checked
  before any backend call (`app/weather/[slug]/resolve.js`).
- Month page: hero photo + breadcrumb + H1, quick answer, 6 stat cards
  (dual units, mm + in), neighbour comparison + ranks, 12 linked month
  chips with mini bars, verdict, packing, "{month} in other {country}
  cities" (capped), CTA, data note (2006–2025). Title "London Weather in
  October: Temperature, Rain & Tips" (51 chars). Global "warmest/driest
  places" lists **skipped** — they need all 155 histories (request #7).
- Country page: computed intro, photo city cards, month × city table (cell
  links, sticky first column, scrolls inside its box), best months.
- Trip Planner does not read query params, so the month CTA cannot prefill
  dates yet (links `/trip-planner?city=` like the city page).

### Measurements (next start, cold fetch cache per page)
| Page | Time | history calls | current (photo) calls |
|---|---|---|---|
| /weather/united-kingdom/london/october | 1.6 s | 5 | 1 |
| /weather/united-states/new-york/july | 1.4 s | 1 | 1 |
| /weather/united-kingdom | 2.7 s | 5 | 5 |
| /weather | 0.16 s | 0 | 0 |
| /weather/united-kingdom/london | 0.7 s | 1 | 1 |
| /weather/united-states | 0.8 s | 1 | 1 |
- CLS 0 on all six at 390 and 1440; LCP 0.1–0.8 s; 0 console errors.
- 404 without backend call: `/london/smarch`, `/france/london`,
  `/hungary` (1-city country; becomes 308 in section 3),
  `/united-states/multan`, `/narnia`, `/china/hong-kong`.
- **Mistake:** while testing I opened `/weather/hong-kong/hong-kong`; Hong
  Kong's local history was empty, so that one request made the local
  backend fetch its 20 years from Open-Meteo (~261 weighted calls, once).
  Tests now use only complete cities.
- Fixes after the first screenshots: packing adds "Light Jacket" for 12–18°
  highs and no longer prints a °C-only difference; country intro only says
  "warmest/coolest" when ≥ 2 cities have data; data note layout on mobile.

### Backend requests (added)
6. **(1.4) Promote cities automatically:** read-only endpoint listing cities
   whose 20-year history is COMPLETE in the DB, so popular user-searched
   cities can get SEO pages without ever calling Open-Meteo on render.
7. **(owner note 3) Climate summary from the DB only:** e.g.
   `GET /api/weather/climate-summary/?cities=london,paris` or `?country=US`,
   monthly averages for many cities in one call, never Open-Meteo. Replaces
   `data/historyReady.js` and the 6-call cap; enables full country tables
   and the global "warmest/driest in {month}" lists.
- Before deploy: confirm the VPS seeding loop finished
  (`tail -n 20 /root/seed.log`); 1,860+ month URLs can make Googlebot hit
  many cities quickly.

---

## 2026-09-27 — Phase C2 (FINAL structure) — PREVIEW
Brief: `docs/CLAUDE_CODE_PHASE_C2_PROMPT.md` (replaces the earlier Phase C
URL decisions). Owner: plan "haan"; Markdown → own tiny parser (no library).
Nothing is live: Section 2 pages are `noindex`, not in the sitemap; the
Section 1 box and the `/climate-guides` Section 2 cards render only with
`NEXT_PUBLIC_PHASE_C2_PREVIEW=1` (local `.env.local`).

### Structure
- **Section 1** (unchanged, live): `/climate-guides` cards, `/weather/{city}`
  (20-year page). No redirect for `/weather/{city}`.
  Flag OFF: `/weather/london` HTML byte-identical to the pre-Phase-C live
  page (scripts/asset hashes stripped). Flag ON: one new box "See {City}
  weather month by month →" + 12 month links (`components/climate/CityClimate.jsx`
  `monthByMonth` prop).
- **Section 2** (preview): `/weather` hub (H1 "Weather by Country"),
  `/weather/{country}` (H1 "{Country} Weather by City & Month"),
  `/weather/{country}/{city}` — NEW page `components/climate/CityByMonth.jsx`
  (intro from year extremes, relative best 3 months, 12 month cards with
  their own data + verdict + link, link to Section 1, other cities),
  `/weather/{country}/{city}/{month}` — `MonthGuide.jsx` rebuilt: 12-row
  "{Month} vs the rest of the year" table (row links, highlighted row,
  sticky first column, summary line), chips, data-driven article (4 H2),
  absolute verdict + relative rank (#n of 12), optional travel note,
  other cities (all linked, data for loaded ones), related blog posts,
  CTA, data note.
- `/climate-guides` Section 2: white cards (the original card style, so
  the two sections look different) → `/weather/{country}/{city}` +
  "Browse all countries" → `/weather`.
- Singapore / Hong Kong: `/weather/singapore` stays the Section 1 page (200);
  Section 2 is `/weather/singapore/singapore`. Hero text no longer says
  "Singapore, Singapore".

### Data / limits
- `data/historyReady.js` is used ONLY when `HISTORY_READY_LOCAL=1` (local
  `.env.local`). In production (flag absent) every whitelisted city is
  available and only the 6-call cap applies. Without backend request #7,
  production country pages show at most 6 cities' data.
- `data/cityTags.js`: read-only copy of backend `seed_city_tags.py`
  (154 cities; Singapore missing → no tags) for "Who {Month} suits"
  (backend `activity.py` thresholds; rain = rainy_days ÷ days in month;
  the wind rule is not applicable to monthly averages).
- `utils/climateMath.js` (+ rankMonths, bestMonths, warmerThanCount,
  yearExtremes, monthSuits). `utils/markdown.jsx`: headings, paragraphs,
  lists, bold/italic, http(s)/relative links; React elements only (no
  dangerouslySetInnerHTML). `services/guides.js` reads
  `content/guides/<city>/<month>.md` (slug-checked).
  Sample: `content/guides/london/october.md` (marked SAMPLE — owner verifies).
- `services/blogPosts.js`: related posts by city name/slug (blog list,
  1 h cache — same URLs as the sitemap).

### Singapore verdicts (local data, shown to owner before finalising)
All 12 months "Fair" (score 5–6): 28–29 °C highs, 17–28 rainy days,
8–10 h sun. Relative rank separates them: best Feb, Sep, Jul; worst Nov,
Dec. Month page shows both (absolute + "#n of 12").

### Measurements (next start, cold fetch cache per page, flag ON)
| Page | Time | history | current (photo) | other |
|---|---|---|---|---|
| /climate-guides | 1.4 s | 0 | 24 | — |
| /weather/london | 0.8 s | 1 | 1 | — |
| /weather/united-kingdom/london | 0.6 s | 1 | 1 | — |
| /weather/united-kingdom/london/october | 1.0 s | 5 | 1 | 2 blog list |
| /weather/united-kingdom | 1.7 s | 5 | 5 | — |
| /weather | 0.2 s | 0 | 0 | — |
| /weather/singapore/singapore | 0.7 s | 1 | 1 | — |
- CLS 0 on all 7 at 390 and 1440; exactly one H1; 0 console errors.
  LCP 0.1–0.7 s except `/climate-guides` 1.7 s (390) / 2.4 s (1440) —
  caused by the round-2 photo cards (24 Pexels images), not by the new
  section; worth improving before launch (e.g. first row eager + smaller).
- Fixes after first screenshots: comparison sentence ("4°C (7.2°F) cooler
  than September"), duplicate "Singapore, Singapore".

---

## 2026-09-27 — Phase C2 LIVE (Section 3) — owner "haan" with conditions

### Owner conditions
1. `content/guides/london/october.md`: "Sample — please verify" line
   removed (Zain checked: BST last Sunday of October, half-term, free
   museums). Comment at the top records the check.
2. `/climate-guides` LCP: cards now load a card-sized Pexels image
   (`w=400`, srcset 400/800, `sizes` per grid) instead of the full
   1200 px photo; first 4 cards `loading="eager"`, only the first
   `fetchPriority="high"`, the rest lazy. Design unchanged.
   New `utils/pexels.js` (pure helpers, also re-exported by
   `services/cityPhoto.js`). Country page cards use the same small image.
   **LCP: 390px 1.7 s → 0.54–0.88 s; 1440px 2.4 s → 0.25–0.28 s** (target
   < 2.0 s). CLS 0, 0 console errors.
3. Country page: month × city table shows ONLY cities whose data loaded
   (no "—" rows); section hidden if none; all city cards (links) stay;
   intro/best months only from loaded data. **Until backend request #7
   exists, production country pages show at most 6 cities in the table.**

### Section 3
- `noindex` removed from `/weather`, `/weather/{country}`,
  `/weather/{country}/{city}`, `/weather/{country}/{city}/{month}`.
- Preview flag `NEXT_PUBLIC_PHASE_C2_PREVIEW` removed from code,
  `.env.local` and `.env.example` — local and live render the same
  (Section 1 box + `/climate-guides` Section 2 always on).
  `HISTORY_READY_LOCAL=1` stays local-only (documented in .env.example).
- Sitemap: static + blog + Section 1 (155) + `/weather` + 41 country +
  155 city-by-month + 1,860 month = **2,233 URLs**; no history calls;
  lastModified only on blog posts; 1-city country pages excluded.
- `proxy.js` (one hop, 308): trailing slash removed site-wide (not `/`,
  never `/api/*` — matcher excludes api, _next and files); `/weather/*`
  lowercased; 1-city country → its city-by-month page (singapore /
  hong-kong are Section 1 city pages → no redirect, no loop).
  **Bug found & fixed:** `request.nextUrl.clone()` re-added the trailing
  slash when formatting (`/about/` → `/about/` loop); now `new URL(request.url)`.
  Verified with `curl -L`: every case 1 hop → 200; query strings kept.
- `next.config.mjs` comment updated (trailing-slash decision made).
- `public/llms.txt` (site description, climate guide sections, tools,
  sitemap). robots.txt unchanged: all bots allowed except `/api/`.
- Internal links: hub → country → city-by-month → month; month ↔ month
  (12-row table + chips); Section 1 box ↔ "Full 20-year climate guide";
  `/climate-guides` → both sections + "Browse all countries".

### Tests (next start :3001, local backend via logging proxy)
- `npm run build`: 0 errors.
- `npm run check:icons`: all passed.
- `npm run seo-check` (`SEO_ALL=1 HISTORY_READY_LOCAL=1`): **2,088 passed,
  0 failed**. Includes: all 849 Section 2 pages of the 64 locally
  complete cities fetched (11,037 checks, 0 failed — one H1, self-canonical,
  no noindex, og/twitter, BreadcrumbList); 872/872 fetched titles and
  descriptions unique; **offline: 2,212 generated titles for every sitemap
  page unique**; redirects (7 cases, 1 hop, target 200); singapore /
  hong-kong / london no redirect; `/api` untouched; 404s (`smarch`,
  `united-states/multan`, `france/london`, `china/hong-kong`, `narnia`,
  `multan` with 0 backend calls); sitemap counts 155/41/155/1,860.
  New in the script: `SEO_ALL` mode, offline title check, redirect checks,
  Section 2 routes, sitemap section counts.
- `npm run test:e2e`: **25/25 passed** — new: Section 2 CLS < 0.1 + one H1
  at 390/768/1440 (6 pages), Section 1 ↔ 2 links, month table links,
  1-city redirect + Singapore no loop; Section 2 pages added to the
  no-console-error / no-horizontal-scroll checks.

### Before deploy (owner)
- Confirm the VPS seeding loop finished (`tail -n 20 /root/seed.log`):
  2,233 URLs can make Googlebot request many cities quickly; a city
  without complete history makes the backend call Open-Meteo.
- Backend requests #6 and #7 still open (see above).

### Known issues in the React site (kept as-is, not fixed)
- Footer shows "© 2024".
- Footer placeholder `#` links (Careers, Scientific Board, Press Room, Cookie Settings).
- Newsletter form only does `console.log`.
- "Forgot password?" is `href="#"`.

---

## 2026-09-28 — Content round (docs/CLAUDE_CODE_CONTENT_ROUND_PROMPT.md) — A + B1–B4 + D (waiting for owner "haan")

### A — repetition / wording
- Month article no longer repeats the numbers: it interprets them (season,
  how the day feels, day–night swing, humidity meaning, rain character).
  New: `utils/monthNarrative.js` (facts only), `components/climate/MonthStory.jsx` (text).
- "Who {Month} suits": Beach / Hiking rows only when the city is coastal /
  has trails; "Museums & indoor" only as a positive tip (rain on most days,
  > 32°, < 5°); new "Parks & outdoor" row (backend 15–26° rule).
- Variety: every sentence has 2–4 phrasings; the choice is an FNV hash of the
  page's own numbers (`pick(seed, salt, …)`), no Math.random — same page, same text.
  Tip-card texts and some "suits" reasons also vary this way.
- Duplicate "not a forecast / use the Trip Planner" line under the verdict removed;
  data note is one sentence.
- A4 (Section 1 meta description + "Singapore, Singapore"): **proposal sent to owner, not changed.**

### B1–B4
- B1 Daylight: `utils/solar.js` (NOAA formula, 15th of the month, local time via
  `Intl` + IANA tz from `data/cities.js`), change vs previous month, sunshine as % of daylight.
  Checked: London 15 Oct 7:22 am / 6:10 pm / 10 h 47 min (matches published tables).
- B2 Season by hemisphere; |lat| < 23.5: dry/wet only if driest 4 months < 35% of
  wettest 4, otherwise "warm all year" (Singapore → warm all year).
- B3 Rain character: mm per rainy day (light < 4, moderate < 9, heavy) vs the city's yearly mm per rainy day.
- B4 "Quick questions" H2 + 4 H3 (warmth, rain, what to wear, this month vs next). No FAQ schema.
- `monthPacking`: no "layers" tip when nights stay ≥ 22°.

### D
- 429 safety net verified: proxy on :8002 returning 429 for photo, blog and other
  cities' history → month page still 200, those sections just empty (all already caught).

### Test — `npm run content-check` (12 cities × 4 months, next start :3001)
| | before | after |
|---|---|---|
| same country + same month overlap (max / median) | 97% / 80% | **45% / 38%** |
| all pairs median | 65% | 25% |
| prose words (<p>/<li> only) min / median | 293 / 310 | **380 / 451** |
| sentences on every page | 11 | **2** (CTA line, data note) |
Result **PASS**. Note: no southern-hemisphere city has complete local data — re-run on live data.
- Build OK · seo-check SEO_ALL **2088 passed, 0 failed** · e2e **25/25** ·
  CLS 0 at 390/1440 (London Oct, Dubai Jul), LCP 368–732 ms, 1 H1, no console errors.

### Backend requests (added)
8. **Internal key/header for SSR calls** so the Next.js server is not counted in the
   per-IP anonymous burst limit (`WEATHER_ANON_PER_MINUTE`, 600/min). A month page can
   make up to ~8 backend calls (history ×≤6, photo, blog); many new pages crawled at once
   from one server IP could hit 429. (Extends #1.) Frontend safety net is in place meanwhile.

## 2026-09-28 — Owner decisions after content round

### A4 — Section 1 meta description (owner text, metadata only)
- `/weather/{city}`: "{City} climate: 20-year averages ({start}–{end}) for temperature,
  rainfall, rainy days and sunshine, with charts for the whole year and a full monthly
  table." City name only, so Singapore / Hong Kong never doubled. Design unchanged.
- seo-check: new `cannibalizationCheck` — Section 1 description has no "month by month",
  no "X, X", and word overlap with the same city's Section 2 description < 35%.
  SEO_ALL now also fetches Section 1 city pages.
  Result: 64 city pairs, max overlap **12%**; **2401 passed, 0 failed**.

### Southern hemisphere — `npm run season-check` (no DB; lat/lon/tz only)
All 10 PASS: Sydney Oct = mid spring (south), +1 h 3 min daylight vs mid-Sep;
Buenos Aires Jun = early winter (south), shortest day of the year (9 h 51 min);
Singapore = warm all year, day length 12 h 3 min – 12 h 12 min;
London Dec = early winter, shortest days (7 h 53 min); Sydney Jan = summer; Cape Town Jul = winter.

### C — travel note drafts (started)
- Final top-30 list (owner): the 24 Climate Guides featured cities minus Karachi, Lahore,
  Islamabad (21) + Lisbon, Prague, Athens, Hong Kong, Los Angeles, Bali + Miami,
  San Francisco, Orlando (all in the whitelist).
- `content/guides-drafts/london/*.md`: 12 drafts, 133–154 words each (without sources),
  each ends with "Sources to check" (official sites). Only yearly recurring facts;
  no prices / opening times; dates only as rules (e.g. "last Sunday of March") or fixed
  days (1 Jan, 5 Nov, 25 Dec). Drafts are not rendered (checked: /…/london/june has no
  "Travel notes"). october.md draft = a longer version of the already published note.
- **Waiting for owner review** before Paris, New York, Dubai, Tokyo.

### C — London published, Paris drafted (2026-09-29)
- Owner review of London: free-museum line kept only in Jan + Nov (Feb → Six Nations /
  Twickenham, Aug → open-air theatre, Oct → early darkness + autumn parks); specific
  sources (london.gov.uk Lunar New Year + St Patrick's Festival event pages, Royal British
  Legion Remembrance Sunday page); October comment "facts reviewed 2026-09-28".
- **Published:** 12 notes moved to `content/guides/london/` (October replaced).
  `services/guides.js` now cuts the "## Sources to check" section before rendering
  (kept in the file for verification, not shown on the page).
- `content-check` now takes `CITIES=` / `MONTHS=all`. London 12 months: all-pairs
  overlap max 35% / median 23%, prose 557–613 words; full 48-page run still PASS
  (45% max, prose min 380, 2 common sentences). seo-check 2401 / 0.
- Paris: 12 drafts in `content/guides-drafts/paris/` — **waiting for owner review.**
- **Paris published** (owner "haan", 2026-09-29): 12 notes in `content/guides/paris/`.
  Paris 12 months: overlap max 37% / median 23%, prose 577–632; full run PASS (max 42%).
  seo-check 2401 / 0. (Logging proxy :8001 had stopped — restarted before the build.)
- New York: 12 drafts in `content/guides-drafts/new-york/` (125–153 words) — **waiting for owner review.**

### C — New York review (docs/CLAUDE_CODE_NEWYORK_REVIEW_PROMPT.md, 2026-09-29)
- Process rule: a city's notes are published only after owner's "haan" following review.
- Fixes: April Easter ("usually in April, sometimes in late March"); June Pride ("passing
  through Greenwich Village, near the Stonewall National Monument"); September US Open
  ("first half of September") + Feast of San Gennaro bullet (sangennaronyc.org);
  November "Getting around" → Thanksgiving balloon inflation (ferry/NMAI only in January).
  Restaurant Week left out.
- Sources: march → nyctourism.com (nycgo.com gives no response; NYC Tourism's site is now
  nyctourism.com); april → nyctourism.com Easter Parade page (200); july → NYCEM extreme-heat
  page (200); august → mta.info; december new.mta.info → mta.info (403 bot-block).
- New `npm run guides:list` (published / draft per city-month + 120–250 word check).
  London 12 P, Paris 12 P, New York 12 D; all within 120–250.
- content-check full run PASS (max 42%). New York pages without notes: max 59% (Jul/Aug,
  near-identical climate); with the draft notes added offline (scratch script, no code
  change): **max 46%**, median 23%. NY notes vs each other max 2%, vs London/Paris max 7%.
  content-check now also prints the top 3 overlapping pairs. seo-check 2401 / 0.
- Note: python edits on Windows had written CRLF; all content .md normalised back to LF.
- **Waiting for owner "haan"** to move New York to content/guides/.
- **New York published** (owner "hn", 2026-09-29). NY pages with notes: max 45% (Jul/Aug),
  prose 588–621. guides:list 36 published. seo-check 2401 / 0.

### C — Dubai drafts (2026-09-29) — waiting for owner review, NOT published
- 12 drafts in `content/guides-drafts/dubai/` (132–153 words).
- Islamic dates never tied to a fixed month: written as expected years (Ramadan mostly in
  Feb in 2027 + 2028; Eid al-Fitr early Mar 2027 / late Feb 2028; Eid al-Adha mid-May 2027 /
  early May 2028; Islamic New Year early Jun 2027 / late May 2028; Prophet's Birthday mid-Aug
  2027 / early Aug 2028), "depends on the moon sighting".
- Weekend Sat–Sun since 2022 (u.ae working-hours page), National Day 2 Dec + Commemoration
  Day 1 Dec, DSF (Dec–Jan), DSS (summer), Global Village (~Oct–May), Dubai Fitness Challenge
  (Nov), Dubai Airshow (Nov, odd years), Dubai World Cup (late Mar / early Apr), GITEX (Oct).
- Overlap: notes among themselves max 8%, vs other cities max 3%; pages + draft notes
  (offline): max 40%, median 24%.
- **Dubai published** (owner "han", 2026-09-29). Dubai pages with notes: max 40%, prose 503–619.
  guides:list 48 published. seo-check 2401 / 0.

### C — Tokyo drafts (2026-09-29) — waiting for owner review, NOT published
- 12 drafts in `content/guides-drafts/tokyo/` (127–158 words). Holidays from the Cabinet
  Office list; rules ("second Monday of January", "third weekend of May", "last Saturday of
  July"); rainy season / cherry blossom per JMA as "usually"; no DST in Japan (not mentioned).
- Fixed during self-check: June "only month without a national holiday" → December too.
- Overlap: notes among themselves max 3%, vs other cities 3%; pages + draft notes (offline)
  max 39%, median 24%.
- **Tokyo published** (owner "han", 2026-09-29). guides:list 60 published (5 cities x 12).
- Owner choice: remaining 25 top-30 cities in batches of 5 (drafts → review → publish). Batch 1: Barcelona, Rome, Sydney, Singapore, Bangkok.

### C — Batch 1 drafts (2026-09-29) — waiting for owner review, NOT published
- 60 drafts: Barcelona, Rome, Sydney, Singapore, Bangkok (`content/guides-drafts/…`), all 120–250 words.
- Checked facts via search: Barcelona free museum Sundays (barcelona.cat), Italy
  "Domenica al Museo" (first Sunday), Singapore 2027 gazetted holidays (MOM, June 2026),
  Thailand Buddhist-holiday alcohol rules (changed 2025 → written as "restricted, with some
  exemptions … check locally").
- Overlap: notes vs other cities max 12% (Barcelona/Paris March, shared EU clock-change line);
  pages + draft notes (offline): Barcelona max 41%, Rome 49% (Jun/Jul), Singapore 48%.
  Sydney + Bangkok pages NOT opened (no complete local history → would call Open-Meteo);
  only note-vs-note overlap measured (≤ 5%).
- Unreachable from here (000) but found via search: musei.cultura.gov.it, turismoroma events page,
  parcocolosseo.it. 403 bot-blocks: tourismthailand.org, city2surf.com.au.

### Batch 1 review + live Dubai fix (docs/CLAUDE_CODE_BATCH1_REVIEW_PROMPT.md + CLAUDE_CODE_FRONTEND_FINISH_PROMPT.md, 2026-09-29)
- **Live Dubai:** October — GITEX removed (moved to December at Expo City from 2026), new
  bullet Dubai Fitness Challenge ("very end of October or 1 November", 2026 edition
  31 Oct – 29 Nov) + source dubaifitnesschallenge.com (403 bot-block, real domain); 126 words.
  December — "busiest times to visit, and hotels book up early" + GITEX December line.
  August — "hotel demand" instead of "hotel prices".
- **Batch 1 drafts:** Bangkok Aug "the late Queen Sirikit"; Bangkok Mar "traditionally fly
  kites"; Rome Nov "spring and early autumn"; Sydney Oct/Nov Sculpture by the Sea wording
  ("in most years" / "in years when it is held"); Sydney Dec "second half of December";
  Sydney BoM links → https; Singapore Jul haze bullet + haze.gov.sg removed, new bullet about
  National Day flags going up in July (141 words).
- Checks: build OK (0 errors) · content-check PASS (same-country max 42%; per published city
  max London 35 / Paris 37 / New York 45 / Dubai 40 / Tokyo 39%) · Batch 1 with draft notes
  (offline): Barcelona 41, Rome 49, Singapore 48% · seo-check 2401 / 0 · e2e 25/25 ·
  check:icons all passed · guides:list 60 P + 60 D, all 120–250 words.
- **Waiting for owner "haan"** to publish Batch 1.

### Batch 1 published (owner "haan", 2026-09-29)
- Barcelona, Rome, Sydney, Singapore, Bangkok → `content/guides/`. guides:list **120 published
  (10 cities × 12), 0 drafts**, all 120–250 words. seo-check 2401 / 0. content-check PASS
  (same-country max 37%); per city max: Barcelona 41, Rome 48, Singapore 48%.

---

## Frontend status before backend work (2026-09-29)

### 1. Finished — final numbers (next start :3001, local backend via proxy)
| Check | Result |
|---|---|
| `npm run build` | 0 errors |
| `npm run seo-check` (SEO_ALL, local-complete cities) | **2401 passed, 0 failed**; Section 1 ↔ 2 description overlap max 12% |
| `npm run test:e2e` | **25/25** |
| `npm run check:icons` | all passed |
| `npm run content-check` (48 pages) | PASS — same-country/month max 37%, prose min 419 words, 2 sentences common to all pages |
| `npm run season-check` | 10/10 (southern hemisphere, equator, daylight) |
| `npm run guides:list` | **120 travel notes published** (London, Paris, New York, Dubai, Tokyo, Barcelona, Rome, Sydney, Singapore, Bangkok × 12); 0 drafts |
| CLS / LCP (month pages, 390 + 1440) | CLS 0; LCP 368–732 ms |
| Sitemap | 2,233 URLs, all indexable, self-canonical, one H1 |

### 2. Blocked by the backend
| Item | Needs | Workaround in place now |
|---|---|---|
| "Warmer / drier elsewhere in {Month}" (B5), full country tables, global "warmest / driest places in {Month}" | **#7** DB-only climate summary (many cities, one call) | Country page and "other cities" use only already-loaded cities; ≤ 6 history calls per page (`services/history.js` MAX_FANOUT); B5 not built; `data/historyReady.js` + `HISTORY_READY_LOCAL=1` limits local fan-out to cities with complete data |
| SSR 429 risk when Googlebot crawls many pages (all SSR calls come from one server IP; `WEATHER_ANON_PER_MINUTE` 600/min) | **#8** internal key/header for Next.js SSR (extends #1) | Secondary data (photo, blog, other cities) caught → section hidden, page still 200 (tested with a 429 proxy); long fetch caches (history 24 h, photo 3 h, blog 1 h) |
| Auto-promote user-requested cities to SEO pages | **#6** endpoint listing cities with complete history | Fixed whitelist `data/cities.js` (155) |
| Singapore in the backend city list | **#2** add to `fetch_all_cities.py` | Frontend whitelist adds Singapore as an extra |
| Whitelist from the backend | **#4** `GET /api/weather/cities/` | Copied list in `data/cities.js` (lat/lon/tz added for daylight) |
| Month average of exactly 0.0 °C shows blank | **#3** `round(x,1) if x else None` bug | none (shows "—") |
| Beach rule starts at 18 °C, ignores weather_code | **#5** (report only) | Month page uses the same thresholds for "Who {Month} suits" |

### 3. Every backend endpoint the Next.js site calls (read from code)
Browser calls go to `/api/...` (Next.js rewrite → Django, trailing slash kept); server calls go to
`API_INTERNAL_URL` via `services/serverApi.js` (404 → null, other errors throw; callers of
secondary data catch). Paths from `config/endpoints.js`.

| Method | Path | Query / body | Called from | Cache |
|---|---|---|---|---|
| GET | `/weather/current/` | `city` | Browser: `hooks/useWeather.js` (home: WeatherCard, ForecastTable — forecast is part of this response), `components/PopularDestinations.jsx` | react-query staleTime 3 h |
| GET | `/weather/current/` | `city` (slug with spaces) | Server: `services/cityPhoto.js` (only `image_url` used: city/month hero, Climate Guides cards, OG image) | fetch revalidate 3 h |
| GET | `/weather/history/` | `city` | Server: `services/history.js` (Section 1 city page, by-month, month pages, country page ≤ 6 per page) | fetch revalidate 24 h; pages ISR 24 h |
| GET | `/trips/plan/` | `city, start, end` | Browser: Trip Planner | react-query default (no staleTime) |
| GET | `/trips/plan/recommend/` | `country, start, end` | Browser: Trip Planner (country search) | react-query default |
| GET | `/trips/plan/cities/search/` | `q` | Browser: Trip Planner suggestions (search box) | none |
| GET | `/events/risk/` | `city, date, type, time?` | Browser: Event Risk tool | react-query default |
| GET | `/blog/posts/` | `page` | Server: `/blog` list (revalidate 10 min), `app/sitemap.js` (1 h), month-page related posts `services/blogPosts.js` (1 h) | as listed |
| GET | `/blog/posts/{slug}/` | — | Server: `/blog/[slug]` | revalidate 10 min |
| POST | `/auth/register/` | form payload | Browser: Sign up | — |
| POST | `/auth/verify-otp/` | payload | Browser: Sign up (OTP) | — |
| POST | `/auth/login/` | payload → `access_token, refresh_token, username` | Browser: Sign in | — |
| POST | `/auth/google-login/` | `{ id_token }` | Browser: Sign in / Sign up | — |
| POST | `/auth/refresh/` | `{ refresh }` → `access` (+ `refresh`) | Browser: `apiClient` on 401, one refresh at a time | — |
| POST | `/auth/keys/generate/` | payload | Browser: API docs page | — |
| GET | `/auth/keys/` | — (Bearer token) | Browser: `listApiKeys` | — |

- Headers: `Authorization: Bearer <access_token>` from localStorage on browser calls; server calls send only `Accept: application/json`.
- 429 with `code: "free_limit_reached"` → the site opens the sign-up popup (`weatherapex:free-limit` event). Any backend change must keep this code.
- Defined but not called anywhere: `/auth/forgot-password/`, `/auth/reset-password/`, `/auth/keys/{id}/revoke/`. Hooks `hooks/useHistorical.js` and `hooks/useBlog.js` are no longer imported (server fetch replaced them).
- Not our backend: BigDataCloud reverse-geocode (browser, `context/CityContext.jsx`), Google Identity (sign-in button).

### 4. Frontend-only items left before deploy
- Production `.env`: `API_INTERNAL_URL` = live backend, `NEXT_PUBLIC_SITE_URL=https://weatherapex.com`, Google client ID with the live origin; **do not set `HISTORY_READY_LOCAL`** in production.
- Confirm the VPS history seeding finished before the sitemap goes live (a city without history makes the backend call Open-Meteo).
- "Travel notes available" marker on the city-by-month page (content round C4) — not built yet.
- Remaining content: 15 of the top-30 cities (Batches 2–4), paused by owner.
- Re-run `content-check` on live data (no complete southern-hemisphere city locally; Sydney/Bangkok pages were not rendered locally).
- Optional cleanup: remove the two unused hooks.
- Known React-site issues kept as-is (footer © 2024, placeholder `#` links, newsletter `console.log`, "Forgot password?" `href="#"` — the forgot/reset endpoints exist but are not wired).

---

## 2026-09-29 — Backend round (docs/CLAUDE_CODE_BACKEND_PROMPT.md)

### PART 0 — frontend git (done, NOT committed)
- `git init` + `git branch -M main` in the Next.js folder only (no git in backend / React folder).
- `.gitignore` hardened: + `.env`, `.env.development`, `.env.production`, `!.env.example`, `*.log`, `/coverage/`.
- `git add .` → 259 files staged (content 120, app 38, components 31, docs 14, utils 11, services 8,
  scripts 5, public 5, data 4, tests 3, hooks 3, context 3, config 2, root files 12).
- Not staged: `.env.local`, `node_modules/`, `.next/`, `test-results/`. Only env file staged: `.env.example`.
- Secret grep over tracked files: only the public Google Client ID (by design), variable names and the
  `wv_live_YOUR_KEY_HERE` placeholder. No password / key / token values.
- Owner commits and pushes himself.
- Plan for PART A + B shown to owner; waiting for "haan".

### A1 + A2 done (backend, see Apex_Weather/CHANGES_REPORT_2.md)
- A1 internal key: backend `X-Internal-Key` (hmac) on current/history (+ new browsing endpoints);
  frontend `services/serverApi.js` sends it from server-only `BACKEND_INTERNAL_KEY`; `.env.example`
  placeholder added. Canary build: key / env name / header name in **0** files of `.next/static`.
- A2 client IP: `TRUSTED_PROXY_COUNT=1`, IP taken from the right of `X-Forwarded-For`.
- Backend tests: **34 OK** (16 old + 8 A1 + 10 A2), run twice.

### A3 done — climate normals (backend)
- History served from `CityClimateNormal`: queries 5 → 3 cold / 2 warm / 1 internal.
- Response adds `image_url`, `year_from`, `year_to`; bug #3 fixed (0 stays 0).
- Local backfill: 71 complete cities. new-york/singapore/tokyo identical; Dubai only June rainy days
  null → 0; **60 cities change** because the DB also held 1991–2005 (now strictly 2006–2025).
  Frontend pages for those 60 cities will show slightly different (correct) numbers.
- Backend tests: 47 OK.

### A4 + A5 done (backend)
- `/api/weather/climate/summary/` (cities / country / month; normals only; cache 24 h; sorted-slug hash key)
  and `/api/weather/cities/?complete=1` (DB only; cache 1 h). Both: burst guard + internal-key bypass.
- Singapore added to `fetch_all_cities.py` (DB coords 1.28967, 103.85007).
- Local: 71 complete cities, all with `image_url`. Backend tests: 61 OK.

### A6 done — photo without `/current/`
- `services/cityPhoto.js` reads `image_url` from `/weather/cities/` (1 call, 1 h); `/current/` only as a
  fallback for cities without a DB photo. `config/endpoints.js` + `cities`, `climateSummary`.
- London October (cold): `/current/` calls 1 → 0 (total still 6). Climate Guides: 24 `/current/` → 1 `/cities/`.

### PART B done (backend) — article recommendations
- Auto city/month linking from City table + text (owner rules), admin inline (manual / delete = blocked),
  `/api/blog/related/`, `/api/blog/posts/{slug}/related/` (TF-IDF similarity), list/detail + `cities`, `updated_at`.
- Backend tests: 90 OK. Local: 12 posts → 5 city links, 11 month tags.
- Next: PART C + B5 (frontend wiring, RelatedArticles component, screenshots) → owner "haan".

### PART C + B5 (frontend wiring) — waiting for owner "haan"
- `services/history.js`: `yearsOf(data)` (backend `year_from`/`year_to`, old backend → guess),
  `getClimateSummary({cities, month})` (null on old backend → old path).
- `services/cityPhoto.js`: `photoFromHistory(data, slug)` (0 calls); cities index as fallback.
- `services/blogPosts.js`: old title/slug matching REMOVED → `getRelatedForCity`, `getRelatedForPost`.
- `components/RelatedArticles.jsx` (server, blog-card style, renders nothing when empty/404/429/5xx):
  Section 1 `/weather/{city}`, by-month page, month page (with month), blog post ("You may also like").
- Month page: other same-country cities + NEW "Warmer or drier places in {Month}" from ONE climate-summary
  call (`utils/elsewhere.js`: real numbers, nearest first, max 5, hidden if < 2). 6-call cap removed only
  where the summary is used (month page others, country page table).
- Blog post: "Weather in {City}" box → `/weather/{city}` + by-month page for each linked whitelisted
  city; JSON-LD `dateModified`. Sitemap blog `lastModified` = `updated_at` (fallback `published_at`).
- Data notes: "N years" computed from the real range.
- `npm run cities:diff` (report only; whitelist never auto-changed). Local: 0 missing, 84 incomplete
  locally (VPS is seeded), 0 candidates, 0 name/country/coord differences.

| Page (cold, local) | Before | After |
|---|---|---|
| London October | 6 backend calls (5 history + 1 `/current/`) | **3** (history, climate summary, blog related) |
| next month page, same city | 5 (4 other-city histories + `/current/`, own history cached) | **2** (summary, related) |
| London by-month | 2 (history + `/current/`) | 1 (related; history cached) |
| Section 1 `/weather/london` | 2 | 0 (all cached) |
| Country page (UK) | 6 histories + photos | 2 (cities index + summary) |
| Climate Guides | 24 `/current/` | 1 (`/cities/`) |
- DB queries for `/history/`: 5 → 3 cold / 2 warm / 1 internal. Open-Meteo calls caused by SEO pages
  for photos: 1 forecast per city page (when the backend cache expired) → **0**.
- Checks: build OK · seo-check **2401 / 0** · e2e **25/25** · check:icons all passed ·
  content-check PASS (same-country max 41%, prose min 427, 2 common sentences) · backend tests **90 OK**.
- Screenshots 390 + 1440: elsewhere section, month related, Section 1 related, blog weather box, blog related.

### Owner fixes after "haan" (2026-09-29)
- Blog data migration `blog/0003_updated_at_from_published_at` (RunPython): existing posts get
  `updated_at = published_at` → sitemap lastmod stays truthful. Real-migration test; backend tests **91 OK**.
- **Deploy checklist** (backup → backend → frontend → key fingerprint check → spoof check) is in
  `Apex_Weather/CHANGES_REPORT_2.md` ("DEPLOY CHECKLIST").

---

## 2026-10-01 — Beta prep for Hostinger (docs/CLAUDE_CODE_BETA_PREP_PROMPT.md)

### 1. Standalone (Hostinger applies `output: 'standalone'` itself)
- `next.config.mjs`: `outputFileTracingIncludes: { '/**': ['./content/guides/**/*', './app/og-image/*.woff'] }`
  (both are read at runtime via `process.cwd()`; standalone `server.js` chdirs into its own folder).
- Local test switch only: `NEXT_OUTPUT=standalone npm run build` (not permanent — `next start` and our
  seo-check / e2e workflow use the normal build).
- **Real standalone test** (copied `public/` + `.next/static`, ran `node .next/standalone/server.js` from
  the scratchpad folder, port 3005): standalone contains 10 cities / **120 travel notes** + the Inter font.
  - `/weather/united-kingdom/london/october` 200, **Travel notes present** (incl. the Frieze line), years 2006–2025
  - `/og-image?…&city=london` 200 **image/png 1200×630** (583 KB with the city photo)
  - `/sitemap.xml` 200 (2,221 URLs — live backend has 0 blog posts), `/robots.txt` 200, `/favicon.ico` 200 svg
  - `/blog` 200, unknown post 404, `/weather/london` 200, `/climate-guides` 200
  - **Size of `.next/standalone`: 30 MB** (node_modules 22 MB)
  - Local Django was down → the standalone test used the LIVE API (a few public read calls; London is
    complete there, no Open-Meteo).

### 2. `SITE_NOINDEX=1` (beta must not be indexed)
- `headers()` in `next.config.mjs`: `X-Robots-Tag: noindex, nofollow` on every response (`/:path*`).
  robots.txt unchanged (still `Allow: /`). Unset / 0 → exactly as before.
- seo-check: new `siteNoindexChecks()` — mode from `SITE_NOINDEX` (same value as the build).
  - Flag ON build: header on `/`, month page, `/sitemap.xml`, `/robots.txt` → **PASS**; robots allows crawling → PASS
  - Flag OFF build: header absent on all 4 → **PASS**
- `.env.example`: `SITE_NOINDEX=` + the exact beta / main env lists.

### 3. Env / proxy
- With `API_PROXY_TARGET` unset: `rewrites()` returns only the favicon rule (checked in code and in the
  standalone run); browser calls go to `NEXT_PUBLIC_API_BASE_URL` = `https://api.weatherapex.com/api`.
- **Backend env needed (no code change):** CapRover `CORS_ALLOWED_ORIGINS` must include
  `https://beta.weatherapex.com` (default is only SITE_URL apex + www) — otherwise browser calls from beta
  (Popular Destinations, Trip Planner, Event Risk) are blocked. Google Cloud OAuth client: add
  `https://beta.weatherapex.com` to Authorized JavaScript origins for Google sign-in.

### 4. Checks (local Django was down → `next start` against the LIVE API, no SEO_ALL)
- build OK · check:icons all passed · e2e **24 passed, 1 skipped** (blog list → post now skips when the
  backend has 0 posts; it ran and passed with local data before) · seo-check 341 passed / 10 failed — all 10
  are `/blog?page=2` + "sitemap has blog posts" + one duplicate-description pair caused by **0 blog posts on
  the live backend** (they passed with the local DB). Full SEO_ALL run needs the local backend.

---

## 2026-10-03 — Icon trust (docs/CLAUDE_CODE_ICON_TRUST_PROMPT.md) — backend + frontend
- Backend: see `Apex_Weather/CHANGES_REPORT_2.md` ("ICON TRUST"). 106 backend tests OK.
- Frontend: `app/trip-planner/DayCard.jsx` (icon `display_code ?? weather_code`, shower / thunder badges,
  Morning/Afternoon/Evening mini icons), `app/trip-planner/dayInsights.js` (wet part never "Best time";
  shower / thunder sentences; "0%" never shown), `components/ForecastTable.jsx` (`display_code`, shower /
  thunder text; night column unchanged).
- Before/after (same forecast data, old vs new logic) in the owner report; screenshots 390 + 1440 of the
  Trip Planner and the home forecast (API responses generated by the new backend code, local Django was down).
- Checks (frontend vs LIVE old backend → fallback path): build OK · e2e 24 passed / 1 skipped (blog, 0 posts
  live) · check:icons all passed · seo-check 341 / 10 (same 10 caused by 0 live blog posts).
