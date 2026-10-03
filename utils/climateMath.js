// ─────────────────────────────────────────────────────────────
//  Climate hisaab (Phase C) — month / country pages ke liye
//
//  Har jumla page ke APNE numbers se banta hai (Google "scaled content"
//  se bachne ke liye — sirf naam badal kar ek jaisa text nahi).
//  Input: backend history ka `monthly_data` (12 rows: month, avg_high,
//  avg_low, avg_rainfall (mm, mahine ka total), rainy_days,
//  sunshine_hours (roz ka avg), humidity).
// ─────────────────────────────────────────────────────────────

export const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
].map((slug, i) => ({
  slug,
  num: i + 1,
  name: slug[0].toUpperCase() + slug.slice(1),
  short: slug.slice(0, 3)[0].toUpperCase() + slug.slice(1, 3),
}));

export const monthBySlug = (slug) => MONTHS.find((m) => m.slug === slug) || null;
export const monthByNum = (n) => MONTHS[(((n - 1) % 12) + 12) % 12];

// Backend (weather/historical.py target_year_range): HISTORICAL_YEARS=20,
// aakhri POORA saal = pichla saal → 2026 mein 2006–2025.
export const HISTORY_YEARS = 20;
export function historyYearRange(today = new Date()) {
  const end = today.getUTCFullYear() - 1;
  return { start: end - HISTORY_YEARS + 1, end };
}

export const mmToIn = (mm) => (mm == null ? null : Math.round((mm / 25.4) * 10) / 10);
const r1 = (v) => Math.round(v * 10) / 10;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

/** monthly_data se ek mahina (1–12) */
export const rowFor = (monthly, num) => (monthly || []).find((m) => m.month === num) || null;

/**
 * Pichle / agle mahine se muqabla.
 * @returns {{ vs: string, month: object, tempDiff: number|null, rainDiff: number|null }[]}
 */
export function neighbourComparisons(monthly, num) {
  const cur = rowFor(monthly, num);
  if (!cur) return [];
  return [num - 1, num + 1].map((n) => {
    const m = monthByNum(n);
    const other = rowFor(monthly, m.num);
    if (!other) return null;
    return {
      month: m,
      tempDiff: isNum(cur.avg_high) && isNum(other.avg_high) ? r1(cur.avg_high - other.avg_high) : null,
      rainDiff: isNum(cur.avg_rainfall) && isNum(other.avg_rainfall) ? Math.round(cur.avg_rainfall - other.avg_rainfall) : null,
    };
  }).filter(Boolean);
}

/**
 * Saal mein is mahine ka rank: garmi/thand aur barish.
 * warmth: agar mahina saal ke garam aadhe mein ho to "Nth warmest", warna "Nth coolest".
 */
export function monthRanks(monthly, num) {
  const cur = rowFor(monthly, num);
  const out = {};
  const temps = (monthly || []).filter((m) => isNum(m.avg_high));
  if (cur && isNum(cur.avg_high) && temps.length === 12) {
    const warmRank = temps.filter((m) => m.avg_high > cur.avg_high).length + 1;
    out.warmth = warmRank <= 6
      ? { kind: 'warmest', rank: warmRank }
      : { kind: 'coolest', rank: 13 - warmRank };
  }
  const rains = (monthly || []).filter((m) => isNum(m.avg_rainfall));
  if (cur && isNum(cur.avg_rainfall) && rains.length === 12) {
    const wetRank = rains.filter((m) => m.avg_rainfall > cur.avg_rainfall).length + 1;
    out.rain = wetRank <= 6
      ? { kind: 'wettest', rank: wetRank }
      : { kind: 'driest', rank: 13 - wetRank };
  }
  return out;
}

/**
 * "Is October a good time to visit?" — Great / Good / Fair / Poor.
 * Trip scoring jaisa khayal (10 se minus), magar mahana AVERAGES par:
 *  • aaram-deh din ka temperature (high) 18–27°C
 *  • barish ke din (rainy_days, ≥ 1 mm) aur mahine ki kul barish
 *  • dhoop (sunshine_hours, roz ka avg)
 * Wajahein saaf likhi jati hain. Yeh historical average hai, forecast nahi.
 */
export function visitVerdict(row) {
  if (!row) return null;
  let score = 10;
  const reasons = [];
  const hi = row.avg_high;
  const lo = row.avg_low;
  const rainDays = row.rainy_days;
  const rain = row.avg_rainfall;
  const sun = row.sunshine_hours;

  if (isNum(hi)) {
    if (hi < 5) { score -= 4; reasons.push({ t: 'cold', text: 'cold days', c: hi }); }
    else if (hi < 12) { score -= 2.5; reasons.push({ t: 'chilly', text: 'chilly days', c: hi }); }
    else if (hi < 18) { score -= 1; reasons.push({ t: 'mild-cool', text: 'mild but cool days', c: hi }); }
    else if (hi <= 27) { reasons.push({ t: 'comfortable', text: 'comfortable temperatures', c: hi, good: true }); }
    else if (hi <= 32) { score -= 1; reasons.push({ t: 'warm', text: 'warm to hot days', c: hi }); }
    else if (hi <= 36) { score -= 2.5; reasons.push({ t: 'hot', text: 'hot days', c: hi }); }
    else { score -= 4; reasons.push({ t: 'very-hot', text: 'very hot days', c: hi }); }
  }
  if (isNum(lo) && lo < 0) { score -= 1; reasons.push({ t: 'frost', text: 'freezing nights', c: lo }); }

  if (isNum(rainDays)) {
    if (rainDays >= 16) { score -= 3; reasons.push({ t: 'rain', text: `rain on most days (about ${rainDays})` }); }
    else if (rainDays >= 11) { score -= 2; reasons.push({ t: 'rain', text: `frequent rain (about ${rainDays} rainy days)` }); }
    else if (rainDays >= 6) { score -= 1; reasons.push({ t: 'rain', text: `some rainy days (about ${rainDays})` }); }
    else { reasons.push({ t: 'dry', text: `mostly dry (about ${rainDays} rainy days)`, good: true }); }
  }
  if (isNum(rain) && rain > 200) { score -= 1; reasons.push({ t: 'heavy', text: `heavy rainfall (${Math.round(rain)} mm)` }); }

  if (isNum(sun)) {
    if (sun < 3) { score -= 1; reasons.push({ t: 'dull', text: `short sunny spells (${sun} h a day)` }); }
    else if (sun >= 8) { reasons.push({ t: 'sunny', text: `plenty of sunshine (${sun} h a day)`, good: true }); }
  }

  score = Math.max(1, Math.round(score * 10) / 10);
  const label = score >= 8.5 ? 'Great' : score >= 7 ? 'Good' : score >= 5 ? 'Fair' : 'Poor';
  return { score, label, reasons };
}

/** Mahine ke numbers se packing (city page ki packing ka month version) */
export function monthPacking(row) {
  if (!row) return [];
  const items = [];
  const hi = row.avg_high;
  const lo = row.avg_low;
  // Raat bhi garam (≥ 22°) ho to "layers" ka mashwara bemaani
  if (isNum(hi) && isNum(lo) && hi - lo >= 8 && lo < 22) {
    // Number nahi likhte — °C ka farq °F wale user ko ghalat lagta
    items.push({ key: 'layers', title: 'Versatile Layers', text: 'Days are noticeably warmer than nights — layers you can add or remove.' });
  }
  if ((isNum(row.rainy_days) && row.rainy_days >= 8) || (isNum(row.avg_rainfall) && row.avg_rainfall > 60)) {
    items.push({ key: 'rain', title: 'Rain Protection', text: 'A compact umbrella and a light waterproof jacket.' });
  }
  if (isNum(hi) && hi > 28) {
    items.push({ key: 'sun', title: 'Sun Protection', text: 'Sunscreen, a hat and sunglasses; light breathable clothes.' });
  }
  if (isNum(hi) && hi >= 12 && hi < 18 && !(isNum(lo) && lo < 5)) {
    items.push({ key: 'jacket', title: 'Light Jacket', text: 'Cool days — a light jacket or sweater for walking around.' });
  }
  if ((isNum(hi) && hi < 12) || (isNum(lo) && lo < 5)) {
    items.push({ key: 'warm', title: 'Warm Layers', text: 'A warm jacket, a hat and gloves for cold mornings and evenings.' });
  }
  if (isNum(row.sunshine_hours) && row.sunshine_hours >= 7 && !(isNum(hi) && hi > 28)) {
    items.push({ key: 'shades', title: 'Sunglasses', text: 'Frequent sunshine — sunglasses and a light hat.' });
  }
  if (!items.length) items.push({ key: 'light', title: 'Light Layers', text: 'Comfortable clothes with a light layer for the evening.' });
  return items;
}

/** Saal ka average high (country page: sab se garam / thanda shehar) */
export const annualMeanHigh = (monthly) => {
  const v = (monthly || []).filter((m) => isNum(m.avg_high)).map((m) => m.avg_high);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

// ── Phase C2 ─────────────────────────────────────────────────

const DAYS_IN_MONTH = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Shehar ke APNE saal mein mahinon ki tarteeb (behtar pehle) — relative.
 * Garam/geele shehron (Singapore) ko bhi "best months" milte hain.
 * Score = visitVerdict; barabar ho to kam rainy days, phir zyada dhoop.
 * @returns {number[]} month numbers, best → worst
 */
export function rankMonths(monthly) {
  return (monthly || [])
    .map((r) => ({ n: r.month, v: visitVerdict(r) }))
    .filter((x) => x.v)
    .sort((a, b) =>
      b.v.score - a.v.score
      || (rowFor(monthly, a.n).rainy_days ?? 99) - (rowFor(monthly, b.n).rainy_days ?? 99)
      || (rowFor(monthly, b.n).sunshine_hours ?? 0) - (rowFor(monthly, a.n).sunshine_hours ?? 0))
    .map((x) => x.n);
}

/** Is mahine ka rank (1 = shehar ka sab se acha mahina) */
export const monthRelativeRank = (monthly, num) => rankMonths(monthly).indexOf(num) + 1 || null;

/** Top N mahine (relative) */
export const bestMonths = (monthly, n = 3) => rankMonths(monthly).slice(0, n).map(monthByNum);

/** "warmer than 6 months of the year" — kitne mahine is se thande (avg high) */
export function warmerThanCount(monthly, num) {
  const cur = rowFor(monthly, num);
  if (!cur || !isNum(cur.avg_high)) return null;
  return (monthly || []).filter((m) => m.month !== num && isNum(m.avg_high) && m.avg_high < cur.avg_high).length;
}

/** Intro ke liye: sab se garam / thanda / geela / khushk / dhoop wala mahina */
export function yearExtremes(monthly) {
  const pick = (key, dir) => {
    const rows = (monthly || []).filter((m) => isNum(m[key]));
    if (!rows.length) return null;
    const r = rows.reduce((a, b) => ((dir > 0 ? b[key] > a[key] : b[key] < a[key]) ? b : a));
    return { month: monthByNum(r.month), row: r };
  };
  return {
    warmest: pick('avg_high', 1),
    coolest: pick('avg_high', -1),
    wettest: pick('avg_rainfall', 1),
    driest: pick('avg_rainfall', -1),
    sunniest: pick('sunshine_hours', 1),
  };
}

/**
 * "Who {Month} suits" — backend trip_planner/activity.py ke thresholds:
 *   rain > 50 → indoor; temp > 32 (coastal → beach, warna midday indoor);
 *   18–28° + rain < 20 + coastal → beach; 18–28° + trails → hiking;
 *   15–26° → parks. `rain` yahan = rainy_days ÷ mahine ke din × 100
 *   (mahana average mein roz ka "rain probability" nahi hota).
 *   Hawa (wind > 30) ka mahana data nahi — woh rule yahan nahi.
 * @param tags { coastal, hiking } (data/cityTags.js)
 */
export function monthSuits(row, tags, num) {
  if (!row || !isNum(row.avg_high)) return [];
  const t = row.avg_high;
  const rain = isNum(row.rainy_days) ? Math.round((row.rainy_days / DAYS_IN_MONTH[num - 1]) * 100) : 0;
  const out = [];
  const sight = rain <= 50 && t >= 10 && t <= 32;
  out.push({
    key: 'sightseeing', label: 'Sightseeing', ok: sight,
    why: sight ? 'daytime temperatures are fine for walking around' : rain > 50 ? 'rain falls on more than half the days' : t > 32 ? 'midday heat makes long walks hard' : 'it is cold for long walks',
  });
  // Parks (backend: 15–26°) — har shehar par laagu
  const parks = t >= 15 && t <= 26 && rain <= 50;
  out.push({
    key: 'parks', label: 'Parks & outdoor', ok: parks,
    why: parks ? 'comfortable for long walks and picnics' : t > 26 ? 'afternoons are too warm to linger outside' : t < 15 ? 'too cool to sit outside for long' : 'rain interrupts outdoor plans',
  });
  // Content round A2: jo cheez is shehar par laagu hi nahi (samandar /
  // trails nahi) woh row dikhate hi nahi
  if (tags.coastal) {
    const beach = (t >= 18 && t <= 28 && rain < 20) || t > 32;
    out.push({
      key: 'beach', label: 'Beach', ok: beach,
      why: beach ? (t > 32 ? 'hot coastal weather' : 'warm and mostly dry on the coast') : t < 18 ? 'the sea air is too cool' : 'too many rainy days',
    });
  }
  if (tags.hiking) {
    const hike = t >= 18 && t <= 28 && rain <= 50;
    out.push({
      key: 'hiking', label: 'Hiking', ok: hike,
      why: hike ? 'mild temperatures for trails' : t < 18 ? 'trails are cool' : t > 28 ? 'too hot for long hikes' : 'wet trails',
    });
  }
  // Museums kabhi "less ideal" nahi — sirf jab asal mashwara ho (barish,
  // bohat garmi / sardi), musbat alfaaz mein
  if (rain > 50 || t > 32 || t < 5) {
    out.push({
      key: 'indoor', label: 'Museums & indoor', ok: true,
      why: rain > 50 ? 'with rain on most days, galleries and museums make easy plans' : t > 32 ? 'a cool break during the hottest hours' : 'warm places to spend the coldest part of the day',
    });
  }
  return out;
}
