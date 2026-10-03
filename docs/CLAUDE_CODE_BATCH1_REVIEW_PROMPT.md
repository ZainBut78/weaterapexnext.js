# WeatherApex — Batch 1 review + fixes to live Dubai notes (for Claude Code)

Standing rules still apply:
- React project and backend are read-only.
- Explain in simple Roman Urdu and ask before changes.
- Log everything in `docs/PROGRESS.md`.
- **SEO is the first priority.**

## 0. Process
Dubai and Tokyo were published before the external review, the same way Paris was.
- They have now been reviewed. Tokyo is fully correct.
- Dubai has **one wrong fact live on the site** (see 1), which must be fixed first.
- Rule, again: **no city moves to `content/guides/` until Zain says "haan" after the review.**
- The batch plan (5 cities per batch, publish only after review) is approved.

## 1. LIVE FIX FIRST — `content/guides/dubai/`
1. **october.md, GITEX:** wrong from 2026.
   - GITEX Global 2026 is on **7–11 December 2026 at Dubai Exhibition Centre, Expo City Dubai** (official: gitex.com; Dubai Media Office announcement, Oct 2025). It is no longer held in October.
   - Remove the GITEX bullet from October.
   - Replace it with another verified, stable fact. Suggestion: the Dubai Fitness Challenge usually begins at the very end of October or on 1 November. Verify it first; if you cannot verify it, leave October with 3 bullets.
   - Add to **december.md** at most one line:
     > "GITEX Global, a large technology exhibition, moved to December at Expo City Dubai in 2026; check the official dates, as hotels fill up that week."
2. **No-prices rule:**
   - **august.md**: change "hotel prices and crowds … lowest" to "hotel demand and crowds at attractions are usually at their lowest of the year".
   - **december.md**: change "one of the busiest and most expensive times" to "one of the busiest times to visit, and hotels book up early".
3. Run `content-check` and `seo-check`, then show Zain the diff.

## 2. Batch 1 drafts — fixes before publishing
The facts are verified and correct except where listed below.

### Bangkok
1. **august.md:** Queen Sirikit, the Queen Mother, **died on 24 October 2025** (confirmed: Royal Household Bureau via CNN, Al Jazeera, US State Dept). Change to:
   > "12 August, the birthday of the late Queen Sirikit, the Queen Mother, is a public holiday and is celebrated as Mother's Day in Thailand."

   Keep the note that it is on the Bank of Thailand holiday list, and confirm that it is on the 2027 list. The "decorations in blue" wording can stay.
2. **march.md, kites:** write "people traditionally fly kites at Sanam Luang…". Access to the field has had restrictions in some years.
3. Everything else is correct:
   - Chinese New Year 2027 is 6 Feb and 2028 is 26 Jan.
   - Makha, Visakha and Asahna Bucha, Khao Phansa and Ok Phansa follow the lunar rules as written.
   - The fixed-date holidays are 6 Apr, 13–15 Apr, 4 May, 3 Jun, 28 Jul, 13 Oct, 23 Oct, 5 Dec, 10 Dec and 31 Dec.
   - The "alcohol restricted, with some exemptions … check locally" wording is good.

### Barcelona
All correct. No changes. The facts checked were:
- 5–6 Jan and Santa Eulàlia
- MWC at Fira Gran Via
- Sant Jordi (not a holiday)
- the two Barcelona local holidays: Whit Monday and La Mercè on 24 Sep
- Sant Joan on 24 Jun, La Diada on 11 Sep, 12 Oct, and 6, 8, 25 and 26 Dec
- Gràcia and Sants festivals
- Fira de Santa Llúcia
- municipal museums free on the first Sunday and Sunday afternoons

### Rome
1. **november.md** has a wording bug: "crowds are smaller than in spring and autumn", but November *is* autumn. Change it to "smaller than in spring and early autumn".
2. Everything else is correct:
   - Domenica al Museo
   - Wednesday papal audience
   - 8 Dec at the Spanish Steps column
   - 21 Apr, 25 Apr, 2 Jun and 29 Jun
   - the Primo Maggio concert at San Giovanni (confirmed for 2026)
   - Caracalla, Festa de' Noantri and Madonna della Neve
   - vino novello at the end of October
3. The Italian sites that returned 000 (musei.cultura.gov.it, turismoroma.it, parcocolosseo.it) are real official domains that block bots. Keep them; Zain will open them in a browser.

### Sydney
1. **october.md / november.md, Sculpture by the Sea:** it has not run every year. The 2026 edition returns to Bondi from 16 October, for its 30th anniversary.
   - October: "in most years, from mid- or late October into early November, the free outdoor exhibition Sculpture by the Sea lines the coastal walk from Bondi to Tamarama".
   - November: "in years when it is held, … continues into early November".
2. **december.md:** change "the long school summer holidays begin in mid-December" to "begin in the second half of December".
3. **All BoM links:** `http://www.bom.gov.au` → `https://www.bom.gov.au`.
4. Everything else is correct:
   - DST starts on the first Sunday of October and ends on the first Sunday of April.
   - Seasons start on the 1st of the month.
   - King's Birthday is the second Monday of June and Labour Day the first Monday of October.
   - Anzac Day is at the Martin Place Cenotaph.
   - City2Surf is on the second Sunday of August, and Sydney to Hobart starts on 26 Dec.
   - The Vivid and whale-season timings are right.

### Singapore
All correct. No required changes. The facts checked were:
- the monsoon phases (per MSS)
- Chinese New Year and Good Friday 2027 (26 Mar)
- Hari Raya, Vesak and Deepavali for 2027, from the MOM gazetted list, with 2028 marked "expected"
- the Thaipusam route
- NDP, the Grand Prix and the Orchard Road light-up

Optional: haze is mentioned in June, July and September. You may drop the July haze bullet to reduce repetition.

## 3. After the fixes
1. Run `content-check` (Rome must stay ≤ 50%; report it), `seo-check` and `guides:list`.
2. Show Zain the diff of the changed files.
3. **Wait for "haan"**, then publish the 5 Batch 1 cities.
4. Then write the Batch 2 drafts (Seoul, Istanbul, Berlin, Toronto, Amsterdam) and **stop** for review. For Batch 2:
   - **Istanbul:** Islamic holidays move about 11 days earlier every year. Use the same "in 2027 / expected in 2028" wording as Dubai and Singapore.
   - **Seoul:** Seollal and Chuseok follow the lunar calendar. Use year-specific wording from an official Korean government source.
   - **Toronto:** Canadian holidays such as Victoria Day and Civic Holiday are rule-based. State the rule, not a date.
   - **For every city:** watch for events that have moved or changed month recently (like GITEX). Confirm each recurring event on its official site for the **current or next edition**, not only from memory.
