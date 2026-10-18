// /sitemap/<name>.xml — child sitemaps (static, blog, places, months-N).
// Ghalat naam → 404. Qawaid: services/sitemap.js.
import { childEntries, urlset, xmlResponse } from '@/services/sitemap';

export const revalidate = 600;

export async function generateStaticParams() {
  return [];
}

export async function GET(_request, { params }) {
  const { name } = await params;
  const m = /^([a-z0-9-]+)\.xml$/.exec(name || '');
  const entries = m ? await childEntries(m[1]) : null;
  if (!entries) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  return xmlResponse(urlset(entries));
}
