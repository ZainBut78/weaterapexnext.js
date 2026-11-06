// ─────────────────────────────────────────────────────────────
//  GET /api/site/... — browser ka data Next.js server ke zariye (BFF, Nov 2026)
//
//  Django ke website endpoints sirf X-Internal-Key maante hain; key sirf yahan server
//  par rehti hai (NEXT_PUBLIC_ nahi). Raaste aur params: utils/siteBff.js.
//  Browser ki IP X-Site-Client-IP mein, taake 3-free/din per-visitor rahe.
//
//  Env (Hostinger, sab optional):
//    SITE_BFF_WEATHER_PER_MINUTE=120  SITE_BFF_SEARCH_PER_MINUTE=120
//    SITE_BFF_FEATURE_PER_MINUTE=30
//  Hadd har server process ki apni memory mein (/api/places/open jaisi).
// ─────────────────────────────────────────────────────────────
import { clientIp } from '@/utils/clientIp';
import { createRateLimiter, DEFAULT_PER_MINUTE, matchSiteRoute, perMinuteFromEnv, pickParams } from '@/utils/siteBff';

const API_INTERNAL_URL = (process.env.API_INTERNAL_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');
const FEATURE_TIMEOUT_MS = 45000;   // trip plan kai din ka forecast laata hai
const CACHED_TIMEOUT_MS = 15000;

const limiters = {
  weather: createRateLimiter(perMinuteFromEnv(process.env.SITE_BFF_WEATHER_PER_MINUTE, DEFAULT_PER_MINUTE.weather)),
  search: createRateLimiter(perMinuteFromEnv(process.env.SITE_BFF_SEARCH_PER_MINUTE, DEFAULT_PER_MINUTE.search)),
  feature: createRateLimiter(perMinuteFromEnv(process.env.SITE_BFF_FEATURE_PER_MINUTE, DEFAULT_PER_MINUTE.feature)),
};

const reply = (body, status, headers = {}) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

export async function GET(request, { params }) {
  const { path } = await params;
  const route = matchSiteRoute(path);
  if (!route) return reply({ error: 'Not found', code: 'not_found' }, 404);

  const ip = clientIp(request.headers);
  const wait = limiters[route.limit].hit(ip);
  if (wait) {
    return reply({ error: 'Too many requests. Please slow down and try again.', code: 'rate_limited', retry_after: wait },
      429, { 'Retry-After': String(wait) });
  }

  const headers = { Accept: 'application/json' };
  if (process.env.BACKEND_INTERNAL_KEY) headers['X-Internal-Key'] = process.env.BACKEND_INTERNAL_KEY;
  // Cache wale raaste sab ke liye ek jawab: IP / token bhejne se cache key alag ho jati
  if (!route.cacheSeconds) {
    if (ip !== 'unknown') headers['X-Site-Client-IP'] = ip;
    const auth = request.headers.get('authorization');
    if (route.forwardAuth && auth) headers.Authorization = auth;
  }

  const qs = pickParams(route, new URL(request.url).searchParams);
  let res;
  try {
    res = await fetch(`${API_INTERNAL_URL}${route.backend}${qs ? `?${qs}` : ''}`, {
      headers,
      ...(route.cacheSeconds
        ? { next: { revalidate: route.cacheSeconds, tags: route.tags }, signal: AbortSignal.timeout(CACHED_TIMEOUT_MS) }
        : { cache: 'no-store', signal: AbortSignal.timeout(FEATURE_TIMEOUT_MS) }),
    });
  } catch {
    return reply({ error: 'Service temporarily unavailable. Please try again.', code: 'backend_unavailable' }, 503);
  }

  const retryAfter = res.headers.get('retry-after');
  return new Response(await res.text(), {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
      ...(retryAfter ? { 'Retry-After': retryAfter } : {}),
    },
  });
}
