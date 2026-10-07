// ─────────────────────────────────────────────────────────────
//  Trip planner ki tareekhon ki window (UX fixes PART C).
//
//  "Aaj" teen jagah alag ho sakta hai:
//   • browser (user ki local date) — user calendar par yahi dekhta hai
//   • backend — `date.today()` Django TIME_ZONE='UTC' par = UTC date;
//     `end - today <= 15` ho to forecast, warna historical estimate
//     (pehle `<= 16` tha — +16 par forecast maangta aur 503; Oct 2026 fix)
//   • Open-Meteo — end_date zyada se zyada UTC aaj + 15 (Oct 2026 test:
//     Honolulu ke liye bhi +16 par "out of allowed range")
//  Is liye:
//   • forecast: pehla din = browser ka aaj, aakhri = UTC aaj + 15
//     (Pakistan mein raat 12–5 baje 15 din, warna 16)
//   • estimate: aakhri din >= UTC aaj + 16 — forecast ke foran baad, koi
//     khaali din nahi. Backend ka `<= 15` fix PEHLE deploy hona zaroori.
// ─────────────────────────────────────────────────────────────
export const FORECAST_LAST_OFFSET = 15;
export const ESTIMATE_FIRST_END_OFFSET = 16;
export const ESTIMATE_MAX_AHEAD_DAYS = 365;

const pad = (n) => String(n).padStart(2, '0');

export const localIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const daysBetween = (a, b) =>
  Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);

// "Oct 6" — UTC mein format, taake browser ka timezone din na khiskaye
export const fmtShort = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export function forecastWindow(now = new Date()) {
  const start = localIso(now);
  const utcToday = now.toISOString().slice(0, 10);
  const end = addDays(utcToday, FORECAST_LAST_OFFSET);
  const days = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return {
    start,
    end,
    days,
    estimateFrom: addDays(utcToday, ESTIMATE_FIRST_END_OFFSET),
    estimateMax: addDays(start, ESTIMATE_MAX_AHEAD_DAYS),
  };
}

export const inForecast = (win, iso) => !!iso && iso >= win.start && iso <= win.end;
