// ─────────────────────────────────────────────────────────────
//  GSC 404 (Nov 2026): Google RSC payload ki path jaisi React keys ko link samajh kar crawl
//  karta tha (["$","li","/trip-planner-2",…] → /trip-planner-2 404). Server HTML aur RSC mein
//  key ki jagah koi "/…-<number>" na ho. Saath mein do kabhi na bane blog posts ke 301.
//    PW_BASE_URL=http://localhost:3100 npx playwright test crawl-hygiene
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';

const PAGES = [
  '/weather/japan/tokyo',                                   // city
  '/weather/japan/tokyo/october',                           // month
  '/de/weather/japan/tokyo/october',
  '/weather/japan',                                         // country
  '/weather',
  '/blog',
  '/blog/where-in-europe-is-warm-in-january',               // Further reading: /weather/…, /blog/…, /trip-planner
  '/blog/best-time-to-visit-mexico',
  '/trip-planner', '/de/trip-planner', '/events', '/events/wedding', '/trip-planner/beach',
  '/climate-guides', '/weather-widget', '/',
];

// ["$","li","/path-2",…] — RSC mein element ki key (HTML ke andar \" escape ke saath bhi)
const pathKeys = (text) => [...text.replace(/\\"/g, '"').matchAll(/\["\$","[^"]+","(\/[^"]*-\d+)"/g)].map((m) => m[1]);

for (const path of PAGES) {
  test(`no path-like React keys: ${path}`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
    const html = await res.text();
    const rsc = await (await request.get(`${path}?_rsc=keys`, { headers: { RSC: '1' } })).text();
    expect(pathKeys(html), 'HTML').toEqual([]);
    expect(pathKeys(rsc), 'RSC').toEqual([]);
  });
}

test('blog Further reading links are unchanged (same hrefs, text and order)', async ({ request }) => {
  const html = await (await request.get('/blog/where-in-europe-is-warm-in-january')).text();
  const aside = html.slice(html.indexOf('aria-labelledby="further-reading-heading"'), html.indexOf('</aside>', html.indexOf('further-reading-heading')));
  const hrefs = [...aside.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1]);
  expect(hrefs).toEqual(['/weather/spain/valencia/january', '/blog/where-in-europe-is-warm-in-december', '/trip-planner']);
});

// Kabhi na bane posts → sab se qareeb maujood page, ek hop, 301, har zaban mein usi zaban ka page
for (const [lang, from, to] of [
  ['', '/blog/best-time-to-visit-philippines', '/weather/philippines'],
  ['', '/blog/best-time-to-visit-montreal', '/weather/canada/montreal'],
  ['de', '/blog/best-time-to-visit-philippines', '/weather/philippines'],
  ['ja', '/blog/best-time-to-visit-montreal', '/weather/canada/montreal'],
]) {
  const src = lang ? `/${lang}${from}` : from;
  const dst = lang ? `/${lang}${to}` : to;
  test(`301 ${src} → ${dst}`, async ({ request }) => {
    const res = await request.get(src, { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(new URL(res.headers().location, 'http://x').pathname).toBe(dst);
  });
}

test('other blog 404s stay 404', async ({ request }) => {
  expect((await request.get('/blog/best-time-to-visit-atlantis', { maxRedirects: 0 })).status()).toBe(404);
});
