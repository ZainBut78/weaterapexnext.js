// ─────────────────────────────────────────────────────────────
//  OTP screens (Nov 2026): timer, resend, refresh, ghalat code, email fail, unverified login
//  Backend mock — koi asal email / account nahi.
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';

const sent = { message: 'OTP sent', email: 'new@example.com', retry_after: 60, expires_in: 600 };

async function reachOtpScreen(page, body = sent) {
  await page.route('**/api/auth/register/**', (r) => r.fulfill({ status: 201, json: body }));
  await page.goto('/signup');
  await page.locator('input[type="email"]').fill('new@example.com');
  await page.locator('input[type="password"]').fill('Str0ngPassw0rd!');
  await page.locator('form button[type="submit"]').first().click();
  await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible();
}

test('first send: masked email, one minute resend timer, code expiry, autofocus', async ({ page }) => {
  await reachOtpScreen(page);
  await expect(page.getByText('n***@example.com')).toBeVisible();
  await expect(page.getByRole('button', { name: /Resend code in 00:(60|59|58|57|56|55)|Resend code in 01:00/ })).toBeDisabled();
  await expect(page.getByText(/Code expires in (10:00|09:5\d)/)).toBeVisible();
  await expect(page.getByLabel('Digit 1 of 6')).toBeFocused();
});

test('timer survives a refresh (same end time)', async ({ page }) => {
  await reachOtpScreen(page);
  const stored = () => page.evaluate(() => sessionStorage.getItem('otp_session:signup'));
  const before = await stored();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Resend code in/ })).toBeDisabled();
  expect(await stored()).toBe(before);
});

test('resend: enabled at 0, one request on double click, timer restarts from the server', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/auth/resend-otp/**', async (r) => {
    calls += 1;
    await new Promise((done) => setTimeout(done, 300));
    await r.fulfill({ json: { ...sent, retry_after: 60 } });
  });
  await reachOtpScreen(page, { ...sent, retry_after: 2 });
  const resend = page.getByRole('button', { name: 'Resend code', exact: true });
  await expect(resend).toBeEnabled({ timeout: 5000 });
  await resend.dblclick();
  await expect(page.getByRole('button', { name: /Resend code in 00:5\d|Resend code in 01:00/ })).toBeDisabled();
  expect(calls).toBe(1);
});

test('resend too early: 429 moves the countdown to the server value', async ({ page }) => {
  await page.route('**/api/auth/resend-otp/**', (r) => r.fulfill({
    status: 429, headers: { 'Retry-After': '45' }, json: { error: 'Too many attempts.', code: 'otp_cooldown', retry_after: 45 },
  }));
  await reachOtpScreen(page, { ...sent, retry_after: 1 });
  await page.getByRole('button', { name: 'Resend code', exact: true }).click();
  await expect(page.getByRole('button', { name: /Resend code in 00:4\d/ })).toBeDisabled();
  await expect(page.getByText(/try again in 1 minute/)).toBeVisible();
});

test('wrong code shows attempts left', async ({ page }) => {
  await page.route('**/api/auth/verify-otp/**', (r) => r.fulfill({
    status: 400, json: { error: 'Wrong code. 4 attempts left.', code: 'otp_invalid', attempts_left: 4, params: { count: 4 } },
  }));
  await reachOtpScreen(page);
  await page.getByLabel('Digit 1 of 6').focus();
  await page.keyboard.type('000000');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Wrong code. 4 attempts left.')).toBeVisible();
});

test('email service down after the send: the screen says so', async ({ page }) => {
  await page.route('**/api/auth/email-status/**', (r) => r.fulfill({ json: { ok: false } }));
  await reachOtpScreen(page);
  await expect(page.getByRole('alert').filter({ hasText: "couldn't send the email" })).toBeVisible({ timeout: 6000 });
});

test('unverified login goes to the code screen with a fresh code', async ({ page }) => {
  await page.route('**/api/auth/login/**', (r) => r.fulfill({
    status: 403, json: { error: 'Account not verified.', code: 'account_not_verified', email: 'new@example.com' },
  }));
  await page.route('**/api/auth/resend-otp/**', (r) => r.fulfill({ json: sent }));
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill('new@example.com');
  await page.locator('input[type="password"]').fill('Str0ngPassw0rd!');
  await page.locator('form button[type="submit"]').first().click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible();
  await expect(page.getByText('n***@example.com')).toBeVisible();
});

test('reset link: new password, token leaves the URL; bad link asks for a new one', async ({ page }) => {
  const token = 'a'.repeat(64);
  let body;
  await page.route('**/api/auth/reset-password/**', async (r) => {
    body = r.request().postDataJSON();
    await r.fulfill({ json: { message: 'ok' } });
  });
  await page.goto(`/reset-password?token=${token}`);
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.getByLabel('New password').fill('Rainy-Night-2026!');
  await page.getByRole('button', { name: 'Set new password' }).click();
  await expect(page.getByRole('heading', { name: 'Password updated' })).toBeVisible();
  expect(body).toEqual({ token, new_password: 'Rainy-Night-2026!' });

  await page.goto('/reset-password?token=bad');
  await expect(page.getByRole('heading', { name: 'Link not valid' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Request a new link' })).toHaveAttribute('href', '/forgot-password');
});
