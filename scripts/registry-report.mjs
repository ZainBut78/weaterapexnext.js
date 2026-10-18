// ─────────────────────────────────────────────────────────────
//  City registry report + chhote tests (plain Node).
//    node scripts/registry-report.mjs            → live API ka index
//    API=http://127.0.0.1:8000/api node scripts/registry-report.mjs
//  Batata hai: site par kitne shehar (static + DB), DB duplicates (alias →
//  asli), aur jo shamil nahi hue (wajah ke saath). Phir duplicate / mulk /
//  adhoore data ke qaidon ke tests.
// ─────────────────────────────────────────────────────────────
import { buildRegistry } from '../utils/cityRegistryCore.js';

const API = (process.env.API || 'https://api.weatherapex.com/api').replace(/\/+$/, '');
let failures = 0;
const ok = (cond, what) => { if (!cond) failures++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${what}`); };

const rows = (await (await fetch(`${API}/weather/cities/`)).json()).cities;
const reg = buildRegistry(rows);
const extra = reg.cities.filter((c) => !c.isStatic);
console.log(`index rows: ${rows.length} | on site: ${reg.cities.length} (static ${reg.cities.length - extra.length} + DB ${extra.length})`);
console.log('DB cities added:', extra.map((c) => `${c.slug} → ${reg.cityPath(c.slug)}`).join(', ') || 'none');
console.log('aliases (301 → canonical):', [...reg.aliases].map(([a, b]) => `${a} → ${b}`).join(', ') || 'none');
console.log('skipped:', reg.skipped.map((s) => `${s.slug} (${s.reason})`).join(', ') || 'none');

// ── Qaidon ke tests (nakli rows) ──
const base = { region: 'other', lat: 1, lon: 1, is_coastal: false, has_hiking_trails: false, history_complete: true };
const t = buildRegistry([
  ...rows.filter((r) => r.slug === 'new-york' || r.slug === 'london'),
  { ...base, slug: 'newyork', name: 'Newyork', country: 'USA' },
  { ...base, slug: 'new-york-city', name: 'New York', country: 'United States' },
  { ...base, slug: 'testabad', name: 'Testabad', country: 'Pakistan' },
  { ...base, slug: 'test-abad', name: 'Test Abad', country: 'Pakistan' },
  { ...base, slug: 'half', name: 'Half', country: 'Pakistan', history_complete: false },
  { ...base, slug: 'nowhere', name: 'Nowhere', country: 'Atlantis' },
  { ...base, slug: 'spain', name: 'Spain', country: 'Spain' },
  { ...base, slug: 'london-x', name: 'London', country: 'Canada' },
]);
ok(t.aliases.get('newyork') === 'new-york', 'DB "newyork" (USA) is an alias of static "new-york"');
ok(t.aliases.get('new-york-city') === 'new-york', 'same name + country ("New York", United States) → alias');
ok(t.has('test-abad') && t.aliases.get('testabad') === 'test-abad', 'two DB records of one city → one canonical (hyphenated slug from the name wins)');
ok(t.cityPath('test-abad') === '/weather/pakistan/test-abad', 'new DB city gets /weather/<country>/<city>');
ok(!t.has('half'), 'incomplete history → not on site');
ok(!t.has('nowhere') && t.skipped.some((s) => s.slug === 'nowhere'), 'unknown country → skipped');
ok(!t.has('spain'), 'slug equal to a country slug → skipped');
ok(t.has('london') && t.cityPath('london') === '/weather/united-kingdom/london', 'static city keeps its URL');
ok(!t.has('london-x') && t.skipped.some((s) => s.slug === 'london-x'), 'same name as a site city in another country → skipped for review');
const down = buildRegistry(null);
ok(down.degraded && down.cities.length >= 160, 'backend down → static list (site does not disappear)');
console.log(failures ? `\n${failures} failed` : '\nall passed');
process.exitCode = failures ? 1 : 0;
