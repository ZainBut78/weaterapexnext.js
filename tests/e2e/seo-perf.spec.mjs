// ─────────────────────────────────────────────────────────────
//  SEO/perf fixes (Oct 2026): geolocation sirf button par (Task 5),
//  sitemap index + child sitemaps (Task 4), robots _rsc (Task 1),
//  homepage "Weather Map" heading server HTML mein (Task 6).
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';
import { mockCurrentWeather, blockThirdParty } from './helpers.mjs';

const PHONE = { width: 390, height: 844 };

test('homepage does not ask for location on load; "Use my location" does', async ({ page, context }) => {
  await blockThirdParty(page);
  const calls = await mockCurrentWeather(page);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });
  await page.addInitScript(() => {
    window.__geoCalls = 0;
    const orig = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    navigator.geolocation.getCurrentPosition = (...a) => { window.__geoCalls++; return orig(...a); };
  });
  // Reverse geocode (blockThirdParty se pehle wala route jeet-ta hai — yeh baad mein laga, isi ko pehle check hota hai)
  await page.route('**/api.bigdatacloud.net/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"city":"Paris"}' }));
  await page.setViewportSize(PHONE);
  await page.goto('/');
  await expect(page.getByText(/• London, United Kingdom/)).toBeVisible();
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => window.__geoCalls)).toBe(0);

  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(page.getByText(/• Paris, Testland/)).toBeVisible();
  expect(await page.evaluate(() => window.__geoCalls)).toBe(1);
  expect(calls).toContain('paris');
});

test('"Weather Map" heading is in the server HTML (no JS needed)', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toContain('Weather Map</h2>');
});

test('sitemap index lists child sitemaps; children are valid with lastmod and no legacy URLs', async ({ request }) => {
  const idx = await request.get('/sitemap.xml');
  expect(idx.status()).toBe(200);
  const xml = await idx.text();
  expect(xml).toContain('<sitemapindex');
  const children = [...xml.matchAll(/<sitemap><loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(children).toEqual(expect.arrayContaining(['/sitemap/static.xml', '/sitemap/blog.xml', '/sitemap/places.xml', '/sitemap/months-1.xml']));
  let total = 0;
  for (const c of children) {
    const r = await request.get(c);
    expect(r.status(), c).toBe(200);
    const body = await r.text();
    expect(body, c).toContain('<urlset');
    const urls = [...body.matchAll(/<url><loc>([^<]+)<\/loc>(<lastmod>[^<]+<\/lastmod>)?<\/url>/g)];
    expect(urls.length, c).toBeGreaterThan(0);
    for (const u of urls) {
      expect(u[2], `${u[1]} lastmod`).toBeTruthy();
      const path = new URL(u[1]).pathname;
      expect(path).not.toMatch(/^\/weather\/(london|paris|brisbane|tokyo)$/);
      expect(path).not.toMatch(/\/(login|signup|pricing|api-docs)$/);
    }
    total += urls.length;
  }
  expect(total).toBeGreaterThan(2000);
  expect((await request.get('/sitemap/nope.xml')).status()).toBe(404);
});

test('robots.txt blocks RSC payload URLs and links the sitemap index', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text();
  expect(txt).toContain('Disallow: /*?_rsc=');
  expect(txt).toContain('Disallow: /*&_rsc=');
  expect(txt).toMatch(/Sitemap: https:\/\/[^\s]+\/sitemap\.xml/);
});
