// ─────────────────────────────────────────────────────────────
//  SEASON + DAYLIGHT CHECK (content round, owner item 2)
//
//  DB / backend ki zaroorat nahi: season aur daylight sirf lat/lon/tz
//  (data/cities.js) + mahine se bante hain (utils/monthNarrative.js,
//  utils/solar.js). Southern hemisphere yahan test hota hai, kyun ke local
//  DB mein koi southern shehar mukammal nahi.
//
//  Chalana:  npm run season-check      (exit 1 agar koi check fail)
// ─────────────────────────────────────────────────────────────
import { getCity } from '../data/cities.js';
import { seasonOf } from '../utils/monthNarrative.js';
import { monthDaylight, hoursMinutes } from '../utils/solar.js';

let failed = 0;
const rows = [];
function check(label, cond, detail) {
  if (!cond) failed++;
  rows.push(`${cond ? 'PASS' : 'FAIL'}  ${label.padEnd(58)} ${detail}`);
}

// Saal ke 12 mahinon ka daylight (15 tareekh) — sab se lamba / chhota din
const yearDays = (city) => Array.from({ length: 12 }, (_, i) => monthDaylight(city, i + 1).dayMinutes);
const seasonTxt = (s) => (s.kind === 'temperate' ? `${s.stage} ${s.name} (${s.hemisphere})` : s.kind === 'tropical-even' ? 'warm all year' : s.name || 'between seasons');

// 1) Sydney October = spring + din lambe ho rahe
{
  const c = getCity('sydney');
  const s = seasonOf(null, 10, c.lat);
  const d = monthDaylight(c, 10);
  check('Sydney October → spring, southern hemisphere', s.name === 'spring' && s.hemisphere === 'south', seasonTxt(s));
  check('Sydney October → days getting longer', d.change > 0, `${hoursMinutes(d.dayMinutes)}, +${hoursMinutes(d.change)} vs mid-Sep · ${d.sunrise}–${d.sunset}`);
}
// 2) Buenos Aires June = winter (+ June ke aas paas sab se chhote din)
{
  const c = getCity('buenos-aires');
  const s = seasonOf(null, 6, c.lat);
  const d = monthDaylight(c, 6);
  const days = yearDays(c);
  check('Buenos Aires June → winter, southern hemisphere', s.name === 'winter' && s.hemisphere === 'south', seasonTxt(s));
  check('Buenos Aires June → shortest days of the year', d.dayMinutes === Math.min(...days), `${hoursMinutes(d.dayMinutes)} · ${d.sunrise}–${d.sunset}`);
}
// 3) Singapore = "warm all year" (koi bhi mahina)
{
  const c = getCity('singapore');
  const all = Array.from({ length: 12 }, (_, i) => seasonOf(null, i + 1, c.lat));
  const d = yearDays(c);
  check('Singapore → "warm all year" in all 12 months', all.every((s) => s.kind === 'tropical-even'), seasonTxt(all[0]));
  check('Singapore → day length almost constant (< 15 min range)', Math.max(...d) - Math.min(...d) < 15, `${hoursMinutes(Math.min(...d))} – ${hoursMinutes(Math.max(...d))}`);
}
// 4) London December = winter + sab se chhote din
{
  const c = getCity('london');
  const s = seasonOf(null, 12, c.lat);
  const d = monthDaylight(c, 12);
  const days = yearDays(c);
  check('London December → winter, northern hemisphere', s.name === 'winter' && s.hemisphere === 'north', seasonTxt(s));
  check('London December → shortest days of the year', d.dayMinutes === Math.min(...days), `${hoursMinutes(d.dayMinutes)} · ${d.sunrise}–${d.sunset}`);
}
// Extra: hemispheres ulte — Sydney January = summer, Cape Town July = winter
{
  const syd = seasonOf(null, 1, getCity('sydney').lat);
  const cpt = seasonOf(null, 7, getCity('cape-town').lat);
  check('Sydney January → summer', syd.name === 'summer', seasonTxt(syd));
  check('Cape Town July → winter', cpt.name === 'winter', seasonTxt(cpt));
}

console.log(rows.join('\n'));
console.log(`\n${failed ? `FAIL (${failed})` : 'PASS'}`);
process.exit(failed ? 1 : 0);
