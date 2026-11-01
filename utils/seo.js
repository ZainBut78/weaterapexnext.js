// ─────────────────────────────────────────────────────────────
//  SEO metadata ek jagah se (audit 2.2)
//
//  Har page `pageMetadata({...})` se apna metadata banata hai:
//   • canonical — chhote harf, aakhir mein "/" nahi, query string nahi
//     (sirf /blog?page=N apna query rakhta hai). Pura pata layout ke
//     `metadataBase` (NEXT_PUBLIC_SITE_URL) se banta hai.
//   • og:url / og:type / og:site_name / og:image, twitter:card
//
//  Kyun helper: Next.js mein page ka `openGraph` layout wale `openGraph`
//  ko POORA badal deta hai (merge nahi hota) — is liye siteName/type
//  har page par dobara dene padte hain. Ek jagah se galti nahi hoti.
// ─────────────────────────────────────────────────────────────

import { DEFAULT_LOCALE, OG_LOCALE, localePath, parseEnabledLocales } from '@/i18n/config';

export const SITE_NAME = 'WeatherApex';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://weatherapex.com').replace(/\/+$/, '');

// Generated share image (app/og-image/route.js). `city` (whitelist slug)
// diya ho to image ke peeche us shehar ki photo lagti hai.
export const ogImageUrl = (title, kicker, city) => {
  const qs = new URLSearchParams({ title });
  if (kicker) qs.set('kicker', kicker);
  if (city) qs.set('city', city);
  return `/og-image?${qs}`;
};

/**
 * @param {object} o
 * @param {string} o.title        — tab title ("About"; layout " — WeatherApex" jodta hai)
 * @param {string} [o.absoluteTitle] — poora title khud (template nahi lagega)
 * @param {string} o.description
 * @param {string} o.path         — canonical path, jaise '/about', '/blog?page=2'
 * @param {'website'|'article'} [o.type]
 * @param {string} [o.image]      — og:image (default: generated share image)
 * @param {string} [o.imageTitle] — generated image par likha title
 * @param {string} [o.kicker]     — generated image ka chhota upar wala label
 * @param {string} [o.city]       — generated image ke peeche is shehar ki photo
 * @param {boolean} [o.noindex]
 * @param {object} [o.openGraph]  — extra og fields (publishedTime wagera)
 * @param {string} [o.lang]       — zaban (i18n): canonical/og:url us zaban ka
 *                                  apna URL (/de/...), og:locale. Default en.
 * @param {object} [o.robots]     — apna robots (jaise { index: false, follow: true });
 *                                  index:false → noindex jaisa (hreflang nahi)
 * @param {boolean|string[]|object} [o.hreflang] — page ki kaunsi zabanein MAUJOOD hain:
 *                                  default = sab (same path) · false = koi nahi ·
 *                                  ['en','de'] = sirf yeh · { en: '/blog/a', de: '/blog/b' }
 *                                  = har zaban ka apna path. Sirf ENABLED zabanein.
 */
export function pageMetadata({
  title, absoluteTitle, description, path, type = 'website',
  image, imageTitle, kicker, city, noindex = false, openGraph = {}, lang = DEFAULT_LOCALE,
  robots, hreflang,
}) {
  // Canonical hamesha APNI zaban ka URL (/de/... ka canonical kabhi English nahi)
  const url = localePath(lang, path);
  const fullTitle = absoluteTitle || `${title} — ${SITE_NAME}`;
  const img = image || ogImageUrl(imageTitle || absoluteTitle || title, kicker, city);
  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: { canonical: url, ...hreflangLinks({ lang, path, hreflang, noindex: noindex || robots?.index === false }) },
    ...(robots ? { robots } : noindex ? { robots: { index: false } } : {}),
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: OG_LOCALE[lang] || OG_LOCALE[DEFAULT_LOCALE],
      type,
      images: [{ url: img, width: image ? undefined : 1200, height: image ? undefined : 630, alt: fullTitle }],
      ...openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [img],
    },
  };
}

// ── hreflang (Google: "Tell Google about localized versions of your page") ──
// Sirf HTML <link rel="alternate" hreflang> (sitemap mein xhtml:link NAHI).
// Har page: khud + har doosri ENABLED aur MAUJOOD zaban + x-default (= English).
// Reciprocal khud ba khud: har zaban ka page yahi function, yahi set.
// Kabhi nahi: noindex page, disabled zaban, ya sirf ek zaban (kuch batana nahi —
// sirf `en` enabled ho to output bilkul pehle jaisa). ISO 639-1, poore URL.
const enabledNow = () => parseEnabledLocales(process.env.ENABLED_LOCALES);
const absUrl = (p) => `${SITE_URL}${p === '/' ? '' : p}`;

export function hreflangLinks({ lang = DEFAULT_LOCALE, path, hreflang, noindex = false }) {
  if (noindex || hreflang === false) return {};
  const enabled = enabledNow();
  if (!enabled.includes(lang)) return {};
  let paths;
  if (hreflang && typeof hreflang === 'object' && !Array.isArray(hreflang)) paths = hreflang;
  else paths = Object.fromEntries((Array.isArray(hreflang) ? hreflang : enabled).map((l) => [l, path]));
  const langs = enabled.filter((l) => paths[l]);
  if (langs.length < 2 || !langs.includes(lang)) return {};
  const languages = Object.fromEntries(langs.map((l) => [l, absUrl(localePath(l, paths[l]))]));
  if (languages[DEFAULT_LOCALE]) languages['x-default'] = languages[DEFAULT_LOCALE];
  return { languages };
}
