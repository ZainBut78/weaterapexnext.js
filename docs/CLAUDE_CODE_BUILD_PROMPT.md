# WeatherApex — Next.js migration: build brief for Claude Code

You are finishing the migration of the WeatherApex frontend from React + Vite to
**Next.js 16 (App Router, JavaScript, not TypeScript)**. Read this whole file before you touch anything.
The main goal is **SEO**: every public page must reach Google as complete, server-rendered HTML with correct metadata.
The design must stay **exactly** as it is today.

---

## 0. How to work with the owner (read first)

- The owner (Zain) is **new to Next.js**. Talk to him in **simple Roman Urdu**, keep it short, and explain *why* as well as *what*.
- **Before any change, tell him what you are going to change and why, and wait for his "haan".** This is his standing rule. Do not change anything on your own initiative.
- Work **one phase at a time** (section 6). At the end of each phase:
  1. show what changed,
  2. show that the tests pass,
  3. give him screenshots of the pages on **mobile (390px) and desktop (1440px)**,
  4. and wait for approval before starting the next phase.
- Most of the traffic is on **mobile**, so check the mobile layout first.
- The target market is Tier 1 (US, UK, Canada, Australia, Western Europe). Keep all site copy in English.
- If something is unclear or risky, **stop and ask**. Do not guess.
- Keep a log in `docs/PROGRESS.md`. For every step record what you did, which files you touched, and what you tested. Another reviewer will debug from this log at the end.

---

## 1. Folders — what you may touch

| Path (Windows) | What it is | Access |
|---|---|---|
| `D:\python projects\apexweather+nextjs` | **The new Next.js project. All work happens here.** | read + write |
| `D:\python projects\APEX_WEATER_FRONTED\my-project` | Old React + Vite frontend (the live site). **Source of design and logic.** | **READ-ONLY** |
| `D:\python projects\Apex_Weather` | Django backend (DRF, PostgreSQL) | **READ-ONLY** |

Hard rules:
- **Never modify, move, delete or format anything** in the React project or the backend. Read them only.
- **Do not run any `git` command inside those two repos**, not even `git status`. On this machine a read-only git command there once left a stale `.git/index.lock` that blocked the owner's commits. Read files with normal file reads.
- If the backend seems to need a change, **do not make it**. Write it down in `docs/PROGRESS.md` under "Backend requests" and tell the owner.
- In the new project, **never `git add .`**. Stage explicit paths. **Never push**; the owner pushes himself. Never commit `.env.local`.

---

## 2. Local setup (already running)

- **Django backend** runs locally at **`http://127.0.0.1:8000`** (started with `RUN_BACKEND.bat`, `DEBUG=True`, local PostgreSQL). All API paths are under `/api/` and **end with a trailing slash** (e.g. `/api/weather/current/?city=london`).
- **Next.js dev server:** `npm run dev` → `http://localhost:3000`.
- `.env.local` currently contains:
  ```
  NEXT_PUBLIC_API_BASE_URL=/api
  API_PROXY_TARGET=http://127.0.0.1:8000
  ```
- The browser calls `/api/...` on `localhost:3000`. `next.config.mjs` rewrites those calls to the backend. This proxy exists because of CORS: the live backend only allows `weatherapex.com`.
  - There are **two rewrite rules** on purpose. The first rule keeps the trailing slash. Without it, `:path*` drops the slash, Django redirects with APPEND_SLASH, and the browser gets `ERR_TOO_MANY_REDIRECTS`. **Do not merge them into one rule.**
  - `skipTrailingSlashRedirect: true` is set for the same reason. **Do not change it without asking.** The site-wide trailing-slash policy is still an open decision (section 7).
- After changing `.env.local` or `next.config.mjs`, **restart `npm run dev`**. Rewrites are built only at startup; an env hot-reload does not rebuild them.
- Use `127.0.0.1`, not `localhost`, for the backend. Newer Node versions may resolve `localhost` to IPv6 `::1`, and Django's runserver only listens on IPv4.

Env variables you may add to `.env.local` and document in `.env.example` (tell the owner first):
- `API_INTERNAL_URL=http://127.0.0.1:8000/api` — **server-side** base URL. Server Components cannot use the relative `/api`; they need an absolute URL.
- `NEXT_PUBLIC_SITE_URL=https://weatherapex.com` — used for canonical URLs, `og:url`, sitemap and JSON-LD. It is never the API domain.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID=637612529072-41mk8f7bp6femvvibck84r2nt7vtd3se.apps.googleusercontent.com` — public, not a secret.
  - For Google Sign-In to work on localhost, the owner must add `http://localhost:3000` to **Authorized JavaScript origins** in Google Cloud Console. Tell him; you cannot do it yourself.

---

## 3. API limits — do not burn them

- The backend fetches weather from **Open-Meteo (free tier: 600 calls/min, 5,000/hour, 10,000/day)**. Historical calls are *weighted*: one city's 20-year history costs about 261 calls.
  - `GET /api/weather/history/?city=X` calls `ensure_history`, which **can hit Open-Meteo** when years are missing in the database.
  - Therefore **never loop over many cities** (at build time, in `generateStaticParams`, in tests or in scripts).
  - Build SEO pages **on demand** with ISR (`revalidate`), not by pre-building every city.
  - Pre-build at most 2–3 cities without asking the owner.
- Anonymous visitors get a **free daily limit per IP** on some features (`trip_planner`, `country_recommend`, `event_risk`, new-city lookups, climate history). After the limit the backend returns **429** with `code: "free_limit_reached"`, and the frontend shows the sign-up modal.
  - Locally, every request comes from `127.0.0.1`, so the limit fills up quickly.
  - In automated tests, **mock these endpoints** (Playwright `page.route`) instead of calling the real backend repeatedly.
  - Use real calls only for 1–2 smoke checks.
- Do not add polling, prefetch-everything or retry storms.

---

## 4. Already done (Steps 1–2) — do not redo

The landing page `/` is migrated and matches the React site pixel for pixel. The page height is identical on mobile (7234px) and desktop (4570px), and there are no console errors.

Existing structure:
```
app/layout.js        root layout: leaflet css, globals.css, <Providers>, default metadata + title template "%s — WeatherApex"
app/providers.jsx    'use client': QueryClient (same options as old main.jsx), AuthProvider, CityProvider, FreeLimitModal
app/page.js          landing page (server component) + metadata
app/error.js         error UI (Next 16 uses `retry()`, not `reset()`)
app/globals.css      exact copy of old src/index.css
components/          ported components + NavLink.jsx (react-router NavLink shim) + LiveSatelliteRadarLazy.jsx (dynamic, ssr:false)
context/             AuthContext, CityContext (city starts null; read from localStorage in useEffect)
hooks/useWeather.js  services/apiClient.js  services/weatherService.js  utils/*
config/endpoints.js  API_BASE_URL from NEXT_PUBLIC_API_BASE_URL, endpoint paths hard-coded (same values as old .env)
```

Porting conventions already used. **Follow them for every new page.**
1. Any file with `useState`, `useEffect`, event handlers, `localStorage`, `window` or React Query hooks gets `'use client';` on line 1.
2. `import { Link } from 'react-router-dom'` + `to=` becomes `import Link from 'next/link'` + `href=`.
   - `NavLink` → `components/NavLink.jsx` (same API: `to`, `end`, className/children functions).
   - `useLocation` → `usePathname`; `useNavigate()` → `useRouter()` from `next/navigation` (`navigate(x)` → `router.push(x)`).
   - `useParams` → the `params` prop in the page. **In Next 16 `params` is a Promise: `const { slug } = await params`**, or use `useParams()` in a client component.
3. `import.meta.env.VITE_X` becomes `process.env.NEXT_PUBLIC_X`.
4. **Client components are still rendered once on the server.** Never read `localStorage`, `window`, `document`, `Date.now()` or `Math.random()` during render. Do it in `useEffect` or in an event handler. Otherwise you get crashes or hydration mismatches.
5. Browser-only libraries (Leaflet and anything else that touches `window` at import time) load through `next/dynamic` with `{ ssr: false }` **inside a client component**.
6. `react-helmet-async` and `RouteMeta.jsx` are **not** used. Every page exports `metadata` or `generateMetadata`. Copy titles and descriptions from the old `src/components/RouteMeta.jsx` (`META` map), and keep `noindex` on `/login` and `/signup`.
7. Keep the Tailwind classes, colors, spacing, icons and text **exactly** as in the React source. Do not "improve" the design.
8. This Next.js version has breaking changes compared to older docs. **Check `node_modules/next/dist/docs/` before using an API** (see the auto-generated `AGENTS.md`).
9. A hydration warning about `cz-shortcut-listen` on `<body>` comes from the ColorZilla browser extension on the owner's PC, not from our code. You may propose `suppressHydrationWarning` on `<body>` in `app/layout.js`, but ask first.

---

## 5. Page inventory (old React → new Next.js)

The React source is in `my-project/src/`. Routes come from `src/App.jsx`.

| Route | Old file | Rendering plan |
|---|---|---|
| `/` | pages/LandingPage.jsx | ✅ done |
| `/login` | pages/SignIn.jsx (+ components/GoogleSignInButton.jsx, config/googleAuth.js) | client page, `noindex` |
| `/signup` | pages/SignUp.jsx | client page, `noindex` |
| `/trip-planner` | pages/TripPlanner.jsx | static server shell (h1, intro text) + client tool |
| `/events` | pages/EventRisk.jsx + components/events/* | same as trip planner |
| `/climate-guides` | pages/ClimateGuides.jsx (FEATURED_CITIES list) | **server-rendered**; city cards must be real `<a href>` links |
| `/weather/[citySlug]` | pages/HistoricalPage.jsx (recharts) | **SEO-critical.** Fetch data on the **server** (`API_INTERNAL_URL`, `revalidate`) so the HTML contains the h1, climate text and monthly table. Charts can be client components that receive the data as props. Unknown city → `notFound()` (real 404) |
| `/blog` | pages/Blog.jsx (hooks/useBlog.js) | server-rendered list with `<a href>` links |
| `/blog/[slug]` | pages/BlogPost.jsx | server-rendered, `generateMetadata` from the post, Article JSON-LD, `notFound()` for missing posts |
| `/api-docs` | pages/ApiDocs.jsx | mostly static → server; interactive parts client |
| `/about`, `/terms`, `/privacy` | pages/AboutUs.jsx, TermsOfService.jsx, PrivacyPolicy.jsx | static server pages |
| `/pricing` | "Coming Soon" in App.jsx | same as before |
| 404 | pages/NotFound.jsx | `app/not-found.js`, must return **HTTP 404** |

`src/components/SignIn.jsx` and `SignUp.jsx` also exist next to `src/pages/SignIn.jsx`. Check which ones are actually imported before porting, and port only what is used.

Things that must keep working exactly as before:
- the JWT refresh logic in `apiClient.js`
- AuthContext's "undefined" name sanitisation
- the Google login flow (`/api/auth/google-login/`)
- the free-limit modal
- the location detection in CityContext (BigDataCloud)
- Popular Destinations click-to-switch-city

---

## 6. Phases (stop for approval after each)

**Phase A — Remaining pages, parity first**
- Port all pages from section 5 with **identical design and behavior**. Only the SEO-critical pages get server data fetching here; everything else is a straight port.
- Add `recharts` and any other dependency **at the exact version used in the old `package.json`**. Ask before adding any library that the old project does not have.
- For each page, compare screenshots with the React site (the owner can run it with `npm run dev` in the old folder, on another port) at 390px and 1440px.

**Phase B — SEO foundation**
- `metadata` for every page:
  - unique title and description
  - `alternates.canonical`, built from `NEXT_PUBLIC_SITE_URL`
  - Open Graph and Twitter tags
- `app/sitemap.js`: static pages, blog posts from the API, and city pages. Take the city list from data the site already has; **do not** call the history endpoint for every city.
- `app/robots.js`: allow everything; disallow `/login`, `/signup` and `/api/`; link the sitemap.
- JSON-LD:
  - `Organization` and `WebSite` on the home page
  - `BreadcrumbList` on the city and blog pages
  - `Article` on blog posts
  - **No FAQ schema**, because Google restricted FAQ rich results in 2023.
- Internal links as real `<a href>` everywhere users navigate: cards, city lists, breadcrumbs and footer. Do not use `onClick` navigation for anything Google should follow.
- Real 404s: `notFound()` for unknown slugs; never a 200 "not found" page.
- Images:
  - Use `next/image` only if it does not change the look. Otherwise keep `<img>` and add `width`/`height` to prevent layout shift.
  - Pexels images come from `images.pexels.com`; configure `images.remotePatterns` if you use `next/image`.
- Performance / Core Web Vitals (LCP, CLS, INP): keep the client JS for content pages small.

**Phase C — Programmatic SEO pages: ⚠️ BLOCKED until the owner approves the URL structure**
- The URL structure (country / city / month levels, trailing slash, handling of duplicate city names) is **still being decided**. **Do not create new URL patterns and do not change existing ones.**
- When you reach this phase, explain the options to the owner in simple Roman Urdu and wait. Until then, `/weather/[citySlug]` stays exactly as it is.
- Month pages and country pages also need data that may require a new **read-only** backend endpoint. Write it up as a "Backend request"; do not build it.

**Phase D — Tests and final checks** (write tests alongside each phase, not only at the end)
- `npm run build` must succeed with **zero errors**.
- An SEO check script (`scripts/seo-check.mjs`, plain Node `fetch`, no new dependency) that runs against `npm run build && npm start`. For every public route it checks:
  - status code (404 route → 404)
  - exactly one `<h1>` present in the **raw server HTML**
  - `<title>` and meta description present and unique
  - canonical present and absolute
  - no `noindex` on public pages, `noindex` on `/login` and `/signup`
  - `robots.txt` and `sitemap.xml` are valid
- End-to-end tests with **Playwright** (ask the owner before installing it; the browser download is about 150 MB). Mock the rate-limited endpoints. Cover:
  - landing page loads with data
  - city card click switches the city
  - mobile menu open and close
  - search
  - sign-in form validation
  - OTP paste
  - free-limit modal on a mocked 429
  - blog list → post
  - 404 page
  - no console errors on any page
- Test at 390px and 1440px.

---

## 7. Open decisions — ask, never assume

1. The URL structure for SEO city/country/month pages, and the trailing-slash policy (Phase C).
2. `suppressHydrationWarning` on `<body>` (ColorZilla warning).
3. Any new dependency.
4. Any backend change (write it as a request only).

Known issues in the React site. **Keep them as they are and only list them in PROGRESS.md; do not fix them without asking:**
- the footer shows "© 2024"
- placeholder `#` links in the footer (Careers, Scientific Board, Press Room, Cookie Settings)
- the newsletter form only does `console.log`
- the Vite favicon (a new favicon is pending approval)
- "Forgot password?" is `href="#"`

---

## 8. Deployment (later — do not do it now)

- Target: **Hostinger Business → Node.js Web App**, deployed from a new GitHub repo. It runs `npm run build` + `npm start`.
- Do **not** use `output: 'export'`; Hostinger runs Next.js in server mode.
- In production there is no `API_PROXY_TARGET`:
  - `NEXT_PUBLIC_API_BASE_URL=https://api.weatherapex.com/api`
  - `API_INTERNAL_URL=https://api.weatherapex.com/api`
- Nothing is deployed until the owner says so.
