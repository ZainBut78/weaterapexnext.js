# WeatherApex — Content & SEO round for Section 2 (for Claude Code)

All standing rules still apply:
- React project and backend are read-only; no git commands there.
- Explain in simple Roman Urdu and ask before every change.
- Screenshots at 390px and 1440px before anything is final.
- Log everything in `docs/PROGRESS.md`.
- **SEO is the first priority.**

---

## Why this round

An external audit rendered 36 month pages (9 cities × 4 months) from realistic climate data and measured how much of each page is template text.

| Pair of month pages | Same text | Same template (numbers/names removed) |
|---|---|---|
| London Oct vs London Jul | 43% | 61% |
| London Oct vs Paris Oct | 56% | 68% |
| London Oct vs Manchester Oct | 61% | **75%** |
| Rome Apr vs Tokyo Apr | 63% | **78%** |
| Dubai Jul vs Sydney Jan | 35% | 58% |

- A page has about 570 words, but most of them are the 12-row table. The real prose is only about 150 words.
- 8 sentences appear on every page with only the numbers changed. Examples: "Rain (1 mm or more) falls on about # days…", "Average humidity is #%", "Hiking: less ideal — no major trails are listed for this city".
- Across ~1,860 pages that looks like scaled, templated content. Zain also feels the pages are too similar and wants more written content.

**Goal:**
- Template overlap between two month pages of the same country and month should drop to **≤ 50%**, measured the same way (see Test).
- Each month page should have **≥ 350 words of prose** (not counting tables and chips).
- All added content must be derived from real data or verified facts. **Never invent facts** such as events, festivals or prices.

---

## A. Fix redundancy and odd wording (frontend only)

1. **Remove repetition.**
   - Today the same numbers appear three times: the quick answer, the stat cards, and the article paragraph "What's the weather like…".
   - Keep the quick answer and the stat cards.
   - Rewrite the article paragraph so it **interprets** the numbers instead of repeating them: the day-night swing, rain character (see B3), how it feels, and what the humidity means.
2. **"Who {Month} suits":**
   - Do **not** show activities that don't apply. No "Beach: less ideal — the city is not on the coast" for inland cities, and no "Hiking … no major trails listed". Omit those rows.
   - Fix "Museums & indoor: less ideal — outdoor plans work most days". Museums are never "less ideal". Show the indoor row only when it is a real recommendation (rainy, very hot or cold month), with positive wording.
3. **Sentence variety driven by data, not randomness.** Pick different phrasings from the page's own numbers and rank, so pages read differently:
   - peak-summer, shoulder-season, coldest-stretch and wettest-month wording
   - a big vs small day-night swing
   - dry vs showery vs persistently wet
   - Use no `Math.random()`: the same page must always render the same text.
4. **Section 1 description** (`/weather/{city}`) currently says "Month-by-month climate guide for …". That competes with the Section 2 page "{City} Weather by Month" for the same searches (keyword cannibalization).
   - **(ask Zain)** Propose meta text for Section 1 that targets "climate / 20-year averages / charts" instead of "month by month".
   - This changes **metadata only**; the Section 1 design stays exactly the same.
   - Also fix "Singapore, Singapore" in Section 1 descriptions when city = country.

---

## B. New data-driven sections (unique per page, no backend change)

1. **Daylight: sunrise, sunset and day length for the middle of the month.**
   - Compute it astronomically from latitude/longitude. There is no API call and no new library; use the standard NOAA solar formula.
   - Copy lat/lon for the 155 cities **read-only** from backend `weather/management/commands/fetch_all_cities.py` into `data/cities.js` (Singapore: use the DB/known coordinates and note it).
   - Show local times using the city's IANA timezone (`Intl.DateTimeFormat` with `timeZone`). Add a timezone per city to `data/cities.js`, verified.
   - Add one sentence, e.g. "Days are getting shorter: about 10 h 45 min of daylight in mid-October, 2 h 20 min less than in mid-September."
   - This is genuinely unique per city and month, and people search for it ("daylight hours London October").
2. **Season label by hemisphere:**
   - For example "autumn in London", "spring in Sydney".
   - Tropical cities (|lat| < 23.5): use "dry season / wet season" only when the rainfall numbers clearly show it; otherwise say "warm all year".
3. **Rain character:**
   - Compute mm per rainy day, e.g. "short showers (≈4 mm per rainy day)" vs "heavy downpours (≈15 mm per rainy day)".
   - Compare with the city's own yearly average.
4. **Q&A section** in plain HTML, with H2 "Quick questions" and H3 questions. **No FAQ schema.** Use 3–4 questions answered only from the data, for example:
   - "How warm is {City} in {Month}?"
   - "Does it rain a lot in {City} in {Month}?"
   - "What should I wear in {City} in {Month}?"
   - "Is {Month} or {Next month} better for visiting {City}?" (compare using the verdict and rank)
5. **"If you want warmer / drier weather in {Month}"**: needs backend #7 (see D). Until then, compare only with the cities of the same country that are already fetched (≤ 6-call cap), and hide the section if fewer than 2 cities are available.

---

## C. Hand-written travel notes (the real "blog" content)

This is the content Google values most, and it needs a human check. Process:
1. Create `content/guides-drafts/{city}/{month}.md`. **Drafts are never rendered on the site.**
2. Write drafts for the **top 30 cities × 12 months** (list from Popular Destinations + Climate Guides featured cities; show Zain the list first). Each is 120–250 words.
   - Only well-known, stable, verifiable facts: recurring festivals with their usual month, daylight saving changes, school holiday periods, typical crowds and seasonality, free museums.
   - **No prices, no exact event dates, no opening hours.**
   - Every draft ends with a "Sources to check" list: 2–3 official sources (city or tourism board, official event site) that Zain can open to verify.
   - Start with **5 cities** (London, Paris, New York, Dubai, Tokyo) × 12 months and stop for Zain's review of style and accuracy before writing the rest.
3. Zain verifies a draft, then moves it to `content/guides/{city}/{month}.md`, which publishes it (the existing "Travel notes" section).
   - Add a tiny script `npm run guides:list` that shows which drafts exist and which are published.
4. On the city-by-month page, show a small "Travel notes available" marker on months that have a published note.

---

## D. Backend dependencies (do NOT build — list in PROGRESS.md "Backend requests")
- **#7** A DB-only multi-city climate summary (one call). This enables "warmer/drier elsewhere in {Month}", full country tables, and "warmest places in {Month}". It is the biggest content upgrade after the notes.
- **#8 (new)** An internal key or header so the Next.js server's SSR calls are not counted in the per-IP anonymous burst limit (`WEATHER_ANON_PER_MINUTE`, 600/min).
  - Without it, when Googlebot crawls many new pages at once, a month page can make up to ~8 backend calls (history ×≤6, photo, blog).
  - The shared server IP can then hit 429, and Googlebot receives error pages.
  - Until then, add a safety net in the frontend: if the backend returns 429 for **secondary** data (other cities, photo, related posts), render the page without that section. Never throw an error page for secondary data.

---

## E. Test (add to seo-check or a new script `npm run content-check`)
1. Render at least 40 month pages across 10 whitelisted cities with complete local data. Include pairs from the same country and same month, and from different hemispheres.
2. Measure, the same way as the audit:
   - Extract the text between the header and the footer.
   - Replace numbers with `#` and city/country/month names with `X`.
   - Compute 5-word shingle Jaccard similarity.
3. Report the max and median template overlap, the prose word count (excluding tables and chips), and the sentences that appear on every page.
   - **Pass:** max overlap ≤ 50% for same-country/same-month pairs, prose ≥ 350 words, and at most 3 sentences common to all pages.
4. Re-run `npm run build`, `seo-check`, `test:e2e`, CLS/LCP at 390/1440. Report the numbers.

Order: A → B1–B4 → test → screenshots → Zain's "haan" → C (5 cities, stop for review) → B5 after backend #7.
