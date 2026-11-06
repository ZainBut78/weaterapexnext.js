// ─────────────────────────────────────────────────────────────
//  localStorage mein expire JWT (Nov 2026): forgot password, signup aur resend chalte rahen,
//  navbar logged-in na dikhaye. Live bug: "Could not send the code".
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';
import { blockThirdParty } from './helpers.mjs';

const jwt = (exp) => `h.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.s`;
const nowS = () => Math.floor(Date.now() / 1000);

// Sirf pehli dafa: baad ki navigation par wapas na bhare
async function seedTokens(page, { access, refresh }) {
  await page.addInitScript(({ access: a, refresh: r }) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('access_token', a);
    if (r) localStorage.setItem('refresh_token', r);
    localStorage.setItem('username', 'stale-user');
  }, { access, refresh });
}

const sent = { message: 'OTP sent', email: 'new@example.com', retry_after: 1, expires_in: 600 };

test.beforeEach(async ({ page }) => {
  await blockThirdParty(page);
  await seedTokens(page, { access: jwt(nowS() - 3600), refresh: jwt(nowS() - 60) });
});

test('forgot password reaches the code screen, without the stale header', async ({ page }) => {
  const headers = [];
  await page.route('**/api/auth/forgot-password/**', (r) => {
    headers.push(r.request().headers().authorization);
    return r.fulfill({ json: { message: 'If this email exists, an OTP has been sent.', retry_after: 60, expires_in: 600 } });
  });
  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill(`nobody-${Date.now()}@example.com`);
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByText(/If an account exists for/)).toBeVisible();
  await expect(page.getByLabel('6-digit code')).toBeVisible();
  expect(headers).toEqual([undefined]);
});

test('signup reaches the OTP screen and resend works, no stale header', async ({ page }) => {
  const headers = [];
  await page.route('**/api/auth/register/**', (r) => {
    headers.push(r.request().headers().authorization);
    return r.fulfill({ status: 201, json: sent });
  });
  await page.route('**/api/auth/resend-otp/**', (r) => {
    headers.push(r.request().headers().authorization);
    return r.fulfill({ json: { ...sent, retry_after: 60 } });
  });
  await page.goto('/signup');
  await page.locator('input[type="email"]').fill('new@example.com');
  await page.locator('input[type="password"]').fill('Str0ngPassw0rd!');
  await page.locator('form button[type="submit"]').first().click();
  await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible();
  const resend = page.getByRole('button', { name: 'Resend code', exact: true });
  await expect(resend).toBeEnabled({ timeout: 5000 });
  await resend.click();
  await expect(page.getByRole('button', { name: /Resend code in/ })).toBeDisabled();
  expect(headers).toEqual([undefined, undefined]);
});

test('navbar: dead tokens are cleared and the user is not shown as logged in', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByText('stale-user')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible();
  const left = await page.evaluate(() => ['access_token', 'refresh_token', 'username'].map((k) => localStorage.getItem(k)));
  expect(left).toEqual([null, null, null]);
});
