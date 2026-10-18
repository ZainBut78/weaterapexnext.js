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

export async function proxy(request) {
  const original = request.nextUrl.pathname;
  let path = original;
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
      }
    }
  }

  if (path !== original) {
    // Saada URL — request.nextUrl.clone() asal URL ka aakhri "/" format
    // karte waqt wapas jod deta tha (/about/ → /about/ loop, test mein pakda).
    const url = new URL(request.url);
    url.pathname = path;
    return NextResponse.redirect(url, status);
  }
  return NextResponse.next();
}

export const config = {
  // Sab pages — sivaye /api (backend proxy), Next ki apni files aur
  // extension wali files (favicon.ico, robots.txt, sitemap.xml, logo.png…)
  matcher: ['/((?!api/|api$|_next/|.*\\.[a-zA-Z0-9]+$).*)'],
};
