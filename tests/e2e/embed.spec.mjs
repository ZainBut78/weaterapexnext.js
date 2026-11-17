// ─────────────────────────────────────────────────────────────
//  Embed widget (Nov 2026): /embed/<country>/<city>[/<month>]. Widget par koi JS nahi, is liye
//  browser wale test se bhi koi Open-Meteo call nahi.
//    PW_BASE_URL=http://localhost:3100 npx playwright test embed
// ─────────────────────────────────────────────────────────────
import http from 'node:http';
import { test, expect } from '@playwright/test';
import { MONTH_HEIGHT, YEAR_HEIGHT } from '../../utils/embedWidget.js';

// Saadi HTML file ek doosre origin se (jaise kisi blogger ki site): frame-ancestors * sirf
// http(s) parent maanta hai, about:blank / file:// nahi.
let blog;
let blogUrl;
test.beforeAll(async () => {
  blog = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html><body style="margin:0"><iframe src="${u.searchParams.get('src')}" width="${u.searchParams.get('w') || 300}" height="${u.searchParams.get('h')}" style="border:0"></iframe></body>`);
  });
  await new Promise((r) => blog.listen(0, '127.0.0.1', r));
  blogUrl = `http://127.0.0.1:${blog.address().port}/`;
});
test.afterAll(() => blog?.close());

const BASE = process.env.PW_BASE_URL || 'http://localhost:3100';
const LANGS = ['', 'de', 'it', 'ja', 'fr', 'es'];
const url = (lang, path) => (lang ? `/${lang}${path}` : path);
const SAMPLES = [
  ['united-kingdom/london', 'march'],
  ['japan/tokyo', 'december'],
  ['portugal/lisbon', 'july'],
];

test('widget numbers match the month page (3 cities)', async ({ request }) => {
  for (const [place, month] of SAMPLES) {
    const pageHtml = await (await request.get(`/weather/${place}/${month}`)).text();
    const meta = /<meta name="description" content="[^"]*?average high ([\d.]+)°C[^"]*?low ([\d.]+)°C/.exec(pageHtml);
    expect(meta, place).toBeTruthy();
    const widget = await (await request.get(`/embed/${place}/${month}`)).text();
    expect(widget, `${place} high`).toContain(`${Number(meta[1])} °C`);
    expect(widget, `${place} low`).toContain(`${Number(meta[2])} °C`);
  }
});

for (const lang of LANGS) {
  for (const [place, month] of SAMPLES.slice(0, 1)) {
    for (const path of [`/embed/${place}`, `/embed/${place}/${month}`]) {
      test(`${url(lang, path)}: 200, noindex, framing allowed, under 50 KB, footer links`, async ({ request }) => {
        const r = await request.get(url(lang, path), { headers: { referer: 'https://blog.example/post' } });
        expect(r.status()).toBe(200);
        const h = r.headers();
        expect(h['x-robots-tag']).toBe('noindex');
        expect(h['content-security-policy']).toContain('frame-ancestors *');
        expect(h['x-frame-options']).toBeUndefined();
        const html = await r.text();
        expect(html).toContain('<meta name="robots" content="noindex">');
        expect(html).toMatch(new RegExp(`<html lang="${lang || 'en'}">`));
        expect(Buffer.byteLength(html)).toBeLessThan(50 * 1024);
        expect(html).not.toMatch(/<script/i);
        const links = [...html.matchAll(/<a href="([^"]+)" target="_blank" rel="noopener"/g)].map((m) => m[1]);
        expect(links).toEqual([
          `https://weatherapex.com${url(lang, `/weather/${path.split('/embed/')[1]}`)}`,
          `https://weatherapex.com${url(lang, '/trip-planner')}`,
          `https://weatherapex.com${url(lang, '/events')}`,
          'https://open-meteo.com/',
        ]);
      });
    }
  }
}

test('other pages keep their framing headers', async ({ request }) => {
  for (const path of ['/', '/about', '/ja', '/weather/united-kingdom/london/march', '/de/weather/united-kingdom/london/march', '/events/wedding', '/trip-planner']) {
    const h = (await request.get(path)).headers();
    expect(h['x-frame-options'], path).toBe('SAMEORIGIN');
    expect(h['content-security-policy'] || '', path).not.toContain('frame-ancestors');
  }
});

test('theme parameter and unknown widgets', async ({ request }) => {
  expect(await (await request.get('/embed/japan/tokyo?theme=dark')).text()).toContain('<body class="dark">');
  expect(await (await request.get('/embed/japan/tokyo?theme=pink')).text()).toContain('<body class="light">');
  expect((await request.get('/embed/japan/not-a-city')).status()).toBe(404);
  expect((await request.get('/embed/japan/tokyo/smarch')).status()).toBe(404);
  expect((await request.get('/embed/france/tokyo')).status()).toBe(404);
  const r = await request.get('/embed/japan/tokyo/smarch');
  expect(r.headers()['x-robots-tag']).toBe('noindex');
});

test('widgets stay out of the sitemap', async ({ request }) => {
  const index = await (await request.get('/sitemap.xml')).text();
  const kids = [...index.matchAll(/<loc>[^<]*(\/sitemap\/[^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const k of kids) expect(await (await request.get(k)).text(), k).not.toContain('/embed/');
});

// Copy code ki unchai (utils/embedWidget.js): 300px aur 1000px chaudai par iframe ke andar scroll
// nahi; full-year mein neeche zyada khaali jagah bhi nahi. Har zaban, dono theme.
const YEAR_BLANK_MAX = 60;
for (const lang of LANGS) {
  for (const [path, height, kind] of [['/embed/united-kingdom/london/march', MONTH_HEIGHT, 'month'], ['/embed/united-kingdom/london', YEAR_HEIGHT, 'year'], ['/embed/japan/tokyo/december', MONTH_HEIGHT, 'month']]) {
    test(`iframe ${height}px tall at 300 and 1000 wide, no scroll: ${url(lang, path)}`, async ({ page }) => {
      for (const width of [300, 1000]) {
        for (const theme of ['light', 'dark']) {
          await page.setViewportSize({ width: width + 40, height: height + 40 });
          await page.goto(`${blogUrl}?w=${width}&h=${height}&src=${encodeURIComponent(`${BASE}${url(lang, path)}?theme=${theme}`)}`);
          await expect(page.frameLocator('iframe').locator('h1')).toBeVisible();
          const inner = await (await page.$('iframe')).contentFrame();
          const size = await inner.evaluate(() => ({
            scroll: document.documentElement.scrollHeight,
            content: Math.ceil(document.body.getBoundingClientRect().height),
            w: document.documentElement.scrollWidth,
          }));
          const tag = `${width}px ${theme}`;
          expect(size.w, `${tag} width`).toBeLessThanOrEqual(width);
          expect(size.scroll, `${tag} scroll`).toBeLessThanOrEqual(height);
          if (kind === 'year') expect(height - size.content, `${tag} khaali jagah`).toBeLessThanOrEqual(YEAR_BLANK_MAX);
        }
      }
    });
  }
}

// ── Step 2: "Use this data on your site" city aur month pages par ──
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
let sitemapPaths = null;
async function sitemap(request) {
  if (sitemapPaths) return sitemapPaths;
  const index = await (await request.get('/sitemap.xml')).text();
  const kids = [...index.matchAll(/<loc>[^<]*(\/sitemap\/[^<]+)<\/loc>/g)].map((m) => m[1]);
  sitemapPaths = new Set();
  for (const k of kids) for (const m of (await (await request.get(k)).text()).matchAll(/<loc>https?:\/\/[^/]+([^<]+)<\/loc>/g)) sitemapPaths.add(m[1]);
  return sitemapPaths;
}

for (const lang of LANGS) {
  for (const [path, monthly] of [['/weather/japan/tokyo/december', true], ['/weather/japan/tokyo', false]]) {
    test(`embed box in server HTML: ${url(lang, path)}`, async ({ request }) => {
      const html = await (await request.get(url(lang, path))).text();
      const box = html.slice(html.indexOf('data-embed-section'), html.indexOf('</section>', html.indexOf('data-embed-section')));
      expect(box.length).toBeGreaterThan(100);
      // Server HTML mein /embed/ ka koi href ya src nahi (preview iframe sirf button par; code sirf text)
      expect(html).not.toMatch(/(?:href|src)\s*=\s*["'][^"']*\/embed\//);
      expect(box).not.toMatch(/<iframe/);
      // Section mein sirf ek asli link: landing page (Step 3). Code ke links sirf text.
      expect([...box.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1])).toEqual([url(lang, '/weather-widget')]);
      const code = decode(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/.exec(box)?.[1] || '');
      const iframe = /<iframe src="https:\/\/weatherapex\.com([^"?]+)[^"]*" width="100%" height="(\d+)"/.exec(code);
      expect(iframe, 'iframe').toBeTruthy();
      expect(iframe[1]).toBe(url(lang, path.replace('/weather/', '/embed/')));
      expect(Number(iframe[2])).toBe(monthly ? MONTH_HEIGHT : YEAR_HEIGHT);
      // iframe ke BAHAR saada link, jo sitemap wale page par jata hai
      const outside = code.slice(code.indexOf('</iframe>'));
      const link = /<a href="https:\/\/weatherapex\.com([^"]+)">WeatherApex — [^<]+<\/a>/.exec(outside);
      expect(link, 'outside link').toBeTruthy();
      expect(link[1]).toBe(url(lang, path));
      expect((await sitemap(request)).has(link[1]), `${link[1]} sitemap mein`).toBe(true);
      expect(outside).not.toMatch(/nofollow|target=/);
    });
  }
}

test('copy box options change the code; preview only on click; other language loaded on demand (browser, backend calls blocked)', async ({ page }) => {
  await page.route('**/api/**', (r) => r.abort());
  const chunks = [];
  page.on('request', (r) => { if (r.resourceType() === 'script') chunks.push(r.url()); });
  await page.goto('/weather/japan/tokyo/december');
  await page.waitForLoadState('networkidle');
  const box = page.locator('[data-embed-section]');
  const code = box.locator('pre code');
  await expect(code).toHaveText(/\/embed\/japan\/tokyo\/december"/);
  await expect(box.locator('iframe')).toHaveCount(0);
  const selects = box.locator('select');
  await selects.nth(0).selectOption('year');
  await expect(code).toHaveText(new RegExp(`/embed/japan/tokyo" width="100%" height="${YEAR_HEIGHT}"`));
  const before = chunks.length;
  await selects.nth(1).selectOption('ja');
  await expect(code).toHaveText(/WeatherApex — 東京の月別の天気/);
  expect(chunks.length, 'ja text: naya chunk').toBeGreaterThan(before);
  await selects.nth(2).selectOption('dark');
  await expect(code).toHaveText(/https:\/\/weatherapex\.com\/ja\/embed\/japan\/tokyo\?theme=dark/);
  await box.locator('input[type="checkbox"]').check();
  await expect(code).toHaveText(/<a href="https:\/\/weatherapex\.com\/ja\/trip-planner">WeatherApexの旅行プランナー<\/a>/);
  await box.locator('button[aria-expanded="false"]').click();
  await expect(box.locator('iframe')).toHaveAttribute('src', '/ja/embed/japan/tokyo?theme=dark');
  await box.locator('button[aria-expanded="true"]').click();
  await expect(box.locator('iframe')).toHaveCount(0);
});

// ── Step 3: /weather-widget landing page (indexable, 6 zabanein) ──
for (const lang of LANGS) {
  test(`landing page: ${url(lang, '/weather-widget')}`, async ({ browser, request }) => {
    const path = url(lang, '/weather-widget');
    const res = await request.get(path);
    expect(res.status()).toBe(200);
    expect(res.headers()['x-robots-tag'] || '').not.toMatch(/noindex/);
    const html = await res.text();
    expect(html).not.toMatch(/(?:href|src)\s*=\s*["'][^"']*\/embed\//);
    const code = decode(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/.exec(html)?.[1] || '');
    expect(code).toContain(`<a href="https://weatherapex.com${url(lang, '/weather/france/paris/may')}">WeatherApex — `);

    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(path);
    const seo = await page.evaluate(() => ({
      robots: document.querySelector('meta[name="robots"]')?.content || '',
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.getAttribute('hreflang')).sort(),
      h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
      faq: [...document.querySelectorAll('h3')].map((h) => [h.textContent.trim(), h.nextElementSibling?.textContent.trim()]),
      ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)),
    }));
    await context.close();
    expect(seo.robots).not.toMatch(/noindex/);
    expect(new URL(seo.canonical).pathname).toBe(path);
    expect(seo.hreflang).toEqual(['de', 'en', 'es', 'fr', 'it', 'ja', 'x-default']);
    expect(seo.h1).toHaveLength(1);
    // FAQPage JSON-LD = page par dikhne wale sawal/jawab, hoobahoo
    const faq = seo.ld.find((d) => d['@type'] === 'FAQPage');
    expect(faq, 'FAQPage').toBeTruthy();
    expect(faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text])).toEqual(seo.faq);
    expect(seo.faq.length).toBeGreaterThanOrEqual(5);
  });

  test(`widget section links to the landing page: ${url(lang, '/weather/japan/tokyo/december')}`, async ({ request }) => {
    const html = await (await request.get(url(lang, '/weather/japan/tokyo/december'))).text();
    const box = html.slice(html.indexOf('data-embed-section'), html.indexOf('</section>', html.indexOf('data-embed-section')));
    expect(box).toContain(`href="${url(lang, '/weather-widget')}"`);
  });
}

test('landing page in the sitemap with a real lastmod', async ({ request }) => {
  for (const lang of LANGS) {
    const xml = await (await request.get(`/sitemap/${lang ? `tools-${lang}` : 'tools'}.xml`)).text();
    expect(xml).toMatch(new RegExp(`<loc>https?://[^<]+${url(lang, '/weather-widget')}</loc><lastmod>2026-[0-9]{2}-[0-9]{2}</lastmod>`));
  }
});

test('landing picker: city changes the code, demo loads in the browser (backend calls blocked)', async ({ page }) => {
  await page.route('**/api/**', (r) => r.abort());
  await page.goto('/ja/weather-widget');
  await expect(page.locator('main iframe').first()).toHaveAttribute('src', '/ja/embed/france/paris/may');
  const code = page.locator('pre code');
  await expect(code).toHaveText(/ja\/embed\/france\/paris\/may"/);
  await page.locator('main select').first().selectOption('tokyo');
  await expect(code).toHaveText(/ja\/embed\/japan\/tokyo\/may"/);
  await expect(code).toHaveText(/WeatherApex — 東京の5月の天気/);
});
