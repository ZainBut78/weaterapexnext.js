# WeatherApex — New York travel notes: review result + next steps (for Claude Code)

All standing rules still apply:
- React project and backend are read-only.
- Explain in simple Roman Urdu and ask before changes.
- Log everything in `docs/PROGRESS.md`.
- **SEO is the first priority.**

## 0. Process rule (important)
Paris was moved to `content/guides/` before the external review. The facts turned out correct, so nothing needs to be undone.
- From now on, **never publish a city's notes until Zain says "haan" after the review.**
- A draft stays in `content/guides-drafts/` until then.

## 1. New York — fixes before publishing
All the other facts were checked and are correct.

1. **april.md (Easter).** Easter Sunday falls between 22 March and 25 April; in 2027 it is 28 March. Change the bullet to say the Easter Parade and Bonnet Festival is on Easter Sunday, "usually in April, sometimes in late March".
2. **june.md (Pride).** The route changes, and in recent years it has ended in Chelsea. Replace "ending in Greenwich Village" with "passing through Greenwich Village, near the Stonewall National Monument".
3. **september.md (US Open).** The finals are no longer always "early September"; the tournament has a Sunday start since 2025. Change to "finish in the first half of September".
4. **november.md ("Getting around").** This paragraph repeats January's sentence (Staten Island Ferry + NMAI) word for word. Replace it with a different stable fact, for example:
   > "The Thanksgiving parade balloons are inflated the day before, on the streets around the American Museum of Natural History, and many people go to watch. The parade route closes streets on the Upper West Side and in Midtown on Thanksgiving morning."

   Keep the ferry and museum tip in January only.
5. **september.md: add the Feast of San Gennaro.** It is stable, well known and one of the city's oldest street festivals (since 1926). Add one bullet: an 11-day street festival on Mulberry Street in Little Italy, usually in mid-September.
   - Source: https://sangennaronyc.org (official).
   - No exact dates, no prices.
6. **Restaurant Week:** leave it out. Its dates and format change every year.

## 2. Sources: make them specific
Replace the generic `https://www.nyc.gov` homepage links with a specific official page. Open each link and report the status (200, or 403 bot-block is fine).

| File | Change |
|---|---|
| march | `nyc.gov` → `https://www.nycgo.com` (official NYC tourism) |
| april | `nyc.gov` → the NYC Tourism page for the Easter Parade on nycgo.com (or nycgo.com) |
| july | `nyc.gov` → the NYC Emergency Management extreme-heat / cooling-centres page |
| august | drop the generic `nyc.gov` line, or replace it with `https://www.mta.info` (subway to Flushing Meadows) |
| december | `https://new.mta.info` → `https://www.mta.info` |

The 403 links (Macy's, MTA, Rockefeller Center, Smithsonian) are real official domains that block bots. Keep them; Zain will open them in a browser.

## 3. After the fixes
1. Run `npm run content-check`; New York overlap must be ≤ 50%. Then run `npm run seo-check` and `npm run guides:list`.
2. Show Zain the diff of the 5 changed files plus the source table. **Wait for "haan"**, then move New York to `content/guides/new-york/`.

## 4. Next city: Dubai (drafts only, then stop for review)
Same format and 120–250 words. Dubai-specific rules:
- **Islamic dates move about 11 days earlier every year** (Ramadan, Eid al-Fitr, Eid al-Adha, Islamic New Year). Never tie them to a fixed month.
  - Write, for example, "In years when Ramadan falls in March…" or put one general Ramadan note in the months where it falls in the next ~3 years, clearly worded as "in 2027/2028".
  - Explain Ramadan etiquette neutrally: eating and drinking in public during daylight, shorter working hours.
- Weekend: the UAE government weekend has been **Saturday–Sunday** since 2022 (Friday is a half day for government).
- Fixed dates: UAE National Day on **2 December** (holiday usually 2–3 December), Commemoration Day on **1 December** (usually observed with National Day).
- Recurring events: Dubai Shopping Festival (December–January), Dubai Summer Surprises (summer), Global Village (season roughly October–May), Dubai Fitness Challenge (November), Dubai Airshow (November, **odd years only**).
  - Say "usually", with no exact dates.
- Summer heat: daytime outdoor sightseeing is hard from June to September. Many attractions are indoors.
- Sources: official only, e.g. visitdubai.com, u.ae (UAE government portal), mydsf.ae, globalvillage.ae.
- **Stop after the Dubai drafts** and report the attention points (moving dates, anything uncertain) like you did for New York.
