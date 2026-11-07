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
import { notFound } from 'next/navigation';
import { serverGet } from './serverApi';
import { ENDPOINTS } from '../config/endpoints';
import { HISTORY_READY } from '../data/historyReady';
import { historyYearRange } from '../utils/climateMath';

export const HISTORY_REVALIDATE = 60 * 60 * 24;
// Data badle to backend yeh tag expire karta hai (weather/indexnow_pages.py): 24 h ka intezar nahi
const historyTag = (citySlug) => `history:${citySlug}`;
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
  // 5xx / timeout → throw (Step 2): warna page bina in numbers ke ban kar poora waqt cache
  // rehta. Page 5xx deta hai, purana achha page ISR mein rehta hai. 404 → null (purana backend).
  const data = await serverGet(ENDPOINTS.weather.climateSummary, { params, revalidate: HISTORY_REVALIDATE, tags: ['climate-summary'] });
  if (!data || !Array.isArray(data.cities)) return null;
  return new Map(data.cities.map((c) => [c.slug, c]));
}

/**
 * Shehar ki saal-wari mahana rows (Step 5). 1 call shehar ke 13 pages ke liye, sirf DB.
 * 404 / purana jawab → null: block nahi dikhta. 5xx / timeout → throw (Step 2): block ke
 * baghair page cache na ho.
 */
export async function getCityYears(citySlug) {
  const data = await serverGet(ENDPOINTS.weather.climateYears, { params: { city: citySlug }, revalidate: HISTORY_REVALIDATE, tags: [historyTag(citySlug)] });
  // Guard ka faisla na mile to block bhi nahi
  return Array.isArray(data?.rows) && Array.isArray(data?.flagged_months)
    ? { rows: data.rows, flagged: data.flagged_months }
    : null;
}

export const getHistory = (citySlug) =>
  serverGet(ENDPOINTS.weather.history, {
    params: { city: citySlug },
    revalidate: HISTORY_REVALIDATE,
    tags: [historyTag(citySlug)],
  });

// ── Kis shehar ka 20-saal data mukammal hai (owner review, Oct 2026) ──
// Backend /weather/cities/ (sirf DB, Open-Meteo nahi) har shehar ke saath
// `history_complete` deta hai. Wahi ek call (1 ghanta cache) cityPhoto bhi
// karta hai — same URL, isliye backend ko izafi call nahi.
const CITIES_INDEX_REVALIDATE = 60 * 60;

/** slug → index row. Backend down → THROW (caller 5xx deta hai). */
async function citiesIndexStrict() {
  const data = await serverGet(ENDPOINTS.weather.cities, { revalidate: CITIES_INDEX_REVALIDATE, tags: ['cities'] });
  return new Map((data?.cities || []).map((c) => [c.slug, c]));
}

/**
 * Jin whitelist shehron ka data mukammal hai — Set(slug). Sitemap aur
 * internal links isi se filter hote hain (adhoore shehar ka link/URL nahi).
 * Backend down ho to `null` (caller sab shehar rakhe — poori site gayab na ho).
 */
export async function readyCitySlugs() {
  try {
    const idx = await citiesIndexStrict();
    return new Set([...idx.values()].filter((c) => c.history_complete !== false).map((c) => c.slug));
  } catch {
    return null;
  }
}

/** list ko ready shehron tak mehdood karo (index na mile → list waisi hi) */
export async function onlyReady(list, slugOf = (c) => c.slug) {
  const ready = await readyCitySlugs();
  return ready ? list.filter((c) => ready.has(slugOf(c))) : list;
}

/** Sirf EK mahina (adhoore shehar ka month page) — backend sirf us mahine ke missing saal laata hai */
export const getHistoryMonth = (citySlug, month) =>
  serverGet(ENDPOINTS.weather.history, {
    params: { city: citySlug, month },
    revalidate: HISTORY_REVALIDATE,
    tags: [historyTag(citySlug)],
  });

// City / month page ka data (owner review, Oct 2026):
//  • Backend jawab na de / timeout / 5xx → THROW → 5xx, Next cache NAHI
//    karta (pehle se bana achha page ISR mein rehta hai).
//  • Shehar DB (index) mein hi nahi → notFound() = asli 404.
//  • Mahina-war (owner, Oct 2026 — "jitna data chahiye utni calls"):
//    – mukammal shehar → wahi ek history URL (13 pages, 1 cache)
//    – adhoora shehar, month page → `?month=M`: backend SIRF us mahine ke
//      missing saal Open-Meteo se (≈44 calls, poore 20 saal ke ≈522 nahi)
//    – adhoora shehar, city page (12 mahine dikhata hai) → saare mahine
//  • Data aaya magar woh mahina phir bhi khaali (Open-Meteo ke paas nahi) → 404.
//  • Ghalat URL (registry se bahar) pehle hi resolveCity() mein 404.
export async function requireHistory(citySlug, month = null) {
  const idx = await citiesIndexStrict();
  const info = idx.get(citySlug);
  if (!info) notFound();
  const complete = info.history_complete !== false;
  const data = month && !complete ? await getHistoryMonth(citySlug, month) : await getHistory(citySlug);
  if (!data) notFound();
  if (month && !data.monthly_data?.find((r) => r.month === month && r.avg_high != null)) notFound();
  return data;
}

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
