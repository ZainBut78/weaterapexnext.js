// ─────────────────────────────────────────────────────────────
//  Security fix round 3 (Oct 2026) — headers, X-Powered-By, IP debug route,
//  /api/places/open ki per-IP hadd jhooti X-Forwarded-For se bypass nahi.
//  IP debug test ke liye server ko REVALIDATE_SECRET chahiye (env), warna skip.
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

test('ip-debug route hidden without the secret', async ({ request }) => {
  expect((await request.get('/api/places/ip-debug')).status()).toBe(404);
  expect((await request.get('/api/places/ip-debug', { headers: { Authorization: 'Bearer wrong' } })).status()).toBe(404);
});

test('ip-debug with secret shows only header names + masked IPs', async ({ request }) => {
  const secret = process.env.REVALIDATE_SECRET;
  test.skip(!secret, 'REVALIDATE_SECRET set nahi (server + test dono mein chahiye)');
  const res = await request.get('/api/places/ip-debug', {
    headers: { Authorization: `Bearer ${secret}`, 'x-forwarded-for': '6.6.6.6, 203.0.113.7' },
  });
  expect(res.status()).toBe(200);
  const j = await res.json();
  expect(j.candidates['xff-right-public']).toBe('203.0.x.x');
  expect(j.current_pick).toBe('203.0.x.x');
  expect(JSON.stringify(j)).not.toContain('203.0.113.7');                   // poori IP kabhi nahi
  expect(JSON.stringify(j)).not.toContain(secret);
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
