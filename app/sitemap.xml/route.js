// /sitemap.xml — sitemap INDEX (Task 4, Oct 2026). Child sitemaps aur sab
// qawaid: services/sitemap.js. Purana app/sitemap.js (ek bari urlset) hata.
// Nov 2026: route ka apna cache NAHI (pehle 10 min ISR) — live par tarjume
// publish hone ke baad bhi purana index (blog-de ke baghair) milta raha.
// Har request taaza bana hai, magar backend ka data fetch cache (tag "blog",
// "cities") se aata hai — Django publish /api/revalidate se woh tag saaf karta
// hai → agli request mein naya child sitemap. Bots ke liye sasta.
import { children, sitemapIndex, xmlResponse } from '@/services/sitemap';

export const dynamic = 'force-dynamic';

export async function GET() {
  return xmlResponse(sitemapIndex(await children()));
}
