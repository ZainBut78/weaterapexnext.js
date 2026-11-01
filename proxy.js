// ─────────────────────────────────────────────────────────────
//  PROXY (Next 16 mein "middleware" ka naya naam) — page banne se PEHLE
//
//  URL qawaid (Phase C2 final) — sab ek hi 308 hop mein (koi chain nahi):
//   1) Aakhri "/" nahi:  /about/ → /about   (sirf "/" khud, aur /api/* NAHI —
//      /api ko matcher chhoo hi nahi sakta; Django ke URLs "/" par khatam hote hain)
//   2) /weather/* chhote harf:  /weather/London → /weather/london
//   3) 1-shehar wala mulk: /weather/hungary → /weather/hungary/budapest.
//      Shehar dynamic hain (registry: static + DB ke mukammal) — proxy
//      backend ka cities index ek dafa laata hai, 1 ghanta memory mein.
//      (Page se permanentRedirect karne par Next pehli request par Location
//      header DO dafa bhejta tha — is liye wapas yahan.) Backend na mile →
//      static list.
//   4) Purana city URL (Section 1) → merged page, **301** (SEO fixes, Oct
//      2026, owner): /weather/brisbane → /weather/australia/brisbane.
//      Sab 160 whitelist shehar ka naya page hai (data/countries cityPath).
//      singapore / hong-kong bhi: /weather/singapore → /weather/singapore/singapore
//      (4 hisse — wapas yahan nahi aata, loop nahi). Country hubs
//      (/weather/australia) shehar nahi → 200, bilkul waise.
//   5) DB ka koi aur shehar (search se add hua, Oct 2026): /weather/tulum →
//      /weather/mexico/tulum (308, registry se — warna 404 tha)
//   6) Purana duplicate blog slug (Search Console 404, Nov 2026, owner):
//      /blog/<slug>-<number> → /blog/<slug> **301** — sirf jab <slug> live post
//      ho aur asal URL khud live NA ho (backend se poochte hain, 10 min memory).
//      Warna 404 bilkul waise. Har zaban: /de/blog/<slug>-2 → /de/blog/<slug>
//      sirf jab us zaban ka tarjuma <slug> published ho.
//  Misal: /weather/Brisbane/ → ek hi hop (301) → /weather/australia/brisbane
//
//  Lowercase redirect page.js mein kyun nahi: city pages ISR hain; page se
//  redirect karne par "London" ka redirect cache hota aur Windows ki disk par
//  "london" ko bhi milta (loop — audit 2.1 mein pakda gaya). Yahan page
//  tak pohanchne se pehle hota hai.
// ─────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { isKnownCity } from './data/cities';
import { cityPath, getCountry } from './data/countries';
import { buildRegistry } from './utils/cityRegistryCore';
import { duplicateBlogBase } from './utils/blogDuplicate';
import { DEFAULT_LOCALE, localePath, parseEnabledLocales, splitLocale } from './i18n/config';

const API_INTERNAL_URL = (process.env.API_INTERNAL_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');
const INDEX_TTL_MS = 60 * 60 * 1000;
let registryCache = { at: 0, reg: null };

async function cityRegistry() {
  if (registryCache.reg && Date.now() - registryCache.at < INDEX_TTL_MS) return registryCache.reg;
  try {
    const key = process.env.BACKEND_INTERNAL_KEY;
    const res = await fetch(`${API_INTERNAL_URL}/weather/cities/`, {
      headers: key ? { Accept: 'application/json', 'X-Internal-Key': key } : { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    registryCache = { at: Date.now(), reg: buildRegistry((await res.json()).cities || []) };
  } catch {
    // Backend band → static list; 1 minute baad dobara koshish
    registryCache = { at: Date.now() - INDEX_TTL_MS + 60 * 1000, reg: registryCache.reg || buildRegistry(null) };
  }
  return registryCache.reg;
}

// Blog post (us zaban mein) live hai? (rule 6) — {"lang:slug": {at, live}};
// backend na mile → false (404 hi rahe)
const POST_TTL_MS = 10 * 60 * 1000;
const postLive = new Map();

async function blogPostLive(slug, lang) {
  const key = `${lang}:${slug}`;
  const hit = postLive.get(key);
  if (hit && Date.now() - hit.at < POST_TTL_MS) return hit.live;
  const en = lang === DEFAULT_LOCALE;
  let live = false;
  try {
    const res = await fetch(`${API_INTERNAL_URL}/blog/posts/${slug}/${en ? '' : `?lang=${lang}`}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    // Tarjuma: jawab usi zaban ka ho (services/blogApi.js jaisa — warna English post)
    live = res.ok && (en || (await res.json())?.lang === lang);
  } catch {
    return false;   // cache nahi — agli dafa dobara
  }
  if (postLive.size > 500) postLive.clear();
  postLive.set(key, { at: Date.now(), live });
  return live;
}

// ── Zabanein (i18n Phase 1, Oct 2026) ──
// Pages app/[lang]/ mein hain. Neeche ke qawaid bina-prefix hisse par chalte
// hain aur redirect usi zaban mein (/de/weather/Brisbane → ek hop →
// /de/weather/australia/brisbane). Phir:
//   • /en/...  → 308 bina prefix (ek hi hop; target kabhi /en se shuru nahi
//     hota aur rewrite dobara proxy se nahi guzarta → loop mumkin nahi)
//   • English (koi prefix nahi) → andar se /en/... par REWRITE (URL wahi)
//   • /de/... waghera → seedha; ENABLED_LOCALES mein nahi → X-Robots-Tag noindex
// Root ki non-page routes (og-image; /api, files matcher se pehle hi bahar)
// [lang] ke bahar hain — un ko chhona nahi.
const ROOT_ROUTES = ['/og-image'];

export async function proxy(request) {
  const original = request.nextUrl.pathname;
  if (ROOT_ROUTES.some((r) => original === r || original.startsWith(`${r}/`))) return NextResponse.next();

  const explicitEn = /^\/en(?=\/|$)/.test(original);
  const { lang, path: bare } = explicitEn
    ? { lang: DEFAULT_LOCALE, path: original.slice(3) || '/' }
    : splitLocale(original);
  let path = bare;
  let status = 308;

  // 1) trailing slash
  if (path.length > 1 && path.endsWith('/')) path = path.replace(/\/+$/, '') || '/';

  if (path === '/weather' || path.startsWith('/weather/')) {
    // 2) lowercase
    path = path.toLowerCase();

    // 4) purana city URL
    const parts = path.split('/'); // ['', 'weather', '<slug>', ...]
    if (parts.length === 3 && parts[2]) {
      const slug = parts[2];
      if (isKnownCity(slug)) {
        // 4) purana Section 1 city URL (original 160) → merged page (301, owner)
        path = cityPath(slug);
        status = 301;
      } else if (getCountry(slug)) {
        // 3) mulk ka sirf 1 shehar → seedha us ka page (ek hi hop, 308)
        const reg = await cityRegistry();
        const list = reg.citiesOfCountry(slug);
        if (list.length === 1) path = reg.cityPath(list[0].slug);
      } else {
        // 5) DB ka shehar (search se aaya, jaise /weather/tulum) → us ka page (308)
        const reg = await cityRegistry();
        const target = reg.cityPath(reg.aliases.get(slug) || slug);
        if (target) path = target;
      }
    }
  }

  // 6) purana duplicate blog slug → asal post (301)
  const base = duplicateBlogBase(path);
  if (base && !(await blogPostLive(path.slice('/blog/'.length), lang)) && (await blogPostLive(base, lang))) {
    path = `/blog/${base}`;
    status = 301;
  }

  const target = localePath(lang, path);
  if (target !== original) {
    // Saada URL — request.nextUrl.clone() asal URL ka aakhri "/" format
    // karte waqt wapas jod deta tha (/about/ → /about/ loop, test mein pakda).
    const url = new URL(request.url);
    url.pathname = target;
    return NextResponse.redirect(url, status);
  }

  if (lang === DEFAULT_LOCALE) {
    const url = new URL(request.url);
    url.pathname = path === '/' ? '/en' : `/en${path}`;
    return NextResponse.rewrite(url);
  }
  const res = NextResponse.next();
  if (!parseEnabledLocales(process.env.ENABLED_LOCALES).includes(lang)) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
}

export const config = {
  // Sab pages — sivaye /api (backend proxy), Next ki apni files aur
  // extension wali files (favicon.ico, robots.txt, sitemap.xml, logo.png…)
  matcher: ['/((?!api/|api$|_next/|.*\\.[a-zA-Z0-9]+$).*)'],
};
