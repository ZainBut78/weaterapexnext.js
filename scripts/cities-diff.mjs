// ─────────────────────────────────────────────────────────────
//  CITIES DIFF — data/cities.js (SEO whitelist) vs backend /api/weather/cities/
//  (backend round PART C3). Sirf RIPORT — whitelist khud nahi badalti.
//
//  Chalana:  npm run cities:diff
//            API=https://api.weatherapex.com/api npm run cities:diff
//  Default API: API_INTERNAL_URL ya http://127.0.0.1:8000/api
//
//  Batata hai:
//   1. whitelist mein hai magar backend mein nahi (page 404 dega)
//   2. whitelist mein hai magar backend par 20-saal history adhoori
//      (page ka data backend Open-Meteo se mangwayega)
//   3. backend par mukammal shehar jo whitelist mein NAHI (naye SEO pages
//      ke umeedwar — backend request #6)
//   4. naam / mulk / coordinates ka farq (> 0.1°)
// ─────────────────────────────────────────────────────────────
import { CITIES } from '../data/cities.js';

const API = (process.env.API || process.env.API_INTERNAL_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');

const res = await fetch(`${API}/weather/cities/`, {
  headers: process.env.BACKEND_INTERNAL_KEY ? { 'X-Internal-Key': process.env.BACKEND_INTERNAL_KEY } : {},
});
if (!res.ok) {
  console.error(`Backend ${res.status} for ${API}/weather/cities/ — endpoint maujood hai? (backend round A5)`);
  process.exit(1);
}
const data = await res.json();
const backend = new Map(data.cities.map((c) => [c.slug, c]));
const white = new Map(CITIES.map((c) => [c.slug, c]));

const missing = CITIES.filter((c) => !backend.has(c.slug)).map((c) => c.slug);
const incomplete = CITIES.filter((c) => backend.has(c.slug) && !backend.get(c.slug).history_complete).map((c) => c.slug);
const candidates = data.cities.filter((c) => c.history_complete && !white.has(c.slug)).map((c) => `${c.slug} (${c.country})`);
const mismatch = [];
for (const c of CITIES) {
  const b = backend.get(c.slug);
  if (!b) continue;
  const d = [];
  if (b.name !== c.name) d.push(`name "${c.name}" vs "${b.name}"`);
  if (b.country !== c.country) d.push(`country "${c.country}" vs "${b.country}"`);
  if (typeof c.lat === 'number' && (Math.abs(b.lat - c.lat) > 0.1 || Math.abs(b.lon - c.lon) > 0.1)) {
    d.push(`coords ${c.lat},${c.lon} vs ${b.lat},${b.lon}`);
  }
  if (d.length) mismatch.push(`${c.slug}: ${d.join('; ')}`);
}

const show = (title, list) => {
  console.log(`\n${title}: ${list.length}`);
  for (const x of list) console.log(`  • ${x}`);
};
console.log(`Backend ${API} — ${data.count} cities (${data.year_from}–${data.year_to}); whitelist ${CITIES.length}`);
show('1. In whitelist, NOT in backend (would 404)', missing);
show('2. In whitelist, backend history incomplete (backend would call Open-Meteo)', incomplete);
show('3. Complete in backend, NOT in whitelist (SEO page candidates, #6)', candidates);
show('4. Name / country / coordinate differences', mismatch);
console.log('\nWhitelist is NOT changed automatically — edit data/cities.js by hand if needed.');
