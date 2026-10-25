// Mulk list generator (Oct 2026): data/countries.js mein naye mulk + backend weather/countries.py.
// Chalana: node scripts/gen-countries.mjs data/countries.js <extra.js> <backend>/weather/countries.py
// (extra.js ki lines COUNTRIES ke aakhir mein — pehle se maujood mulk nahi badalte)
// Generates: (1) extra COUNTRIES entries for the frontend, (2) backend ISO2 -> name map.
// Usage: node gen-countries.mjs <frontend countries.js> <out-frontend-js> <out-backend-py>
import fs from 'node:fs';

const [, , countriesFile, outJs, outPy] = process.argv;
const src = fs.readFileSync(countriesFile, 'utf8');
const existing = [...src.matchAll(/\{ source: (null|'[^']*'), name: '([^']*)', slug: '([^']*)', iso2: '([A-Z]{2})', region: '([^']*)' \}/g)]
  .map((m) => ({ source: m[1] === 'null' ? null : m[1].slice(1, -1), name: m[2], slug: m[3], iso2: m[4], region: m[5] }));

const R = {
  europe: 'AD AL AT AX BA BE BG BY CH CY CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM UA VA XK',
  'north-america': 'US CA MX BM GL PM',
  'latin-america': 'AG AI AR AW BB BL BO BQ BR BS BZ CL CO CR CU CW DM DO EC FK GD GF GP GT GY HN HT JM KN KY LC MF MQ MS NI PA PE PR PY SR SV SX TC TT UY VC VE VG VI',
  'middle-east-africa': 'AE BH IL IQ IR JO KW LB OM PS QA SA SY TR YE EG AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EH ER ET GA GH GM GN GQ GW KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RE RW SC SD SH SL SN SO SS ST SZ TD TG TN TZ UG YT ZA ZM ZW',
  asia: 'AF AM AZ BD BN BT CN GE HK ID IN JP KG KH KP KR KZ LA LK MM MN MO MV MY NP PH PK SG TH TJ TL TM TW UZ VN',
  oceania: 'AS AU CK FJ FM GU KI MH MP NC NF NR NU NZ PF PG PN PW SB TK TO TV VU WF',
};
const regionOf = new Map();
for (const [k, v] of Object.entries(R)) for (const c of v.split(' ')) regionOf.set(c, k);

const dn = new Intl.DisplayNames(['en'], { type: 'region' });
const OVERRIDE = {
  CD: 'DR Congo', CG: 'Republic of the Congo', CI: 'Ivory Coast', PS: 'Palestine', VI: 'US Virgin Islands',
  MO: 'Macau', HK: 'Hong Kong', MM: 'Myanmar', XK: 'Kosovo', FM: 'Micronesia', TL: 'Timor-Leste',
  KP: 'North Korea', KR: 'South Korea', CZ: 'Czech Republic', TR: 'Turkey', VA: 'Vatican City',
};
const nice = (code) => (OVERRIDE[code] || dn.of(code))
  .replace(/ & /g, ' and ').replace(/^St\. /, 'Saint ').replace(/ SAR China$/, '').replace(/’/g, "'");
const slugify = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const have = new Set(existing.map((c) => c.iso2));
const added = [];
for (const [code, region] of regionOf) {
  if (have.has(code)) continue;
  const name = nice(code);
  if (!name || name === code) throw new Error(`no name for ${code}`);
  added.push({ source: name, name, slug: slugify(name), iso2: code, region });
}
const order = Object.keys(R);
added.sort((a, b) => order.indexOf(a.region) - order.indexOf(b.region) || a.name.localeCompare(b.name));
const slugs = new Set(existing.map((c) => c.slug));
for (const c of added) { if (slugs.has(c.slug)) throw new Error(`dup slug ${c.slug}`); slugs.add(c.slug); }

const q = (s) => `'${s.replace(/'/g, "\\'")}'`;
fs.writeFileSync(outJs, added.map((c) => `  { source: ${q(c.source)}, name: ${q(c.name)}, slug: ${q(c.slug)}, iso2: ${q(c.iso2)}, region: ${q(c.region)} },`).join('\n') + '\n');

// Backend: ISO2 -> wahi naam jo frontend `source` mein hai (existing: 'USA', 'UAE'…)
const all = [...existing.map((c) => [c.iso2, c.source || c.name]), ...added.map((c) => [c.iso2, c.source])].sort();
const py = `"""ISO2 → mulk ka naam — wahi jo frontend data/countries.js ka \`source\` hai.\n\nGenerated (Oct 2026) from the frontend list; naya shehar add karte waqt\ngeocoding ka country_code isi se naam banta hai, taake frontend ke page\nhamesha milein (GeoNames kuch jazeeron ka naam nahi deta, jaise TC/VI/CW).\n"""\n\nCOUNTRY_NAME_BY_ISO2 = {\n${all.map(([k, v]) => `    "${k}": "${v.replace(/"/g, '\\"')}",`).join('\n')}\n}\n`;
fs.writeFileSync(outPy, py);
console.log(`existing ${existing.length}, added ${added.length}, total ${all.length}`);
