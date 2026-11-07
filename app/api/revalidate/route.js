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
//  Blog tags foran expire ({ expire: 0 }) — agla visitor naya data dekhe. Data tags
//  'max' (neeche). Sirf apni site ke path / allowed tags — baqi rad.
// ─────────────────────────────────────────────────────────────
import { revalidatePath, revalidateTag } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';
import { LOCALES } from '@/i18n/config';

export const dynamic = 'force-dynamic';

// blog:<slug> · blog:<lang>:<slug> (tarjuma, Phase 4) · blog · cities (history_complete index, 1 h)
// · history:<shehar> · climate-summary (services/history.js: data badla to naya number)
const ALLOWED_TAG = /^(blog(:([a-z]{2}:)?[a-z0-9-]+)?|cities|history:[a-z0-9-]+|climate-summary)$/;
// Zaban ka prefix (/de/blog/<slug>) bhi — tarjume ka slug alag hota hai
const ALLOWED = /^(\/(blog(\/[a-z0-9-]+)?|weather(\/[a-z0-9-]+){0,3}|sitemap\.xml|sitemap\/[a-z0-9-]+\.xml|)|\/(de|it|ja|fr|es)(\/(blog(\/[a-z0-9-]+)?|weather(\/[a-z0-9-]+){0,3}))?)$/;
const PREFIXED = /^\/(de|it|ja|fr|es)(?=\/|$)/;

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
  // 40: English post + 5 tarjumon ke paths/lists/sitemaps ek hi call mein (Phase 4)
  const clean = (list) => [...new Set(list.map((x) => String(x).trim()))].slice(0, 40);
  paths = clean([...paths, ...sp.getAll('path')]);
  tags = clean([...tags, ...sp.getAll('tag')]);
  const bad = [...paths.filter((p) => !ALLOWED.test(p)), ...tags.filter((t) => !ALLOWED_TAG.test(t))];
  if ((!paths.length && !tags.length) || bad.length) {
    return Response.json({ revalidated: false, error: 'invalid paths/tags', bad }, { status: 400 });
  }
  // Blog: agla visitor foran naya. Data (cities, history, summary): 'max', purana page chalta
  // rehta hai aur peeche naya banta hai. expire: 0 par har page ruk kar banta tha, aur backend
  // us waqt band ho to poori site 5xx (cities tag har page par hai).
  for (const t of tags) revalidateTag(t, t.startsWith('blog') ? { expire: 0 } : 'max');
  // i18n (Oct 2026): pages app/[lang]/ mein — English bhi andar se /en/...
  // Bina prefix path (/blog/x) → har zaban ka path. Prefix wala (/de/blog/y,
  // blog tarjuma) → sirf wahi. Sitemaps root par hain (zaban nahi).
  for (const p of paths) {
    if (p.startsWith('/sitemap')) { revalidatePath(p); continue; }
    if (PREFIXED.test(p)) { revalidatePath(p); continue; }
    for (const l of LOCALES) revalidatePath(p === '/' ? `/${l}` : `/${l}${p}`);
  }
  return Response.json({ revalidated: true, paths, tags, now: Date.now() });
}
