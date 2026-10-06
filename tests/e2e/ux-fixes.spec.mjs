// ─────────────────────────────────────────────────────────────
//  UX fixes (Oct 2026): A) mobile search hamesha nazar, B) spelling
//  madad ("Did you mean"), C) trip planner sirf forecast ke din.
//  Browser ki API calls MOCK (helpers.mjs) — backend ko nahi maarte.
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';
import { mockCurrentWeather, blockThirdParty } from './helpers.mjs';

const PHONE = { width: 375, height: 812 };
const DESKTOP = { width: 1440, height: 900 };

test.beforeEach(async ({ page }) => {
  await blockThirdParty(page);
});

/** Suggestions API ka mock — har call gin'ta hai */
async function mockCitySearch(page, results = []) {
  const calls = [];
  await page.route('**/api/trips/plan/cities/search/**', (route) => {
    calls.push(new URL(route.request().url()).searchParams.get('q'));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results }) });
  });
  return calls;
}

const mobileSearch = (page) => page.locator('header .lg\\:hidden input[role="combobox"]');

// ── A: mobile search ─────────────────────────────────────────
for (const path of ['/', '/blog', '/trip-planner']) {
  test(`mobile: search visible without opening the menu, no layout shift (${path})`, async ({ page }) => {
    await mockCurrentWeather(page);
    await mockCitySearch(page);
    await page.setViewportSize(PHONE);
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(path);
    const input = mobileSearch(page);
    await expect(input).toBeVisible();
    await expect(page.locator('#mobile-menu')).toHaveCount(0);
    const box = await input.boundingBox();
    expect(box.y).toBeLessThan(120); // logo line ke foran neeche
    expect(box.height).toBeGreaterThanOrEqual(44); // tap target
    await expect(input).toHaveAttribute('inputmode', 'search');
    await expect(input).toHaveAttribute('enterkeyhint', 'search');
    await expect(input).toHaveAttribute('autocomplete', 'off');
    await expect(input).toHaveAttribute('aria-label', /search city/i);
    // Search row header ke andar server HTML mein hi hai → us ki wajah se shift nahi
    const headerShift = await page.evaluate(() => window.__cls);
    expect(headerShift).toBeLessThan(0.1);
  });
}

test('mobile: search is no longer inside the ☰ menu', async ({ page }) => {
  await mockCurrentWeather(page);
  await page.setViewportSize(PHONE);
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.locator('#mobile-menu')).toBeVisible();
  await expect(page.locator('#mobile-menu input')).toHaveCount(0);
  await expect(page.locator('#mobile-menu').getByRole('link', { name: 'Trip Planner' })).toBeVisible();
});

test('mobile: Enter searches, clears and blurs the input', async ({ page }) => {
  const calls = await mockCurrentWeather(page);
  await mockCitySearch(page);
  await page.setViewportSize(PHONE);
  await page.goto('/');
  await expect(page.getByText(/• London, United Kingdom/)).toBeVisible();
  const input = mobileSearch(page);
  await input.fill('Tokyo');
  await input.press('Enter');
  await expect(page.getByText(/• Tokyo, Testland/)).toBeVisible();
  expect(calls).toContain('tokyo');
  await expect(input).toHaveValue('');
  expect(await input.evaluate((el) => el === document.activeElement)).toBe(false);
});

// ── B: spelling help ─────────────────────────────────────────
const TYPOS = [
  ['barcelna', 'Barcelona'],
  ['Pheonix', 'Phoenix'],
  ['new yrok', 'New York'],
  ['zurich', 'Zurich'],
  ['zürich', 'Zurich'],
];
for (const [typed, expected] of TYPOS) {
  test(`mobile typeahead: "${typed}" suggests ${expected}`, async ({ page }) => {
    await mockCurrentWeather(page);
    await mockCitySearch(page);
    await page.setViewportSize(PHONE);
    await page.goto('/');
    const input = mobileSearch(page);
    await input.fill(typed);
    const option = page.getByRole('option', { name: new RegExp(`^.*${expected}`) }).first();
    await expect(option).toBeVisible();
  });
}

test('typing "barcelona" quickly makes at most 2 suggestion calls', async ({ page }) => {
  await mockCurrentWeather(page);
  const calls = await mockCitySearch(page);
  await page.setViewportSize(DESKTOP);
  await page.goto('/');
  const input = page.locator('header input[role="combobox"]').first();
  await input.click();
  await input.pressSequentially('barcelona', { delay: 60 });
  await expect(page.getByRole('option', { name: /Barcelona/ }).first()).toBeVisible();
  await page.waitForTimeout(800);
  expect(calls.length).toBeLessThanOrEqual(2);
  expect(calls.length).toBeGreaterThanOrEqual(1);
});

test('keyboard: ↓ + Enter picks the suggestion, Esc closes the list', async ({ page }) => {
  const calls = await mockCurrentWeather(page);
  await mockCitySearch(page);
  await page.setViewportSize(DESKTOP);
  await page.goto('/');
  const input = page.locator('header input[role="combobox"]').first();
  await input.fill('pheonix');
  await expect(page.getByRole('listbox')).toBeVisible();
  await input.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await input.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', /.+/);
  await input.press('Enter');
  await expect.poll(() => calls).toContain('phoenix');
});

test('home: city not found shows "Did you mean" and the suggestion works', async ({ page }) => {
  const calls = await mockCurrentWeather(page, { fail: (c) => (c === 'barcelna' ? 404 : 0) });
  await mockCitySearch(page);
  await page.setViewportSize(PHONE);
  await page.goto('/');
  const input = mobileSearch(page);
  await input.fill('barcelna');
  await input.press('Enter'); // koi option highlight nahi → jaisa likha waisa search
  await expect(page.getByText(/We couldn.t find .barcelna./)).toBeVisible();
  await page.getByRole('button', { name: 'Barcelona, Spain', exact: true }).click();
  await expect(page.getByText(/• Barcelona, Testland/)).toBeVisible();
  expect(calls).toContain('barcelona');
});

test('home: no close match → spelling hint', async ({ page }) => {
  await mockCurrentWeather(page, { fail: (c) => (c === 'qqzzxx' ? 404 : 0) });
  await mockCitySearch(page);
  await page.setViewportSize(DESKTOP);
  await page.goto('/');
  const input = page.locator('header input[role="combobox"]').first();
  await input.fill('qqzzxx');
  await input.press('Enter');
  await expect(page.getByText('Check the spelling or try a nearby big city.')).toBeVisible();
});

test('search from another page: known city → its city page', async ({ page }) => {
  await mockCitySearch(page);
  await page.setViewportSize(DESKTOP);
  await page.goto('/about');
  const input = page.locator('header input[role="combobox"]').first();
  await input.fill('barcelona');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/weather\/barcelona$/);
});

test('search from another page: other place → home with that city', async ({ page }) => {
  const calls = await mockCurrentWeather(page);
  await mockCitySearch(page);
  await page.setViewportSize(PHONE);
  await page.goto('/about');
  const input = mobileSearch(page);
  await input.fill('Springfield');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(/• Springfield, Testland/)).toBeVisible();
  expect(calls).toContain('springfield');
});

// ── C: trip planner — sirf forecast ke din ───────────────────
const fmtShort = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const chipName = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
const addDays = (iso, n) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// Browser ka window — app jaisa hi hisaab (utils/forecastWindow.js)
const browserWindow = (page) => page.evaluate(() => {
  const n = new Date();
  const pad = (x) => String(x).padStart(2, '0');
  const start = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
  const u = new Date(`${n.toISOString().slice(0, 10)}T00:00:00Z`);
  u.setUTCDate(u.getUTCDate() + 15);
  return { start, end: u.toISOString().slice(0, 10) };
});

const tripDays = (startIso, n) => Array.from({ length: n }, (_, i) => ({
  date: addDays(startIso, i), score: 7, rain_probability: 10, wind_kmh: 10, temp_max: 22, temp_min: 14,
  weather_code: 1, recommended_activity: 'city_sightseeing', affiliate_products: [], day_parts: null,
}));

for (const vp of [PHONE, DESKTOP]) {
  test(`trip planner: only forecast days are pickable, today → today+15 works (${vp.width}px)`, async ({ page }) => {
    await mockCitySearch(page);
    const planCalls = [];
    await page.route(/\/api\/trips\/plan\/\?/, (route) => {
      const u = new URL(route.request().url());
      const start = u.searchParams.get('start');
      const end = u.searchParams.get('end');
      planCalls.push({ start, end });
      const days = tripDays(start, Math.round((new Date(end) - new Date(start)) / 86400000) + 1);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        city: 'Barcelona', country: 'Spain', image_url: null, data_source: 'forecast', overall_score: 7,
        note: 'All days have similar conditions', best_day: null, worst_day: null, days, packing_suggestions: [],
      }) });
    });
    await page.setViewportSize(vp);
    await page.goto('/trip-planner');
    const win = await browserWindow(page);

    await expect(page.getByText('Live forecast', { exact: true })).toBeVisible();
    const chips = page.getByRole('group', { name: 'Trip days' }).getByRole('button');
    const expectedCount = Math.round((new Date(win.end) - new Date(win.start)) / 86400000) + 1;
    await expect(chips).toHaveCount(expectedCount);
    await expect(page.getByText(`${fmtShort(win.start)} – ${fmtShort(win.end)}`).first()).toBeVisible();
    // Window ke bahar ka din maujood hi nahi
    await expect(page.getByRole('button', { name: chipName(addDays(win.end, 1)) })).toHaveCount(0);
    await expect(page.locator('form input[type="date"]')).toHaveCount(0);

    // Bina tareekh submit → saaf message, backend call nahi
    await page.getByPlaceholder(/e\.g\. London/).fill('Barcelona');
    await page.getByPlaceholder(/e\.g\. London/).press('Escape');
    await page.getByRole('button', { name: 'Plan Trip' }).click();
    await expect(page.getByText('Please tap your first and last trip day')).toBeVisible();
    expect(planCalls).toHaveLength(0);

    await page.getByRole('button', { name: chipName(win.start) }).click();
    await page.getByRole('button', { name: chipName(win.end) }).click();
    await page.getByRole('button', { name: 'Plan Trip' }).click();
    await expect(page.getByText('Day score (out of 10):')).toBeVisible();
    expect(planCalls).toEqual([{ start: win.start, end: win.end }]);
    const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(o).toBeLessThanOrEqual(0);
  });
}

test('trip planner: "Planning further ahead?" uses clearly-labelled estimates, blocks forecast-range ends', async ({ page }) => {
  await mockCitySearch(page);
  const planCalls = [];
  await page.route(/\/api\/trips\/plan\/\?/, (route) => {
    const u = new URL(route.request().url());
    planCalls.push({ start: u.searchParams.get('start'), end: u.searchParams.get('end') });
    return route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"test"}' });
  });
  await page.setViewportSize(DESKTOP);
  await page.goto('/trip-planner');
  const win = await browserWindow(page);
  await page.getByPlaceholder(/e\.g\. London/).fill('Barcelona');
  await page.getByPlaceholder(/e\.g\. London/).press('Escape');
  await page.getByRole('button', { name: 'Planning further ahead?' }).click();
  await expect(page.getByText('Estimate based on 20 years of climate data — not a forecast')).toBeVisible();

  // Aakhri din forecast window ke andar → mana, backend tak nahi gaya
  await page.getByLabel('Start Date').fill(addDays(win.end, -3));
  await page.getByLabel('End Date').fill(win.end);
  await page.getByRole('button', { name: 'Plan Trip' }).click();
  await expect(page.getByText(/Estimates are for trips ending/)).toBeVisible();
  // 20 din se lambi trip → mana
  const far = addDays(win.end, 40);
  await page.getByLabel('Start Date').fill(far);
  await page.getByLabel('End Date').fill(addDays(far, 25));
  await page.getByRole('button', { name: 'Plan Trip' }).click();
  await expect(page.getByText(/Trips up to 20 days are supported/)).toBeVisible();
  expect(planCalls).toHaveLength(0);
  // Sahi → bhej diya
  await page.getByLabel('End Date').fill(addDays(far, 6));
  await page.getByRole('button', { name: 'Plan Trip' }).click();
  await expect.poll(() => planCalls.length).toBe(1);
  expect(planCalls[0]).toEqual({ start: far, end: addDays(far, 6) });
});

test('trip planner: country mode has only the forecast chips', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/trip-planner');
  await page.getByRole('button', { name: /Search by Country/ }).click();
  await expect(page.getByRole('group', { name: 'Trip days' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Planning further ahead?' })).toHaveCount(0);
});

test('trip planner: city field suggests the right spelling, 404 shows "Did you mean"', async ({ page }) => {
  await mockCitySearch(page);
  await page.route(/\/api\/trips\/plan\/\?/, (route) =>
    route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"City not found"}' }));
  await page.setViewportSize(PHONE);
  await page.goto('/trip-planner');
  const win = await browserWindow(page);
  const field = page.getByPlaceholder(/e\.g\. London/);
  await field.fill('pheonix');
  await expect(page.getByRole('option', { name: /Phoenix/ })).toBeVisible();
  await expect(page.getByText('Did you mean…?')).toBeVisible();
  await field.press('Escape');
  await page.getByRole('button', { name: chipName(win.start) }).click();
  await page.getByRole('button', { name: chipName(win.start) }).click(); // 1 din ki trip
  await page.getByRole('button', { name: 'Plan Trip' }).click();
  await expect(page.getByText(/We couldn.t find .pheonix./)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Phoenix, USA', exact: true })).toBeVisible();
});
