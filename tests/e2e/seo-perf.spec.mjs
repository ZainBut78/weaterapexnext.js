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

test('homepage weather card is server-rendered for the default city (London)', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toContain('ssr-default-city');
  expect(html).toMatch(/London(<!-- -->)?, (<!-- -->)?United Kingdom/);
  // Badi icon above the fold: lazy nahi, high priority
  expect(html).toMatch(/<img[^>]*fetchPriority="high"[^>]*\/icons\/meteocons\/|<img[^>]*\/icons\/meteocons\/[^>]*fetchPriority="high"/);
});

for (const [saved, hidden] of [['paris', true], ['london', false]]) {
  test(`saved city "${saved}": server London content ${hidden ? 'hidden' : 'visible'} before JS`, async ({ page }) => {
    await blockThirdParty(page);
    // Sirf JS rok do — server HTML + CSS + inline script (hydration nahi). CSS bhi
    // /_next/static/chunks/ mein hoti hai, us ko rokna nahi (warna chhupane wala rule hi nahi)
    await page.route('**/_next/static/chunks/**', (r) => (r.request().resourceType() === 'script' ? r.abort() : r.continue()));
    await page.addInitScript((c) => localStorage.setItem('weatherApex_city', c), saved);
    await page.goto('/');
    const vis = await page.locator('.ssr-default-city').first().evaluate((el) => getComputedStyle(el).visibility);
    expect(vis).toBe(hidden ? 'hidden' : 'visible');
  });
}

test('sitemap lastmod is stable between requests (not request time)', async ({ request }) => {
  const a = await (await request.get('/sitemap/places.xml')).text();
  await new Promise((r) => setTimeout(r, 1500));
  const b = await (await request.get('/sitemap/places.xml')).text();
  const dates = (x) => [...x.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  expect(dates(a)).toEqual(dates(b));
  const today = new Date().toISOString().slice(0, 10);
  expect(dates(a).filter((d) => !d.startsWith(today)).length).toBeGreaterThan(dates(a).length / 2);
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

test('IndexNow key file is served as plain text (only the real key)', async ({ request }) => {
  const key = (process.env.INDEXNOW_KEY || '').trim();
  test.skip(!key, 'INDEXNOW_KEY set nahi (build + test dono mein chahiye)');
  const res = await request.get(`/${key}.txt`);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('text/plain');
  expect((await res.text()).trim()).toBe(key);
  expect((await request.get('/0000000000000000wrongkey.txt')).status()).toBe(404);
});

test('robots.txt blocks RSC payload URLs and links the sitemap index', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text();
  expect(txt).toContain('Disallow: /*?_rsc=');
  expect(txt).toContain('Disallow: /*&_rsc=');
  expect(txt).toMatch(/Sitemap: https:\/\/[^\s]+\/sitemap\.xml/);
});
