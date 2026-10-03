// ─────────────────────────────────────────────────────────────
//  PROXY (Next 16 mein "middleware" ka naya naam) — page banne se PEHLE
//
//  URL qawaid (Phase C2 final) — sab ek hi 308 hop mein (koi chain nahi):
//   1) Aakhri "/" nahi:  /about/ → /about   (sirf "/" khud, aur /api/* NAHI —
//      /api ko matcher chhoo hi nahi sakta; Django ke URLs "/" par khatam hote hain)
//   2) /weather/* chhote harf:  /weather/London → /weather/london
//   3) 1-shehar wala mulk:  /weather/hungary → /weather/hungary/budapest
//      Istisna: singapore / hong-kong — yeh Section 1 ke SHEHAR pages hain
//      (/weather/singapore 200 rehta hai, redirect nahi → koi loop nahi).
//  Misal: /weather/Hungary/ → ek hi hop → /weather/hungary/budapest
//
//  Lowercase redirect page.js mein kyun nahi: city pages ISR hain; page se
//  redirect karne par "London" ka redirect cache hota aur Windows ki disk par
//  "london" ko bhi milta (loop — audit 2.1 mein pakda gaya). Yahan page
//  tak pohanchne se pehle hota hai.
// ─────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { isKnownCity } from './data/cities';
import { getCountry, hasCountryPage, citiesOfCountry, cityPath } from './data/countries';

export function proxy(request) {
  const original = request.nextUrl.pathname;
  let path = original;

  // 1) trailing slash
  if (path.length > 1 && path.endsWith('/')) path = path.replace(/\/+$/, '') || '/';

  if (path === '/weather' || path.startsWith('/weather/')) {
    // 2) lowercase
    path = path.toLowerCase();

    // 3) 1-shehar wala mulk → us ka akela shehar (by-month page)
    const parts = path.split('/'); // ['', 'weather', '<slug>', ...]
    if (parts.length === 3 && parts[2]) {
      const slug = parts[2];
      const country = getCountry(slug);
      if (country && !isKnownCity(slug) && !hasCountryPage(slug)) {
        const only = citiesOfCountry(slug)[0];
        if (only) path = cityPath(only.slug);
      }
    }
  }

  if (path !== original) {
    // Saada URL — request.nextUrl.clone() asal URL ka aakhri "/" format
    // karte waqt wapas jod deta tha (/about/ → /about/ loop, test mein pakda).
    const url = new URL(request.url);
    url.pathname = path;
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  // Sab pages — sivaye /api (backend proxy), Next ki apni files aur
  // extension wali files (favicon.ico, robots.txt, sitemap.xml, logo.png…)
  matcher: ['/((?!api/|api$|_next/|.*\\.[a-zA-Z0-9]+$).*)'],
};
