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
 */
export function pageMetadata({
  title, absoluteTitle, description, path, type = 'website',
  image, imageTitle, kicker, city, noindex = false, openGraph = {},
}) {
  const fullTitle = absoluteTitle || `${title} — ${SITE_NAME}`;
  const img = image || ogImageUrl(imageTitle || absoluteTitle || title, kicker, city);
  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false } } : {}),
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
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
