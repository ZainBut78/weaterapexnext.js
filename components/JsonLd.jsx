// ─────────────────────────────────────────────────────────────
//  JSON-LD (Google ke liye structured data) — audit 2.4
//  Server par HTML mein <script type="application/ld+json"> banta hai;
//  screen par kuch nazar nahi aata. `<` ko < kiya jata hai taake
//  data mein "</script>" jaisa text script ko tod na sake.
//  FAQ schema kabhi nahi (Google ne 2023 mein band kar diya).
// ─────────────────────────────────────────────────────────────
import { SITE_NAME, SITE_URL } from '@/utils/seo';

export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

// Logo: public/logo.png (512×512) — Navbar wale WeatherApex nishan (neela
// gol + badal ✓) se bana. Pehle yahan favicon.svg tha jo asal mein Vite
// ka logo tha (owner, round 3 B1). Final brand logo aane par file badlein.
export const ORGANIZATION = {
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
};

export const breadcrumbs = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: `${SITE_URL}${it.path === '/' ? '' : it.path}`,
  })),
});
