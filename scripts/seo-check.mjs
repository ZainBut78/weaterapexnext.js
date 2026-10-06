// ─────────────────────────────────────────────────────────────
//  SEO CHECK — raw server HTML (JavaScript nahi chalta, jaise Google ka
//  pehla crawl). Plain Node fetch, koi dependency nahi.
//
//  Chalana:  npm run build && npm start      (doosre terminal mein)
//            node scripts/seo-check.mjs
//  Doosra server/port:  BASE=http://localhost:3001 node scripts/seo-check.mjs
//  Optional: BACKEND_LOG=<file> — ek logging proxy ki file; "unknown city
//  → backend call nahi" wala check isi se hota hai (warna skip).
//
//  SEO_ALL=1 — sitemap ke SAARE Section 2 pages khol kar asli title/
//  description ka duplicate check. HISTORY_READY_LOCAL=1 ho to sirf un
//  shehron ke pages jin ka data local DB mein mukammal hai (khaali shehar
//  kholne se backend Open-Meteo se 20 saal mangwata hai).
//  Offline check hamesha: sitemap ke saare URLs ke title (page ke pattern
//  se) unique hon.
//
//  Exit code 0 = sab pass, 1 = koi fail.
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs';
import { CITIES } from '../data/cities.js';
import { COUNTRIES, countryOfCity, hasCountryPage } from '../data/countries.js';
import { HISTORY_READY } from '../data/historyReady.js';
import { MONTHS } from '../utils/climateMath.js';

const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/+$/, '');
const SITE = 'https://weatherapex.com';
const BACKEND_LOG = process.env.BACKEND_LOG;

// Indexable public routes (200, index, canonical, unique title/desc)
const PUBLIC = [
  '/', '/trip-planner', '/events', '/climate-guides', '/blog', '/blog?page=2',
  '/api-docs', '/about', '/terms', '/privacy',
  '/weather/london', '/weather/new-york', '/weather/singapore',
  // Section 2 (Phase C2)
  '/weather', '/weather/united-kingdom', '/weather/united-kingdom/london',
  '/weather/united-kingdom/london/october', '/weather/united-states/new-york/july',
  '/weather/singapore/singapore', '/weather/hungary/budapest',
];
// 200 magar noindex
const NOINDEX = ['/login', '/signup', '/pricing'];
// Asli 404
const NOT_FOUND = ['/koi-ghalat-page', '/blog/nahi-hai-xyz', '/blog?page=99', '/weather/multan', '/weather/qzxvnotacity',
  '/weather/united-kingdom/london/smarch', '/weather/united-states/multan', '/weather/france/london', '/weather/china/hong-kong', '/weather/narnia'];
// JSON-LD jo lazmi hona chahiye
const JSONLD_REQUIRED = {
  '/': ['Organization', 'WebSite'],
  '/weather/london': ['BreadcrumbList'],
  '/weather': ['BreadcrumbList'],
  '/weather/united-kingdom': ['BreadcrumbList'],
  '/weather/united-kingdom/london': ['BreadcrumbList'],
  '/weather/united-kingdom/london/october': ['BreadcrumbList'],
  '/weather/singapore/singapore': ['BreadcrumbList'],
};

let failures = 0;
let quiet = false;   // SEO_ALL: sirf FAIL lines, PASS sirf gine jate hain
let quietPasses = 0;
const results = [];
const ok = (cond, route, what, detail = '') => {
  if (!cond) failures++;
  if (quiet && cond) { quietPasses++; return; }
  results.push(`${cond ? 'PASS' : 'FAIL'}  ${route.padEnd(28)} ${what}${detail ? `  — ${detail}` : ''}`);
};

const decode = (s) => (s || '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (html, re) => decode((html.match(re) || [])[1]);

async function get(path, opts = {}) {
  const r = await fetch(BASE + path, { redirect: 'manual', ...opts });
  return {
    status: r.status, location: r.headers.get('location'), type: r.headers.get('content-type') || '',
    robotsTag: r.headers.get('x-robots-tag') || '', html: await r.text(),
  };
}

function jsonLdTypes(html, route) {
  const types = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      const items = j['@graph'] || [j];
      for (const it of items) {
        ok(!!it['@type'], route, 'JSON-LD item has @type');
        types.push(it['@type']);
      }
    } catch (e) {
      ok(false, route, 'JSON-LD parses', e.message);
    }
  }
  return types;
}

const titles = new Map();
const descs = new Map();
const descOf = new Map(); // route → description (Section 1 ↔ 2 takraav check)

// Blog posts: pehli 2 posts sitemap se utha kar public list mein
async function blogSamples() {
  const r = await get('/sitemap.xml');
  const locs = [...r.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, ''));
  return locs.filter((p) => p.startsWith('/blog/')).slice(0, 3);
}

async function main() {
  console.log(`SEO check against ${BASE}\n`);
  const blogPosts = await blogSamples();

  for (const route of [...PUBLIC, ...blogPosts]) {
    const r = await get(route);
    await checkPage(route, r, blogPosts);
  }
  await allSection2Pages();
  offlineTitleCheck();

  for (const [t, routes] of titles) ok(routes.length === 1, routes.slice(0, 3).join(', '), 'title unique', t);
  for (const [d, routes] of descs) ok(routes.length === 1, routes.slice(0, 3).join(', '), 'description unique', d.slice(0, 60));
  results.push(`info  titles checked: ${titles.size} unique of ${[...titles.values()].reduce((a, r) => a + r.length, 0)} pages`);

  cannibalizationCheck();

  await redirectChecks();
  await restChecks();
}

// ── Section 1 (/weather/{city}) vs Section 2 (/weather/{country}/{city}) ──
// Content round A4: Section 1 = "climate / 20-year averages / charts",
// Section 2 = "weather by month". Descriptions alag hon (word Jaccard < 35%),
// Section 1 mein "month by month" na ho, aur "X, X" (Singapore, Singapore) na ho.
function cannibalizationCheck() {
  const words = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2));
  let pairs = 0;
  let worst = 0;
  for (const c of CITIES) {
    const s1 = descOf.get(`/weather/${c.slug}`);
    if (!s1) continue;
    ok(!/month[- ]by[- ]month/i.test(s1), `/weather/${c.slug}`, 'Section 1 description has no "month by month"', s1.slice(0, 60));
    ok(!new RegExp(`${c.name}, ${c.name}`).test(s1), `/weather/${c.slug}`, 'no doubled name in description', s1.slice(0, 60));
    const s2 = descOf.get(`/weather/${countryOfCity(c)?.slug}/${c.slug}`);
    if (!s2) continue;
    const a = words(s1);
    const b = words(s2);
    let inter = 0;
    for (const w of a) if (b.has(w)) inter++;
    const j = inter / (a.size + b.size - inter || 1);
    worst = Math.max(worst, j);
    pairs++;
    ok(j < 0.35, `/weather/${c.slug}`, 'Section 1 vs Section 2 description overlap < 35%', `${Math.round(j * 100)}%`);
  }
  results.push(`info  Section 1 ↔ 2 descriptions     ${pairs} city pairs compared, max word overlap ${Math.round(worst * 100)}%`);
}

async function checkPage(route, r) {
  {
    ok(r.status === 200, route, 'status 200', `got ${r.status}`);
    const h1 = (r.html.match(/<h1[\s>]/g) || []).length;
    ok(h1 === 1, route, 'exactly one <h1>', `got ${h1}`);
    const title = meta(r.html, /<title>([^<]*)<\/title>/);
    const desc = meta(r.html, /<meta name="description" content="([^"]*)"/);
    ok(!!title, route, 'has <title>');
    ok(!!desc, route, 'has meta description');
    if (title) titles.set(title, [...(titles.get(title) || []), route]);
    if (desc) descs.set(desc, [...(descs.get(desc) || []), route]);
    if (desc) descOf.set(route, desc);
    const canon = meta(r.html, /<link rel="canonical" href="([^"]*)"/);
    ok(/^https:\/\//.test(canon), route, 'canonical absolute', canon || 'missing');
    const expected = SITE + (route === '/' ? '' : route);
    ok(canon === expected, route, 'canonical = own URL (lowercase, no slash)', `${canon} vs ${expected}`);
    ok(!/<meta name="robots" content="[^"]*noindex/.test(r.html), route, 'no noindex');
    ok(!!meta(r.html, /<meta property="og:url" content="([^"]*)"/), route, 'og:url');
    ok(!!meta(r.html, /<meta property="og:image" content="([^"]*)"/), route, 'og:image');
    ok(meta(r.html, /<meta name="twitter:card" content="([^"]*)"/) === 'summary_large_image', route, 'twitter:card');
    const types = jsonLdTypes(r.html, route);
    for (const t of JSONLD_REQUIRED[route] || []) ok(types.includes(t), route, `JSON-LD ${t}`);
    if (route.startsWith('/blog/')) {
      ok(types.includes('Article') && types.includes('BreadcrumbList'), route, 'JSON-LD Article + BreadcrumbList');
      const aff = [...r.html.matchAll(/<a [^>]*target="_blank"[^>]*>/g)].map((m) => m[0]);
      for (const a of aff) ok(/rel="[^"]*sponsored/.test(a), route, 'affiliate link rel has sponsored');
      if (!aff.length) results.push(`info  ${route.padEnd(28)} (no affiliate links on this post)`);
      ok(!/\| WeatherApex Blog \| WeatherApex Blog/.test(title), route, 'title has no doubled suffix', title);
    }
  }

}

// ── SEO_ALL: sitemap ke saare Section 2 pages (asli fetch) ─────
async function allSection2Pages() {
  if (process.env.SEO_ALL !== '1') { results.push('skip  SEO_ALL                      all Section 2 pages (set SEO_ALL=1)'); return; }
  const sm = await get('/sitemap.xml');
  const locs = [...sm.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '') || '/');
  const local = process.env.HISTORY_READY_LOCAL === '1';
  const cityOf = (p) => { const parts = p.split('/'); return parts.length >= 4 ? parts[3] : null; };
  const countryCities = (slug) => CITIES.filter((c) => countryOfCity(c)?.slug === slug).map((c) => c.slug);
  const section2 = locs.filter((p) => {
    const parts = p.split('/');
    if (parts[1] !== 'weather') return false;
    if (parts.length === 2) return true;                     // /weather
    // Section 1 city page (/weather/{city}) bhi — A4 takraav check ke liye
    if (parts.length === 3 && CITIES.find((c) => c.slug === parts[2])) return !local || HISTORY_READY.has(parts[2]);
    if (parts.length === 3) return !!COUNTRIES.find((c) => c.slug === parts[2]) // country
      && (!local || countryCities(parts[2]).some((s) => HISTORY_READY.has(s)));
    const city = cityOf(p);
    return !local || HISTORY_READY.has(city);
  }).filter((p) => !PUBLIC.includes(p));
  const before = failures;
  quiet = true;
  const queue = [...section2];
  const worker = async () => {
    while (queue.length) {
      const p = queue.shift();
      const r = await get(p);
      await checkPage(p, r);
      const types = jsonLdTypes(r.html, p);
      ok(types.includes('BreadcrumbList'), p, 'JSON-LD BreadcrumbList');
      // Month page (/weather/<country>/<city>/<month>) → Dataset (climate normals)
      if (p.split('/').length === 5) ok(types.includes('Dataset'), p, 'JSON-LD Dataset');
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  quiet = false;
  results.push(`info  SEO_ALL                      ${section2.length} Section 2 pages fetched${local ? ' (local: only cities with complete history)' : ''} — ${quietPasses} checks passed, ${failures - before} failed`);
}

// ── Offline: sitemap ke SAARE URLs ke title (page pattern) unique ──
function offlineTitleCheck() {
  const t = new Map();
  const add = (title, url) => t.set(title, [...(t.get(title) || []), url]);
  add('Weather by Country & Month — WeatherApex', '/weather');
  for (const c of COUNTRIES) if (hasCountryPage(c.slug)) add(`${c.name} Weather by Month & City — WeatherApex`, `/weather/${c.slug}`);
  for (const c of CITIES) {
    add(`${c.name} Climate & Weather Guide — WeatherApex`, `/weather/${c.slug}`);
    add(`${c.name} Weather by Month: Climate & Best Time to Visit`, `/weather/…/${c.slug}`);
    for (const m of MONTHS) add(`${c.name} Weather in ${m.name}: Temperature, Rain & Tips`, `/weather/…/${c.slug}/${m.slug}`);
  }
  const dups = [...t.entries()].filter(([, u]) => u.length > 1);
  ok(dups.length === 0, 'offline (all sitemap pages)', `${t.size} generated titles unique`, dups.slice(0, 3).map(([k]) => k).join(' | '));
}

// ── Redirects: ek hop, koi loop nahi, /api untouched ───────────
async function redirectChecks() {
  const cases = [
    ['/about/', '/about'],
    ['/weather/London', '/weather/london'],
    ['/weather/london/', '/weather/london'],
    ['/weather/United-Kingdom/London/October/', '/weather/united-kingdom/london/october'],
    ['/weather/hungary', '/weather/hungary/budapest'],
    ['/weather/Hungary/', '/weather/hungary/budapest'],
    ['/weather/', '/weather'],
  ];
  for (const [from, to] of cases) {
    const r = await get(from);
    ok(r.status === 308, from, '308 redirect', `got ${r.status}`);
    const loc = (r.location || '').replace(BASE, '');
    ok(loc === to, from, `→ ${to}`, loc || 'none');
    const r2 = await get(loc || '/');
    ok(r2.status === 200, from, 'one hop (target is 200, no chain)', `target ${r2.status}`);
  }
  for (const p of ['/weather/singapore', '/weather/hong-kong', '/weather/singapore/singapore', '/weather/hong-kong/hong-kong', '/weather/london']) {
    const r = await get(p);
    ok(r.status === 200, p, 'no redirect (Section 1 / no loop)', `got ${r.status}`);
  }
  for (const p of ['/api/weather/current/?city=london', '/api/blog/posts/?page=1']) {
    const r = await get(p);
    ok(r.status === 200, p, '/api untouched (no redirect)', `got ${r.status}`);
  }
}

// ── Beta switch: SITE_NOINDEX ──────────────────────────────────
// Server jis SITE_NOINDEX ke saath BUILD hua, wahi yahan dein:
//   SITE_NOINDEX=1 → har response par `X-Robots-Tag: noindex, nofollow`,
//                    aur robots.txt phir bhi crawling allow kare
//   khaali / 0     → header bilkul nahi (aaj jaisa)
async function siteNoindexChecks() {
  const on = process.env.SITE_NOINDEX === '1';
  const routes = ['/', '/weather/united-kingdom/london/october', '/sitemap.xml', '/robots.txt'];
  for (const route of routes) {
    const r = await get(route);
    if (on) ok(/noindex/i.test(r.robotsTag) && /nofollow/i.test(r.robotsTag), route, 'SITE_NOINDEX=1 → X-Robots-Tag noindex, nofollow', r.robotsTag || 'missing');
    else ok(!r.robotsTag, route, 'SITE_NOINDEX off → no X-Robots-Tag', r.robotsTag);
  }
  const robots = await get('/robots.txt');
  ok(/Allow:\s*\/\s*$/m.test(robots.html) && !/Disallow:\s*\/\s*$/m.test(robots.html), '/robots.txt',
    'robots.txt still allows crawling (Google must see the header)', robots.html.split('\n').slice(0, 4).join(' | '));
}

async function restChecks() {
  await siteNoindexChecks();

  for (const route of NOINDEX) {
    const r = await get(route);
    ok(r.status === 200, route, 'status 200', `got ${r.status}`);
    ok(/<meta name="robots" content="[^"]*noindex/.test(r.html), route, 'has noindex');
  }

  if (BACKEND_LOG) fs.writeFileSync(BACKEND_LOG, '');
  for (const route of NOT_FOUND) {
    const r = await get(route);
    ok(r.status === 404, route, 'status 404', `got ${r.status}`);
    ok(/<meta name="robots" content="[^"]*noindex/.test(r.html), route, '404 has noindex');
  }
  if (BACKEND_LOG) {
    const log = fs.readFileSync(BACKEND_LOG, 'utf8');
    const hits = log.split('\n').filter((l) => /multan|qzxvnotacity/i.test(l)).length;
    ok(hits === 0, '/weather/multan', 'no backend call for non-whitelisted city', `${hits} matching calls in backend log`);
  } else {
    results.push('skip  /weather/multan               backend-call check (set BACKEND_LOG)');
  }

  for (const [from, to] of [['/weather/London', '/weather/london'], ['/weather/NEW-YORK', '/weather/new-york']]) {
    const r = await get(from);
    ok(r.status === 308 || r.status === 301, from, 'uppercase city → permanent redirect', `got ${r.status}`);
    ok((r.location || '').endsWith(to), from, `redirects to ${to}`, r.location || 'none');
  }

  const robots = await get('/robots.txt');
  ok(robots.status === 200, '/robots.txt', 'status 200');
  ok(/User-Agent: \*/i.test(robots.html) && /Allow: \//.test(robots.html), '/robots.txt', 'allows /');
  ok(robots.html.includes('Disallow: /api/'), '/robots.txt', 'disallows /api/');
  // noindex pages robots.txt mein block NAHI honi chahiye — warna Google
  // un ka noindex tag parh hi nahi sakta (NOINDEX list upar check hoti hai)
  for (const d of NOINDEX) ok(!robots.html.includes(`Disallow: ${d}`), '/robots.txt', `does not block noindex page ${d}`);
  ok(robots.html.includes(`Sitemap: ${SITE}/sitemap.xml`), '/robots.txt', 'links sitemap');

  const sm = await get('/sitemap.xml');
  ok(sm.status === 200, '/sitemap.xml', 'status 200');
  ok(/xml/.test(sm.type) && sm.html.includes('<urlset'), '/sitemap.xml', 'valid urlset');
  const locs = [...sm.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  ok(locs.every((l) => l.startsWith(SITE)), '/sitemap.xml', 'all URLs absolute on site domain');
  ok(new Set(locs).size === locs.length, '/sitemap.xml', 'no duplicate URLs');
  ok(!locs.some((l) => /\/(login|signup|pricing)$/.test(l)), '/sitemap.xml', 'no login/signup/pricing');
  const expectCountries = COUNTRIES.filter((c) => hasCountryPage(c.slug)).length;
  const w = locs.map((l) => l.replace(SITE, ''));
  const s1 = CITIES.filter((c) => w.includes(`/weather/${c.slug}`)).length;
  const monthPages = w.filter((p) => p.split('/').length === 5).length;
  const byMonth = w.filter((p) => p.split('/').length === 4 && p.startsWith('/weather/')).length;
  const countryPages = w.filter((p) => p.split('/').length === 3 && p.startsWith('/weather/') && COUNTRIES.find((c) => c.slug === p.split('/')[2]) && !CITIES.find((c) => c.slug === p.split('/')[2])).length;
  ok(s1 === CITIES.length, '/sitemap.xml', `Section 1 city pages ${s1}/${CITIES.length}`);
  ok(w.includes('/weather'), '/sitemap.xml', 'has /weather hub');
  ok(countryPages === expectCountries, '/sitemap.xml', `country pages ${countryPages}/${expectCountries} (2+ cities)`);
  ok(byMonth === CITIES.length, '/sitemap.xml', `city-by-month pages ${byMonth}/${CITIES.length}`);
  ok(monthPages === CITIES.length * 12, '/sitemap.xml', `month pages ${monthPages}/${CITIES.length * 12}`);
  ok(!w.includes('/weather/hungary'), '/sitemap.xml', 'no 1-city country page (308)');
  ok(locs.some((l) => l.includes('/blog/')), '/sitemap.xml', 'has blog posts');
  results.push(`info  /sitemap.xml                 ${locs.length} URLs`);

  const fav = await get('/favicon.ico');
  ok(fav.status === 200, '/favicon.ico', 'status 200', `got ${fav.status}`);

  console.log(results.join('\n'));
  const passed = results.filter((l) => l.startsWith('PASS')).length;
  console.log(`\n${passed} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
