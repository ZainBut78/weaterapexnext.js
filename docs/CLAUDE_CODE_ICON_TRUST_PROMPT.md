# WeatherApex — Weather icon and score must agree (for Claude Code)

## Problem (reported by Zain with a screenshot from the Trip Planner)
- **Tue, Oct 13:** score **9.2 "Excellent"**, "Best for: Picnic / Park", but the icon is **"Rain showers"**.
- **Wed, Oct 14:** score **9.3 "Excellent"**, but the icon is **"Drizzle"**.

Users judge the weather from the icon first, before they read the numbers. A rain icon next to "Excellent" kills trust.

## Root cause (already found in the code; please confirm)
1. **The icon comes from Open-Meteo's *daily* `weather_code`.** Open-Meteo defines it as the **most severe** condition of the whole day, so a single wet hour turns the whole day into a rain icon.
   - Trip Planner: `app/trip-planner/DayCard.jsx` → `getMeteoconIcon(day.weather_code)`. The backend `trip_planner/views.py` passes the daily code.
2. **The score ignores the weather condition entirely.** `trip_planner/scoring.py → calculate_day_score(rain_prob, wind, tmax, tmin)` only uses the daily **max** rain probability, wind and temperature. 26% rain costs about 0.8 points, so the day stays "Excellent" while the icon shows rain.
3. The same daily-code icon is probably also used by:
   - the home page 15-day forecast table (`/weather/current` → `forecast_7day`)
   - Event Risk (it uses `_worst_code` in `events/views.py`)

   Check all places that call `getMeteoconIcon` with a **daily** code.

## Goal
**The icon, the score/band and the sentence must always tell the same story, based on real data. No random numbers and no hard-coded city or day rules.**

## Proposed design (show Zain the plan first; backend changes need his "haan")

### A. One shared helper on the backend: the representative daytime condition
Put it in a new `weather/conditions.py`. It is used by the trip planner, the home forecast, and later Event Risk.

**Input:** the hourly `weather_code`, `precipitation_probability` and `precipitation` (mm) for one date. **Window:** daytime hours, default 08–20 local time. Put the window in settings.

**Classify each hour as "wet"** when its code is drizzle, rain, showers, snow or thunder **and** `precipitation ≥ 0.1 mm` or `probability ≥ 40%`. Put the thresholds in settings.

**`display_code` rules:**
1. A thunder hour with probability ≥ 40% → thunder icon.
2. At least `WET_HOURS_FOR_RAIN_ICON` wet hours (default 3, in settings) → the most common wet code (rain, drizzle or showers).
3. 1–2 wet hours → **the most common dry code** (partly cloudy, cloudy and so on), plus a flag `shower_risk: true`. The UI then shows a small "chance of a shower" note instead of a full rain icon.
4. 0 wet hours → the most common dry code. On a tie, choose the cloudier code.

**Also return** `wet_hours`, `rain_mm_daytime` and `shower_risk`.

**Hourly data:** the trip planner already fetches hourly data for `day_parts`. Add `weather_code` and `precipitation` to that **same request**: no extra Open-Meteo call. Report whether the request weight changes.

### B. The score must agree with the condition
Add generic, data-driven inputs to `calculate_day_score`, with the weights in settings:
- a penalty per wet daytime hour, and/or per mm of daytime rain
- a thunderstorm penalty

Add a **consistency rule:** if `display_code` is rain, drizzle, showers, snow or thunder, the band can **never** be "Excellent". Cap it just under the Excellent threshold that `scoreBand()` uses on the frontend; read the real thresholds first.

**`activityReason` and "Best for":** never suggest picnic/park or beach on a day whose `display_code` is wet. Use the same thresholds as backend `trip_planner/activity.py`.

**Sentence:** if `shower_risk` is true, say something like "Mostly dry — a passing shower is possible (26% chance)". If the day is wet, say so plainly.

### C. API and backward compatibility
- **Keep** `weather_code` in every response, because the old React site may still read it. **Add** `display_code`, `shower_risk`, `wet_hours` and `rain_mm_daytime`.
- **Frontend:** use `display_code ?? weather_code` everywhere a daily icon is shown:
  - Trip Planner `DayCard`
  - home `ForecastTable`
  - Event Risk date comparison
- When `shower_risk` is true, show a small shower badge with the percentage.

### D. Event Risk
An event happens at a specific time, so the worst code **inside the event window** may be correct there. Review it and report. Change it only if the icon, score and text disagree in the same way.


### E. Weather changes during the day: show it (Zain's request)
One icon cannot tell the whole day. The weather can change several times between morning and evening.
- Use the **same helper from A** for each part of the day, with the windows already used by `calculate_day_parts`:
  - morning 06–12
  - afternoon 12–18
  - evening 18–22
- Return a `display_code` (plus `shower_risk`) for **each part** inside `day_parts`.
- **Trip Planner DayCard:** show a small row with three mini icons (Morning / Afternoon / Evening) under the main icon, each with its own rain %.
  - Keep the existing card design, sizes and colours.
  - "Best time" must agree with these parts. For example, if the afternoon is wet, the best time cannot be the afternoon.
- **Freshness:** the icons come from the latest cached forecast, which follows `weather/cache_policy.py`. Confirm in the report how often a day card's data refreshes. Do **not** add extra Open-Meteo calls.
- **Test:** a day that is dry in the morning, wet in the afternoon and dry in the evening must show three different part icons. The main icon must follow the rules in A, and "Best time" must be morning or evening.

## Tests
**Backend unit tests (synthetic hourly data):**
1. 1 shower hour, 26% → dry icon, `shower_risk` true, score can still be high, the sentence mentions the possible shower.
2. 6 rain hours, 80%, 8 mm → rain icon, band at most "Fair", no picnic or beach suggestion.
3. Drizzle all day, 0.3 mm/h → drizzle icon, band capped below "Excellent".
4. 1 thunder hour at 60% → thunder icon and a thunderstorm penalty.
5. All dry → the most common dry code.

**Also:**
- Run the Trip Planner for London and two other cities for the next 7 days. Show Zain a before/after table: date | old icon | new icon | old score/band | new score/band | sentence.
- Take screenshots at 390px and 1440px of the Trip Planner and the home forecast. The design stays the same; only the icon logic changes.
- Run the full backend test suite, plus frontend `build`, `seo-check`, `test:e2e` and `check:icons`.

## Process
1. Confirm the root cause. Show Zain the plan in Roman Urdu: the files, the settings names, and the thresholds you propose. **Wait for "haan".**
2. Build the backend part first, with tests, then the frontend.
3. Show the before/after table and the screenshots.
4. **No git commands in the backend.** Frontend: `git add .` and show the list. Zain commits and pushes. Backend deploy = Zain's push → CapRover.
