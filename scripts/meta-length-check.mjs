// ─────────────────────────────────────────────────────────────
//  Month pages ki meta description: sab shehar × 12 mahine × 6 zabanein, 160 characters se KAM
//  (Nov 2026). Koi page ya API call nahi: wahi monthMeta functions (components/climate/text)
//  seedha chalte hain.
//    node scripts/meta-length-check.mjs [normals.json]
//  normals.json (optional): { slug: { name, rows: [12 × {avg_high, avg_low, rainy_days, …}] } }
//  jiti: Tailwind ke saath pehle se install (nayi library nahi).
//  (DB se, sirf parhne ke liye). Iske ilawa har static shehar par "sab se lambe" numbers wali
//  row bhi (upper bound), taake jin sheharon ka local data nahi woh bhi jaanche jayen.
// ─────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';

import React from 'react';

globalThis.React = React;   // text files mein JSX (classic transform)
const root = fileURLToPath(new URL('..', import.meta.url));
const jiti = createJiti(import.meta.url, { jsx: true, extensions: ['.js', '.mjs', '.jsx', '.json'], alias: { '@': root.replace(/[\\/]$/, '') } });
const { climateText } = await jiti.import('../components/climate/text/index.js');
const { cityName, countryName } = await jiti.import('../i18n/places.js');
const { visitVerdict } = await jiti.import('../utils/climateMath.js');
const { CITIES } = await jiti.import('../data/cities.js');
const { getCountry } = await jiti.import('../data/countries.js');

const LANGS = ['en', 'de', 'it', 'ja', 'fr', 'es'];
const MAX = 159;   // "160 se kam"
const normals = process.argv[2] ? JSON.parse(readFileSync(process.argv[2], 'utf8')) : {};
// Sab se zyada characters: do-hindsay manfi aur ek-hindsa decimal, 2-hindsay din aur dhoop
const WIDE = { avg_high: -10.5, avg_low: -18.5, rainy_days: 22, sunshine_hours: 10.5, avg_rainfall: 120.5, humidity: 80 };

const cases = [];
for (const c of CITIES) cases.push({ city: c, rows: Array.from({ length: 12 }, () => WIDE), kind: 'wide' });
for (const [slug, n] of Object.entries(normals)) {
  const city = CITIES.find((c) => c.slug === slug) || { slug, name: n.name, country: n.country };
  cases.push({ city, rows: n.rows, kind: 'db' });
}

let worst = { len: 0 };
let fail = 0;
let checked = 0;
const noMore = Object.fromEntries(LANGS.map((l) => [l, 0]));
const MORE = { en: 'what to pack →', de: 'Packliste →', fr: 'valise →', it: 'in valigia →', es: 'qué llevar →', ja: '持ち物リストも掲載。' };
for (const lang of LANGS) {
  const L = climateText(lang);
  for (const { city, rows, kind } of cases) {
    const country = getCountry ? getCountry(city.country) : null;
    for (let m = 1; m <= 12; m++) {
      const row = rows[m - 1];
      const verdict = visitVerdict(row);
      const d = L.monthMeta({ cityN: cityName(lang, city), countryN: country ? countryName(lang, country) : city.country, city, country, monthN: L.month(m), monthNum: m, row, verdict }).description;
      checked++;
      if (!d.endsWith(MORE[lang])) noMore[lang]++;
      if (d.length > worst.len) worst = { len: d.length, lang, slug: city.slug, m, kind, d };
      if (d.length > MAX) {
        fail++;
        if (fail <= 10) console.log(`TOO LONG ${d.length} ${lang} ${city.slug} ${m}: ${d}`);
      }
    }
  }
}
console.log(`${checked} descriptions · longest ${worst.len} (${worst.lang} ${worst.slug} ${worst.m}, ${worst.kind}) · over ${MAX}: ${fail}`);
console.log(`without the last sentence: ${JSON.stringify(noMore)}`);
process.exit(fail ? 1 : 0);
