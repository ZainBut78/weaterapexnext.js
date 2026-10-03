# WeatherApex — Finish the frontend round (for Claude Code)

This continues `docs/CLAUDE_CODE_BATCH1_REVIEW_PROMPT.md`. Standing rules still apply:
- React project and backend are read-only.
- Explain in simple Roman Urdu.
- Log in `docs/PROGRESS.md`.
- **SEO first.**

The external reviewer has checked the current files:
- **Done and correct:** Dubai August, Dubai December (GITEX line and "book up early"), the Dubai October GITEX removal, and Rome November.
- **Still open:** everything listed in section 1 below.

## 1. Remaining content fixes (all already approved, do them now)

### Dubai, LIVE: `content/guides/dubai/october.md`
It currently has 2 bullets and 119 words, which is below the 120 minimum. Add this third bullet. The date was confirmed from the 2026 announcement (Gulf News, Khaleej Times, Time Out Dubai: **31 October – 29 November 2026**, 10th edition).
> **Dubai Fitness Challenge:** the 30-day Dubai Fitness Challenge usually starts at the very end of October or on 1 November and runs through November, with free fitness events across the city.

Source line:
- `https://www.dubaifitnesschallenge.com` — Dubai Fitness Challenge (official)

If that domain does not open, use the official Dubai government events page you can verify, and report which one you used.

### Bangkok drafts
- **august.md:** "the birthday of Queen Sirikit, the Queen Mother" → "the birthday of the late Queen Sirikit, the Queen Mother". She died on 24 October 2025; this is confirmed.
- **march.md:** "people fly kites at Sanam Luang" → "people traditionally fly kites at Sanam Luang".

### Sydney drafts
- **october.md:** replace the Sculpture by the Sea bullet with:
  > "in most years, from mid- or late October into early November, the free outdoor exhibition Sculpture by the Sea lines the coastal walk from Bondi to Tamarama with large artworks."
- **november.md:** "usually continues into early November" → "in years when it is held, continues into early November".
- **december.md:** "begin in mid-December" → "begin in the second half of December".
- **july.md, august.md, november.md:** `http://www.bom.gov.au` → `https://www.bom.gov.au`.

### Singapore drafts (optional, reviewer recommends it)
- **july.md:** remove the Haze bullet and its `haze.gov.sg` source line, because haze is already covered in June and September.
- Check that the file is still ≥ 120 words. If it is not, add one verified sentence and show it.

## 2. Checks (all must pass)
1. `npm run build`: 0 errors.
2. `npm run content-check`: report max/median overlap per city. Rome must be ≤ 50%, and every note must be 120–250 words.
3. `npm run seo-check`: 0 fail.
4. `npm run test:e2e` and `npm run check:icons`.
5. `npm run guides:list`.
6. Restart the test server on 3001 with the **new build**. Open `/weather/united-arab-emirates/dubai/october` and confirm that GITEX is gone and the new bullet shows.

## 3. Show Zain, then publish
- Show the diff of every changed file (Dubai live files plus the Batch 1 drafts) in one place.
- **Wait for Zain's "haan"**, then move Barcelona, Rome, Sydney, Singapore and Bangkok to `content/guides/`.
- Re-run `seo-check` and `guides:list` after publishing.
- **Do NOT start Batch 2 yet.** Zain wants to move to backend work next. Content batches will continue later.

## 4. Frontend status report (for the backend phase)
Add a short section **"Frontend status before backend work"** to `PROGRESS.md` and show it to Zain. It must contain:
1. **What is finished**, with the final numbers: build, seo-check, e2e, icons, content-check, and published notes (should be 10 cities × 12).
2. **What is blocked by the backend.** For each item, name the backend request it needs:
   - "warmer/drier elsewhere in {Month}", full country tables, and "warmest places" → **#7**
   - SSR 429 risk when Googlebot crawls → **#8**
   - auto-promoting user-requested cities to SEO pages → **#6**
   - Singapore in the backend city list
   - any known frontend workaround currently in place (for example the 6-call cap, or hiding sections on 429)
3. **Every backend endpoint the Next.js site calls**, with method, path, query params and cache time. Include the search, current, forecast, history, photo, blog, auth and trip planner calls.
   - This is needed so the backend changes don't break anything.
   - Read it from the code (`services/`, `lib/`); do not guess.
4. **Anything else left before deploy** that is frontend-only.

Do not touch the backend. The backend prompt comes next, after Zain has seen this report.
