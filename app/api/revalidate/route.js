// ─────────────────────────────────────────────────────────────
//  POST /api/revalidate — on-demand cache saaf karna (SEO fixes, Oct 2026)
//
//  Django BlogPost save/publish/delete par yahan POST karta hai, taake post,
//  /blog aur sitemap foran naye hon. (Yeh file /api/* ke Django rewrite se
//  pehle chalti hai — filesystem route rewrites se pehle match hota hai.)
//
//  Secret: server-only env REVALIDATE_SECRET (NEXT_PUBLIC_ nahi). Header
//  `Authorization: Bearer <secret>` (behtar) ya `?secret=` (query).
//  Body: {"paths": ["/blog/<slug>", "/blog", "/sitemap.xml"]} ya `?path=`.
//  Sirf apni site ke path (/blog, /weather, /sitemap…) — baqi rad.
// ─────────────────────────────────────────────────────────────
import { revalidatePath } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';

export const dynamic = 'force-dynamic';

const ALLOWED = /^\/(blog(\/[a-z0-9-]+)?|weather(\/[a-z0-9-]+){0,3}|sitemap\.xml|sitemap\/[a-z0-9-]+\.xml|)$/;

function authorized(request) {
  const secret = process.env.REVALIDATE_SECRET || '';
  if (!secret) return false;
  const header = request.headers.get('authorization') || '';
  const given = header.startsWith('Bearer ')
    ? header.slice(7)
    : new URL(request.url).searchParams.get('secret') || '';
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  if (!authorized(request)) {
    return Response.json({ revalidated: false, error: 'unauthorized' }, { status: 401 });
  }
  let paths = [];
  try {
    const body = await request.json();
    if (Array.isArray(body?.paths)) paths = body.paths;
  } catch {
    // body nahi — query se
  }
  const q = new URL(request.url).searchParams.getAll('path');
  paths = [...new Set([...paths, ...q].map((p) => String(p).trim()))].slice(0, 20);
  const bad = paths.filter((p) => !ALLOWED.test(p));
  if (!paths.length || bad.length) {
    return Response.json({ revalidated: false, error: 'invalid paths', bad }, { status: 400 });
  }
  for (const p of paths) revalidatePath(p);
  return Response.json({ revalidated: true, paths, now: Date.now() });
}
