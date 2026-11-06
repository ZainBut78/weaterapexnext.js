// ─────────────────────────────────────────────────────────────
//  Website ka data BFF (/api/site) se (Nov 2026). Asli local Django, koi mock nahi
//  (sivaye daily limit UI ke). Flag ON ke saath chalana:
//    SITE_API_REQUIRE_INTERNAL_KEY=True manage.py runserver 8000
//    PW_EXPECT_GATE=1 npm run test:e2e -- site-bff
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';
import { blockThirdParty } from './helpers.mjs';

const DJANGO = 'http://127.0.0.1:8000/api';

// Page par API calls ginte hain: data sirf /api/site se, koi 403 nahi
function watchApi(page) {
  const calls = [];
  page.on('response', (res) => {
    const { pathname } = new URL(res.url());
    if (pathname.includes('/api/')) calls.push({ pathname, status: res.status() });
  });
  return calls;
}

function expectClean(calls) {
  const direct = calls.filter((c) => /\/api\/(weather|trips|events|blog)\//.test(c.pathname));
  expect(direct, 'browser ne website endpoint seedha bulaya').toEqual([]);
  expect(calls.filter((c) => c.status === 403), '403 mila').toEqual([]);
}

test('gate is on locally when asked', async ({ request }) => {
  test.skip(!process.env.PW_EXPECT_GATE, 'sirf flag ON ke saath');
  const direct = await request.get(`${DJANGO}/weather/current/?city=london`);
  expect(direct.status()).toBe(403);
  expect((await direct.json()).code).toBe('site_api_private');
  const viaBff = await request.get('/api/site/weather/current/?city=london');
  expect(viaBff.status()).toBe(200);
  expect((await viaBff.json()).city).toBe('London');
});

for (const [name, path, heading] of [
  ['home', '/', /Weather Forecasts/],
  ['city page', '/weather/united-kingdom/london', /London Weather/],
  ['month page', '/weather/united-kingdom/london/january', /London Weather in January/],
]) {
  test(`${name}: renders, data goes through the BFF`, async ({ page }) => {
    await blockThirdParty(page);
    const calls = watchApi(page);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await page.waitForLoadState('networkidle').catch(() => {});
    expectClean(calls);
  });
}

test('home: weather cards load through the BFF', async ({ page }) => {
  await blockThirdParty(page);
  const calls = watchApi(page);
  await page.goto('/');
  await page.getByText(/Popular Destinations/i).first().scrollIntoViewIfNeeded().catch(() => {});
  await expect.poll(() => calls.filter((c) => c.pathname.startsWith('/api/site/weather/current')).length, { timeout: 20000 }).toBeGreaterThan(0);
  expect(calls.filter((c) => c.pathname.startsWith('/api/site/') && c.status >= 400)).toEqual([]);
  expectClean(calls);
});

test('trip planner: city search and plan go through the BFF', async ({ page, request }) => {
  await blockThirdParty(page);
  const calls = watchApi(page);
  await page.goto('/trip-planner');
  const box = page.getByRole('combobox').or(page.getByPlaceholder(/city/i)).first();
  await box.fill('Lond');
  await expect.poll(() => calls.filter((c) => c.pathname.startsWith('/api/site/trips/plan/cities/search')).length, { timeout: 10000 }).toBeGreaterThan(0);
  expectClean(calls);
  // Backend tak pohanchta hai, aur validation Django ki hi hai
  // (3-free/din is IP par pehle hi khatam ho sakte hain — woh bhi Django ka jawab hai)
  const bad = await request.get('/api/site/trips/plan/?city=paris&start=x&end=y');
  expect(['invalid_date', 'free_limit_reached']).toContain((await bad.json()).code);
  const risk = await request.get('/api/site/events/risk/?city=paris&date=x&type=wedding');
  expect(risk.status()).toBeLessThan(500);
  expect(risk.status()).not.toBe(403);
});

test('login: wrong password gets the real backend answer', async ({ page }) => {
  await blockThirdParty(page);
  const calls = watchApi(page);
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(`nobody-${Date.now()}@example.com`);
  await page.getByPlaceholder('Enter your password').fill('Wrong-Pass-2026!');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Invalid email/username or password')).toBeVisible();
  expect(calls.filter((c) => c.status === 403)).toEqual([]);
});

test('forgot password: request works, timer starts', async ({ page }) => {
  await blockThirdParty(page);
  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill(`nobody-${Date.now()}@example.com`);
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByText(/If an account exists for/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Resend code in/ })).toBeDisabled();
});

test('signup: form reaches the backend, OTP endpoints stay public', async ({ request }) => {
  const email = `nobody-${Date.now()}@example.com`;
  const resend = await request.post('/api/auth/resend-otp/', { data: { email } });
  expect(resend.status()).toBe(200);
  expect((await resend.json()).retry_after).toBe(60);
  const verify = await request.post('/api/auth/verify-otp/', { data: { email, otp: '000000' } });
  expect(verify.status()).toBe(400);
  expect((await request.get('/api/auth/email-status/')).status()).toBe(200);
});

test('BFF refuses anything off the whitelist', async ({ request }) => {
  for (const path of ['auth/login/', 'weather/cities/', 'blog/posts/', 'weather/places/open/', 'admin/']) {
    expect((await request.get(`/api/site/${path}`)).status(), path).toBe(404);
  }
});

test('logged-in daily limit: friendly notice with a link to plans', async ({ page }) => {
  await blockThirdParty(page);
  await page.route('**/api/site/weather/current/**', (r) => r.fulfill({
    status: 429,
    headers: { 'Retry-After': '3600' },
    json: { code: 'user_daily_limit', error: 'limit', limit: 20, used: 20, feature: 'event_risk', upgrade_url: '/pricing', retry_after: 3600 },
  }));
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: /today's 20 checks/ })).toBeVisible({ timeout: 20000 });
  await expect(dialog.getByRole('link', { name: 'See plans' })).toHaveAttribute('href', '/pricing');
  await expect(dialog.getByRole('link', { name: 'Create free account' })).toHaveCount(0);
});
