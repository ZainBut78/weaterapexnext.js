// ─────────────────────────────────────────────────────────────
//  History (20-saal mahana averages) — SERVER par, ek hi cache
//
//  getHistory(slug): city page aur us ke 12 month pages SAB isi ek URL
//  ko use karte hain → backend ko ek shehar ki 1 call (24 ghante cache).
//
//  getHistories(slugs): country page / "doosre shehar" ke liye. Hadd:
//   • LOCAL dev (HISTORY_READY_LOCAL=1): sirf HISTORY_READY shehar (jin ka
//     data local DB mein mukammal — warna
//     backend Open-Meteo se 20 saal mangwata hai)
//   • ek page par zyada se zyada MAX_FANOUT calls (owner: 6)
//  Baqi shehar `skipped` mein wapas aate hain (page un ka "—" dikhata hai).
//  Build ke waqt kabhi nahi chalta (pages on-demand ISR).
// ─────────────────────────────────────────────────────────────
import { serverGet } from './serverApi';
import { ENDPOINTS } from '../config/endpoints';
import { HISTORY_READY } from '../data/historyReady';
import { historyYearRange } from '../utils/climateMath';

export const HISTORY_REVALIDATE = 60 * 60 * 24;
export const MAX_FANOUT = 6;

/**
 * Saal ki range — backend ke jawab se (`year_from` / `year_to`, backend
 * round A3). Purana backend yeh fields nahi bhejta → pehle wala andaza.
 */
export function yearsOf(data) {
  const guess = historyYearRange();
  return {
    start: Number.isInteger(data?.year_from) ? data.year_from : guess.start,
    end: Number.isInteger(data?.year_to) ? data.year_to : guess.end,
  };
}

/**
 * Backend round A4: kai shehron ka climate EK call mein (sirf normals,
 * backend Open-Meteo ko kabhi call nahi karta; adhoore shehar khud chhod
 * diye jate hain). Cache 24 h.
 * @param {{cities?: string[], month?: number}} q
 * @returns {Promise<Map<string, object>|null>} slug → item ({monthly_data} ya
 *   {month_data}); null = endpoint nahi / fail (purana backend) → caller purana rasta le
 */
export async function getClimateSummary({ cities, month } = {}) {
  const params = {};
  if (cities?.length) params.cities = [...cities].sort().join(',');
  if (month) params.month = month;
  try {
    const data = await serverGet(ENDPOINTS.weather.climateSummary, { params, revalidate: HISTORY_REVALIDATE });
    if (!data || !Array.isArray(data.cities)) return null;
    return new Map(data.cities.map((c) => [c.slug, c]));
  } catch {
    return null;
  }
}

export const getHistory = (citySlug) =>
  serverGet(ENDPOINTS.weather.history, {
    params: { city: citySlug },
    revalidate: HISTORY_REVALIDATE,
  });

/**
 * @param {string[]} slugs    — tarteeb ahem: pehle wale pehle
 * @param {object}   o
 * @param {number}   o.max    — is page par kitni calls (default MAX_FANOUT)
 * @returns {{ data: Map<string, object>, skipped: string[], calls: number }}
 */
export async function getHistories(slugs, { max = MAX_FANOUT } = {}) {
  // HISTORY_READY (local DB snapshot) SIRF local dev mein — env flag
  // HISTORY_READY_LOCAL=1 (.env.local). Production mein yeh flag nahi:
  // saare whitelist shehar available, sirf 6 wali hadd (Phase C2 §5).
  const useLocalSnapshot = process.env.HISTORY_READY_LOCAL === '1';
  const ready = slugs.filter((s) => !useLocalSnapshot || HISTORY_READY.has(s)).slice(0, max);
  const results = await Promise.all(
    ready.map(async (s) => {
      try {
        return [s, await getHistory(s)];
      } catch {
        return [s, null];
      }
    }),
  );
  const data = new Map(results.filter(([, d]) => d));
  return { data, skipped: slugs.filter((s) => !data.has(s)), calls: ready.length };
}
