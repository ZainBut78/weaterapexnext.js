// ─────────────────────────────────────────────────────────────
//  Embed widget ka HTML (Nov 2026): /embed/<country>/<city>[/<month>].
//  Seedha HTML string: inline CSS + SVG, koi JS, koi cookie, koi bahar ki script nahi (50 KB se
//  kam). Numbers month page wale helpers se (rowFor, monthHistoryFacts, monthPacking,
//  rankMonths), is liye widget aur page ek jaise. Pure: tests/unit/embedWidget.test.mjs.
// ─────────────────────────────────────────────────────────────
import { MONTHS, monthPacking, rankMonths, rowFor, wintryBand } from './climateMath.js';
import { monthHistoryFacts } from './monthHistory.js';
import { wearBand } from './monthWear.js';
import { DAYS_IN } from './monthNarrative.js';
import { embedText } from './embedText.js';

export { MONTH_HEIGHT, YEAR_HEIGHT, esc } from './embedConst.js';
import { esc } from './embedConst.js';

const LOCALE = { en: 'en-GB', de: 'de-DE', it: 'it-IT', ja: 'ja-JP', fr: 'fr-FR', es: 'es-ES' };
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const loc = (lang) => LOCALE[lang] || 'en-GB';
const num = (lang, v, d = 1) => Number(v).toLocaleString(loc(lang), { maximumFractionDigits: d, minimumFractionDigits: 0 });
const monthName = (lang, m, style = 'long') => new Intl.DateTimeFormat(loc(lang), { month: style, timeZone: 'UTC' }).format(new Date(Date.UTC(2026, m - 1, 1)));
const temp = (lang, c) => `${num(lang, c)} °C <span class="f">${Math.round((c * 9) / 5 + 32)} °F</span>`;

/** Month widget ke numbers. history: /weather/climate/years jaisa {rows, flagged} ya null */
export function monthModel({ monthly, monthNum, yearData }) {
  const row = rowFor(monthly, monthNum);
  if (!row || !isNum(row.avg_high)) return null;
  const facts = monthHistoryFacts({ rows: yearData?.rows, flagged: yearData?.flagged || [], monthNum, headline: row });
  return {
    row,
    chance: isNum(row.rainy_days) ? Math.round((row.rainy_days / DAYS_IN[monthNum - 1]) * 100) : null,
    records: facts?.records || [],
    odds: facts?.odds || [],
    n: facts?.n || 0,
    band: wearBand(row.avg_high, row.avg_low, wintryBand(row)),
    pack: monthPacking(row).map((p) => p.key),
    highs: MONTHS.map((m) => rowFor(monthly, m.num)?.avg_high ?? null),
  };
}

export function yearModel({ monthly }) {
  const rows = MONTHS.map((m) => rowFor(monthly, m.num));
  if (rows.some((r) => !r || !isNum(r.avg_high))) return null;
  const ranked = rankMonths(monthly);
  return { rows, best: ranked.slice(0, 3), avoid: ranked.slice(-2).reverse() };
}

const CSS = `*{box-sizing:border-box;margin:0}
html,body{background:var(--bg);color:var(--fg)}
body{font:13px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,"Hiragino Sans","Noto Sans JP",sans-serif;padding:10px 12px}
.light{--bg:#fff;--fg:#0f172a;--mu:#475569;--li:#e2e8f0;--card:#f8fafc;--hi:#ea580c;--lo:#2563eb;--rain:#7dd3fc;--a:#0369a1}
.dark{--bg:#0f172a;--fg:#e2e8f0;--mu:#94a3b8;--li:#334155;--card:#1e293b;--hi:#fb923c;--lo:#60a5fa;--rain:#0ea5e9;--a:#7dd3fc}
h1{font-size:15px;line-height:1.25}
.sub{color:var(--mu);font-size:11px;margin-bottom:6px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0}
.card{background:var(--card);border:1px solid var(--li);border-radius:8px;padding:5px 7px}
.card b{display:block;font-size:14px}.card span{color:var(--mu);font-size:11px}
.f{color:var(--mu);font-size:11px;font-weight:400}
.line{color:var(--mu);font-size:12px;margin:3px 0}
h2{font-size:12px;margin:5px 0 1px}
ul{padding-left:16px}li{font-size:12px}
.rec{list-style:none;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:0 8px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:8px}
svg{display:block;width:100%;height:auto}
.yr{height:160px;max-width:640px;margin:2px 0 0;overflow:visible}.yr text{font-size:11px;text-anchor:middle}.yr .mn{display:none}.mini{max-width:300px}
.foot{border-top:1px solid var(--li);margin-top:5px;padding-top:4px;font-size:11px;display:flex;flex-wrap:wrap;gap:1px 12px}
a{color:var(--a);text-decoration:none}a:hover{text-decoration:underline}
.data{color:var(--mu)}
@media (max-width:480px){.foot .pre{display:none}body{padding:8px 10px}.grid{gap:4px;margin:4px 0}.card{padding:3px 4px}.card b{font-size:12px}.card span,.card .f{font-size:10px;display:block;line-height:1.2}li{font-size:11px}.line{font-size:11px}.two{grid-template-columns:1fr;gap:0}.x3{display:none}h1{font-size:14px}h2{margin:3px 0 0}.sub{margin-bottom:3px}.foot{font-size:10.5px;line-height:1.3;margin-top:4px;padding-top:3px}.mini{max-width:230px}.two.yr2{grid-template-columns:1fr 1fr;gap:8px}.yr .ms{display:none}.yr .mn{display:inline}}`;

function page({ lang, theme, title, body }) {
  return `<!doctype html><html lang="${esc(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title><style>${CSS}</style></head><body class="${theme === 'dark' ? 'dark' : 'light'}">${body}</body></html>`;
}

function footer(T, links) {
  // "Plan your trip dates → Trip Planner": chhoti chaudai par sirf "Trip Planner" (.pre chhupta hai)
  const label = (text) => {
    const i = text.indexOf('→');
    return i < 0 ? esc(text) : `<span class="pre">${esc(text.slice(0, i + 1))} </span>${esc(text.slice(i + 1).trim())}`;
  };
  const a = (href, text, cls = '') => `<a href="${esc(href)}" target="_blank" rel="noopener"${cls ? ` class="${cls}"` : ''}>${label(text)}</a>`;
  return `<div class="foot">${a(links.page, links.pageText)}${a(links.trip, T.trip)}${a(links.events, T.events)}${a('https://open-meteo.com/', T.data, 'data')}</div>`;
}

function miniChart(highs, monthNum, lang) {
  const vals = highs.filter(isNum);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const bars = highs.map((v, i) => {
    if (!isNum(v)) return '';
    const h = 6 + ((v - lo) / Math.max(hi - lo, 1)) * 30;
    return `<rect x="${i * 25 + 2}" y="${30 - h * 0.75}" width="21" height="${h * 0.75}" rx="2" fill="${i + 1 === monthNum ? 'var(--hi)' : 'var(--li)'}"/>`;
  }).join('');
  const labels = MONTHS.map((m, i) => `<text x="${i * 25 + 12.5}" y="40" font-size="9" text-anchor="middle" fill="var(--mu)">${esc(monthName(lang, m.num, 'narrow'))}</text>`).join('');
  return `<svg class="mini" viewBox="0 0 300 43" role="img" aria-hidden="true">${bars}${labels}</svg>`;
}

export function renderMonth({ lang, theme, cityName, monthNum, model, period, links }) {
  const T = embedText(lang);
  const { row } = model;
  const month = monthName(lang, monthNum);
  const title = T.titleMonth(cityName, month);
  const stats = [
    [temp(lang, row.avg_high), T.high],
    [temp(lang, row.avg_low), T.low],
    [num(lang, row.rainy_days, 0), T.rainyDays],
    [`${num(lang, row.avg_rainfall, 0)} mm`, T.rainfall],
  ].map(([v, l]) => `<div class="card"><b>${v}</b><span>${esc(l)}</span></div>`).join('');
  const extra = [model.chance != null ? T.chance(model.chance) : null, isNum(row.sunshine_hours) ? T.sun(num(lang, row.sunshine_hours)) : null].filter(Boolean);
  const records = model.records.map((r) => {
    const v = r.field === 'high' ? `${num(lang, r.value)} °C` : `${num(lang, r.value, 0)} mm`;
    return `<li>${esc(T.record[r.key])} ${r.year ?? esc(T.years(r.ties))} · ${v}</li>`;
  }).join('');
  const odds = model.odds.slice(0, 3).map((o, i) => {
    const t = o.kind === 'warm' || o.kind === 'cool' ? num(lang, o.t) : num(lang, o.t, 0);
    return `<li${i >= 2 ? ' class="x3"' : ''}>${esc(T.odds[o.kind](o.count, model.n, t))}</li>`;
  }).join('');
  const wear = [T.band[model.band], ...model.pack.map((k) => T.pack[k]).filter(Boolean)].join(', ');
  const body = `<h1>${esc(title)}</h1><p class="sub">${esc(period)}</p>
<div class="grid">${stats}</div>${extra.length ? `<p class="line">${esc(extra.join(' · '))}</p>` : ''}
${records ? `<div class="two"><div><h2>${esc(T.recordsTitle)}</h2><ul class="rec">${records}</ul></div><div><h2>${esc(T.oddsTitle)}</h2><ul>${odds}</ul></div></div>` : ''}
<h2>${esc(T.wearTitle)}</h2><p class="line">${esc(wear)}</p>
${miniChart(model.highs, monthNum, lang)}
${footer(T, { ...links, pageText: T.monthLink(cityName, month) })}`;
  return page({ lang, theme, title, body });
}

// Saal ka chart (Nov 2026 fix): unchai chaudai se AZAD. Bahar wala <svg> bina viewBox (1 unit = 1px,
// text kabhi bara nahi hota, x %-mein); andar wala <svg> sirf lines/bars ko chaudai mein khinchta
// hai (preserveAspectRatio="none", stroke non-scaling). Teen alag patti, koi label takrata nahi:
//   temperature 0–CH.temp (high label upar, low label neeche) · baarish CH.rainTop–CH.rainBot (din ki ginti bar
//   ke upar, apni patti mein) · mahine ke naam.
const CH = { top: 16, temp: 88, rainTop: 100, rainBot: 140, month: 155, h: 160 };
function yearChart(rows, lang, T) {
  const highs = rows.map((r) => r.avg_high);
  const lows = rows.map((r) => r.avg_low);
  const tMin = Math.min(...lows);
  const tMax = Math.max(...highs);
  const rMax = Math.max(...rows.map((r) => r.avg_rainfall || 0), 1);
  // high labels ke liye upar jagah, low labels (+13) temp patti ke andar
  const ty = (v) => CH.top + (1 - (v - tMin) / Math.max(tMax - tMin, 1)) * (CH.temp - CH.top - 14);
  const cx = (i) => (i + 0.5) * 100;                        // andar wala viewBox: 1200 chaura
  const px = (i) => `${((i + 0.5) / 12) * 100}%`;            // bahar wala: %
  const rainH = (r) => 4 + ((r.avg_rainfall || 0) / rMax) * (CH.rainBot - CH.rainTop - 18);
  const bars = rows.map((r, i) => `<rect x="${cx(i) - 30}" y="${CH.rainBot - rainH(r)}" width="60" height="${rainH(r)}" fill="var(--rain)" opacity=".75"/>`).join('');
  const poly = (vals, color) => `<polyline fill="none" stroke="${color}" stroke-width="2.5" vector-effect="non-scaling-stroke" points="${vals.map((v, i) => `${cx(i)},${ty(v)}`).join(' ')}"/>`;
  const txt = (i, y, v, fill, cls = '') => `<text x="${px(i)}" y="${y}" fill="${fill}"${cls ? ` class="${cls}"` : ''}>${v}</text>`;
  const labels = [
    ...rows.map((r, i) => txt(i, CH.rainBot - rainH(r) - 3, Math.round(r.rainy_days), 'var(--mu)')),
    ...highs.map((v, i) => txt(i, ty(v) - 5, Math.round(v), 'var(--hi)')),
    ...lows.map((v, i) => txt(i, ty(v) + 13, Math.round(v), 'var(--lo)')),
    ...MONTHS.map((m, i) => txt(i, CH.month, esc(monthName(lang, m.num, 'short').slice(0, 3)), 'var(--mu)', 'ms')),
    // Chhoti chaudai: ek harf (J F M…); Japanese mein "10月" bhi chaura, is liye sirf 1–12
    ...MONTHS.map((m, i) => txt(i, CH.month, lang === 'ja' ? m.num : esc(monthName(lang, m.num, 'narrow')), 'var(--mu)', 'mn')),
  ].join('');
  return `<svg class="yr" width="100%" height="${CH.h}" role="img" aria-label="${esc(`${T.legend.high}, ${T.legend.low} (°C), ${T.rainyDays}, ${T.legend.rain}`)}"><svg width="100%" height="${CH.h}" viewBox="0 0 1200 ${CH.h}" preserveAspectRatio="none">${bars}${poly(highs, 'var(--hi)')}${poly(lows, 'var(--lo)')}</svg>${labels}</svg>
<p class="line"><span style="color:var(--hi)">●</span> ${esc(T.legend.high)} °C · <span style="color:var(--lo)">●</span> ${esc(T.legend.low)} °C · <span style="color:var(--rain)">■</span> ${esc(T.legend.rain)}, ${esc(T.rainyDays)}</p>`;
}

export function renderYear({ lang, theme, cityName, model, period, links }) {
  const T = embedText(lang);
  const title = T.titleYear(cityName);
  const list = (nums) => nums.map((n) => esc(monthName(lang, n))).join(', ');
  const body = `<h1>${esc(title)}</h1><p class="sub">${esc(period)}</p>
${yearChart(model.rows, lang, T)}
<div class="two yr2"><div><h2>${esc(T.best)}</h2><p class="line">${list(model.best)}</p></div><div><h2>${esc(T.avoid)}</h2><p class="line">${list(model.avoid)}</p></div></div>
${footer(T, { ...links, pageText: T.yearLink(cityName) })}`;
  return page({ lang, theme, title, body });
}

export function renderMessage({ lang, theme, text }) {
  return page({ lang, theme, title: 'WeatherApex', body: `<p class="line">${esc(text)}</p>` });
}
