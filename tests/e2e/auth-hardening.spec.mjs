// ─────────────────────────────────────────────────────────────
//  Auth hardening (Oct 2026) — 429 par saaf message + forgot-password page
//  Backend ke jawab MOCK (browser calls) — koi asal login / email nahi.
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';
import { blockThirdParty } from './helpers.mjs';

const tooMany = (secs, code = 'rate_limited') => ({
  status: 429,
  headers: { 'Retry-After': String(secs) },
  json: { error: 'Too many attempts.', code, retry_after: secs },
});

test('login: 429 shows "try again in X minutes"', async ({ page }) => {
  await blockThirdParty(page);
  await page.route('**/api/auth/login/', (r) => r.fulfill(tooMany(900, 'login_locked')));
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill('zain@example.com');
  await page.getByPlaceholder('Enter your password').fill('whatever123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Too many attempts, try again in 15 minutes.')).toBeVisible();
});

test('login: other errors unchanged', async ({ page }) => {
  await blockThirdParty(page);
  await page.route('**/api/auth/login/', (r) => r.fulfill({ status: 401, json: { error: 'Invalid email/username or password' } }));
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill('zain@example.com');
  await page.getByPlaceholder('Enter your password').fill('whatever123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Invalid email/username or password')).toBeVisible();
});

test('signup: 429 shows the friendly message', async ({ page }) => {
  await blockThirdParty(page);
  await page.route('**/api/auth/register/', (r) => r.fulfill(tooMany(45, 'otp_cooldown')));
  await page.goto('/signup');
  await page.getByPlaceholder('you@example.com').fill('new@example.com');
  await page.getByPlaceholder('Create a password (min 8 chars)').fill('Sunny-Day-2026!');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page.getByText('Too many attempts, try again in 1 minute.')).toBeVisible();
});

test('"Forgot password?" goes to the reset page, which is noindex', async ({ page }) => {
  await blockThirdParty(page);
  await page.goto('/login');
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(robots).toContain('noindex');
});

test('forgot password: email → code + new password → done', async ({ page }) => {
  await blockThirdParty(page);
  const bodies = {};
  await page.route('**/api/auth/forgot-password/', async (r) => {
    bodies.forgot = r.request().postDataJSON();
    await r.fulfill({ json: { message: 'If this email exists, an OTP has been sent.' } });
  });
  await page.route('**/api/auth/reset-password/', async (r) => {
    bodies.reset = r.request().postDataJSON();
    await r.fulfill({ json: { message: 'Password reset successful. Please login.' } });
  });
  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill('zain@example.com');
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByText(/If an account exists for/)).toBeVisible();
  await page.getByLabel('6-digit code').fill('123456');
  await page.getByLabel('New password').fill('Rainy-Night-2026!');
  await page.getByRole('button', { name: 'Set new password' }).click();
  await expect(page.getByRole('heading', { name: 'Password updated' })).toBeVisible();
  expect(bodies).toEqual({
    forgot: { email: 'zain@example.com' },
    reset: { email: 'zain@example.com', otp: '123456', new_password: 'Rainy-Night-2026!' },
  });
  await page.getByRole('link', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('forgot password: cooldown 429 shows the friendly message', async ({ page }) => {
  await blockThirdParty(page);
  await page.route('**/api/auth/forgot-password/', (r) => r.fulfill(tooMany(50, 'otp_cooldown')));
  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill('zain@example.com');
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByText('Too many attempts, try again in 1 minute.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send code' })).toBeVisible();   // pehle qadam par hi
});
