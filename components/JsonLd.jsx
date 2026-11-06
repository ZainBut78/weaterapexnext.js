// ─────────────────────────────────────────────────────────────
//  JSON-LD (Google ke liye structured data) — audit 2.4
//  Server par HTML mein <script type="application/ld+json"> banta hai;
//  screen par kuch nazar nahi aata. `<` ko < kiya jata hai taake
//  data mein "</script>" jaisa text script ko tod na sake.
//  FAQ schema kabhi nahi (Google ne 2023 mein band kar diya).
// ─────────────────────────────────────────────────────────────
import { SITE_NAME, SITE_URL } from '@/utils/seo';
import { localePath } from '@/i18n/config';

export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

// Logo: public/logo.png (512×512) — owner ka asal WeatherApex logo (Nov 2026).
export const ORGANIZATION = {
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
};

// Blog posts ka author (owner ka faisla, Oct 2026). Backend post ka author
// abhi nahi bhejta — saare articles Zain likhte / review karte hain.
export const AUTHOR = {
  '@type': 'Person',
  name: 'Zain Butt',
  url: SITE_URL,
};

// lang (i18n): item URL us zaban ka (/de/...); en → pehle jaisa
export const breadcrumbs = (items, lang = 'en') => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: `${SITE_URL}${it.path === '/' && lang === 'en' ? '' : localePath(lang, it.path)}`,
  })),
});
