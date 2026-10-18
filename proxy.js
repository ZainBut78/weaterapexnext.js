// ─────────────────────────────────────────────────────────────
//  PROXY (Next 16 mein "middleware" ka naya naam) — page banne se PEHLE
//
//  URL qawaid (Phase C2 final) — sab ek hi 308 hop mein (koi chain nahi):
//   1) Aakhri "/" nahi:  /about/ → /about   (sirf "/" khud, aur /api/* NAHI —
//      /api ko matcher chhoo hi nahi sakta; Django ke URLs "/" par khatam hote hain)
//   2) /weather/* chhote harf:  /weather/London → /weather/london
//   3) 1-shehar wala mulk (/weather/hungary → /weather/hungary/budapest) —
//      ab yahan NAHI: shehar dynamic hain (DB ke naye shehar se mulk 2+ ho
//      sakta hai), is liye country page (registry se) 308 karta hai.
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
import { cityPath } from './data/countries';

export function proxy(request) {
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
