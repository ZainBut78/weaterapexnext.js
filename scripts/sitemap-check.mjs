// ─────────────────────────────────────────────────────────────
//  SITEMAP CHECK (i18n, Oct 2026) — /sitemap.xml index + HAR child sitemap
//  + un ka HAR URL. Plain Node fetch, koi dependency nahi.
//
//  Chalana:  npm run build && npm start      (doosre terminal mein)
//            node scripts/sitemap-check.mjs
//  Doosra server:  BASE=http://localhost:3300 node scripts/sitemap-check.mjs
//  Zabanein: LOCALES=en,de (server ka ENABLED_LOCALES) — index mein bilkul
//  yahi zabanein hon (na kam, na zyada). Default: sirf en.
//  LANG_SITEMAP_PHASE=A|B — server jaisa (B = month pages bhi).
//
//  Google (Build and submit a sitemap / Manage large sitemaps / Localized versions):
//   • well-formed XML, UTF-8, ≤ 50,000 URLs aur ≤ 50 MB (uncompressed) per file
//   • poore (absolute) URLs; child sitemaps index ki directory ya us ke neeche
//   • sirf canonical, indexable, 200 URLs (redirect / noindex / 404 nahi)
//   • <lastmod> sahi W3C tareekh (future nahi); <priority>/<changefreq> nahi
//   • hreflang (HTML <link>): khud shamil, x-default = English, reciprocal,
//     sirf enabled zabanein, ISO 639-1, absolute; sitemap mein xhtml:link nahi
//  Har page: <html lang> = us ki zaban.
//
//  Exit code 0 = sab pass, 1 = koi fail.
// ─────────────────────────────────────────────────────────────
const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/+$/, '');
const SITE = 'https://weatherapex.com';
const LOCALES = ['en', 'de', 'it', 'ja', 'fr', 'es'];
const ENABLED = LOCALES.filter((l) => l === 'en' || String(process.env.LOCALES || '').split(',').map((s) => s.trim()).includes(l));
const PHASE = String(process.env.LANG_SITEMAP_PHASE || 'A').toUpperCase() === 'B' ? 'B' : 'A';
const CONCURRENCY = Number(process.env.CONCURRENCY || 6);
const MAX_URLS = 50_000;
const MAX_BYTES = 50 * 1024 * 1024;

let fails = 0;
let passes = 0;
const fail = (msg) => { fails++; console.log(`✗ ${msg}`); };
const ok = () => { passes++; };

const local = (u) => BASE + new URL(u).pathname + new URL(u).search;
const langOf = (u) => {
  const m = /^\/([a-z]{2})(?=\/|$)/.exec(new URL(u).pathname);
  return m && LOCALES.includes(m[1]) && m[1] !== 'en' ? m[1] : 'en';
};

// ── chhota XML well-formedness check (tags balanced, entities sahi) ──
function wellFormed(xml) {
  if (!/^<\?xml version="1\.0" encoding="UTF-8"\?>/.test(xml)) return 'XML declaration (UTF-8) missing';
  const body = xml.replace(/^<\?xml[^>]*\?>/, '');
  const stack = [];
  const re = /<(\/?)([A-Za-z_][\w:.-]*)([^>]*?)(\/?)>|&([^;\s]*);?|</g;
  let m;
  while ((m = re.exec(body))) {
    if (m[0] === '<') return `stray "<" at ${m.index}`;
    if (m[5] !== undefined) {
      if (!/^(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+)$/.test(m[5]) || !m[0].endsWith(';')) return `bad entity "${m[0]}"`;
      continue;
    }
    const [, close, name, , self] = m;
    if (self) continue;
    if (close) {
      if (stack.pop() !== name) return `mismatched </${name}>`;
    } else stack.push(name);
  }
  return stack.length ? `unclosed <${stack[stack.length - 1]}>` : null;
}

function checkLastmods(xml, where) {
  const now = Date.now() + 24 * 3600e3;
  for (const [, d] of xml.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)) {
    const t = Date.parse(d);
    if (!/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2}))?$/.test(d) || Number.isNaN(t)) return fail(`${where}: bad lastmod "${d}"`);
    if (t > now) return fail(`${where}: lastmod in future "${d}"`);
  }
  ok();
}

async function getXml(url, where) {
  const res = await fetch(local(url), { redirect: 'manual' });
  const buf = Buffer.from(await res.arrayBuffer());
  const xml = buf.toString('utf8');
  if (res.status !== 200) { fail(`${where}: status ${res.status}`); return null; }
  if (!/xml/.test(res.headers.get('content-type') || '')) fail(`${where}: content-type ${res.headers.get('content-type')}`);
  if (buf.length > MAX_BYTES) fail(`${where}: ${buf.length} bytes > 50 MB`);
  const wf = wellFormed(xml);
  if (wf) fail(`${where}: not well-formed — ${wf}`); else ok();
  if (/<priority>|<changefreq>/.test(xml)) fail(`${where}: has <priority>/<changefreq>`);
  if (/xhtml:link|hreflang/.test(xml)) fail(`${where}: hreflang in sitemap (HTML only)`);
  checkLastmods(xml, where);
  return xml;
}

// ── page check ──
const pageCache = new Map();
async function page(url) {
  if (pageCache.has(url)) return pageCache.get(url);
  const p = (async () => {
    const res = await fetch(local(url), { redirect: 'manual' });
    const html = res.status === 200 ? await res.text() : '';
    // Poora HTML, sirf <head> nahi: Next 16 dynamic pages (blog post) par metadata
    // stream ho kar <body> mein aata hai — Googlebot poora DOM parhta hai (Next docs:
    // generateMetadata → Streaming metadata)
    const head = html.replace(/<script[\s\S]*?<\/script>/g, '');
    const alts = {};
    for (const [tag] of head.matchAll(/<link[^>]*rel="alternate"[^>]*>/g)) {
      const hl = /hrefLang="([^"]+)"/i.exec(tag)?.[1];
      const href = /href="([^"]+)"/.exec(tag)?.[1]?.replace(/&amp;/g, '&');
      if (hl) alts[hl] = href;
    }
    return {
      status: res.status,
      xrobots: res.headers.get('x-robots-tag') || '',
      robots: /<meta name="robots" content="([^"]*)"/.exec(head)?.[1] || '',
      canonical: /<link rel="canonical" href="([^"]+)"/.exec(head)?.[1]?.replace(/&amp;/g, '&') || null,
      htmlLang: /<html[^>]*\blang="([^"]+)"/.exec(html)?.[1] || null,
      alts,
    };
  })();
  pageCache.set(url, p);
  return p;
}

const norm = (u) => (u ? u.replace(/\/$/, '') : u);

async function checkUrl(url, where) {
  const p = await page(url);
  const lang = langOf(url);
  const errs = [];
  if (!url.startsWith(SITE + '/') && url !== SITE) errs.push('not absolute https://weatherapex.com URL');
  if (p.status !== 200) errs.push(`status ${p.status}`);
  else {
    if (/noindex/i.test(p.robots) || /noindex/i.test(p.xrobots)) errs.push('noindex');
    if (norm(p.canonical) !== norm(url)) errs.push(`canonical ${p.canonical}`);
    if (p.htmlLang !== lang) errs.push(`html lang ${p.htmlLang} ≠ ${lang}`);
    if (!ENABLED.includes(lang)) errs.push(`locale ${lang} not enabled`);
    // hreflang
    const keys = Object.keys(p.alts);
    if (keys.length) {
      const bad = keys.filter((k) => k !== 'x-default' && !ENABLED.includes(k));
      if (bad.length) errs.push(`hreflang lists disabled/invalid ${bad.join(',')}`);
      if (norm(p.alts[lang]) !== norm(url)) errs.push(`hreflang self missing (${p.alts[lang]})`);
      if (!p.alts['x-default'] || norm(p.alts['x-default']) !== norm(p.alts.en)) errs.push('x-default ≠ English URL');
      for (const [k, href] of Object.entries(p.alts)) {
        if (!href?.startsWith(SITE)) errs.push(`hreflang ${k} not absolute`);
        if (k === 'x-default' || k === lang) continue;
        const q = await page(href);
        if (q.status !== 200) errs.push(`hreflang ${k} → status ${q.status}`);
        else if (/noindex/i.test(q.robots + q.xrobots)) errs.push(`hreflang ${k} → noindex`);
        else if (norm(q.canonical) !== norm(href)) errs.push(`hreflang ${k} → canonical ${q.canonical}`);
        const same = Object.keys(q.alts).length === keys.length && keys.every((kk) => norm(q.alts[kk]) === norm(p.alts[kk]));
        if (!same) errs.push(`hreflang not reciprocal with ${k}`);
      }
    } else if (ENABLED.length > 1 && !/\/blog/.test(url)) {
      errs.push('no hreflang (expected with >1 enabled locale)');
    }
  }
  if (errs.length) fail(`${where} ${new URL(url).pathname}: ${errs.join('; ')}`); else ok();
}

async function pool(items, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

// ── run ──
const index = await getXml(`${SITE}/sitemap.xml`, 'index');
if (!index) process.exit(1);
if (!index.includes('<sitemapindex')) fail('index: no <sitemapindex>');
const children = [...index.matchAll(/<sitemap><loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
console.log(`index: ${children.length} child sitemaps (locales ${ENABLED.join(',')}, phase ${PHASE})`);

// index ki zabanein = ENABLED (na kam, na zyada); phase A → non-en months nahi
const childLangs = new Set(children.map((c) => /-([a-z]{2})(?:-\d+)?\.xml$/.exec(c)?.[1]).filter(Boolean));
for (const l of childLangs) if (!ENABLED.includes(l)) fail(`index lists disabled locale sitemaps: ${l}`);
for (const l of ENABLED.filter((x) => x !== 'en')) if (!childLangs.has(l)) fail(`index missing sitemaps for enabled locale ${l}`);
for (const c of children) {
  if (!c.startsWith(`${SITE}/`)) fail(`child not absolute / other host: ${c}`);
  if (/\/sitemap\/months-[a-z]{2}-\d+\.xml$/.test(c) && PHASE === 'A') fail(`phase A but ${c} listed`);
}
for (const req of ['static', 'blog', 'places', 'months-1']) {
  if (!children.includes(`${SITE}/sitemap/${req}.xml`)) fail(`index missing English ${req}`);
}

const seen = new Set();
let total = 0;
for (const child of children) {
  const name = new URL(child).pathname;
  const xml = await getXml(child, name);
  if (!xml) continue;
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) fail(`${name}: no urlset namespace`);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  if (!locs.length) fail(`${name}: empty`);
  if (locs.length > MAX_URLS) fail(`${name}: ${locs.length} URLs > 50,000`);
  const fileLang = /-([a-z]{2})(?:-\d+)?\.xml$/.exec(name)?.[1] || 'en';
  for (const u of locs) {
    if (seen.has(u)) fail(`${name}: duplicate URL across sitemaps ${u}`);
    seen.add(u);
    if (langOf(u) !== fileLang) fail(`${name}: ${u} is not ${fileLang}`);
  }
  total += locs.length;
  const t0 = Date.now();
  await pool(locs, (u) => checkUrl(u, name));
  console.log(`  ${name}: ${locs.length} URLs checked (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

// non-en URLs: phase A mein month pages nahi
if (PHASE === 'A') {
  for (const u of seen) if (langOf(u) !== 'en' && /^\/[a-z]{2}\/weather\/[^/]+\/[^/]+\/[^/]+$/.test(new URL(u).pathname)) fail(`phase A but month page ${u}`);
}

console.log(`\n${total} URLs in ${children.length} sitemaps · ${passes} checks passed · ${fails} failed`);
process.exit(fails ? 1 : 0);
