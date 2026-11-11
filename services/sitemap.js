// ─────────────────────────────────────────────────────────────
//  SITEMAPS (SEO fixes Task 4, Oct 2026) — index + alag child sitemaps
//
//   /sitemap.xml                → <sitemapindex> (robots.txt isi ko batata hai)
//   /sitemap/static.xml         → home, tools, about, terms, privacy
//   /sitemap/blog.xml           → /blog + har post (lastmod = updated_at)
//   /sitemap/places.xml         → /weather, country hubs, city pages
//   /sitemap/months-<n>.xml     → month pages, 1,000 per file
//
//  lastmod sach (owner review, Oct 2026 — deploy par KABHI nahi badalta):
//   • blog = post ka updated_at
//   • city page = us shehar ke climate data ki aakhri tabdeeli (backend
//     cities index `climate_updated_at`; purana backend → DATA_PERIOD_DATE)
//   • month page = wahi, ya travel note ki "facts reviewed" (jo nayi ho);
//     har mahine naya data aane par (backend sync) khud badalta hai
//   • country hub = us ke shehron mein sab se nayi; /weather = sab mein nayi
//   • static pages = neeche constants (page ka content badle to tareekh bhi)
//  Sirf canonical + indexable + 200 URLs: login/signup/pricing (noindex),
//  api-docs, purane /weather/<city> (301), ?param URLs — kuch nahi.
//  Shehar: registry (static + DB ke mukammal) — adhoore shamil nahi.
//
//  ZABANEIN (i18n, Oct 2026) — har zaban ka apna set, isi index mein:
//   /sitemap/static-de.xml, blog-de, places-de, months-de-1, months-de-2 …
//  • sirf ENABLED_LOCALES wali zabanein (warna index mein nahi + 404)
//  • LANG_SITEMAP_PHASE (env): A (default) = home, climate-guides, blog,
//    mulk + shehar pages · B = A + month pages. English par asar nahi.
//  • hreflang sitemap mein NAHI (sirf HTML <link>) — ek hi tareeqa.
//  • lastmod = English wali tareekh ya us zaban ke text ki tareekh (jo nayi).
//  Google: 50,000 URLs / 50 MB per file — MONTH_CHUNK is se bohat neeche.
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs/promises';
import path from 'node:path';
import { backendDownError, serverGet } from './serverApi';
import { ENDPOINTS } from '@/config/endpoints';
import { getCityRegistry } from './cityRegistry';
import { COUNTRIES, countryPath } from '@/data/countries';
import { MONTHS } from '@/utils/climateMath';
import { SITE_URL } from '@/utils/seo';
import { DEFAULT_LOCALE, localePath, parseEnabledLocales } from '@/i18n/config';
import { dayOnly, newestDay } from '@/utils/sitemapDates';
import { TOOLS_CONTENT_DATE, USECASE_PATHS } from '@/utils/useCases';

// Page ki aakhri asal tabdeeli (git log). Template/content badle → yahan bhi.
const STATIC_PAGES = [
  ['/', '2026-10-18'],
  ['/trip-planner', TOOLS_CONTENT_DATE],   // Nov 2026: guide + "Plan by use case"
  ['/events', TOOLS_CONTENT_DATE],
  ['/climate-guides', '2026-10-18'],
  ['/about', '2026-10-03'],
  ['/terms', '2026-10-03'],
  ['/privacy', '2026-10-03'],
];
// Climate data ka daur 2006–2025 band hua → shehar ki apni tareekh na mile to yeh
// (pakki — har deploy par wahi)
export const DATA_PERIOD_DATE = '2026-01-01';
const cityDate = (c) => c.dataDate || DATA_PERIOD_DATE;
const MONTH_CHUNK = 1000;

const BLOG_REVALIDATE = 600;

// Doosri zabanon ka text kab bana (page ka content tab badla) — UI (Phase 1) aur
// climate pages ka text (Phase 3). Text badle to yeh tareekh bhi.
const LOCALE_UI_DATE = '2026-10-28';
const LOCALE_CLIMATE_DATE = '2026-10-28';
const LANG_STATIC = ['/', '/climate-guides'];

// Month page ka TEXT aakhri dafa kab badla (kisi bhi zaban mein). Haath se badalna hai,
// aur SIRF tab jab month page ke jumle, sections ya naye blocks sach mein live jayen:
// us din ki tareekh likhein. Aam deploy, bug fix ya kisi aur page ki tabdeeli par NAHI —
// warna 12,000+ pages ki lastmod bina wajah badlegi aur Google us par bharosa chhor dega.
export const MONTH_TEXT_DATE = '2026-11-07';

const otherLocales = () => parseEnabledLocales(process.env.ENABLED_LOCALES).filter((l) => l !== DEFAULT_LOCALE);
const langPhase = () => (String(process.env.LANG_SITEMAP_PHASE || 'A').trim().toUpperCase() === 'B' ? 'B' : 'A');

const xmlEscape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const abs = (p) => `${SITE_URL}${p === '/' ? '' : p}`;
// Sirf YYYY-MM-DD, kabhi future nahi (utils/sitemapDates.js)
const isoDay = (d) => dayOnly(d);

export function urlset(entries) {
  const body = entries.map((e) => `<url><loc>${xmlEscape(abs(e.path))}</loc>${e.lastmod ? `<lastmod>${isoDay(e.lastmod)}</lastmod>` : ''}</url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function sitemapIndex(children) {
  const body = children.map((c) => `<sitemap><loc>${xmlEscape(abs(`/sitemap/${c.name}.xml`))}</loc>${c.lastmod ? `<lastmod>${isoDay(c.lastmod)}</lastmod>` : ''}</sitemap>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

// Cache-Control saaf likha (Nov 2026): routes dynamic hain — Hostinger CDN / proxy
// .xml ko apne andaze se cache na kare (tarjuma publish ke baad purana index)
export const xmlResponse = (xml) => new Response(xml, {
  headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' },
});

// ── data ──
async function allPosts(lang = DEFAULT_LOCALE) {
  const posts = [];
  // Backend band → throw (503, neeche withSitemapBackend). Adhoori list kabhi nahi.
  for (let page = 1; page <= 50; page++) {
    const params = lang === DEFAULT_LOCALE ? { page } : { page, lang };
    const data = await serverGet(ENDPOINTS.blog.list, { params, revalidate: BLOG_REVALIDATE, tags: ['blog'] });
    // Purana backend `?lang=` nahi samajhta (English bhejta) → doosri zaban = koi post nahi
    if (lang !== DEFAULT_LOCALE && data?.lang !== lang) break;
    if (!data?.posts?.length) break;
    posts.push(...data.posts);
    if (!data.has_next || data.current_page !== page) break;
  }
  return posts;
}

const NOTE_DATE = /reviewed (\d{4}-\d{2}-\d{2})/;
// Notes sirf deploy par badalte hain — sitemap routes ab har request par bante
// hain (route cache nahi), is liye har file process mein ek hi dafa parhi jaye
const noteDates = new Map();
async function readNoteDate(citySlug, monthSlug) {
  try {
    const head = (await fs.readFile(path.join(process.cwd(), 'content', 'guides', citySlug, `${monthSlug}.md`), 'utf8')).slice(0, 300);
    return head.match(NOTE_DATE)?.[1] || null;
  } catch {
    return null;
  }
}
function noteDate(citySlug, monthSlug) {
  const key = `${citySlug}/${monthSlug}`;
  if (!noteDates.has(key)) noteDates.set(key, readNoteDate(citySlug, monthSlug));
  return noteDates.get(key);
}

const max = (a, b) => (!a ? b : !b ? a : (a > b ? a : b));

export async function staticEntries() {
  return STATIC_PAGES.map(([p, lastmod]) => ({ path: p, lastmod }));
}

export async function blogEntries() {
  const posts = await allPosts();
  const items = posts.map((p) => ({ path: `/blog/${p.slug}`, lastmod: p.updated_at || p.published_at || null }));
  const newest = items.reduce((a, i) => max(a, i.lastmod && isoDay(i.lastmod)), null);
  return [{ path: '/blog', lastmod: newest || '2026-10-18' }, ...items];
}

export async function placeEntries() {
  const reg = await fullRegistry();
  const newestOf = (list) => list.reduce((a, c) => max(a, isoDay(cityDate(c))), null);
  return [
    { path: '/weather', lastmod: newestOf(reg.cities) },
    ...COUNTRIES.filter((c) => reg.hasCountryPage(c.slug))
      .map((c) => ({ path: countryPath(c.slug), lastmod: newestOf(reg.citiesOfCountry(c.slug)) })),
    ...reg.cities.map((c) => ({ path: reg.cityPath(c.slug), lastmod: cityDate(c) })),
  ];
}

// Har shehar-mahine ki aakhri asli tabdeeli (backend, internal key). Na mile → shehar ki tareekh.
async function monthDates() {
  const data = await serverGet(ENDPOINTS.weather.climateLastmod, { revalidate: 3600, tags: ['cities'] });
  return data?.cities || {};
}

// Backend band: registry sirf static list hoti hai (adhoore shehar shamil, DB ke gayab).
async function fullRegistry() {
  const reg = await getCityRegistry();
  if (reg.degraded) throw backendDownError('sitemap city list');
  return reg;
}

const SITEMAP_RETRY_AFTER_SECONDS = 300;

/**
 * Sitemap sirf poore data se. Backend ka cached data ho to wahi (aakhri achhi list); warna
 * 503 + Retry-After, jo kabhi cache nahi hota. Google adhoori list se URLs nahi girata.
 */
export async function withSitemapBackend(build) {
  try {
    return await build();
  } catch (e) {
    if (!e?.status) throw e;    // hamara apna bug: chhupana nahi
    return new Response('Sitemap temporarily unavailable.\n', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Retry-After': String(SITEMAP_RETRY_AFTER_SECONDS),
        'Cache-Control': 'no-store',
      },
    });
  }
}

export async function monthEntries() {
  const [reg, dates] = await Promise.all([fullRegistry(), monthDates()]);
  const out = [];
  // Mukammal shehar → 12 month pages; adhoora (search / month page se kuch
  // mahine aaye) → sirf woh mahine jin ka poora 20-saal data hai (owner, Oct 2026)
  for (const c of [...reg.cities, ...(reg.partial || [])]) {
    for (const m of MONTHS) {
      if (c.months && !c.months.includes(m.num)) continue;
      const note = await noteDate(c.slug, m.slug);
      out.push({
        path: reg.monthPath(c.slug, m.slug),
        lastmod: newestDay([dates[c.slug]?.[String(m.num)] || cityDate(c), note, MONTH_TEXT_DATE]),
      });
    }
  }
  return out;
}

// ── doosri zabanein ──
// English entries us zaban ke URL par; lastmod = (English, text ki tareekh) mein nayi
const toLang = (lang, entries, textDate) => entries.map((e) => ({
  path: localePath(lang, e.path),
  lastmod: max(e.lastmod && isoDay(e.lastmod), isoDay(textDate)),
}));

// Use-case pages (Nov 2026): English mein 8 pages (hubs static mein hain);
// doosri zaban mein hubs bhi, kyunke woh us zaban ke kisi aur sitemap mein nahi.
export async function toolEntries() {
  return USECASE_PATHS.map((p) => ({ path: p, lastmod: TOOLS_CONTENT_DATE }));
}

export async function langToolEntries(lang) {
  return ['/trip-planner', '/events', ...USECASE_PATHS].map((p) => ({ path: localePath(lang, p), lastmod: TOOLS_CONTENT_DATE }));
}

export async function langStaticEntries(lang) {
  return LANG_STATIC.map((p) => ({ path: localePath(lang, p), lastmod: LOCALE_UI_DATE }));
}

/** Us zaban ke published tarjume. Koi nahi → [] (child sitemap nahi banta). */
export async function langBlogEntries(lang) {
  const posts = await allPosts(lang);
  if (!posts.length) return [];
  const items = posts.map((p) => ({ path: localePath(lang, `/blog/${p.slug}`), lastmod: p.updated_at || p.published_at || null }));
  const newestPost = items.reduce((a, i) => max(a, i.lastmod && isoDay(i.lastmod)), null);
  return [{ path: localePath(lang, '/blog'), lastmod: newestPost }, ...items];
}

export async function langPlaceEntries(lang) {
  // Mulk + shehar pages (phase A ki list — hub /weather nahi)
  return toLang(lang, (await placeEntries()).filter((e) => e.path !== '/weather'), LOCALE_CLIMATE_DATE);
}

export async function langMonthEntries(lang) {
  return langPhase() === 'B' ? toLang(lang, await monthEntries(), LOCALE_CLIMATE_DATE) : [];
}

const newest = (entries) => entries.reduce((a, e) => max(a, e.lastmod && isoDay(e.lastmod)), null);
const chunks = (prefix, entries) => {
  const out = [];
  for (let i = 0; i * MONTH_CHUNK < entries.length; i++) {
    out.push({ name: `${prefix}-${i + 1}`, lastmod: newest(entries.slice(i * MONTH_CHUNK, (i + 1) * MONTH_CHUNK)) });
  }
  return out;
};

/** Child sitemaps ki list (index ke liye) — naam + lastmod (sab se nayi entry) */
export async function children() {
  const [st, bl, pl, mo] = await Promise.all([staticEntries(), blogEntries(), placeEntries(), monthEntries()]);
  const list = [
    { name: 'static', lastmod: newest(st) },
    { name: 'blog', lastmod: newest(bl) },
    { name: 'places', lastmod: newest(pl) },
    ...chunks('months', mo),
    { name: 'tools', lastmod: TOOLS_CONTENT_DATE },
  ];
  // Sirf ENABLED zabanein; khaali set (jaise abhi blog) index mein nahi
  for (const lang of otherLocales()) {
    const [lst, lbl, lpl, lmo] = await Promise.all([langStaticEntries(lang), langBlogEntries(lang), langPlaceEntries(lang), langMonthEntries(lang)]);
    list.push({ name: `static-${lang}`, lastmod: newest(lst) });
    if (lbl.length) list.push({ name: `blog-${lang}`, lastmod: newest(lbl) });
    if (lpl.length) list.push({ name: `places-${lang}`, lastmod: newest(lpl) });
    list.push(...chunks(`months-${lang}`, lmo));
    list.push({ name: `tools-${lang}`, lastmod: TOOLS_CONTENT_DATE });
  }
  return list;
}

const part = (all, n) => {
  const i = Number(n) - 1;
  const p = all.slice(i * MONTH_CHUNK, (i + 1) * MONTH_CHUNK);
  return i >= 0 && p.length ? p : null;
};
const orNull = (list) => (list.length ? list : null);

/** Ek child sitemap ki entries — naam ghalat / zaban band / khaali → null (404) */
export async function childEntries(name) {
  if (name === 'static') return staticEntries();
  if (name === 'blog') return blogEntries();
  if (name === 'places') return placeEntries();
  if (name === 'tools') return toolEntries();
  const m = /^months-(\d+)$/.exec(name);
  if (m) return part(await monthEntries(), m[1]);

  const l = /^(static|blog|places|months|tools)-([a-z]{2})(?:-(\d+))?$/.exec(name);
  if (!l || !otherLocales().includes(l[2])) return null;
  const [, kind, lang, n] = l;
  if (kind === 'months') return n ? part(await langMonthEntries(lang), n) : null;
  if (n) return null;
  if (kind === 'static') return langStaticEntries(lang);
  if (kind === 'tools') return langToolEntries(lang);
  if (kind === 'blog') return orNull(await langBlogEntries(lang));
  return orNull(await langPlaceEntries(lang));
}
