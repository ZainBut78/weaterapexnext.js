// ─────────────────────────────────────────────────────────────
//  BFF (/api/site/...) ke qawaid — pure, unit tests inhi par (Nov 2026)
//
//  Browser ka data ab Next.js server se jata hai; Django ke website endpoints
//  sirf X-Internal-Key maante hain. Yahan sirf yeh raaste chalte hain (open proxy
//  nahi), sirf yeh params aage jate hain. Tareekh ghalat hai ya shehar nahi mila,
//  yeh faisla Django ka hi rehta hai (wahi error codes jo UI samajhta hai).
//
//  limit: per-IP per-minute bucket. cacheSeconds: sab visitors ka ek jawab, is liye
//  in par IP / token aage nahi jate. forwardAuth: user ki daily quota Django ginta hai.
// ─────────────────────────────────────────────────────────────
export const SITE_ROUTES = {
  'weather/current': { backend: '/weather/current/', params: ['city'], limit: 'weather', cacheSeconds: 300, tags: [] },
  'trips/plan/cities/search': { backend: '/trips/plan/cities/search/', params: ['q'], limit: 'search', cacheSeconds: 600, tags: ['cities'] },
  'trips/plan': { backend: '/trips/plan/', params: ['city', 'start', 'end'], limit: 'feature', forwardAuth: true },
  'trips/plan/recommend': { backend: '/trips/plan/recommend/', params: ['country', 'start', 'end'], limit: 'feature', forwardAuth: true },
  'events/risk': { backend: '/events/risk/', params: ['city', 'date', 'type', 'time'], limit: 'feature', forwardAuth: true },
};

export const DEFAULT_PER_MINUTE = { weather: 120, search: 120, feature: 30 };

const MAX_PARAM_LENGTH = 100;

/** ['weather', 'current'] → route, warna null. */
export function matchSiteRoute(segments) {
  const key = (segments || []).join('/');
  return Object.hasOwn(SITE_ROUTES, key) ? SITE_ROUTES[key] : null;
}

/** Sirf route ke params, chhote, bina control characters. Cache wale lowercase (ek key). */
export function pickParams(route, searchParams) {
  const out = new URLSearchParams();
  for (const name of route.params) {
    const raw = searchParams.get(name);
    if (raw == null) continue;
    // eslint-disable-next-line no-control-regex
    let value = raw.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, MAX_PARAM_LENGTH);
    if (route.cacheSeconds) value = value.toLowerCase();
    out.set(name, value);
  }
  return out.toString();
}

/** Fixed window per key. hit() → 0 = theek, warna kitne second baad. Ek server process ki memory. */
export function createRateLimiter(perMinute, now = Date.now) {
  const hits = new Map();
  return {
    hit(key) {
      const t = now();
      let entry = hits.get(key);
      if (!entry || t - entry.start >= 60000) {
        entry = { start: t, count: 0 };
        hits.set(key, entry);
      }
      entry.count += 1;
      if (hits.size > 10000) {
        for (const [k, v] of hits) if (t - v.start >= 60000) hits.delete(k);
      }
      return entry.count > perMinute ? Math.max(1, Math.ceil((entry.start + 60000 - t) / 1000)) : 0;
    },
  };
}

export function perMinuteFromEnv(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}
