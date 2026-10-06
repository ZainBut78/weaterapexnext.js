// ─────────────────────────────────────────────────────────────
//  WeatherApex end-to-end tests (Group 4). Mobile 390px + desktop 1440px.
//  Browser ki weather calls MOCK (helpers.mjs); server-side pages (blog,
//  city) asli backend se.
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';
import { mockCurrentWeather, blockThirdParty, collectErrors } from './helpers.mjs';

const MOBILE = { width: 390, height: 844 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1440, height: 900 };

test.beforeEach(async ({ page }) => {
  await blockThirdParty(page);
});

// ── Landing ──────────────────────────────────────────────────
test('landing page loads with weather data', async ({ page }) => {
  await mockCurrentWeather(page);
  await page.goto('/');
  await expect(page.getByText(/• London, United Kingdom/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Long-range Forecast' })).toBeVisible();
  await expect(page.getByText('TODAY').first()).toBeAttached();
  await expect(page.locator('h1')).toHaveCount(1);
});

test('Popular Destinations card click switches the city', async ({ page }) => {
  await mockCurrentWeather(page);
  await page.goto('/');
  await expect(page.getByText(/• London, United Kingdom/)).toBeVisible();
  await page.getByRole('button', { name: /Show weather for Tokyo/ }).click();
  await expect(page.getByText(/• Tokyo, Testland/)).toBeVisible();
  await expect(page).toHaveURL(/\/$/); // page wahi rehta hai
  expect(await page.evaluate(() => localStorage.getItem('weatherApex_city'))).toBe('tokyo');
});

test('Popular Destinations "Climate guide" link opens the city page', async ({ page }) => {
  await mockCurrentWeather(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Show weather for Paris/ }).getByRole('link', { name: /Climate guide/ }).click();
  await expect(page).toHaveURL(/\/weather\/paris$/);
  await expect(page.locator('h1')).toHaveText(/Paris Climate & Weather Guide/);
});

test('Popular Destinations: failed city shows "—" and no weather icon', async ({ page }) => {
  await mockCurrentWeather(page, { fail: (c) => (c === 'paris' ? 500 : 0) });
  await page.goto('/');
  const card = page.getByRole('button', { name: /Show weather for Paris/ });
  await expect(card).toContainText('—', { timeout: 20_000 });
  await expect(card.locator('img[src*="meteocons"]')).toHaveCount(0);
  // doosre card normal
  await expect(page.getByRole('button', { name: /Show weather for London/ }).locator('img[src*="meteocons"]')).toHaveCount(1);
});

test('search switches the city', async ({ page }) => {
  const calls = await mockCurrentWeather(page);
  await page.setViewportSize(DESKTOP);
  await page.goto('/');
  await expect(page.getByText(/• London, United Kingdom/)).toBeVisible();
  const search = page.getByPlaceholder('Search city or zip code').first();
  await search.fill('Tokyo');
  await search.press('Enter');
  await expect(page.getByText(/• Tokyo, Testland/)).toBeVisible();
  expect(calls).toContain('tokyo');
});

test('mobile menu opens and closes', async ({ page }) => {
  await mockCurrentWeather(page);
  await page.setViewportSize(MOBILE);
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.locator('#mobile-menu')).toBeVisible();
  await page.getByRole('button', { name: 'Close menu' }).click();
  await expect(page.locator('#mobile-menu')).toHaveCount(0);
});

// ── Units (audit 3.2) ────────────────────────────────────────
test.describe('°C / °F', () => {
  test.use({ locale: 'en-US' });
  test('en-US defaults to °F + mph, toggle remembers °C', async ({ page }) => {
    await mockCurrentWeather(page);
    await page.goto('/');
    const group = page.getByRole('group', { name: 'Temperature unit' });
    await expect(group.getByRole('button', { name: 'Show Fahrenheit' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/\d+mph/).first()).toBeVisible();
    await group.getByRole('button', { name: 'Show Celsius' }).click();
    await expect(page.getByText(/\d+km\/h/).first()).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Show Celsius' })).toHaveAttribute('aria-pressed', 'true');
  });
});

// ── Free-limit modal ─────────────────────────────────────────
test('free-limit modal appears on a mocked 429', async ({ page }) => {
  await mockCurrentWeather(page, { status429: true });
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  await expect(dialog.getByRole('link', { name: /sign up|create/i }).first()).toBeVisible();
});

// ── Auth forms ───────────────────────────────────────────────
test('sign-in form validation blocks empty submit, shows server error', async ({ page }) => {
  let loginCalls = 0;
  await page.route('**/api/auth/login/**', (r) => {
    loginCalls++;
    return r.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"Invalid email or password."}' });
  });
  await page.goto('/login');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  const email = page.getByPlaceholder('you@example.com');
  expect(await email.evaluate((el) => el.validity.valueMissing)).toBe(true);
  expect(loginCalls).toBe(0);
  await email.fill('test@example.com');
  await page.getByPlaceholder('Enter your password').fill('wrong-password');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByText('Invalid email or password.')).toBeVisible();
  expect(loginCalls).toBe(1);
});

test('sign-up OTP: pasting a 6-digit code fills all boxes', async ({ page }) => {
  await page.route('**/api/auth/register/**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"message":"OTP sent"}' }));
  await page.goto('/signup');
  await page.locator('input[type="email"]').fill('new@example.com');
  await page.locator('input[type="password"]').fill('Str0ngPassw0rd!');
  const company = page.locator('input[type="text"]').first();
  if (await company.count()) await company.fill('Test Co');
  await page.locator('form button[type="submit"]').first().click();
  const boxes = page.locator('input[inputmode="numeric"]');
  await expect(boxes).toHaveCount(6);
  await boxes.first().focus();
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.setData('text', '123456');
    document.activeElement.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  for (let i = 0; i < 6; i++) await expect(boxes.nth(i)).toHaveValue(String(i + 1));
  await expect(page.locator('form button[type="submit"]').first()).toBeEnabled();
});

// ── Blog + 404 (server-rendered, asli backend) ───────────────
test('blog list → post', async ({ page }) => {
  await page.goto('/blog');
  // Naya backend (beta) par shuru mein 0 posts — tab test skip, fail nahi
  test.skip((await page.locator('a[href^="/blog/"]').count()) === 0, 'backend par koi published blog post nahi');
  const first = page.locator('a[href^="/blog/"]').first();
  const href = await first.getAttribute('href');
  await first.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('link', { name: /Back to Blog/ })).toBeVisible();
});

test('404 page returns HTTP 404', async ({ page }) => {
  const res = await page.goto('/koi-ghalat-page');
  expect(res.status()).toBe(404);
  await expect(page.getByText('This page drifted off the map')).toBeVisible();
});

// ── CLS (audit 1.2): 1.5 s API delay ─────────────────────────
for (const vp of [MOBILE, DESKTOP]) {
  test(`home CLS < 0.1 at ${vp.width}px with 1.5 s API delay`, async ({ page }) => {
    await mockCurrentWeather(page, { delay: 1500 });
    await page.setViewportSize(vp);
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('/');
    await expect(page.getByText(/• London, United Kingdom/)).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(3000);
    const cls = await page.evaluate(() => window.__cls);
    console.log(`CLS @${vp.width}px = ${cls.toFixed(4)}`);
    expect(cls).toBeLessThan(0.1);
  });
}

// ── Har page: console errors nahi, horizontal scroll nahi ───
// Section 2 (Phase C2) pages: sirf aise shehar jin ka 20-saal data local DB
// mein mukammal hai (warna backend Open-Meteo se data mangwata hai)
const SECTION2 = ['/weather', '/weather/united-kingdom', '/weather/united-kingdom/london',
  '/weather/united-kingdom/london/october', '/weather/singapore/singapore', '/weather/japan/tokyo/april'];

const ROUTES = ['/', '/trip-planner', '/events', '/climate-guides', '/blog', '/api-docs', '/about',
  '/terms', '/privacy', '/pricing', '/login', '/signup', '/weather/london', ...SECTION2];

for (const vp of [MOBILE, TABLET, DESKTOP]) {
  test(`no console errors and no horizontal scroll at ${vp.width}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await mockCurrentWeather(page);
    await page.setViewportSize(vp);
    const errors = collectErrors(page);
    const overflow = [];
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle').catch(() => {});
      const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (o > 0) overflow.push(`${route} (+${o}px)`);
    }
    expect(overflow, 'horizontal overflow').toEqual([]);
    expect(errors, 'console errors').toEqual([]);
  });
}

// ── Trip Planner day cards (audit N3, option 2) ──────────────
const part = (temp, rain, wind) => ({ temp, rain_probability: rain, wind_kmh: wind });
function tripFixture(start) {
  const iso = (i) => { const d = new Date(start); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10); };
  const days = [
    { score: 9.3, rain_probability: 5, wind_kmh: 14, temp_max: 26, temp_min: 19, weather_code: 1, recommended_activity: 'beach_water',
      day_parts: { morning: part(21, 5, 10), afternoon: part(26, 5, 16), evening: part(22, 5, 12) } },
    { score: 4.1, rain_probability: 80, wind_kmh: 22, temp_max: 19, temp_min: 14, weather_code: 63, recommended_activity: 'indoor_museum',
      day_parts: { morning: part(15, 90, 20), afternoon: part(18, 85, 24), evening: part(16, 40, 18) } },
    { score: 8.0, rain_probability: 10, wind_kmh: 12, temp_max: 35, temp_min: 24, weather_code: 0, recommended_activity: 'indoor_midday',
      day_parts: { morning: part(27, 5, 8), afternoon: part(35, 10, 12), evening: part(30, 5, 9) } },
    { score: 6.2, rain_probability: 25, wind_kmh: 42, temp_max: 22, temp_min: 15, weather_code: 3, recommended_activity: 'indoor_sheltered',
      day_parts: { morning: part(17, 20, 45), afternoon: part(22, 25, 40), evening: part(19, 30, 28) } },
    { score: 7.4, rain_probability: 15, wind_kmh: 18, temp_max: 9, temp_min: 2, weather_code: 2, recommended_activity: 'city_sightseeing',
      day_parts: { morning: part(3, 10, 15), afternoon: part(9, 15, 18), evening: part(5, 15, 14) } },
  ].map((d, i) => ({ ...d, date: iso(i), affiliate_products: [] }));
  return { city: 'Barcelona', country: 'Spain', image_url: null, overall_score: 7.0, note: null,
    best_day: days[0].date, worst_day: days[1].date, days };
}

for (const vp of [MOBILE, DESKTOP]) {
  test(`Trip Planner day cards render (option 2) at ${vp.width}px`, async ({ page }, testInfo) => {
    const start = new Date(Date.now() + 2 * 86400000);
    const fx = tripFixture(start.toISOString().slice(0, 10));
    await page.route('**/api/trips/plan/cities/search/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route(/\/api\/trips\/plan\/\?/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fx) }));
    await page.setViewportSize(vp);
    await page.goto('/trip-planner');
    await page.getByPlaceholder(/e\.g\. London/).fill('Barcelona');
    await page.getByPlaceholder(/e\.g\. London/).press('Escape');
    // Tareekhein ab "16 din" chips se (UX fixes C) — date inputs nahi
    const chip = (iso) => page.getByRole('button', {
      name: new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }),
    });
    await chip(fx.days[0].date).click();
    await chip(fx.days[4].date).click();
    await page.getByRole('button', { name: 'Plan Trip' }).click();

    await expect(page.getByText('Day score (out of 10):')).toBeVisible();
    const cardsBlock = page.getByText('Day score (out of 10):').locator('xpath=../..');
    await expect(cardsBlock.getByText('/ 10')).toHaveCount(5);
    for (const w of ['Excellent', 'Poor', 'Good', 'Fair']) await expect(page.getByText(w, { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Least ideal').first()).toBeVisible();
    await expect(page.getByText('Best for:').first()).toBeVisible();
    await expect(page.getByText('Best time:').first()).toBeVisible();
    // takraav nahi: museum din par barish ki wajah
    await expect(page.getByText('80% chance of rain — indoor plans are the safest bet.', { exact: false })).toBeVisible();
    // kacchi tareekh (YYYY-MM-DD) kahin nahi
    expect(await page.locator('body').innerText()).not.toMatch(/\b20\d\d-\d\d-\d\d\b/);
    const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(o).toBeLessThanOrEqual(0);
    await page.screenshot({ path: testInfo.outputPath(`trip-cards-${vp.width}.png`), fullPage: true });
  });
}

// ── Phase C2: Section 2 pages — CLS, 1 H1, Section 1 ↔ 2 links ─
for (const vp of [MOBILE, TABLET, DESKTOP]) {
  test(`Section 2 pages: CLS < 0.1 at ${vp.width}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(vp);
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
        .observe({ type: 'layout-shift', buffered: true });
    });
    const bad = [];
    for (const route of SECTION2) {
      await page.goto(route);
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(800);
      const cls = await page.evaluate(() => window.__cls);
      const h1 = await page.locator('h1').count();
      if (cls >= 0.1 || h1 !== 1) bad.push(`${route} cls=${cls.toFixed(3)} h1=${h1}`);
    }
    expect(bad).toEqual([]);
  });
}

test('Section 1 ↔ Section 2 links both ways', async ({ page }) => {
  await page.goto('/weather/london');
  await page.getByRole('link', { name: /See London weather month by month/ }).click();
  await expect(page).toHaveURL((u) => u.pathname === '/weather/united-kingdom/london');
  await expect(page.locator('h1')).toHaveText('London Weather by Month');
  await page.getByRole('link', { name: /Full 20-year climate guide for London/ }).click();
  await expect(page).toHaveURL((u) => u.pathname === '/weather/london');
});

test('month page: table rows and chips link to other months', async ({ page }) => {
  await page.goto('/weather/united-kingdom/london/october');
  await expect(page.locator('h1')).toHaveText('London Weather in October');
  await page.getByRole('row').filter({ hasText: 'November' }).getByRole('link', { name: 'November' }).click();
  await expect(page).toHaveURL((u) => u.pathname === '/weather/united-kingdom/london/november');
  await expect(page.locator('h1')).toHaveText('London Weather in November');
});

test('1-city country redirects to its city in one hop; Singapore has no loop', async ({ page }) => {
  const r = await page.goto('/weather/hungary');
  expect(new URL(page.url()).pathname).toBe('/weather/hungary/budapest');
  expect(r.status()).toBe(200);
  const s1 = await page.goto('/weather/singapore');
  expect(s1.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe('/weather/singapore');
});
