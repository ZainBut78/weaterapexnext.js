// ─────────────────────────────────────────────────────────────
//  messages/*.json ki jaanch (i18n Phase 1)
//
//  Chalana:  node scripts/check-messages.mjs
//  messages/en.json asal hai. Har doosri zaban mein:
//   • har key maujood (koi zyada / kam nahi)
//   • har {placeholder} wahi (tarjume mein {city} gum na ho)
//   • arrays ki lambai wahi
//   • koi khaali string nahi
//   • plural objects ({one, other}) — 'other' hamesha
//  Galti ho to exit 1 (CI / deploy se pehle).
// ─────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';

// Zabanein i18n/config.js se (import nahi — woh ESM-tag ke bina warning deta)
const LOCALES = JSON.parse(/LOCALES = (\[[^\]]+\])/.exec(readFileSync(new URL('../i18n/config.js', import.meta.url), 'utf8'))[1].replace(/'/g, '"'));
const load = (l) => JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url), 'utf8'));
const en = load('en');
const isPlural = (v) => v && typeof v === 'object' && !Array.isArray(v) && 'other' in v
  && Object.keys(v).every((k) => ['zero', 'one', 'two', 'few', 'many', 'other'].includes(k));
const vars = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

let problems = 0;
const bad = (lang, path, msg) => { problems += 1; console.log(`✗ ${lang}  ${path}  — ${msg}`); };

function compare(lang, a, b, path) {
  if (isPlural(a)) {
    if (!isPlural(b)) return bad(lang, path, 'plural object chahiye ({one?, other})');
    for (const v of Object.values(b)) if (vars(v) !== vars(a.other)) bad(lang, path, `placeholders: en {${vars(a.other)}} vs {${vars(v)}}`);
    return;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return bad(lang, path, 'array chahiye');
    if (a.length !== b.length) bad(lang, path, `array length ${b.length} (en ${a.length})`);
    a.forEach((x, i) => b[i] !== undefined && compare(lang, x, b[i], `${path}[${i}]`));
    return;
  }
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object' || Array.isArray(b)) return bad(lang, path, 'object chahiye');
    for (const k of Object.keys(a)) {
      if (!(k in b)) bad(lang, `${path}.${k}`, 'MISSING');
      else compare(lang, a[k], b[k], `${path}.${k}`);
    }
    for (const k of Object.keys(b)) if (!(k in a)) bad(lang, `${path}.${k}`, 'extra key (en mein nahi)');
    return;
  }
  if (typeof b !== 'string') return bad(lang, path, 'string chahiye');
  if (!b.trim()) bad(lang, path, 'khaali');
  if (vars(a) !== vars(b)) bad(lang, path, `placeholders: en {${vars(a)}} vs {${vars(b)}}`);
}

for (const lang of LOCALES.filter((l) => l !== 'en')) {
  let data;
  try { data = load(lang); } catch (e) { bad(lang, '', `JSON parse: ${e.message}`); continue; }
  const before = problems;
  for (const k of Object.keys(en)) {
    if (!(k in data)) bad(lang, k, 'MISSING namespace');
    else compare(lang, en[k], data[k], k);
  }
  console.log(`${problems === before ? '✓' : '✗'} ${lang}: ${problems - before} problem(s)`);
}
if (problems) { console.log(`\n${problems} problem(s)`); process.exit(1); }
console.log('\nSab zabanein mukammal.');
