// ─────────────────────────────────────────────────────────────
//  Use-case pages: /events/<slug>, /trip-planner/<slug>, 6 zabanein (Nov 2026).
//  Sirf server HTML (request, koi browser JS nahi): koi Open-Meteo call nahi.
//    PW_BASE_URL=http://localhost:3100 npx playwright test use-cases
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';

const EVENTS = ['wedding', 'concert', 'marathon', 'festival', 'picnic-bbq'];
const TRIPS = ['beach', 'city-break', 'hiking'];
const LANGS = ['', 'de', 'it', 'ja', 'fr', 'es'];
const PATHS = [...EVENTS.map((s) => `/events/${s}`), ...TRIPS.map((s) => `/trip-planner/${s}`)];
const url = (lang, path) => (lang ? `/${lang}${path}` : path);

const decode = (s) => s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const strip = (s) => decode(s.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '')).trim();
const one = (html, re) => (re.exec(html) || [])[1];

let sitemapPaths = null;
async function sitemap(request) {
  if (sitemapPaths) return sitemapPaths;
  const index = await (await request.get('/sitemap.xml')).text();
  const kids = [...index.matchAll(/<loc>[^<]*(\/sitemap\/[^<]+)<\/loc>/g)].map((m) => m[1]);
  sitemapPaths = new Set();
  for (const k of kids) {
    for (const m of (await (await request.get(k)).text()).matchAll(/<loc>https?:\/\/[^/]+([^<]+)<\/loc>/g)) sitemapPaths.add(m[1]);
  }
  return sitemapPaths;
}

const seen = { title: new Set(), h1: new Set(), meta: new Set() };

for (const lang of LANGS) {
  for (const path of PATHS) {
    const page = url(lang, path);
    test(`${page}: 200, own title/H1/meta, canonical, 7 hreflang, FAQ = visible, table, links`, async ({ request }) => {
      const r = await request.get(page);
      expect(r.status()).toBe(200);
      expect(r.headers()['content-language']).toBe(lang || 'en');
      expect(r.headers()['cache-control']).toContain('s-maxage=31536000');   // static: koi backend call nahi
      const html = await r.text();

      const title = decode(one(html, /<title>([^<]*)<\/title>/));
      const h1 = strip(one(html, /<h1[^>]*>([\s\S]*?)<\/h1>/));
      const meta = decode(one(html, /<meta name="description" content="([^"]*)"/));
      for (const [k, v] of [['title', title], ['h1', h1], ['meta', meta]]) {
        expect(v, k).toBeTruthy();
        expect(seen[k].has(v), `${k} sirf is page ka`).toBe(false);
        seen[k].add(v);
      }

      const canonical = one(html, /<link rel="canonical" href="([^"]+)"/);
      expect(canonical).toBe(`https://weatherapex.com${page}`);
      const alternates = [...html.matchAll(/<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"/g)];
      expect(alternates.length).toBe(7);
      expect(alternates.map((m) => m[1]).sort()).toEqual(['de', 'en', 'es', 'fr', 'it', 'ja', 'x-default']);
      expect(html).toContain('og:image');

      const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
        .map((m) => JSON.parse(m[1])).find((d) => d['@type'] === 'FAQPage');
      expect(ld).toBeTruthy();
      const start = html.indexOf('-factors"');
      const section = html.slice(start, html.indexOf('</section>', start));
      const qa = [...section.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => [strip(m[1]), strip(m[2])]);
      for (const q of ld.mainEntity) expect(qa, q.name).toContainEqual([q.name, q.acceptedAnswer.text]);
      expect(ld.mainEntity.length).toBeGreaterThanOrEqual(4);

      expect((section.slice(0, section.indexOf('</table>')).match(/<tr/g) || []).length).toBe(11);

      // Naye links: sirf maujooda pages (sitemap mein) ya hub / use-case pages
      const site = await sitemap(request);
      const links = [...new Set([...section.matchAll(/href="([^"#]+)"/g)].map((m) => m[1]))];
      const own = new Set([...PATHS, '/events', '/trip-planner'].map((p) => url(lang, p)));
      for (const href of links) {
        expect(href.startsWith(lang ? `/${lang}/` : '/'), href).toBe(true);
        expect(own.has(href) || site.has(href), `${href} sitemap mein`).toBe(true);
      }
    });
  }
}

test('sitemap: all 48 use-case pages and the language hubs, in tools sitemaps with a real lastmod', async ({ request }) => {
  const index = await (await request.get('/sitemap.xml')).text();
  const names = LANGS.map((l) => (l ? `tools-${l}` : 'tools'));
  const want = new Set([...LANGS.flatMap((l) => PATHS.map((p) => url(l, p))),
    ...LANGS.filter(Boolean).flatMap((l) => [`/${l}/trip-planner`, `/${l}/events`])]);
  const got = new Map();
  for (const n of names) {
    expect(index, n).toContain(`/sitemap/${n}.xml`);
    const xml = await (await request.get(`/sitemap/${n}.xml`)).text();
    for (const m of xml.matchAll(/<loc>https?:\/\/[^/]+([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)) got.set(m[1], m[2]);
  }
  expect([...want].filter((u) => !got.has(u)), 'sitemap se gayab').toEqual([]);
  expect(got.size).toBe(want.size);
  for (const d of got.values()) expect(d).toMatch(/^2026-\d\d-\d\d$/);
});

test('unknown use case is a 404', async ({ request }) => {
  expect((await request.get('/events/not-a-use-case')).status()).toBe(404);
  expect((await request.get('/ja/trip-planner/road-trip')).status()).toBe(404);
});

test('hubs link to every use case page', async ({ request }) => {
  for (const lang of LANGS) {
    const events = await (await request.get(url(lang, '/events'))).text();
    for (const s of EVENTS) expect(events).toContain(`href="${url(lang, `/events/${s}`)}"`);
    const trip = await (await request.get(url(lang, '/trip-planner'))).text();
    for (const s of TRIPS) expect(trip).toContain(`href="${url(lang, `/trip-planner/${s}`)}"`);
  }
});

test('the event page shows the tool with its type selected', async ({ request }) => {
  const html = await (await request.get('/ja/events/picnic-bbq')).text();
  expect(html).toContain('ピクニック・BBQ');
  expect(html).toMatch(/border-blue-600 bg-blue-50[^>]*>(?:(?!<\/button>).)*ピクニック・BBQ/s);
});
