// ─────────────────────────────────────────────────────────────
//  "<Month> in <City>: what 20 years show" ke facts (Step 5, Nov 2026) — sirf hisaab
//
//  Data: HistoricalWeather ki mahana rows (wahi rows jin se page ke headline numbers
//  bante hain). Koi naya fetch nahi. Yeh daily records NAHI: "warmest March", "warmest day" nahi.
//   • 15 se kam mukammal saal → null (block nahi dikhta)
//   • rows ka average headline se na mile (rounding se zyada) → null: page par do
//     alag sach kabhi nahi
//   • is mahine ki koi row data-quality signal par aaye → null (Step 5 aur Step 6 dono)
//   • latest saal (range ke baad) record tode ya barabar ho → `breaks` mein, record ke
//     saath likha jata hai
// ─────────────────────────────────────────────────────────────
const MIN_YEARS = 15;
const r1 = (v) => Math.round(v * 10) / 10;
const r0 = (v) => Math.round(v);
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** Poora number; -0.3 se "-0" kabhi nahi chhapta */
export const whole = (v) => Math.round(v) + 0;

/** Beech ke 80% saal: upar neeche 10% chhor kar */
export function middle80(values) {
  const v = [...values].sort((a, b) => a - b);
  const k = Math.round(v.length * 0.1);
  return [v[k], v[v.length - 1 - k]];
}

/** Gol threshold jo target ke sab se qareeb ho; 0/n aur n/n kabhi nahi. */
function chooseThreshold(values, cmp, target, step, lo, hi) {
  const test = (x, t) => (cmp === 'ge' ? x >= t : x < t);
  const start = Math.floor(Math.min(...values) / step);
  const end = Math.ceil(Math.max(...values) / step);
  let best = null;
  for (let i = start; i <= end; i += 1) {
    const t = Math.round(i * step * 100) / 100;
    const count = values.filter((x) => test(x, t)).length;
    const share = count / values.length;
    if (share >= lo && share <= hi && (!best || Math.abs(share - target) < Math.abs(best.share - target))) {
      best = { t, count, share };
    }
  }
  return best && { t: best.t, count: best.count };
}

/** Is shehar ke apne saalon se 3–4 odds. */
export function chooseOdds(rows) {
  const n = rows.length;
  const days = rows.map((r) => r.days);
  const rain = rows.map((r) => r.rain);
  const high = rows.map((r) => r.high);
  const median = [...rain].sort((a, b) => a - b)[Math.floor(n / 2)];
  const hiStep = Math.max(...high) - Math.min(...high) < 3 ? 0.5 : 1;
  const rainStep = median < 15 ? 1 : median < 100 ? 5 : 10;

  const pass = (lo, hi) => {
    const out = [];
    const d = chooseThreshold(days, 'ge', 0.35, 1, lo, hi);
    const anyRain = days.filter((x) => x >= 1).length;
    if (d) out.push({ kind: d.t === 1 ? 'anyrain' : 'rainy', ...d });
    else if (anyRain > 0 && anyRain < n) out.push({ kind: 'anyrain', t: 1, count: anyRain });
    const dry = median >= 3 ? chooseThreshold(rain, 'lt', 0.25, rainStep, lo, hi) : null;
    if (dry) out.push({ kind: 'dry', ...dry });
    const warm = chooseThreshold(high, 'ge', 0.25, hiStep, lo, hi);
    if (warm) out.push({ kind: 'warm', ...warm });
    const cool = chooseThreshold(high, 'lt', 0.25, hiStep, lo, hi);
    if (cool) out.push({ kind: 'cool', ...cool });
    return out;
  };
  const first = pass(0.15, 0.6);
  return (first.length >= 3 ? first : pass(0.1, 0.7)).slice(0, 4);
}

/** Record + us ke barabar saal. Ek se zyada saal barabar → saal ki jagah ginti. */
function record(rows, key, field, pick, round) {
  const best = round(pick(...rows.map((r) => r[field])));
  const same = rows.filter((r) => round(r[field]) === best);
  const only = same.length === 1 ? same[0] : null;
  return {
    key,
    value: best,
    field,
    ties: same.length,
    year: only?.year ?? null,
    high: only?.high ?? null,
    rain: only?.rain ?? null,
    days: only?.days ?? null,
  };
}

/** Latest saal vs records: tod diya (beat) ya barabar (match) */
export function latestBreaks(records, latest) {
  const out = [];
  for (const rec of records) {
    const raw = rec.field === 'high' ? latest.high : latest.rain;
    if (!isNum(raw)) continue;
    const v = rec.field === 'high' ? r1(raw) : r0(raw);
    const beat = rec.key === 'warm' || rec.key === 'wet' ? v > rec.value : v < rec.value;
    if (beat) out.push({ key: rec.key, type: 'beat', value: v });
    else if (v === rec.value) out.push({ key: rec.key, type: 'match', value: v });
  }
  return out;
}

/**
 * @param {object} o
 * @param {Array} o.rows       [[year, month, high, rain, days], …] poori range ke
 * @param {number} o.monthNum
 * @param {object} o.headline  page ka row (avg_high, avg_rainfall, rainy_days)
 * @param {object|null} o.latest  data.recent ka row (Latest actual wali line wahi)
 * @param {number[]} o.flagged  woh mahine jin ki koi row "impossible" ya "mean_rain" par aaye
 * @returns facts ya null (block nahi)
 */
export function monthHistoryFacts({ rows, monthNum, headline, latest = null, flagged = [] }) {
  // Data-quality guard (backend rain_quality): is mahine ki koi row shak mein → block nahi
  if (flagged.includes(monthNum)) return null;
  const list = (rows || []).filter((r) => r[1] === monthNum).map((r) => ({ year: r[0], high: r[2], rain: r[3], days: r[4] }))
    .filter((r) => isNum(r.high) && isNum(r.rain) && isNum(r.days));
  if (list.length < MIN_YEARS || !headline) return null;

  // Wahi rows, wahi definition: average headline se mile (sirf rounding ka farq)
  if (Math.abs(mean(list.map((r) => r.high)) - headline.avg_high) > 0.11) return null;
  if (Math.abs(mean(list.map((r) => r.rain)) - headline.avg_rainfall) > 0.6) return null;
  if (Math.abs(mean(list.map((r) => r.days)) - headline.rainy_days) > 0.6) return null;

  const [highLo, highHi] = middle80(list.map((r) => r.high));
  const [rainLo, rainHi] = middle80(list.map((r) => r.rain));
  const records = [
    record(list, 'warm', 'high', Math.max, r1),
    record(list, 'cold', 'high', Math.min, r1),
    record(list, 'wet', 'rain', Math.max, r0),
    record(list, 'dry', 'rain', Math.min, r0),
  ];
  const years = list.map((r) => r.year);
  const from = Math.min(...years);
  const to = Math.max(...years);

  let late = null;
  if (latest && isNum(latest.avg_high) && latest.year > to) {
    const norm = { high: latest.avg_high, rain: latest.avg_rainfall };
    const breaks = latestBreaks(records, norm);
    const all = [...list.map((r) => r.high), latest.avg_high];
    const warmer = all.filter((v) => r1(v) > r1(latest.avg_high)).length + 1;
    const cooler = all.filter((v) => r1(v) < r1(latest.avg_high)).length + 1;
    late = {
      year: latest.year,
      high: latest.avg_high,
      rain: latest.avg_rainfall,
      days: latest.rainy_days,
      total: all.length,
      breaks,
      // Garmi ka record toota / barabar → rank ka jumla bekaar (record wala hi kaafi)
      rank: breaks.some((b) => b.key === 'warm' || b.key === 'cold') ? null
        : warmer <= cooler ? { dir: 'warm', rank: warmer } : { dir: 'cold', rank: cooler },
    };
  }

  return {
    n: list.length,
    from,
    to,
    range: { highLo, highHi, rainLo: r0(rainLo), rainHi: r0(rainHi) },
    records,
    odds: chooseOdds(list),
    latest: late,
  };
}
