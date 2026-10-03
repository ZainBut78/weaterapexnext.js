// ─────────────────────────────────────────────────────────────
//  GUIDES LIST — travel notes ka haal (content round C3)
//
//  content/guides/<city>/<month>.md         → published (month page par dikhta)
//  content/guides-drafts/<city>/<month>.md  → draft (site par NAHI)
//  Words = "## Sources to check" se pehle ka text (HTML comments ke baghair).
//  Chalana:  npm run guides:list
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MONTHS } from '../utils/climateMath.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'content');
const DIRS = { published: path.join(ROOT, 'guides'), draft: path.join(ROOT, 'guides-drafts') };

const cities = new Set();
for (const d of Object.values(DIRS)) {
  if (fs.existsSync(d)) for (const c of fs.readdirSync(d)) if (fs.statSync(path.join(d, c)).isDirectory()) cities.add(c);
}

const words = (file) => fs.readFileSync(file, 'utf8')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/^##\s+Sources to check[\s\S]*$/m, '')
  .split(/\s+/).filter(Boolean).length;

let pub = 0;
let draft = 0;
console.log(`${'city'.padEnd(14)} ${MONTHS.map((m) => m.short).join('  ')}   published  draft`);
for (const city of [...cities].sort()) {
  let p = 0;
  let d = 0;
  const cells = MONTHS.map((m) => {
    const pf = path.join(DIRS.published, city, `${m.slug}.md`);
    const df = path.join(DIRS.draft, city, `${m.slug}.md`);
    if (fs.existsSync(pf)) { p++; return fs.existsSync(df) ? 'P+D' : ' P '; }
    if (fs.existsSync(df)) { d++; return ' D '; }
    return ' · ';
  });
  pub += p;
  draft += d;
  console.log(`${city.padEnd(14)} ${cells.join('  ')}   ${String(p).padStart(9)}  ${String(d).padStart(5)}`);
}
console.log('\nP = published (content/guides) · D = draft only (content/guides-drafts) · P+D = both · · = none');
console.log(`Total: ${pub} published, ${draft} drafts`);

// Words per file (120–250 target)
const bad = [];
for (const [kind, dir] of Object.entries(DIRS)) {
  if (!fs.existsSync(dir)) continue;
  for (const city of fs.readdirSync(dir)) {
    const cd = path.join(dir, city);
    if (!fs.statSync(cd).isDirectory()) continue;
    for (const f of fs.readdirSync(cd).filter((x) => x.endsWith('.md'))) {
      const w = words(path.join(cd, f));
      if (w < 120 || w > 250) bad.push(`${kind} ${city}/${f}: ${w} words`);
    }
  }
}
console.log(bad.length ? `\nOutside 120–250 words:\n  ${bad.join('\n  ')}` : '\nAll notes are 120–250 words.');
