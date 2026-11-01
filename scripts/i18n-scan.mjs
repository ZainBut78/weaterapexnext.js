// ─────────────────────────────────────────────────────────────
//  i18n scan — components/pages mein hard-coded English dhoondhna
//
//  Chalana:  node scripts/i18n-scan.mjs [--summary]
//  Dekhta hai: JSX ke beech ka text (>Some words<), aur placeholder /
//  aria-label / title / alt attributes mein likhi English. Heuristic hai —
//  har nateeja galti nahi (brand naam, units), magar har asal galti yahan aati hai.
//  IGNORE neeche: jo jaan boojh kar English rehta hai (brand, api-docs page).
// ─────────────────────────────────────────────────────────────
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['app', 'components'];
const SKIP_FILES = [/app[\\/]api[\\/]/, /app[\\/]og-image/, /app[\\/]sitemap/, /app[\\/]robots\.js/];
// Jo text English hi rehta hai (brand / naam / code)
const IGNORE_TEXT = /^(WeatherApex|360 Business Consultant|Zain Butt|Syed Sarim|LinkedIn|API|Pexels|Open-Meteo|°[CF]|km\/h|mph|mm|in|UV|AQI|N|S|E|W|AM|PM|OK|ZB|SS|JSON|cURL|Python|JavaScript|GET|POST)$/;

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|mjs)$/.test(f)) out.push(p);
  }
  return out;
}

const files = ROOTS.flatMap((r) => walk(r)).filter((f) => !SKIP_FILES.some((rx) => rx.test(f)));
const results = [];
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*') || t.startsWith('{/*')) return;
    const hits = [];
    // >text< on one line
    for (const m of line.matchAll(/>([^<>{}]*[A-Za-z]{3,}[^<>{}]*)</g)) hits.push(m[1].trim());
    // attributes
    for (const m of line.matchAll(/\b(placeholder|aria-label|title|alt)="([^"]*[A-Za-z]{3,}[^"]*)"/g)) hits.push(`${m[1]}="${m[2]}"`);
    // bare JSX text line (line that is only words, inside JSX)
    if (/^[A-Z][A-Za-z'’,.!?:;()\- ]{6,}$/.test(t) && !/[=;{}]/.test(t) && !/^(import|export|return|const|let|if|else)\b/.test(t)) hits.push(t);
    for (const h of hits) if (!IGNORE_TEXT.test(h)) results.push(`${relative('.', f)}:${i + 1}  ${h.slice(0, 100)}`);
  });
}

if (process.argv.includes('--summary')) {
  const by = {};
  for (const r of results) { const f = r.split(':')[0]; by[f] = (by[f] || 0) + 1; }
  for (const [f, n] of Object.entries(by).sort((a, b) => b[1] - a[1])) console.log(String(n).padStart(4), f);
} else {
  console.log(results.join('\n'));
}
console.log(`\n${results.length} possible hard-coded strings`);
