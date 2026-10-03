// ─────────────────────────────────────────────────────────────
//  Month page ki "kahani" ke FACTS (content round A + B1–B4)
//
//  Yahan sirf hisaab hai — text components/climate/MonthStory.jsx mein.
//  Har cheez shehar + mahine ke APNE numbers se:
//   • season (hemisphere ke hisaab se; tropical mein dry/wet sirf jab
//     barish ke numbers saaf dikhayein, warna "warm all year")
//   • temperature / raat / din-raat ka farq / humidity ke "bands"
//   • barish ka andaz: mm per rainy day vs shehar ka saal bhar ka average
//   • daylight (utils/solar.js — NOAA formula)
//  Jumlon ki variety: `pick()` page ke apne numbers se ek seed banata hai
//  (hash) — Math.random nahi, is liye ek page hamesha wahi text dikhata hai.
// ─────────────────────────────────────────────────────────────
import { MONTHS, rowFor, monthRanks, monthRelativeRank, visitVerdict } from './climateMath.js';
import { monthDaylight } from './solar.js';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const monthName = (n) => MONTHS[(((n - 1) % 12) + 12) % 12].name;

// ── Deterministic variety ────────────────────────────────────
// FNV-1a hash — page ke numbers (string) → 32-bit integer
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Page ke numbers se seed. Wahi data → wahi seed → wahi text. */
export function pageSeed(row, monthNum, city) {
  if (!row) return String(monthNum);
  return [monthNum, row.avg_high, row.avg_low, row.avg_rainfall, row.rainy_days, row.sunshine_hours, row.humidity, city?.lat, city?.lon].join('|');
}

/** Variants mein se ek — `salt` har jumle ke liye alag, taake sab ek saath na badlein */
export function pick(seed, salt, variants) {
  if (!variants.length) return null;
  return variants[hash(`${seed}#${salt}`) % variants.length];
}

// ── Season ───────────────────────────────────────────────────
const NORTH_SEASON = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
// Season ka pehla / beech / aakhri mahina (northern: Dec/Mar/Jun/Sep = pehla)
const NORTH_STAGE = ['mid', 'late', 'early', 'mid', 'late', 'early', 'mid', 'late', 'early', 'mid', 'late', 'early'];

/**
 * @returns {{ kind: 'temperate'|'tropical-seasonal'|'tropical-even',
 *             name: string|null, stage: 'early'|'mid'|'late'|null,
 *             hemisphere: 'north'|'south'|'equator' }}
 *  tropical-seasonal: name = 'wet season' | 'dry season' | null (beech ka mahina)
 */
export function seasonOf(monthly, monthNum, lat) {
  const hemisphere = !isNum(lat) ? 'north' : Math.abs(lat) < 10 ? 'equator' : lat >= 0 ? 'north' : 'south';
  if (isNum(lat) && Math.abs(lat) < 23.5) {
    const rains = (monthly || []).filter((m) => isNum(m.avg_rainfall)).map((m) => m.avg_rainfall).sort((a, b) => a - b);
    const cur = rowFor(monthly, monthNum);
    if (rains.length === 12 && cur && isNum(cur.avg_rainfall)) {
      const dry4 = avg(rains.slice(0, 4));
      const wet4 = avg(rains.slice(8));
      // Saaf farq: sab se khushk 4 mahine sab se geele 4 ke 35% se kam
      if (wet4 > 0 && dry4 / wet4 < 0.35) {
        const mean = avg(rains);
        const name = cur.avg_rainfall >= mean * 1.15 ? 'wet season' : cur.avg_rainfall <= mean * 0.6 ? 'dry season' : null;
        return { kind: 'tropical-seasonal', name, stage: null, hemisphere };
      }
    }
    return { kind: 'tropical-even', name: null, stage: null, hemisphere };
  }
  const i = (hemisphere === 'south' ? monthNum + 5 : monthNum - 1) % 12;
  return { kind: 'temperate', name: NORTH_SEASON[i], stage: NORTH_STAGE[i], hemisphere };
}

// ── Bands ────────────────────────────────────────────────────
export function feelBand(hi) {
  if (!isNum(hi)) return null;
  if (hi < 3) return 'freezing';
  if (hi < 8) return 'cold';
  if (hi < 13) return 'chilly';
  if (hi < 18) return 'cool';
  if (hi < 23) return 'mild';
  if (hi < 28) return 'warm';
  if (hi < 33) return 'hot';
  return 'very-hot';
}
export function nightBand(lo) {
  if (!isNum(lo)) return null;
  if (lo < -3) return 'hard-frost';
  if (lo < 1) return 'frosty';
  if (lo < 7) return 'cold';
  if (lo < 13) return 'cool';
  if (lo < 19) return 'mild';
  if (lo < 25) return 'warm';
  return 'sultry';
}
export function swingBand(hi, lo) {
  if (!isNum(hi) || !isNum(lo)) return null;
  const s = hi - lo;
  if (s < 5) return 'tiny';
  if (s < 8) return 'small';
  if (s < 12) return 'moderate';
  return 'big';
}
export function humidityBand(h) {
  if (!isNum(h)) return null;
  if (h < 40) return 'dry';
  if (h < 60) return 'comfortable';
  if (h < 75) return 'humid';
  return 'very-humid';
}

/**
 * Barish ka andaz.
 * freq: dry (≤ 3 din) · occasional (≤ 7) · showery (≤ 12) · wet (> 12)
 * size: mm per rainy day — light (< 4) · moderate (< 9) · heavy (≥ 9)
 * vsYear: is mahine ka mm/rainy day ÷ shehar ka saal bhar ka mm/rainy day
 */
export function rainCharacter(monthly, row) {
  if (!row || !isNum(row.rainy_days) || !isNum(row.avg_rainfall)) return null;
  const days = row.rainy_days;
  const freq = days <= 3 ? 'dry' : days <= 7 ? 'occasional' : days <= 12 ? 'showery' : 'wet';
  const perDay = days >= 1 ? row.avg_rainfall / days : null;
  const rows = (monthly || []).filter((m) => isNum(m.avg_rainfall) && isNum(m.rainy_days));
  const totDays = rows.reduce((a, m) => a + m.rainy_days, 0);
  const yearPerDay = totDays > 0 ? rows.reduce((a, m) => a + m.avg_rainfall, 0) / totDays : null;
  const size = perDay == null ? null : perDay < 4 ? 'light' : perDay < 9 ? 'moderate' : 'heavy';
  const ratio = perDay != null && yearPerDay ? perDay / yearPerDay : null;
  const vsYear = ratio == null ? null : ratio >= 1.25 ? 'heavier' : ratio <= 0.8 ? 'lighter' : 'typical';
  return {
    freq, size, vsYear,
    perDay: perDay == null ? null : Math.round(perDay * 10) / 10,
    yearPerDay: yearPerDay == null ? null : Math.round(yearPerDay * 10) / 10,
    days,
  };
}

/** Temperature ka rukh: pichle → is → agle mahine */
export function trendOf(monthly, monthNum) {
  const prev = rowFor(monthly, monthNum === 1 ? 12 : monthNum - 1);
  const cur = rowFor(monthly, monthNum);
  const next = rowFor(monthly, monthNum === 12 ? 1 : monthNum + 1);
  if (!prev || !cur || !next || ![prev.avg_high, cur.avg_high, next.avg_high].every(isNum)) return null;
  const a = cur.avg_high - prev.avg_high;
  const b = next.avg_high - cur.avg_high;
  if (a > 0.7 && b < -0.7) return 'peak';
  if (a < -0.7 && b > 0.7) return 'trough';
  if (a >= 0.7 && b >= 0.7) return 'warming';
  if (a <= -0.7 && b <= -0.7) return 'cooling';
  if (Math.abs(a) < 0.7 && Math.abs(b) < 0.7) return 'flat';
  return a + b >= 0 ? 'warming' : 'cooling';
}

/** Sunshine hours ÷ daylight hours — din ka kitna hissa saaf aasmaan */
export function sunShare(row, daylight) {
  if (!row || !isNum(row.sunshine_hours) || !daylight || !daylight.dayMinutes) return null;
  return Math.min(100, Math.round((row.sunshine_hours * 60 / daylight.dayMinutes) * 100));
}

/** Sab facts ek jagah */
export function monthFacts(monthly, monthNum, city) {
  const row = rowFor(monthly, monthNum);
  const nextNum = monthNum === 12 ? 1 : monthNum + 1;
  const prevNum = monthNum === 1 ? 12 : monthNum - 1;
  const daylight = monthDaylight(city, monthNum);
  const rows = (monthly || []).filter((m) => isNum(m.avg_high));
  const highs = rows.map((m) => m.avg_high);
  return {
    row,
    seed: pageSeed(row, monthNum, city),
    season: seasonOf(monthly, monthNum, city?.lat),
    feel: feelBand(row?.avg_high),
    night: nightBand(row?.avg_low),
    swing: swingBand(row?.avg_high, row?.avg_low),
    swingC: row && isNum(row.avg_high) && isNum(row.avg_low) ? row.avg_high - row.avg_low : null,
    humidity: humidityBand(row?.humidity),
    rain: rainCharacter(monthly, row),
    trend: trendOf(monthly, monthNum),
    ranks: monthRanks(monthly, monthNum),
    relRank: monthRelativeRank(monthly, monthNum),
    verdict: visitVerdict(row),
    daylight,
    sunShare: sunShare(row, daylight),
    yearRange: highs.length === 12 ? Math.max(...highs) - Math.min(...highs) : null,
    prev: { num: prevNum, name: monthName(prevNum), row: rowFor(monthly, prevNum) },
    next: { num: nextNum, name: monthName(nextNum), row: rowFor(monthly, nextNum), relRank: monthRelativeRank(monthly, nextNum), verdict: visitVerdict(rowFor(monthly, nextNum)) },
  };
}
