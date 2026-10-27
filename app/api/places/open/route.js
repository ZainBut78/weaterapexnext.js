// ─────────────────────────────────────────────────────────────
//  POST /api/places/open — search se shehar ka climate page (owner, Oct 2026)
//
//  Body: {"q": "Tulum"} · {"q": "Santa Fe, New Mexico"} · {"geoId": 5490263}
//  Pehle hamara DB → na mile to Open-Meteo geocoding → shehar DB mein → us
//  ke 12 mahine (sirf jo DB mein nahi). Yeh sab Django karta hai
//  (/api/weather/places/open/, sirf internal key). Yahan:
//   • browser se seedha Django nahi — bots shehar na banayein: per-IP hadd
//     (20 / 10 minute, asal IP: utils/clientIp), internal key server par hi rehti hai
//   • shehar DB mein aa gaya → cities index (tag "cities") + us ke pages ka
//     cache foran saaf (pehle 404 tha to ab page)
//   • jawab: {status: "ok", path} — browser wahan chala jaye; ya
//     "choose" (kai jagah, user chune) / "not_a_city" / "not_found" / "error"
//  Yeh file /api/* ke Django rewrite (sirf local) se pehle chalti hai.
// ─────────────────────────────────────────────────────────────
import { revalidatePath, revalidateTag } from 'next/cache';
import { serverGet, serverPost } from '@/services/serverApi';
import { ENDPOINTS } from '@/config/endpoints';
import { buildRegistry } from '@/utils/cityRegistryCore';
import { MONTHS } from '@/utils/climateMath';
import { countryPath } from '@/data/countries';
import { clientIp } from '@/utils/clientIp';

export const dynamic = 'force-dynamic';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const OPEN_TIMEOUT_MS = 60000;      // naya shehar = 20 saal ka data (aam taur par 2–6 s)
const hits = new Map();             // ip → [timestamps] (ek server process ki memory)

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return list.length > MAX_PER_WINDOW;
}

const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request) {
  // Asal IP (utils/clientIp) — X-Forwarded-For ki PEHLI value nahi (client khud likh sakta,
  // security report #9). Hostinger par source CLIENT_IP_SOURCE env se (/api/places/ip-debug).
  const ip = clientIp(request.headers);
  if (rateLimited(ip)) return reply({ status: 'rate_limited' }, 429);

  let body = {};
  try {
    body = await request.json();
  } catch {
    // khaali body
  }
  const q = typeof body.q === 'string' ? body.q.trim().slice(0, 100) : '';
  const geoId = body.geoId != null && /^\d{1,12}$/.test(String(body.geoId)) ? Number(body.geoId) : null;
  if (q.length < 2 && !geoId) return reply({ status: 'bad_request' }, 400);

  let res;
  try {
    res = await serverPost(ENDPOINTS.weather.placesOpen, geoId ? { geo_id: geoId } : { q }, { timeoutMs: OPEN_TIMEOUT_MS });
  } catch {
    return reply({ status: 'error' }, 503);
  }
  const data = res.data || {};
  if (data.status === 'choose' || data.status === 'not_a_city') return reply(data);
  if (data.status === 'not_found') return reply(data, 404);
  if (data.status === 'limit') return reply({ status: 'limit' }, 429);
  if (data.status !== 'ok' || !data.city?.slug) return reply({ status: 'error', reason: data.reason || null }, 503);

  // Shehar DB mein — registry taaza (cache nahi) se us ka URL
  revalidateTag('cities', { expire: 0 });
  let reg;
  try {
    const idx = await serverGet(ENDPOINTS.weather.cities, { noStore: true });
    reg = buildRegistry(idx?.cities || []);
  } catch {
    return reply({ status: 'error' }, 503);
  }
  const slug = reg.aliases.get(data.city.slug) || data.city.slug;
  const path = reg.cityPath(slug);
  if (!path) {
    const why = reg.skipped.find((s) => s.slug === slug)?.reason || 'not in registry';
    return reply({ status: 'unsupported', reason: why, city: data.city }, 422);
  }

  // Pehle 404 cache hua ho to ab asal page (city + 12 mahine + mulk + /weather)
  const c = reg.get(slug);
  for (const p of [path, ...MONTHS.map((m) => reg.monthPath(slug, m.slug)), countryPath(c.countrySlug), '/weather']) {
    revalidatePath(p);
  }
  return reply({ status: 'ok', path, created: !!data.created, city: { slug, name: c.name, country: c.country } });
}
