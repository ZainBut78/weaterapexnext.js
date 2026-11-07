// ─────────────────────────────────────────────────────────────
//  Month pages ka size + keyword report (month pages round, har step ke baad)
//    node scripts/month-seo-report.mjs            (server: http://localhost:3100)
//    BASE=http://localhost:3100 node scripts/month-seo-report.mjs
//  HTML, RSC payload, gzip bytes aur shehar ke naam ki ginti (visible text).
// ─────────────────────────────────────────────────────────────
import { gzipSync } from 'node:zlib';

const BASE = (process.env.BASE || 'http://localhost:3100').replace(/\/+$/, '');
const PAGES = [
  ['/weather/united-kingdom/london/march', 'London'],
  ['/weather/united-arab-emirates/dubai/august', 'Dubai'],
  ['/weather/germany/berlin/march', 'Berlin'],
  ['/de/weather/united-kingdom/london/march', 'London'],
  ['/fr/weather/united-kingdom/london/march', 'Londres'],
  ['/ja/weather/united-kingdom/london/march', 'ロンドン'],
  // Upar wale local par guard se chhupe; neeche wale blocks ke saath (saaf data)
  ['/weather/united-kingdom/london/july', 'London'],
  ['/de/weather/united-kingdom/london/july', 'London'],
  ['/fr/weather/united-kingdom/london/july', 'Londres'],
  ['/it/weather/united-kingdom/london/july', 'Londra'],
  ['/es/weather/united-kingdom/london/july', 'Londres'],
  ['/ja/weather/united-kingdom/london/july', 'ロンドン'],
  ['/weather/iceland/reykjavik/january', 'Reykjavik'],
];

const count = (s, word) => s.split(word).length - 1;

for (const [path, city] of PAGES) {
  const res = await fetch(`${BASE}${path}`);
  const html = await res.text();
  const rsc = [...html.matchAll(/self\.__next_f\.push\(.*?\)<\/script>/gs)].reduce((a, m) => a + m[0].length, 0);
  const main = /<main[\s\S]*<\/main>/.exec(html.replace(/<script[\s\S]*?<\/script>/g, ''))?.[0] || '';
  const visible = main.replace(/<[^>]+>/g, ' ');
  console.log([
    path.padEnd(46),
    `html ${String(html.length).padStart(6)}`,
    `rsc ${String(rsc).padStart(6)}`,
    `gzip ${String(gzipSync(html).length).padStart(5)}`,
    `${city} x${count(visible, city)}`,
    `cache ${res.headers.get('x-nextjs-cache') || '-'}`,
  ].join('  '));
}
