// ─────────────────────────────────────────────────────────────
//  POST /api/revalidate — on-demand cache saaf karna (SEO fixes, Oct 2026)
//
//  Django BlogPost save/publish/delete par yahan POST karta hai, taake post,
//  /blog aur sitemap foran naye hon. (Yeh file /api/* ke Django rewrite se
//  pehle chalti hai — filesystem route rewrites se pehle match hota hai.)
//
//  Secret: server-only env REVALIDATE_SECRET (NEXT_PUBLIC_ nahi). Header
//  `Authorization: Bearer <secret>`. Purana `?secret=` (query) abhi bhi
//  qubool (security round 4, Oct 2026) — taake deploy ke beech purana
//  backend na toote; istemal par warning log. Backend ab sirf header
//  bhejta hai — dono deploy ke baad query wala raasta hata sakte hain.
//  Body: {"paths": ["/blog/<slug>", "/blog", "/sitemap.xml"],
//         "tags": ["blog:<slug>", "blog", "cities"]}  (ya `?path=` / `?tag=`).
//  Tags (fetch data cache) foran expire ({ expire: 0 }) — agla visitor naya
//  data dekhe. Sirf apni site ke path / blog tags — baqi rad.
// ─────────────────────────────────────────────────────────────
import { revalidatePath, revalidateTag } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';

export const dynamic = 'force-dynamic';

const ALLOWED_TAG = /^(blog(:[a-z0-9-]+)?|cities)$/;   // cities = history_complete index (1 h cache)
const ALLOWED = /^\/(blog(\/[a-z0-9-]+)?|weather(\/[a-z0-9-]+){0,3}|sitemap\.xml|sitemap\/[a-z0-9-]+\.xml|)$/;

function authorized(request) {
  const secret = process.env.REVALIDATE_SECRET || '';
  if (!secret) return false;
  const header = request.headers.get('authorization') || '';
  const fromHeader = header.startsWith('Bearer ');
  const given = fromHeader ? header.slice(7) : new URL(request.url).searchParams.get('secret') || '';
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  if (ok && !fromHeader) console.warn('[revalidate] secret query param se aaya (purana tareeqa) — header istemal karein');
  return ok;
}

export async function POST(request) {
  if (!authorized(request)) {
    return Response.json({ revalidated: false, error: 'unauthorized' }, { status: 401 });
  }
  let paths = [];
  let tags = [];
  try {
    const body = await request.json();
    if (Array.isArray(body?.paths)) paths = body.paths;
    if (Array.isArray(body?.tags)) tags = body.tags;
  } catch {
    // body nahi — query se
  }
  const sp = new URL(request.url).searchParams;
  const clean = (list) => [...new Set(list.map((x) => String(x).trim()))].slice(0, 20);
  paths = clean([...paths, ...sp.getAll('path')]);
  tags = clean([...tags, ...sp.getAll('tag')]);
  const bad = [...paths.filter((p) => !ALLOWED.test(p)), ...tags.filter((t) => !ALLOWED_TAG.test(t))];
  if ((!paths.length && !tags.length) || bad.length) {
    return Response.json({ revalidated: false, error: 'invalid paths/tags', bad }, { status: 400 });
  }
  for (const t of tags) revalidateTag(t, { expire: 0 });
  for (const p of paths) revalidatePath(p);
  return Response.json({ revalidated: true, paths, tags, now: Date.now() });
}
