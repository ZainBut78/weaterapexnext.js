// ─────────────────────────────────────────────────────────────
//  Month pages: kitna text template hai (month pages round, Step 2)
//    node scripts/month-template-report.mjs                 (en, 16 shehar × 12 mahine)
//    LANG_CODE=de node scripts/month-template-report.mjs
//    BASE=http://localhost:3100  API=http://127.0.0.1:8000/api
//  Normalise: shehar, mulk, mahine → token, numbers → N.
//   template share: un jumlon ke alfaaz jo ≥ 25% pages par hain
//   unique share:   alfaaz jo aise 5-shingle mein hain jo sirf ek page par hai
//   over 8%:        generated jumle (<p>, <li>) jo > 8% pages par hain
// ─────────────────────────────────────────────────────────────
import { buildRegistry } from '../utils/cityRegistryCore.js';
import { MONTHS } from '../utils/climateMath.js';

const BASE = (process.env.BASE || 'http://localhost:3100').replace(/\/+$/, '');
const API = (process.env.API || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');
const LANG = process.env.LANG_CODE || 'en';
const TOP = Number(process.env.TOP || 12);
const SLUGS = ['london', 'dubai', 'tokyo', 'singapore', 'new-york', 'rome', 'berlin', 'reykjavik',
  'moscow', 'quito', 'honolulu', 'buenos-aires', 'istanbul', 'brisbane', 'seoul', 'madrid'];

const decode = (s) => s.replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');

function blocksOf(html) {
  const main = /<main[\s\S]*<\/main>/.exec(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, ''))?.[0] || '';
  const out = [];
  const rx = /<(p|li|h1|h2|h3|td|th|a)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = rx.exec(main))) {
    const text = decode(m[2].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    if (text) out.push({ tag: m[1], text });
  }
  return out;
}

// Decimal (8.9°C, 8,9 °C) par nahi: sirf jab agla lafz bari harf / nayi baat se shuru ho
const sentences = (t) => t.split(/(?<=[。！？])|(?<=[.!?:])\s+(?=[\p{Lu}¿¡])/u).map((s) => s.trim()).filter(Boolean);
const words = (t) => (LANG === 'ja' ? [...t.replace(/\s+/g, '')] : t.split(/\s+/).filter(Boolean));

function normaliser(extra) {
  const names = [...extra].filter(Boolean).sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const rx = new RegExp(names.join('|'), 'gi');
  return (s) => s.replace(rx, ' X ')
    .replace(/[-−]?\d+(?:[.,:]\d+)*/g, ' N ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

async function main() {
  const idx = await (await fetch(`${API}/weather/cities/?complete=1`)).json();
  const reg = buildRegistry(idx.cities);
  const prefix = LANG === 'en' ? '' : `/${LANG}`;
  const paths = SLUGS.flatMap((slug) => MONTHS.map((m) => {
    const p = reg.monthPath(slug, m.slug);
    if (!p) throw new Error(`no path: ${slug}`);
    return `${prefix}${p}`;
  }));

  const pages = [];
  for (let i = 0; i < paths.length; i += 4) {
    const batch = paths.slice(i, i + 4);
    pages.push(...await Promise.all(batch.map(async (path) => {
      const res = await fetch(`${BASE}${path}`);
      if (!res.ok) throw new Error(`${res.status} ${path}`);
      return { path, blocks: blocksOf(await res.text()) };
    })));
  }

  // Mahine aur shehar: is zaban ke page ki breadcrumb / naam ke bajaye har page ka apna
  // H1 use nahi karte: seedha link text se (table + "other cities" ke naam) token.
  const names = new Set();
  for (const p of pages) for (const b of p.blocks) if (b.tag === 'a' && b.text.length < 25) names.add(b.text.replace(/^[-−]?\d+[°\s\S]{0,4}\s*/, ''));
  for (const s of idx.cities) names.add(s.name);
  const norm = normaliser(names);

  const seen = new Map();        // normalised sentence → { pages, sample, generated }
  for (const p of pages) {
    p.sents = [];
    for (const b of p.blocks) {
      for (const s of sentences(b.text)) {
        const n = norm(s);
        if (!n) continue;
        p.sents.push({ n, w: words(s).length });
        const e = seen.get(n) || { pages: new Set(), sample: s, generated: false };
        e.pages.add(p.path);
        if ((b.tag === 'p' || b.tag === 'li') && words(s).length >= 4) e.generated = true;
        seen.set(n, e);
      }
    }
  }

  const total = pages.reduce((a, p) => a + p.sents.reduce((x, s) => x + s.w, 0), 0);
  const quarter = pages.length * 0.25;
  const template = pages.reduce((a, p) => a + p.sents.reduce((x, s) => x + (seen.get(s.n).pages.size >= quarter ? s.w : 0), 0), 0);

  const shingles = new Map();
  for (const p of pages) {
    p.w = p.blocks.flatMap((b) => words(b.text.toLowerCase()));
    const own = new Set();
    for (let i = 0; i + 5 <= p.w.length; i++) own.add(p.w.slice(i, i + 5).join(' '));
    for (const k of own) shingles.set(k, (shingles.get(k) || 0) + 1);
  }
  let uniqueWords = 0;
  let allWords = 0;
  for (const p of pages) {
    const mark = new Array(p.w.length).fill(false);
    for (let i = 0; i + 5 <= p.w.length; i++) {
      if (shingles.get(p.w.slice(i, i + 5).join(' ')) === 1) for (let j = i; j < i + 5; j++) mark[j] = true;
    }
    uniqueWords += mark.filter(Boolean).length;
    allWords += mark.length;
  }

  const gen = [...seen.values()].filter((e) => e.generated).sort((a, b) => b.pages.size - a.pages.size);
  const over = gen.filter((e) => e.pages.size > pages.length * 0.08);
  console.log(`lang ${LANG}, pages ${pages.length}`);
  console.log(`template share  ${((template / total) * 100).toFixed(1)}%`);
  console.log(`unique share    ${((uniqueWords / allWords) * 100).toFixed(1)}%`);
  console.log(`most repeated   ${gen[0]?.pages.size} pages (${((gen[0]?.pages.size / pages.length) * 100).toFixed(0)}%)`);
  console.log(`over 8%         ${over.length} sentences`);
  for (const e of gen.slice(0, TOP)) console.log(`  ${String(e.pages.size).padStart(3)}  ${e.sample.slice(0, 120)}`);
}

await main();
