// ─────────────────────────────────────────────────────────────
//  Zabanein (i18n Phase 1, Oct 2026) — client + server dono ke liye
//
//  en = default, URL par koi prefix NAHI (/weather/...). Baqi 5 prefix ke
//  saath (/de/weather/...). Andar se English bhi app/[lang] mein hai —
//  proxy.js bina-prefix URL ko /en/... par REWRITE karta hai (browser ka
//  URL wahi rehta), aur bahar se aaye /en/... ko 308 se bina-prefix par.
//
//  Kaunsi zaban Google ko dikhe (index, sitemap, hreflang, switcher) —
//  woh ENABLED_LOCALES env se (i18n/server.js). Yahan sirf poori list.
// ─────────────────────────────────────────────────────────────

export const LOCALES = ['en', 'de', 'it', 'ja', 'fr', 'es'];
export const DEFAULT_LOCALE = 'en';
export const PREFIXED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

export const isLocale = (x) => LOCALES.includes(x);

// Intl ke liye. en = en-US — site pehle se yahi istemal karti thi
// (toLocaleDateString('en-US')), English ki shakal bilkul wahi rahe.
export const INTL_LOCALE = { en: 'en-US', de: 'de-DE', it: 'it-IT', ja: 'ja-JP', fr: 'fr-FR', es: 'es-ES' };
export const OG_LOCALE = { en: 'en_US', de: 'de_DE', it: 'it_IT', ja: 'ja_JP', fr: 'fr_FR', es: 'es_ES' };

// Switcher mein har zaban apne naam se (Deutsch, 日本語 …)
export const LOCALE_NAMES = { en: 'English', de: 'Deutsch', it: 'Italiano', ja: '日本語', fr: 'Français', es: 'Español' };
// WeatherSpark jaisa "Deutsch (German)" — jo zaban na parh sake woh bhi pehchane
export const LOCALE_ENGLISH_NAMES = { en: 'English', de: 'German', it: 'Italian', ja: 'Japanese', fr: 'French', es: 'Spanish' };

/** ENABLED_LOCALES env ("en,de") → ['en','de'] (en hamesha). Proxy + server dono. */
export function parseEnabledLocales(env) {
  const want = new Set(String(env || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
  return LOCALES.filter((l) => l === DEFAULT_LOCALE || want.has(l));
}

/** '/weather/x' + 'de' → '/de/weather/x' · en → wahi. Bahar ke / poore URL waise hi. */
export function localePath(lang, path = '/') {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return path;
  if (!lang || lang === DEFAULT_LOCALE) return path;
  const { lang: already } = splitLocale(path);
  if (already !== DEFAULT_LOCALE) return path;           // pehle se /de/... — dobara prefix nahi
  return path === '/' ? `/${lang}` : `/${lang}${path}`;
}

/** Zaban ka hissa hata kar asal path — '/en/x', '/de/x', '/x' sab → '/x'.
 *  (Server par usePathname andar ka /en/... deta hai, browser mein /... —
 *  dono ko ek jaisa banane ke liye; warna hydration mismatch.) */
export function barePath(pathname = '/') {
  if (/^\/en(?=\/|$)/.test(pathname)) return pathname.slice(3) || '/';
  return splitLocale(pathname).path;
}

/** '/de/weather/x' → { lang: 'de', path: '/weather/x' } · '/weather/x' → { lang: 'en', ... } */
export function splitLocale(pathname = '/') {
  const m = /^\/([a-z]{2})(?=\/|$|\?|#)/.exec(pathname);
  if (m && PREFIXED_LOCALES.includes(m[1])) {
    return { lang: m[1], path: pathname.slice(3) || '/' };
  }
  return { lang: DEFAULT_LOCALE, path: pathname || '/' };
}
