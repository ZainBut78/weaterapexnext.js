// ─────────────────────────────────────────────────────────────
//  Backend band ho to crawler ko 500 nahi, 503 + Retry-After (Step 2, Nov 2026)
//
//  App Router ka page apna HTTP status khud set nahi kar sakta: render mein error =
//  hamesha 500. Is liye proxy.js se (sirf OUTAGE_GATE=1 par):
//   • /health/ ka chhota probe background mein, 10 s mein ek dafa. Request kabhi
//     probe ka intezar nahi karti.
//   • Backend theek → kuch nahi, aaj jaisa.
//   • Backend band → page apne hi server se mangwao (GATE_HEADER ke saath, loop nahi):
//       – 5xx ke siwa kuch bhi (cached page, 404, redirect) → waisa hi aage
//       – 5xx ya server jawab na de → 503 + Retry-After, no-store (kabhi cache nahi)
//  Hadd: outage ke pehle 10 s, ya DB theek magar koi ek endpoint fail, to page ka 500
//  waisa hi jata hai.
//
//  Live par aazmana (asal outage ke baghair, OUTAGE_GATE band ho to bhi):
//    curl -i -H "x-outage-test: <REVALIDATE_SECRET>" https://weatherapex.com/<url>
//  Sirf us ek request ke liye backend band maana jata hai. Backend asal mein theek hai,
//  is liye page render ho sakta hai; jo page abhi banana pada (x-nextjs-cache: MISS) woh
//  "kabhi cache na hua" hai → 503. Cached → 200. Self-fetch aur headers wahi asal raasta
//  hain; sirf render ke fail hone ki jagah MISS dekha jata hai. Test page ko cache kar deta
//  hai, is liye agli dafa wahi URL warm hoga. Galat ya khaali header ka koi asar nahi.
//  Pure: fetch aur waqt bahar se (tests/unit/outageGate.test.mjs).
// ─────────────────────────────────────────────────────────────
import { timingSafeEqual } from 'node:crypto';

export const GATE_HEADER = 'x-outage-check';
export const TEST_HEADER = 'x-outage-test';
export const RETRY_AFTER_SECONDS = 120;
export const PROBE_EVERY_MS = 10_000;
export const PROBE_TIMEOUT_MS = 1_500;
export const SELF_FETCH_TIMEOUT_MS = 20_000;

// Node fetch khud decode karta hai, is liye yeh headers jawab ke saath sach nahi rehte
const DROP_HEADERS = ['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'keep-alive'];
// Page ka jawab inhi par nirbhar hai
const FORWARD_HEADERS = ['accept', 'accept-language', 'user-agent', 'cookie'];

/** /api khatam: http://x/api → http://x/health/db/ (SELECT 1; purana backend 404 = theek) */
export const healthUrl = (apiUrl) => `${apiUrl.replace(/\/+$/, '').replace(/\/api$/, '')}/health/db/`;

/** Sirf sahi secret. Secret khaali ho to kabhi nahi. */
export function isOutageTest(request, secret) {
  const given = request.headers.get(TEST_HEADER);
  if (!given || !secret) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createProbe({ url, fetchImpl, now = Date.now, everyMs = PROBE_EVERY_MS, timeoutMs = PROBE_TIMEOUT_MS }) {
  let up = true;       // jab tak saboot na ho, backend theek
  let at = -Infinity;
  let running = false;
  const run = async () => {
    running = true;
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-store' });
      up = res.status < 500;
    } catch {
      up = false;
    } finally {
      at = now();
      running = false;
    }
  };
  return {
    /** Abhi tak ka haal foran; zaroorat ho to agla probe background mein. */
    isUp() {
      if (!running && now() - at >= everyMs) run();
      return up;
    },
    run,
  };
}

export function unavailable() {
  return new Response('Temporarily unavailable. Please try again shortly.\n', {
    status: 503,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Retry-After': String(RETRY_AFTER_SECONDS),
      'Cache-Control': 'no-store',
    },
  });
}

/** Sirf aam page load: RSC navigation aur POST browser khud sambhalta hai. */
export function shouldGate(request) {
  return ['GET', 'HEAD'].includes(request.method)
    && !request.headers.get(GATE_HEADER)
    && !request.headers.get('rsc')
    && !request.headers.get('next-router-prefetch');
}

/** Backend band hai: cached page mile to wahi, warna 503. */
export async function serveDuringOutage(request, { selfOrigin, fetchImpl, timeoutMs = SELF_FETCH_TIMEOUT_MS, simulate = false }) {
  const res = await serveInner(request, { selfOrigin, fetchImpl, timeoutMs, simulate });
  if (!simulate) return res;
  // Test ka jawab CDN mein na rahe, aur saaf dikhe ke yeh test tha
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set(TEST_HEADER, 'simulated');
  return res;
}

async function serveInner(request, { selfOrigin, fetchImpl, timeoutMs, simulate }) {
  const { pathname, search } = new URL(request.url);
  const headers = { [GATE_HEADER]: '1' };
  for (const name of FORWARD_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  let res;
  try {
    res = await fetchImpl(`${selfOrigin}${pathname}${search}`, {
      method: request.method, headers, redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return unavailable();
  }
  if (res.status >= 500) return unavailable();
  if (simulate && res.headers.get('x-nextjs-cache') === 'MISS') return unavailable();
  const out = new Headers(res.headers);
  for (const name of DROP_HEADERS) out.delete(name);
  // Andar wali request ke proxy ke nishan. Wapas gaye to Next inhen hukam samajhta hai
  // (relative x-middleware-rewrite → Invalid URL → 500).
  for (const name of [...out.keys()]) if (name.startsWith('x-middleware-')) out.delete(name);
  return new Response(res.body, { status: res.status, headers: out });
}
