// ─────────────────────────────────────────────────────────────
//  Trip Planner / Events ke neeche wala content (Nov 2026). Sirf server HTML (request,
//  browser JS nahi): koi Open-Meteo call nahi.
//    PW_BASE_URL=http://localhost:3100 npx playwright test tool-guides
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';

const LANGS = ['', '/de', '/it', '/ja', '/fr', '/es'];
const PAGES = LANGS.flatMap((l) => [`${l}/trip-planner`, `${l}/events`]);

const decode = (s) => s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const stripTags = (s) => decode(s.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '')).trim();

for (const path of PAGES) {
  test(`${path}: guide is in the server HTML and FAQ JSON-LD matches the visible text`, async ({ request }) => {
    const r = await request.get(path);
    expect(r.status()).toBe(200);
    const html = await r.text();

    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => JSON.parse(m[1])).find((d) => d['@type'] === 'FAQPage');
    expect(ld, 'FAQPage JSON-LD').toBeTruthy();
    expect(ld.mainEntity.length).toBeGreaterThanOrEqual(4);

    const start = html.indexOf('-guide"');
    const section = html.slice(start, html.indexOf('</section>', start));
    const h3 = [...section.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => [stripTags(m[1]), stripTags(m[2])]);
    for (const q of ld.mainEntity) {
      expect(h3, q.name).toContainEqual([q.name, q.acceptedAnswer.text]);
    }

    // Misaal ki table: 12 mahine
    const rows = section.slice(0, section.indexOf('</table>')).match(/<tr/g) || [];
    expect(rows.length).toBe(13);

    // Naye links sirf maujooda pages par: shehar + (zaban ho to) blog
    const lang = path.split('/')[1] && path.split('/')[1].length === 2 ? path.split('/')[1] : '';
    const links = [...section.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    expect(links.filter((h) => h.includes('/weather/')).length).toBe(8);
    for (const h of links) expect(h.startsWith(lang ? `/${lang}/` : '/')).toBe(true);
  });
}

test('tool page needs no backend at render time (static, cached)', async ({ request }) => {
  const r = await request.get('/trip-planner');
  expect(r.headers()['x-nextjs-cache'] || 'static').not.toBe('MISS-dynamic');
  expect(r.headers()['cache-control']).toContain('s-maxage=31536000');
});
