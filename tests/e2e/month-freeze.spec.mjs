// ─────────────────────────────────────────────────────────────
//  Month pages: links + on-page SEO freeze (Nov 2026, month pages round)
//
//  Har step ke baad yeh wahi hona chahiye jo baseline mein hai: har internal link
//  (href + anchor text), title, meta description, H1, canonical, hreflang, robots,
//  X-Robots-Tag, purani H2/H3 (text + order), JSON-LD.
//  Server HTML dekhta hai (JS band), jaise view-source.
//
//  Chalana (server ENABLED_LOCALES ke saath, live jaisa):
//    ENABLED_LOCALES=de,it,ja,fr,es npx next start -p 3100
//    PW_BASE_URL=http://localhost:3100 npx playwright test month-freeze
//  Baseline SIRF code badalne se pehle bani (git mein): tests/fixtures/month-freeze.json
//  UPDATE_FREEZE=1 sirf tab jab local data sach mein badla ho, code ki wajah se NAHI.
// ─────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const FIXTURE = new URL('../fixtures/month-freeze.json', import.meta.url);

const PAGES = [
  '/weather/united-kingdom/london/march',
  '/weather/united-arab-emirates/dubai/august',
  '/weather/germany/berlin/march',          // Travel notes nahi
  '/de/weather/united-kingdom/london/march',
  '/fr/weather/united-kingdom/london/march',
  '/ja/weather/united-kingdom/london/march',
  // Upar wale local par data-quality guard se chhupe hain; neeche wale blocks ke saath (saaf data)
  '/weather/united-kingdom/london/july',
  '/de/weather/united-kingdom/london/july',
  '/fr/weather/united-kingdom/london/july',
  '/it/weather/united-kingdom/london/july',
  '/es/weather/united-kingdom/london/july',
  '/ja/weather/united-kingdom/london/july',
  '/weather/iceland/reykjavik/january',
];

// Sirf ek naya link jaiz: "What to wear" ki Trip Planner line, page ke PURANE href par (owner, Step 6)
const OPTION_B_TIP = new Set(['H3 Sunglasses', 'H3 Sonnenbrille', 'H3 Lunettes de soleil', 'H3 サングラス']);
const plannerHref = (links) => links.map((l) => l.split(' | ')[0]).find((h) => h.includes('/trip-planner?city='));

const extract = () => {
  const text = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
  const meta = (sel) => document.querySelector(sel)?.getAttribute('content') ?? null;
  return {
    title: document.title,
    description: meta('meta[name="description"]'),
    robots: meta('meta[name="robots"]'),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')]
      .map((l) => `${l.getAttribute('hreflang')} ${l.getAttribute('href')}`).sort(),
    h1: [...document.querySelectorAll('h1')].map(text),
    headings: [...document.querySelectorAll('h2, h3')].map((h) => `${h.tagName} ${text(h)}`),
    jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
    links: [...document.querySelectorAll('a[href]')]
      .map((a) => `${a.getAttribute('href')} | ${text(a)}`).sort(),
  };
};

async function snapshot(browser, baseURL, path) {
  const context = await browser.newContext({ javaScriptEnabled: false, locale: 'en-GB' });
  const page = await context.newPage();
  const res = await page.goto(`${baseURL}${path}`);
  expect(res.status(), path).toBe(200);
  const snap = await page.evaluate(extract);
  snap.xRobotsTag = res.headers()['x-robots-tag'] ?? null;
  await context.close();
  return snap;
}

const load = () => JSON.parse(readFileSync(FIXTURE, 'utf8'));

if (process.env.UPDATE_FREEZE) {
  test('save baseline', async ({ browser, baseURL }) => {
    // Sirf jo pages abhi baseline mein nahi; purani baseline kabhi nahi badalti
    const out = load();
    for (const path of PAGES) if (!out[path]) out[path] = await snapshot(browser, baseURL, path);
    writeFileSync(FIXTURE, `${JSON.stringify(out, null, 1)}\n`);
  });
} else {
  for (const path of PAGES) {
    test(`freeze: ${path}`, async ({ browser, baseURL }) => {
      const before = load()[path];
      const now = await snapshot(browser, baseURL, path);

      for (const key of ['title', 'description', 'robots', 'canonical', 'hreflang', 'h1', 'xRobotsTag', 'jsonLd']) {
        expect(now[key], key).toEqual(before[key]);
      }
      expect(now.h1).toHaveLength(1);

      // Purani headings wahi text, wahi tarteeb. Naye block ki headings beech mein aa sakti hain.
      // Sirf Option B (owner, Nov 2026): 15+ rainy days par "Sunglasses" tip nahi aata.
      const expected = before.headings.filter((h) => !OPTION_B_TIP.has(h) || now.headings.includes(h));
      const remaining = now.headings.filter((h) => before.headings.includes(h));
      expect(remaining, 'purani H2/H3').toEqual(expected);

      const missing = before.links.filter((l) => !now.links.includes(l));
      expect(missing, 'gum hue links').toEqual([]);
      const added = now.links.filter((l) => !before.links.includes(l)).map((l) => l.split(' | ')[0]);
      const planner = plannerHref(before.links);
      expect(added.filter((href) => href !== planner), 'naye links').toEqual([]);
      expect(added.length, 'Trip Planner line sirf ek baar').toBeLessThanOrEqual(1);
    });
  }
}
