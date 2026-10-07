// ─────────────────────────────────────────────────────────────
//  ICON CHECK (audit 3.1 / Group 4.3) — plain Node, koi dependency nahi
//
//  Har WMO code 0–99 × din/raat:
//   • map wale codes ki SVG file public/icons/meteocons/ mein maujood ho
//     (Oct 2026 se icons apni site par — koi CDN nahi)
//   • file asli SVG ho, aur us mein script / bahar ka link na ho
//   • map se bahar ke codes "cloudy" (neutral) par girein — kabhi suraj nahi
//   • raat ko din wala icon na bache jahan raat ka version maujood hai
//  Chalana:  node scripts/check-icons.mjs     (internet ki zaroorat nahi)
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import { getMeteoconIcon, hasKnownIcon, WMO_TO_METEOCONS } from '../utils/meteoconsMap.js';

const PUBLIC = path.join(import.meta.dirname, '..', 'public');
let failures = 0;
const fail = (msg) => { failures++; console.log('FAIL ', msg); };

const urls = new Map(); // url → [labels]
for (let code = 0; code <= 99; code++) {
  for (const night of [false, true]) {
    const url = getMeteoconIcon(code, night);
    const name = url.split('/').pop().replace('.svg', '');
    const label = `${code}/${night ? 'night' : 'day'}`;
    if (!url.startsWith('/icons/meteocons/')) fail(`${label}: icon is not local (${url})`);
    if (!hasKnownIcon(code)) {
      if (name !== 'cloudy') fail(`${label}: unknown code should be "cloudy", got "${name}"`);
      continue;
    }
    if (night && name.includes('-day')) fail(`${label}: night uses a day icon "${name}"`);
    if (!night && name.includes('-night')) fail(`${label}: day uses a night icon "${name}"`);
    urls.set(url, [...(urls.get(url) || []), label]);
  }
}
for (const v of [null, undefined, '', 'abc']) {
  const name = getMeteoconIcon(v).split('/').pop();
  if (name !== 'cloudy.svg') fail(`code ${JSON.stringify(v)} should be cloudy, got ${name}`);
}
urls.set(getMeteoconIcon(null), urls.get(getMeteoconIcon(null)) || ['unknown']);

console.log(`${Object.keys(WMO_TO_METEOCONS).length} mapped WMO codes → ${urls.size} unique icon files; checking public/…`);
for (const [url, labels] of urls) {
  const file = path.join(PUBLIC, url);
  const name = url.split('/').pop();
  if (!fs.existsSync(file)) { fail(`${name} missing in public${url} (${labels.join(' ')})`); continue; }
  const svg = fs.readFileSync(file, 'utf8');
  if (!svg.trimStart().startsWith('<svg')) { fail(`${name} is not an SVG`); continue; }
  if (/<script|\son\w+=|(?:xlink:)?href="https?:|url\(\s*["']?https?:/i.test(svg)) { fail(`${name} has a script or external reference`); continue; }
  console.log('PASS ', name.padEnd(32), `${svg.length} B`.padEnd(8), labels.join(' '));
}
console.log(`\n${failures ? `${failures} failed` : 'all passed'}`);
process.exit(failures ? 1 : 0);
