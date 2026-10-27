// ─────────────────────────────────────────────────────────────
//  Security fix round 3 (Oct 2026) — headers, X-Powered-By,
//  /api/places/open ki per-IP hadd jhooti X-Forwarded-For se bypass nahi.
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';

const PAGES = ['/', '/weather/australia/brisbane', '/blog', '/login'];

test('security headers on pages, no X-Powered-By, no second CSP', async ({ request }) => {
  for (const p of PAGES) {
    const res = await request.get(p);
    const h = res.headers();
    expect(h['x-frame-options'], p).toBe('SAMEORIGIN');
    expect(h['x-content-type-options'], p).toBe('nosniff');
    expect(h['referrer-policy'], p).toBe('strict-origin-when-cross-origin');
    expect(h['permissions-policy'], p).toBe('camera=(), microphone=(), geolocation=(self)');
    expect(h['strict-transport-security'], p).toBe('max-age=31536000');     // includeSubDomains/preload nahi
    expect(h['x-powered-by'], p).toBeUndefined();
    expect(h['content-security-policy'], p).toBeUndefined();                // Hostinger ka hi rahe
    expect(h['cross-origin-opener-policy'], p).toBeUndefined();             // Google login popup
  }
});

test('places/open per-IP limit: spoofed left XFF values do not bypass', async ({ request }) => {
  // Har request mein bayen taraf nayi jhooti IP, asal (daayen) wahi — 21wi par 429
  const codes = [];
  for (let i = 0; i < 21; i++) {
    const r = await request.post('/api/places/open', {
      data: { q: 'zz' }, headers: { 'x-forwarded-for': `6.6.${i}.6, 203.0.113.99` },
    });
    codes.push(r.status());
  }
  expect(codes.slice(0, 20)).not.toContain(429);
  expect(codes[20]).toBe(429);
});
