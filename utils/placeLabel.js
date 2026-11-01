// ─────────────────────────────────────────────────────────────
//  Backend ka shehar/mulk (hamesha English: "Sapporo", "Japan") → user ki
//  zaban mein dikhane ke liye. Home card, trip planner, events — sab ek jaisa.
//  • List ka shehar → curated naam (ロンドン, Londra)
//  • List se bahar + user ne kanji/kana mein likha (札幌) → wahi
//  • Mulk → data/countries.js + Intl (日本, Germania)
//  • Ulta: user ka likha mulk (日本, Giappone, Deutschland) → backend ka English naam
// ─────────────────────────────────────────────────────────────
import { COUNTRIES } from '../data/countries.js';
import { countryName } from '../i18n/places.js';
import { cityLabel, exactCity, normalizeText } from './fuzzyCity.js';
import { LOCALES } from '../i18n/config.js';

// "United Kingdom" / "USA" (backend / cities.js ka naam) → mulk object
const COUNTRY_BY_NAME = new Map();
for (const c of COUNTRIES) {
  for (const n of [c.source, c.name]) if (n) COUNTRY_BY_NAME.set(n.toLowerCase(), c);   // Hong Kong: source null
}

export function countryLabel(country, lang) {
  if (lang === 'en') return country;            // English site bilkul pehle jaisi ("USA")
  const c = COUNTRY_BY_NAME.get(String(country || '').toLowerCase());
  return c ? countryName(lang, c) : country;
}

const LOCAL_SCRIPT = /[぀-ヿ㐀-鿿]/;

export function cityDisplayName(name, lang, typed) {
  const known = exactCity(name || '');
  if (known) return cityLabel(known.slug, known.name, lang);
  if (lang !== 'en' && typed && LOCAL_SCRIPT.test(typed)) return typed.trim();
  return name || typed || '';
}

// Har zaban ka mulk naam (normalized, spaces bina) → backend ka naam (cities.js `country`)
let COUNTRY_BY_ANY_NAME = null;
const countryKey = (s) => normalizeText(s).replace(/ /g, '');

export function canonicalCountryName(text) {
  if (!COUNTRY_BY_ANY_NAME) {
    COUNTRY_BY_ANY_NAME = new Map();
    for (const c of COUNTRIES) {
      const backend = c.source || c.name;
      for (const n of [c.source, c.name, ...LOCALES.map((l) => countryName(l, c))]) {
        if (n) COUNTRY_BY_ANY_NAME.set(countryKey(n), backend);
      }
    }
  }
  return COUNTRY_BY_ANY_NAME.get(countryKey(text)) || String(text || '').trim();
}
