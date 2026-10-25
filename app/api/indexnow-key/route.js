// ─────────────────────────────────────────────────────────────
//  IndexNow key file (Oct 2026) — https://weatherapex.com/<INDEXNOW_KEY>.txt
//
//  next.config.mjs ka rewrite /<key>.txt ko yahan bhejta hai; jawab sirf key
//  (text/plain) — IndexNow isi se tasdeeq karta hai ke URLs hamare hain.
//  Key server env INDEXNOW_KEY (Hostinger; NEXT_PUBLIC_ nahi) — wahi jo
//  Django (CapRover) mein. Key khufia nahi (public file), magar repo mein nahi.
//  Khaali → 404.
// ─────────────────────────────────────────────────────────────
export const dynamic = 'force-dynamic';

export function GET() {
  const key = (process.env.INDEXNOW_KEY || '').trim();
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) return new Response('Not found', { status: 404 });
  return new Response(key, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
