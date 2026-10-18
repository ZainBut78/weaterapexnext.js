// ─────────────────────────────────────────────────────────────
//  SITEMAPS (SEO fixes Task 4, Oct 2026) — index + alag child sitemaps
//
//   /sitemap.xml                → <sitemapindex> (robots.txt isi ko batata hai)
//   /sitemap/static.xml         → home, tools, about, terms, privacy
//   /sitemap/blog.xml           → /blog + har post (lastmod = updated_at)
//   /sitemap/places.xml         → /weather, country hubs, city pages
//   /sitemap/months-<n>.xml     → month pages, 1,000 per file
//
//  lastmod sach: blog = post ka updated_at; month page jis ka travel note
//  ho = note ki "facts reviewed YYYY-MM-DD"; baqi = us page ke template /
//  content ki aakhri asal tabdeeli (neeche constants — page badlein to
//  tareekh bhi). Build ka waqt KABHI nahi.
//  Sirf canonical + indexable + 200 URLs: login/signup/pricing (noindex),
//  api-docs, purane /weather/<city> (301), ?param URLs — kuch nahi.
//  Shehar: registry (static + DB ke mukammal) — adhoore shamil nahi.
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs/promises';
import path from 'node:path';
import { serverGet } from './serverApi';
import { ENDPOINTS } from '@/config/endpoints';
import { getCityRegistry } from './cityRegistry';
import { COUNTRIES, countryPath } from '@/data/countries';
import { MONTHS } from '@/utils/climateMath';
import { SITE_URL } from '@/utils/seo';

// Page ki aakhri asal tabdeeli (git log). Template/content badle → yahan bhi.
const STATIC_PAGES = [
  ['/', '2026-10-18'],
  ['/trip-planner', '2026-10-06'],
  ['/events', '2026-10-03'],
  ['/climate-guides', '2026-10-18'],
  ['/about', '2026-10-03'],
  ['/terms', '2026-10-03'],
  ['/privacy', '2026-10-03'],
];
// /weather hub, country hubs, city pages, month pages ka template (merge: Oct 18)
export const WEATHER_LASTMOD = '2026-10-18';
const MONTH_CHUNK = 1000;

const BLOG_REVALIDATE = 600;

const xmlEscape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const abs = (p) => `${SITE_URL}${p === '/' ? '' : p}`;
const isoDay = (d) => {
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
};

export function urlset(entries) {
  const body = entries.map((e) => `<url><loc>${xmlEscape(abs(e.path))}</loc>${e.lastmod ? `<lastmod>${isoDay(e.lastmod)}</lastmod>` : ''}</url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function sitemapIndex(children) {
  const body = children.map((c) => `<sitemap><loc>${xmlEscape(abs(`/sitemap/${c.name}.xml`))}</loc>${c.lastmod ? `<lastmod>${isoDay(c.lastmod)}</lastmod>` : ''}</sitemap>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

export const xmlResponse = (xml) => new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });

// ── data ──
async function allPosts() {
  const posts = [];
  try {
    for (let page = 1; page <= 50; page++) {
      const data = await serverGet(ENDPOINTS.blog.list, { params: { page }, revalidate: BLOG_REVALIDATE, tags: ['blog'] });
      if (!data?.posts?.length) break;
      posts.push(...data.posts);
      if (!data.has_next || data.current_page !== page) break;
    }
  } catch {
    // backend band → baqi sitemap phir bhi bane
  }
  return posts;
}

const NOTE_DATE = /reviewed (\d{4}-\d{2}-\d{2})/;
async function noteDate(citySlug, monthSlug) {
  try {
    const head = (await fs.readFile(path.join(process.cwd(), 'content', 'guides', citySlug, `${monthSlug}.md`), 'utf8')).slice(0, 300);
    return head.match(NOTE_DATE)?.[1] || null;
  } catch {
    return null;
  }
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
  const reg = await getCityRegistry();
  return [
    { path: '/weather', lastmod: WEATHER_LASTMOD },
    ...COUNTRIES.filter((c) => reg.hasCountryPage(c.slug)).map((c) => ({ path: countryPath(c.slug), lastmod: WEATHER_LASTMOD })),
    ...reg.cities.map((c) => ({ path: reg.cityPath(c.slug), lastmod: WEATHER_LASTMOD })),
  ];
}

export async function monthEntries() {
  const reg = await getCityRegistry();
  const out = [];
  for (const c of reg.cities) {
    for (const m of MONTHS) {
      const note = await noteDate(c.slug, m.slug);
      out.push({ path: reg.monthPath(c.slug, m.slug), lastmod: max(WEATHER_LASTMOD, note) });
    }
  }
  return out;
}

/** Child sitemaps ki list (index ke liye) — naam + lastmod (sab se nayi entry) */
export async function children() {
  const newest = (entries) => entries.reduce((a, e) => max(a, e.lastmod && isoDay(e.lastmod)), null);
  const [st, bl, pl, mo] = await Promise.all([staticEntries(), blogEntries(), placeEntries(), monthEntries()]);
  const list = [
    { name: 'static', lastmod: newest(st) },
    { name: 'blog', lastmod: newest(bl) },
    { name: 'places', lastmod: newest(pl) },
  ];
  for (let i = 0; i * MONTH_CHUNK < mo.length; i++) {
    list.push({ name: `months-${i + 1}`, lastmod: newest(mo.slice(i * MONTH_CHUNK, (i + 1) * MONTH_CHUNK)) });
  }
  return list;
}

/** Ek child sitemap ki entries — naam ghalat → null (404) */
export async function childEntries(name) {
  if (name === 'static') return staticEntries();
  if (name === 'blog') return blogEntries();
  if (name === 'places') return placeEntries();
  const m = /^months-(\d+)$/.exec(name);
  if (m) {
    const i = Number(m[1]) - 1;
    const all = await monthEntries();
    const slice = all.slice(i * MONTH_CHUNK, (i + 1) * MONTH_CHUNK);
    return i >= 0 && slice.length ? slice : null;
  }
  return null;
}
