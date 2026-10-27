// ─────────────────────────────────────────────────────────────
//  /api/revalidate secret (security round 4, Oct 2026): header naya tareeqa,
//  purana ?secret= deploy ke beech abhi bhi chale. Server ko REVALIDATE_SECRET
//  chahiye (env, server + test dono mein), warna skip.
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';

const secret = process.env.REVALIDATE_SECRET;
const body = { paths: ['/blog'] };

test('revalidate: wrong / missing secret → 401', async ({ request }) => {
  expect((await request.post('/api/revalidate', { data: body })).status()).toBe(401);
  expect((await request.post('/api/revalidate', { data: body, headers: { Authorization: 'Bearer wrong' } })).status()).toBe(401);
  expect((await request.post('/api/revalidate?secret=wrong', { data: body })).status()).toBe(401);
});

test('revalidate: Authorization header works', async ({ request }) => {
  test.skip(!secret, 'REVALIDATE_SECRET set nahi');
  const r = await request.post('/api/revalidate', { data: body, headers: { Authorization: `Bearer ${secret}` } });
  expect(r.status()).toBe(200);
  expect((await r.json()).revalidated).toBe(true);
});

test('revalidate: old ?secret= query still accepted (deploy transition)', async ({ request }) => {
  test.skip(!secret, 'REVALIDATE_SECRET set nahi');
  const r = await request.post(`/api/revalidate?secret=${encodeURIComponent(secret)}`, { data: body });
  expect(r.status()).toBe(200);
  expect((await r.json()).revalidated).toBe(true);
});
