// Test helpers — rate-limited endpoints ko MOCK karna (brief §3: real
// backend ko baar baar na maaro; free daily limit jaldi bhar jati hai).
import fs from 'node:fs';
import path from 'node:path';

const FIXTURE = JSON.parse(
  fs.readFileSync(path.join(import.meta.dirname, 'fixtures', 'current-london.json'), 'utf8'),
);

const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * /api/weather/current/?city=X ka nakli jawab (London ka asli data, naam X).
 * opts.delay  — ms der (CLS test)
 * opts.fail   — (city) => status code (jaise 500) us shehar ke liye
 * opts.status429 — har call par free-limit 429
 */
export async function mockCurrentWeather(page, opts = {}) {
  const calls = [];
  await page.route('**/api/weather/current/**', async (route) => {
    const url = new URL(route.request().url());
    const city = (url.searchParams.get('city') || 'london').toLowerCase();
    calls.push(city);
    if (opts.delay) await new Promise((r) => setTimeout(r, opts.delay));
    if (opts.status429) {
      return route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'free_limit_reached', feature: 'weather', limit: 3, error: 'Free limit reached' }),
      });
    }
    const failStatus = opts.fail?.(city);
    if (failStatus) {
      return route.fulfill({ status: failStatus, contentType: 'application/json', body: '{"error":"test failure"}' });
    }
    const body = { ...FIXTURE, city: titleCase(city), country: city === 'london' ? FIXTURE.country : 'Testland' };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  return calls;
}

// Leaflet tiles / BigDataCloud / Google GSI — bahar ki services test mein
// zaroori nahi, aur un ki network ghaltiyan hamare console errors nahi.
export async function blockThirdParty(page) {
  await page.route(/(tile\.openstreetmap|arcgisonline|rainviewer|bigdatacloud|accounts\.google\.com|unpkg\.com\/leaflet)/, (r) => r.abort());
}

/** Console errors + uncaught exceptions jama karo */
export function collectErrors(page) {
  const errors = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // Abort kiye gaye third-party requests ke "Failed to load resource" hamare bug nahi
    if (/Failed to load resource: net::ERR_FAILED|ERR_BLOCKED_BY_CLIENT/.test(t)) return;
    errors.push(t);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}
