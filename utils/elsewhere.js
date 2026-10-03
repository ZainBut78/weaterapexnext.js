// ─────────────────────────────────────────────────────────────
//  "Warmer / drier places in {Month}" (content round B5 → backend round C2)
//
//  Data: backend climate summary (?month=M) — saare mukammal shehron ka
//  wahi mahina, EK call (24 h cache). Sirf asal numbers; koi shehar ka
//  naam code mein nahi; Math.random nahi (wahi data → wahi list).
//
//  Qaide:
//   • warmer: yeh shehar thanda ho (avg high < 26°) aur doosre ka high
//     kam az kam 3° zyada, magar 32° se kam (garmi ki taraf nahi dhakelna)
//   • drier: is shehar mein 6+ rainy days, doosre mein kam az kam 4 kam,
//     aur temperature milta julta (±6°)
//   • sirf whitelist shehar (unke apne month pages hain); paas wale pehle
//     (lat/lon ka faasla) — traveller ke liye mufeed
//   • max 5; 2 se kam hon to [] (section nahi dikhta)
// ─────────────────────────────────────────────────────────────
import { CITIES } from '../data/cities.js';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function km(a, b) {
  const r = (d) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/**
 * @param {object} o
 * @param {{slug,lat,lon}} o.city     — is page ka shehar (data/cities.js row)
 * @param {object} o.row              — is shehar ka is mahine ka row (avg_high, rainy_days)
 * @param {Map<string,{month_data}>} o.summary — climate summary (?month=M)
 * @param {(slug:string)=>string} o.hrefFor — us shehar ke usi mahine ka URL
 * @param {number} [o.max=5]
 * @returns {{slug,name,country,href,row,warmer,drier,km}[]}
 */
export function pickElsewhere({ city, row, summary, hrefFor, max = 5 }) {
  if (!city || !row || !summary || !isNum(row.avg_high)) return [];
  const hi = row.avg_high;
  const wantWarmer = hi < 26;
  const wantDrier = isNum(row.rainy_days) && row.rainy_days >= 6;
  if (!wantWarmer && !wantDrier) return [];

  const cands = [];
  for (const c of CITIES) {
    if (c.slug === city.slug || typeof c.lat !== 'number') continue;
    const m = summary.get(c.slug)?.month_data;
    if (!m || !isNum(m.avg_high)) continue;
    const warmer = wantWarmer && m.avg_high - hi >= 3 && m.avg_high < 32;
    const drier = wantDrier && isNum(m.rainy_days) && row.rainy_days - m.rainy_days >= 4 && Math.abs(m.avg_high - hi) <= 6;
    if (!warmer && !drier) continue;
    cands.push({ slug: c.slug, name: c.name, country: c.country, href: hrefFor(c.slug), row: m, warmer, drier, km: km(city, c) });
  }
  cands.sort((a, b) => a.km - b.km || a.slug.localeCompare(b.slug));

  // Dono qism ke kuch — sirf sab se paas wale warmer na bhar dein
  const pick = [];
  const take = (pred, n) => {
    for (const c of cands) {
      if (pick.length >= max || n <= 0) break;
      if (pred(c) && !pick.includes(c)) { pick.push(c); n--; }
    }
  };
  take((c) => c.warmer, 3);
  take((c) => c.drier, 3);
  take(() => true, max);
  const out = pick.slice(0, max).sort((a, b) => a.km - b.km);
  return out.length >= 2 ? out : [];
}
