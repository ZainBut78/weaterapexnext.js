// ─────────────────────────────────────────────────────────────
//  ICON CHECK (audit 3.1 / Group 4.3) — plain Node, koi dependency nahi
//
//  Har WMO code 0–99 × din/raat:
//   • map wale codes ka Meteocons URL 200 de (CDN par file maujood)
//   • map se bahar ke codes "cloudy" (neutral) par girein — kabhi suraj nahi
//   • raat ko din wala icon na bache jahan raat ka version maujood hai
//  Chalana:  node scripts/check-icons.mjs     (internet chahiye — CDN check)
// ─────────────────────────────────────────────────────────────
import { getMeteoconIcon, hasKnownIcon, WMO_TO_METEOCONS } from '../utils/meteoconsMap.js';

let failures = 0;
const fail = (msg) => { failures++; console.log('FAIL ', msg); };

const urls = new Map(); // url → [labels]
for (let code = 0; code <= 99; code++) {
  for (const night of [false, true]) {
    const url = getMeteoconIcon(code, night);
    const name = url.split('/').pop().replace('.svg', '');
    const label = `${code}/${night ? 'night' : 'day'}`;
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

console.log(`${Object.keys(WMO_TO_METEOCONS).length} mapped WMO codes → ${urls.size} unique icon URLs; checking CDN…`);
const results = await Promise.all([...urls.keys()].map(async (url) => {
  try {
    const r = await fetch(url, { method: 'GET' });
    return [url, r.status];
  } catch (e) {
    return [url, e.message];
  }
}));
for (const [url, status] of results) {
  const name = url.split('/').pop();
  if (status === 200) console.log('PASS ', String(status).padEnd(4), name.padEnd(32), urls.get(url).join(' '));
  else fail(`${name} → ${status} (${urls.get(url).join(' ')})`);
}
console.log(`\n${failures ? `${failures} failed` : 'all passed'}`);
process.exit(failures ? 1 : 0);
