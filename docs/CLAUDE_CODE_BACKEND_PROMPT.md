# WeatherApex — Backend round + article recommendation system (for Claude Code)

## Permissions for this round (Zain has approved these)
- **The Django backend** `D:\python projects\Apex_Weather` **may now be changed, but only for the items in this file.** Everything else in it stays read-only.
- **No git commands in the backend or in the old React folder.** Zain does git there himself.
- The old React project stays read-only.
- Explain everything in simple Roman Urdu. **Before writing code, show Zain the plan (models, endpoints, migrations) and wait for "haan".** Log everything in `docs/PROGRESS.md` (frontend) and in a new `CHANGES_REPORT_2.md` in the backend folder.
- **SEO first. Don't break anything that works today.** In particular, keep the 429 `code: "free_limit_reached"` behaviour and all existing endpoint shapes; only **add** fields.
- **Test locally:** Postgres on the local machine, `RUN_BACKEND.bat`. Write Django tests for every new piece and run them. Do not run anything against the CapRover/VPS server; Zain deploys migrations himself.

---

## PART 0 — Frontend git (do this first, it is small)
The Next.js folder is not a git repo yet. Zain will commit and push himself.
1. `git init`, then `git branch -M main`.
2. Harden `.gitignore`:
   - Keep what is there.
   - Add `.env`, `.env.development`, `.env.production`, `*.log`, `/coverage/`.
   - `.env.example` must stay tracked. It holds no secrets.
3. `git add .`
4. Show Zain `git status --short` (the count per folder is enough) and **prove** that none of these are staged:
   - `.env.local` or any other env file except `.env.example`
   - `node_modules`, `.next`, `test-results`
   - any file containing a password, key or token (grep the staged files)
5. **Do not commit and do not push.** Tell Zain the exact commands to run: `git commit -m "..."`, add the remote, `git push -u origin main`.

---

## PART A — Backend fixes and performance

### A1. #8 — internal key for Next.js SSR (most important for SEO)
**Problem:** Googlebot crawling many pages makes all SSR calls come from one server IP, so the site can hit the 600/min anon burst guard and return 429.

**Change:**
- New setting `INTERNAL_API_KEY` in the backend `.env`: a long random string.
- In `free_usage_limit`, first check the header `X-Internal-Key` with `hmac.compare_digest`.
  - If it matches, skip the anon burst guard and the free quota.
  - Still apply a very high safety cap of `INTERNAL_PER_MINUTE`, default 6000.
- Only for **read-only browsing** endpoints: history, current, blog, and the new endpoints below. Trip plan, recommend and event risk keep today's rules.
- **Frontend:**
  - `services/serverApi.js` sends the header on **server-side** calls only.
  - The value comes from a new server-only env var `BACKEND_INTERNAL_KEY`, which must **never** have the `NEXT_PUBLIC_` prefix.
  - Add it to `.env.example` as an empty placeholder. Zain puts the real value in `.env.local` himself.
- **Test:**
  - Without the header, request 601 in one minute gets 429.
  - With the correct header, no 429.
  - With a wrong header, it is treated as anonymous.
  - The key never appears in any browser bundle: grep `.next/static`.

### A2. Security finding: client IP can be spoofed (#9, new)
- `get_client_ip()` trusts the **first** `X-Forwarded-For` value, and anyone can send that header. A scraper can send a random IP each time and bypass every per-IP limit, both the burst guard and the 3-free quota.
- Fix: trust only the proxy chain we control.
  - Add a setting `TRUSTED_PROXY_COUNT`, default 1 for CapRover/nginx.
  - Take the IP that many hops from the **right**. Fall back to `REMOTE_ADDR`.
- Explain it to Zain and ask before changing, because it affects all limits.
- Add tests with spoofed headers.

### A3. Precomputed climate normals — fewer DB queries, and enables #6 and #7
**Today one `/weather/history/` request does all of this:**
- `get_city`: up to 3 queries
- `complete_years`: a GROUP BY query
- `has_any_history`
- a 12-month AVG over 240 rows
- an INSERT into `ServiceRequestLog`

That is the same for every visitor, for data that changes once a year.

**Change:**
- New model `CityClimateNormal`:
  - Fields: `city` FK, `month` 1–12, `avg_high`, `avg_low`, `avg_rainfall`, `rainy_days`, `sunshine_hours`, `humidity`, `year_from`, `year_to`, `years_count`, `updated_at`.
  - Unique on `(city, month)`.
- Add fields on `City`:
  - `history_complete` (bool), `history_year_from`, `history_year_to`
  - `timezone` (optional, for the future)
- A function `rebuild_normals(city)` in `weather/historical.py`, called automatically at the end of `store_monthly()`/`ensure_history()` whenever rows were saved.
- Management command `rebuild_climate_normals [--city slug]` to backfill all cities once.
- `/weather/history/` flow:
  1. Look the city up by slug first (1 query).
  2. If `history_complete` is true and `history_year_to` equals `target_year_range()[1]`, serve from normals (1 query) **without** calling `ensure_history`.
  3. Otherwise use today's path, then rebuild.
- Cache the JSON response per city in the Django cache for 24 h. Bump a cache version when the normals are rebuilt.
- **The response keeps exactly the same shape**, plus 3 new fields:
  - `image_url` (see A6)
  - `year_from`, `year_to` (so the frontend stops guessing 2006–2025)
- **Rounding bug #3:** use `is not None` everywhere. Today `round(x) if x else None` turns 0.0 into None: 0.0 °C, 0 mm rain in deserts, 0 rainy days. Fix it in the normals and in any remaining view code.
- **Logging:** calls with a valid internal key are not written row by row to `ServiceRequestLog`. Keep per-request logging for everyone else, as today.
- **Test:**
  - Query count with `assertNumQueries`: history served from normals uses ≤ 3 queries.
  - The numbers are identical to today's endpoint for 3 cities.
  - 0.0 values come back as 0.0.

### A4. #7 — multi-city climate summary (one call)
- `GET /api/weather/climate/summary/?cities=london,paris,…` (max 200 slugs), or `?country=United%20Kingdom`, or `?month=10`.
- Returns, per city: `slug`, `name`, `country`, `month` data (or all 12 months), `year_from`, `year_to`.
- **Reads normals only.** It never calls Open-Meteo, and cities without complete normals are simply left out.
- Cached 24 h. Internal-key aware.
- This unlocks on the frontend: "warmer/drier elsewhere in {Month}", full country tables, and "warmest places in {Month}".

### A5. #6 and #4 — city list from the backend
- `GET /api/weather/cities/?complete=1` returns `slug`, `name`, `country`, `region`, `lat`, `lon`, `is_coastal`, `has_hiking_trails`, `image_url` and `history_complete`.
- DB only. Cached 1 h.
- **#2:** add Singapore to `fetch_all_cities.py`. Use Singapore's DB coordinates, and say which you used.

### A6. Photo without a weather call (Open-Meteo saving)
- Today the frontend's `services/cityPhoto.js` calls `/weather/current/` **only to read `image_url`**. That triggers a full 15-day forecast request to Open-Meteo for every city/month page render (cached 3 h per city), even though the pages never show the forecast.
- **Backend:** add `image_url` to the history response (A3) and to the cities list (A5).
- **Frontend:** `cityPhoto.js` reads the photo from those, so SEO pages make **zero** `/current/` calls.
- Report how many `/current/` calls a month page made before and after.

### A7. Not in this round (report only)
- **#5** (the beach rule starts at 18 °C and ignores the weather code): leave it as it is.

---

## PART B — Article recommendation system (Zain's request)

**Goal:**
- When Zain uploads an article in Django admin, it must automatically appear on the right pages. Examples: a London article shows on `/weather/london`, `/weather/united-kingdom/london` and the London month pages; a Paris article shows on the Paris pages.
- **No manual tagging required. No hard-coded city names. No per-city if/else.** Everything comes from the data: the City table and the article text.
- It must work for articles uploaded in the future. There are 0 today.

### B1. Entity linking (article → cities), automatic
- New model `PostCityLink`: `post` FK, `city` FK, `score` (float), `source` (`auto` | `manual`), `mentions` (int). Unique on `(post, city)`.
- New service `blog/linking.py`:
  1. Build a matcher from the **City table** (name and slug-as-words), plus the country names from the DB. It loads from the DB and is cached, so **new cities are picked up automatically.**
  2. Scan these fields with weights: `title` 5, `meta_title` 4, `meta_keywords` 3, `excerpt` 2, `content` (HTML stripped) 1 per mention, log-scaled. Put the weights in `settings.BLOG_LINK_WEIGHTS`, not inside the code.
  3. Matching rules (generic, not per city):
     - whole words only
     - longest match first, so "New York" wins over "York"
     - case-sensitive for body text (so "nice weather" ≠ Nice)
     - ignore matches inside URLs and HTML attributes
  4. Keep links with `score ≥ settings.BLOG_LINK_MIN_SCORE`.
- It runs automatically in `post_save` of `BlogPost`, after the transaction commits.
- Management command `relink_blog_posts` for the backfill, and to run after new cities are added.
- **Admin:**
  - An inline showing the linked cities with their score and source.
  - Zain can add a city by hand (`manual`, which always stays) or delete a wrong auto link. A deleted auto link must **not** come back on the next save: store it as `source='blocked'`.
  - `manual` and `blocked` rows are never overwritten by re-linking.
- Also detect month mentions (January…December) and store them in `PostMonthTag(post, month)` for the month bonus.

### B2. Ranking (one generic formula)
New endpoint:
```
GET /api/blog/related/?city=london&month=10&exclude=slug&limit=4
```
Score per published post:
```
score = W_city   * link_score(post, city)
      + W_country* [post linked to any city in the same country]
      + W_region * [post linked to same region]
      + W_month  * [post tagged with that month]
      + W_recent * recency_decay(published_at, half_life_days)
```
- All weights and the half-life go in settings.
- Sort by score. Tie-break on newest first.
- Only return posts with score > 0. If none have `W_city`/`W_country` relevance, return an empty list: **never show unrelated articles as "related".**
- Response: `title`, `slug`, `excerpt`, `featured_image`, `published_at`, `category`, and the `cities` list (slug, name, country).
- Done in 1–2 queries with annotations/prefetch.
- Cached 1 h per (city, month). The whole blog cache is invalidated (version bump) when any post is saved or deleted.

### B3. Article → article ("You may also like" on blog posts)
- `GET /api/blog/posts/{slug}/related/?limit=4` ranks by the same formula, using the post's own linked cities, plus content similarity.
- Content similarity: a small TF-IDF cosine in pure Python (no new pip packages). Precompute it in a `PostSimilarity(post, other, score)` table, top 10 per post, recomputed on save.
- This works even for posts with no city, such as "how to read a weather map".

### B4. Blog detail / list and SEO extras
- Add `cities: [{slug, name, country, country_slug?}]` to the list and detail responses.
- Add a new field `updated_at` (`auto_now`). Keep `published_at`.
- **Frontend (blog post page):** show a box "Weather in {City}". It links to `/weather/{city}` and to the by-month page for every linked whitelisted city. This is internal linking both ways, which is good for SEO.
- **Frontend sitemap:** use `updated_at` for the blog `lastModified`.

### B5. Frontend: one dynamic component
- `components/RelatedArticles.jsx` (server component) with props `city`, `month?`, `exclude?`, `limit`, `title?`.
  - It calls `/blog/related/` through `serverApi` with the internal key, revalidate 1 h.
  - It renders nothing when the list is empty, or on 429/5xx. **The page must never break.**
- Use it on:
  - the Section 1 city page `/weather/{city}`
  - the city-by-month page
  - the month page (with `month`)
  - the blog post page (via `/posts/{slug}/related/`)
- Keep the existing card design style. Show Zain screenshots at 390 and 1440 before this is final.
- Remove the old title/slug-contains matching in `services/blogPosts.js`.
- **Test:**
  1. Create 4 test posts in the local DB: London, Paris, "Paris and London in October", and one with no city.
  2. London pages show post 1 and post 3. The London October page ranks post 3 first.
  3. Paris pages show posts 2 and 3.
  4. The no-city post appears nowhere as "related" on city pages, but does appear in post→post similarity.
  5. Delete the test posts afterwards, or use a Django test DB.

### B6. Later, not now
Record which related links get clicked, so the weights can be tuned. Write this in the plan as a future idea. **Do not build it now:** there are no users yet.

---

## PART C — Frontend wiring after the backend is done
1. `services/history.js`:
   - use `year_from` and `year_to` from the response
   - use `image_url` from history (A6)
2. **B5 "warmer/drier elsewhere in {Month}"** (from the content round):
   - Build it with A4. Rules: max 5 cities, same month, real numbers only.
   - Hide it if fewer than 2 cities qualify.
   - Country pages and tables can show all cities of the country via A4. Remove the 6-city cap **only** where A4 is used.
3. `data/cities.js` stays the source of truth for the SEO whitelist. Add a script `npm run cities:diff` that compares it with `/api/weather/cities/` and prints the differences. **Don't auto-change the whitelist.**
4. Re-run `build`, `seo-check`, `test:e2e`, `check:icons` and `content-check`. Report:
   - backend calls per page, before and after
   - DB query counts, before and after
   - Open-Meteo calls per page, before and after

## Order and stop points
1. PART 0: git. Show `git status`, then stop.
2. **Plan for A + B:** models, endpoints, migrations, settings and the files you will change. Show it and wait for "haan".
3. A1 → A2 (ask first) → A3 → A4 → A5 → A6, with tests after each.
4. B1 → B2 → B3 → B4, with tests.
5. PART C plus B5, with screenshots. Wait for "haan".
6. Final report, plus a **deploy checklist for the VPS**:
   - migrations
   - `rebuild_climate_normals`
   - `relink_blog_posts`
   - new `.env` keys: `INTERNAL_API_KEY`, `TRUSTED_PROXY_COUNT`
   - and on Hostinger, `BACKEND_INTERNAL_KEY`
