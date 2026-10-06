// ─────────────────────────────────────────────────────────────
//  SITEMAP  →  /sitemap.xml   (audit 2.3)
//
//  • Static public pages (login/signup/pricing NAHI — noindex hain)
//  • Saari blog posts — /api/blog/posts/ ke saare pages server par
//  • Section 1: whitelist ke saare city pages /weather/<city> (data/cities.js)
//  • Section 2 (Phase C2): /weather hub, 2+ shehar wale country pages,
//    /weather/<country>/<city> (160) aur 12 month pages har shehar (1,920)
//    — sab data/ files se; 1-shehar mulk ka country page NAHI (308 hai)
//
//  History endpoint KABHI call nahi hota (Open-Meteo quota).
//  lastModified sirf blog par (updated_at, warna published_at) — static/city pages
//  par jhooti "aaj ki tareekh" nahi daali (owner, round 2).
//  Har ghante dobara banta hai.
// ─────────────────────────────────────────────────────────────
import { serverGet } from '@/services/serverApi';
import { ENDPOINTS } from '@/config/endpoints';
import { CITIES } from '@/data/cities';
import { SITE_URL } from '@/utils/seo';
import { COUNTRIES, hasCountryPage, countryPath, cityPath, monthPath } from '@/data/countries';
import { MONTHS } from '@/utils/climateMath';

export const revalidate = 3600;

const STATIC_PATHS = ['/', '/trip-planner', '/events', '/climate-guides', '/blog', '/api-docs', '/about', '/terms', '/privacy'];

// Saari posts, page-by-page. Zyada se zyada 50 pages (hifazat — loop
// kabhi na atke). Blog API na chale to posts ke baghair sitemap.
async function allPosts() {
  const posts = [];
  try {
    for (let page = 1; page <= 50; page++) {
      const data = await serverGet(ENDPOINTS.blog.list, { params: { page }, revalidate });
      if (!data?.posts?.length) break;
      posts.push(...data.posts);
      if (!data.has_next || data.current_page !== page) break;
    }
  } catch {
    // backend band ho to bhi baqi sitemap bane
  }
  return posts;
}

export default async function sitemap() {
  const posts = await allPosts();
  const url = (p) => `${SITE_URL}${p === '/' ? '' : p}`;

  return [
    ...STATIC_PATHS.map((p) => ({ url: url(p) })),
    ...posts.map((post) => ({
      url: url(`/blog/${post.slug}`),
      // Backend round B4: updated_at (har save par) — purana backend → published_at
      ...((post.updated_at || post.published_at) ? { lastModified: new Date(post.updated_at || post.published_at) } : {}),
    })),
    ...CITIES.map((c) => ({ url: url(`/weather/${c.slug}`) })),
    // Section 2
    { url: url('/weather') },
    ...COUNTRIES.filter((c) => hasCountryPage(c.slug)).map((c) => ({ url: url(countryPath(c.slug)) })),
    ...CITIES.map((c) => ({ url: url(cityPath(c.slug)) })),
    ...CITIES.flatMap((c) => MONTHS.map((m) => ({ url: url(monthPath(c.slug, m.slug)) }))),
  ];
}
