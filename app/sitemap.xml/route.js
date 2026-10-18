// /sitemap.xml — sitemap INDEX (Task 4, Oct 2026). Child sitemaps aur sab
// qawaid: services/sitemap.js. Purana app/sitemap.js (ek bari urlset) hata.
// 10 min ISR; Django publish /api/revalidate se /sitemap.xml + tag "blog"
// saaf karta hai → nayi post minton mein yahan.
import { children, sitemapIndex, xmlResponse } from '@/services/sitemap';

export const revalidate = 600;

export async function GET() {
  return xmlResponse(sitemapIndex(await children()));
}
