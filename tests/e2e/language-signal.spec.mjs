// ─────────────────────────────────────────────────────────────
//  Bing ke liye zaban ka signal + og-image noindex (Nov 2026).
//  Sirf server HTML (request, koi browser JS nahi): Open-Meteo ki koi call nahi.
//    PW_BASE_URL=http://localhost:3100 npx playwright test language-signal
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';

const PAGES = [
  ['en', '/about'],
  ['ja', '/ja/about'],
  ['de', '/de/about'],
  ['fr', '/fr/about'],
  ['it', '/it/about'],
  ['es', '/es/about'],
  ['en', '/weather/united-kingdom/london/march'],
  ['ja', '/ja/weather/united-kingdom/london/march'],
];

for (const [lang, path] of PAGES) {
  test(`${path} says ${lang} three ways`, async ({ request }) => {
    const r = await request.get(path);
    expect(r.status()).toBe(200);
    expect(r.headers()['content-language']).toBe(lang);
    const html = await r.text();
    expect(html).toMatch(new RegExp(`<html[^>]* lang="${lang}"`));
    expect(html).toContain(`<meta http-equiv="content-language" content="${lang}"/>`);
  });
}

test('og-image is noindex but not blocked in robots.txt', async ({ request }) => {
  const r = await request.get('/og-image?title=Test');
  expect(r.status()).toBe(200);
  expect(r.headers()['content-type']).toContain('image/png');
  expect(r.headers()['x-robots-tag']).toBe('noindex');
  expect(await (await request.get('/robots.txt')).text()).not.toContain('og-image');
});
