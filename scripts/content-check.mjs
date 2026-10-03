// ─────────────────────────────────────────────────────────────
//  CONTENT CHECK — month pages kitne "template" hain (content round, E)
//
//  Audit wala tareeqa:
//   1) header aur footer ke beech ka text (server HTML, JS nahi)
//   2) numbers → "#", shehar / mulk / mahine ke naam → "X"
//   3) 5-alfaaz shingles ki Jaccard similarity (template overlap)
//  Aur: prose ke alfaaz (sirf <p>/<li> — headings, tables, chips, link-cards nahi),
//  aur woh jumle jo HAR page par hain.
//
//  Chalana:  node scripts/content-check.mjs          (BASE=http://localhost:3001)
//  Sirf un shehron ke pages jin ka 20-saal data local DB mein mukammal hai.
//  Pass: same-country + same-month max overlap ≤ 50%, prose ≥ 350 alfaaz,
//        har page par common jumle ≤ 3.
// ─────────────────────────────────────────────────────────────
import { CITIES } from '../data/cities.js';
import { COUNTRIES, countryOfCity } from '../data/countries.js';
import { MONTHS } from '../utils/climateMath.js';

const BASE = (process.env.BASE || 'http://localhost:3001').replace(/\/+$/, '');

// 12 shehar (sab local mein mukammal), 4 mahine → 48 pages.
// Same-country jore: london/manchester, paris/lyon, rome/milan, madrid/barcelona.
// Northern + equator (singapore). Southern hemisphere ka koi shehar local DB mein
// mukammal nahi (sydney, cape-town khaali) — live data par dobara chalayein.
// Chhota run: CITIES=london MONTHS=all node scripts/content-check.mjs
// (sirf us shehar ke 12 mahine — same-country pairs na hon to woh shart skip)
const CITY_SLUGS = process.env.CITIES ? process.env.CITIES.split(',') : ['london', 'manchester', 'paris', 'lyon', 'rome', 'milan', 'madrid', 'barcelona', 'tokyo', 'dubai', 'singapore', 'new-york'];
const MONTH_SLUGS = process.env.MONTHS === 'all' ? MONTHS.map((m) => m.slug) : process.env.MONTHS ? process.env.MONTHS.split(',') : ['january', 'april', 'july', 'october'];
const PAIRS = [['london', 'manchester'], ['paris', 'lyon'], ['rome', 'milan'], ['madrid', 'barcelona']];

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const strip = (html) => decode(html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

function mainHtml(html) {
  let s = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  const h = s.indexOf('</header>');
  const f = s.lastIndexOf('<footer');
  return s.slice(h >= 0 ? h + 9 : 0, f >= 0 ? f : undefined);
}

// Prose: <p> aur <li> — tables, chips (<nav>), aur link-cards (<a> blocks) ke baghair
function prose(main) {
  const s = main.replace(/<table[\s\S]*?<\/table>/g, ' ').replace(/<nav[\s\S]*?<\/nav>/g, ' ').replace(/<a [^>]*class="[^"]*(?:block|flex)[^"]*"[\s\S]*?<\/a>/g, ' ');
  const parts = [...s.matchAll(/<(p|li)[\s>][\s\S]*?<\/\1>/g)].map((m) => strip(m[0]));
  return parts.filter(Boolean).join(' ');
}

const NAMES = [...new Set([...CITIES.map((c) => c.name), ...COUNTRIES.map((c) => c.name), ...MONTHS.map((m) => m.name)])]
  .sort((a, b) => b.length - a.length);
const nameRe = new RegExp(`\\b(${NAMES.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'g');
function templatize(text) {
  return text.replace(nameRe, 'X').replace(/[−-]?\d+(?:[.,]\d+)?/g, '#').toLowerCase();
}
function shingles(text, n = 5) {
  const w = text.split(/\s+/).filter(Boolean);
  const set = new Set();
  for (let i = 0; i + n <= w.length; i++) set.add(w.slice(i, i + n).join(' '));
  return set;
}
const jaccard = (a, b) => { let inter = 0; for (const x of a) if (b.has(x)) inter++; return inter / (a.size + b.size - inter || 1); };
const median = (arr) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const pct = (v) => `${Math.round(v * 100)}%`;

async function main() {
  const pages = [];
  for (const city of CITY_SLUGS) {
    const c = CITIES.find((x) => x.slug === city);
    const country = countryOfCity(c);
    for (const m of MONTH_SLUGS) {
      const path = `/weather/${country.slug}/${city}/${m}`;
      const r = await fetch(BASE + path);
      if (r.status !== 200) { console.log(`skip ${path} (${r.status})`); continue; }
      const main = mainHtml(await r.text());
      const text = strip(main);
      const p = prose(main);
      pages.push({ path, city, month: m, country: country.slug, t: templatize(text), sh: shingles(templatize(text)), words: text.split(/\s+/).length, proseWords: p.split(/\s+/).filter(Boolean).length, sentences: new Set(templatize(p).split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => x.split(' ').length >= 4)) });
    }
  }
  console.log(`Pages: ${pages.length} (${CITY_SLUGS.length} cities × ${MONTH_SLUGS.length} months)\n`);

  // Same-country + same-month pairs
  const pairScores = [];
  for (const [a, b] of PAIRS) for (const m of MONTH_SLUGS) {
    const pa = pages.find((p) => p.city === a && p.month === m);
    const pb = pages.find((p) => p.city === b && p.month === m);
    if (pa && pb) pairScores.push({ label: `${a}/${b} ${m}`, v: jaccard(pa.sh, pb.sh) });
  }
  // All pairs
  const all = [];
  const allPairs = [];
  for (let i = 0; i < pages.length; i++) for (let j = i + 1; j < pages.length; j++) {
    const v = jaccard(pages[i].sh, pages[j].sh);
    all.push(v);
    allPairs.push({ label: `${pages[i].city} ${pages[i].month} / ${pages[j].city} ${pages[j].month}`, v });
  }
  // Examples like the audit
  const ex = (a, am, b, bm) => {
    const pa = pages.find((p) => p.city === a && p.month === am);
    const pb = pages.find((p) => p.city === b && p.month === bm);
    return pa && pb ? pct(jaccard(pa.sh, pb.sh)) : 'n/a';
  };

  const sameMax = pairScores.length ? Math.max(...pairScores.map((p) => p.v)) : 0;
  console.log('Template overlap (5-word shingle Jaccard, numbers → #, names → X)');
  if (pairScores.length) console.log(`  same country + same month: max ${pct(sameMax)}  median ${pct(median(pairScores.map((p) => p.v)))}  (${pairScores.length} pairs)`);
  else console.log('  same country + same month: (no pairs in this run — skipped)');
  for (const p of [...pairScores].sort((x, y) => y.v - x.v).slice(0, 4)) console.log(`     ${p.label.padEnd(28)} ${pct(p.v)}`);
  console.log(`  all pairs:                 max ${pct(Math.max(...all))}  median ${pct(median(all))}  (${all.length} pairs)`);
  for (const p of [...allPairs].sort((x, y) => y.v - x.v).slice(0, 3)) console.log(`     ${p.label.padEnd(40)} ${pct(p.v)}`);
  console.log(`  examples: London Oct vs London Jul ${ex('london', 'october', 'london', 'july')} · London Oct vs Paris Oct ${ex('london', 'october', 'paris', 'october')} · London Oct vs Manchester Oct ${ex('london', 'october', 'manchester', 'october')} · Rome Apr vs Tokyo Apr ${ex('rome', 'april', 'tokyo', 'april')} · Dubai Jul vs Singapore Jan ${ex('dubai', 'july', 'singapore', 'january')}`);

  const pw = pages.map((p) => p.proseWords);
  console.log(`\nProse words per page (<p>/<li>, no tables/chips/cards): min ${Math.min(...pw)}  median ${median(pw)}  max ${Math.max(...pw)}   (all text: median ${median(pages.map((p) => p.words))})`);

  let common = [...pages[0].sentences];
  for (const p of pages.slice(1)) common = common.filter((s) => p.sentences.has(s));
  console.log(`\nSentences on EVERY page (template form): ${common.length}`);
  for (const s of common.slice(0, 15)) console.log(`   • ${s.slice(0, 140)}`);

  const pass = sameMax <= 0.5 && Math.min(...pw) >= 350 && common.length <= 3;
  console.log(`\nRESULT: ${pass ? 'PASS' : 'FAIL'}  (targets: same-country/month max ≤ 50%, prose ≥ 350 words, common sentences ≤ 3)`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
