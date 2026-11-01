// ─────────────────────────────────────────────────────────────
//  I18N CHECK (Phase 6, Oct 2026) — har zaban ka poora jaiza. Plain Node fetch.
//
//  Chalana:  npm run build && npm start   (ENABLED_LOCALES jaisa server par)
//            BASE=http://localhost:3300 LOCALES=en,de npm run i18n-check
//  Env: BASE, LOCALES (= server ka ENABLED_LOCALES), LANG_SITEMAP_PHASE (A|B),
//       SKIP_SITEMAP=1 (sitemap-check na chalao), CONCURRENCY.
//
//  1) scripts/sitemap-check.mjs (index, children, har URL, hreflang)
//  2) Har enabled zaban ke pages (sitemap ke URLs + sitemap se bahar wale
//     tools/legal/auth pages):
//     • status 200 · <html lang> = zaban · canonical = apna URL (noindex
//       pages par bhi) · hreflang: khud + x-default (= English) + reciprocal,
//       sirf enabled zabanein; noindex page par koi hreflang nahi
//     • non-English page par koi English paragraph nahi (<p>/<li>, ≥ 12 alfaaz,
//       English stopwords ka hissa > 18% — blog/translations.py jaisa)
//     • har JSON-LD block valid JSON, @context schema.org, inLanguage = zaban (agar ho)
//  Disabled zaban: page noindex (meta / X-Robots-Tag) aur switcher mein nahi.
//  Exit 0 = sab pass.
// ─────────────────────────────────────────────────────────────
import { spawnSync } from 'node:child_process';

const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/+$/, '');
const SITE = 'https://weatherapex.com';
const ALL = ['en', 'de', 'it', 'ja', 'fr', 'es'];
const ENABLED = ALL.filter((l) => l === 'en' || String(process.env.LOCALES || '').split(',').map((s) => s.trim()).includes(l));
const DISABLED = ALL.filter((l) => !ENABLED.includes(l));
const CONCURRENCY = Number(process.env.CONCURRENCY || 6);
// Sitemap mein nahi magar har zaban mein maujood (tools, legal, hub) + noindex auth pages
const EXTRA = ['/trip-planner', '/events', '/about', '/terms', '/privacy', '/weather', '/blog'];
const NOINDEX = ['/login', '/signup', '/forgot-password', '/pricing'];
const EN_STOP = new Set(['the', 'and', 'of', 'to', 'is', 'are', 'with', 'for', 'you', 'your', 'this', 'that', 'it', 'on',
  'be', 'at', 'from', 'by', 'or', 'as', 'was', 'were', 'will', 'can', 'have']);

let fails = 0;
let passes = 0;
const fail = (m) => { fails++; console.log(`✗ ${m}`); };

// ── 1) sitemaps ──
if (!process.env.SKIP_SITEMAP) {
  console.log('── sitemap-check ──');
  const r = spawnSync(process.execPath, ['scripts/sitemap-check.mjs'], { stdio: 'inherit', env: { ...process.env, BASE, LOCALES: ENABLED.join(',') } });
  if (r.status !== 0) fail('sitemap-check failed (see above)');
  else passes++;
}

// ── helpers ──
const lp = (lang, p) => (lang === 'en' ? p : p === '/' ? `/${lang}` : `/${lang}${p}`);
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const text = (h) => decode(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const norm = (u) => (u ? u.replace(/\/$/, '') : u);
const own = (s) => (s == null ? s : Buffer.from(String(s), 'utf8').toString('utf8'));

const cache = new Map();
function get(path) {
  if (!cache.has(path)) {
    cache.set(path, (async () => {
      // Googlebot jaisa: dynamic pages par metadata <body> mein stream hota hai — poora HTML dekhte hain
      const res = await fetch(BASE + path, { redirect: 'manual' });
      const html = res.status === 200 ? await res.text() : '';
      const noScript = html.replace(/<script(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/g, '');
      const alts = {};
      for (const [tag] of noScript.matchAll(/<link[^>]*rel="alternate"[^>]*>/g)) {
        const hl = /hrefLang="([^"]+)"/i.exec(tag)?.[1];
        if (hl) alts[own(hl)] = own(decode(/href="([^"]+)"/.exec(tag)?.[1] || ''));
      }
      // Poora HTML cache mein nahi (1,000+ pages → memory) — sirf zaroori cheezein, alag
      // copy (V8 ka substring poore HTML ko zinda rakhta hai)
      return {
        status: res.status,
        englishParas: englishParagraphs(html).map(own),
        hreflangLangs: new Set([...html.matchAll(/hrefLang="([a-z-]+)"/gi)].map((m) => own(m[1]))),
        xrobots: own(res.headers.get('x-robots-tag') || ''),
        robots: own(/<meta name="robots" content="([^"]*)"/.exec(noScript)?.[1] || ''),
        canonical: own(decode(/<link rel="canonical" href="([^"]+)"/.exec(noScript)?.[1] || '')) || null,
        htmlLang: own(/<html[^>]*\blang="([^"]+)"/.exec(html)?.[1] || null),
        alts,
        // JSON-LD yahin parse (null = invalid JSON)
        ld: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
          try { return JSON.parse(m[1]); } catch { return null; }
        }),
      };
    })());
  }
  return cache.get(path);
}

function englishParagraphs(html) {
  const body = (/<main[\s\S]*?<\/main>/.exec(html) || [html])[0]
    .replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ');
  const out = [];
  for (const [, , inner] of body.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    // Sirf bahar ka ek link (Quellen list) — source ka asli naam English hi rehta hai
    if (/^\s*<a\b[^>]*href="https?:\/\/[^"]*"[^>]*>[\s\S]*<\/a>\s*$/.test(inner)) continue;
    const words = text(inner).toLowerCase().match(/[a-z']+/g) || [];
    if (words.length >= 12 && words.filter((w) => EN_STOP.has(w)).length / words.length > 0.18) out.push(text(inner).slice(0, 70));
  }
  return out;
}

async function checkPage(path, lang, { noindex = false } = {}) {
  const p = await get(path);
  const url = SITE + (path === '/' ? '' : path);
  const errs = [];
  if (p.status !== 200) {
    fail(`${path}: status ${p.status}`);
    return;
  }
  if (p.htmlLang !== lang) errs.push(`html lang ${p.htmlLang}`);
  if (norm(p.canonical) !== norm(url)) errs.push(`canonical ${p.canonical}`);
  const isNoindex = /noindex/i.test(p.robots + p.xrobots);
  if (noindex !== isNoindex) errs.push(noindex ? 'expected noindex' : 'unexpected noindex');
  const keys = Object.keys(p.alts);
  if (isNoindex && keys.length) errs.push('hreflang on noindex page');
  if (!isNoindex && keys.length) {
    if (keys.some((k) => k !== 'x-default' && !ENABLED.includes(k))) errs.push(`hreflang lists disabled locale (${keys})`);
    if (norm(p.alts[lang]) !== norm(url)) errs.push('hreflang self missing');
    if (norm(p.alts['x-default']) !== norm(p.alts.en)) errs.push('x-default ≠ en');
    for (const [k, href] of Object.entries(p.alts)) {
      if (k === lang || k === 'x-default') continue;
      const q = await get(href.replace(SITE, '') || '/');
      const same = Object.keys(q.alts).length === keys.length && keys.every((kk) => norm(q.alts[kk]) === norm(p.alts[kk]));
      if (q.status !== 200 || !same) errs.push(`hreflang ${k} not reciprocal (${q.status})`);
    }
  }
  if (lang !== 'en') for (const para of p.englishParas) errs.push(`English text: “${para}…”`);
  for (const j of p.ld) {
    if (!j) { errs.push('JSON-LD not valid JSON'); continue; }
    for (const node of [j, ...(j['@graph'] || [])]) {
      if (node === j && !String(j['@context'] || '').includes('schema.org')) errs.push('JSON-LD @context');
      if (node.inLanguage && node.inLanguage !== lang) errs.push(`JSON-LD inLanguage ${node.inLanguage}`);
    }
  }
  if (errs.length) fail(`${path}: ${errs.join('; ')}`); else passes++;
}

async function pool(items, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (i < items.length) await fn(items[i++]); }));
}

// ── 2) pages ──
console.log(`\n── pages (enabled: ${ENABLED.join(',')}; disabled: ${DISABLED.join(',') || '—'}) ──`);
const idx = await (await fetch(`${BASE}/sitemap.xml`)).text();
const children = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, ''));
const urls = new Set();
for (const c of children) {
  const xml = await (await fetch(BASE + c)).text();
  for (const [, u] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(decode(u).replace(SITE, '') || '/');
}
const jobs = [];
for (const u of urls) {
  const lang = /^\/([a-z]{2})(?=\/|$)/.exec(u)?.[1];
  jobs.push([u, ALL.includes(lang) ? lang : 'en', {}]);
}
for (const lang of ENABLED) {
  for (const p of EXTRA) if (!urls.has(lp(lang, p))) jobs.push([lp(lang, p), lang, { noindex: lang !== 'en' && p === '/blog' ? undefined : false }]);
  for (const p of NOINDEX) jobs.push([lp(lang, p), lang, { noindex: true }]);
}
const t0 = Date.now();
await pool(jobs, async ([path, lang, opt]) => {
  if (opt.noindex === undefined) {
    // Khaali blog list (abhi koi tarjuma nahi) noindex — dono halat theek, baqi checks wahi
    const p = await get(path);
    return checkPage(path, lang, { noindex: /noindex/i.test(p.robots + p.xrobots) });
  }
  return checkPage(path, lang, opt);
});
console.log(`${jobs.length} pages checked (${((Date.now() - t0) / 1000).toFixed(0)}s)`);

// Disabled zabanein: noindex + switcher mein nahi
for (const lang of DISABLED) {
  const p = await get(lp(lang, '/'));
  if (p.status === 200 && !/noindex/i.test(p.robots + p.xrobots)) fail(`/${lang}: disabled locale is indexable`);
  else passes++;
  const en = await get('/');
  if (en.hreflangLangs.has(lang)) fail(`/: switcher / hreflang links disabled locale ${lang}`);
  else passes++;
}

console.log(`\n${passes} passed · ${fails} failed`);
process.exit(fails ? 1 : 0);
