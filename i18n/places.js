// ─────────────────────────────────────────────────────────────
//  Jagahon ke naam + grammar har zaban mein (i18n Phase 3) — server + client
//
//  cityName(lang, slug, fallback)   München, Londres, 東京 …
//  countryName(lang, country)       Intl.DisplayNames (iso2) + chand override
//  inCity(lang, city)               in Berlin · à Paris · a Roma / ad Atene · en Madrid
//  inCountry(lang, country)         in Deutschland · en France · au Japon · aux États-Unis
//                                   · in Italia · negli Stati Uniti · en Japón …
//  toCountry(lang, country)         nach Japan / in die USA · a Japón / al Reino Unido
//  English: hamesha asal naam (pehle jaisa).
// ─────────────────────────────────────────────────────────────
import { CITY_IN, CITY_NAMES, COUNTRY_GRAMMAR } from '../data/placeNames.js';
import { INTL_LOCALE } from './config.js';

// Intl ke lambe / bracket wale naam
const NAME_OVERRIDE = {
  HK: { de: 'Hongkong', it: 'Hong Kong', fr: 'Hong Kong', es: 'Hong Kong', ja: '香港' },
  US: { de: 'USA', ja: 'アメリカ' },
  CZ: { it: 'Repubblica Ceca' },
  MO: { de: 'Macau', it: 'Macao', fr: 'Macao', es: 'Macao', ja: 'マカオ' },
};

const displayNames = {};
function intlRegion(lang, iso2) {
  if (!iso2) return null;
  try {
    displayNames[lang] ||= new Intl.DisplayNames([INTL_LOCALE[lang] || lang], { type: 'region' });
    const n = displayNames[lang].of(iso2);
    return n && n !== iso2 ? n.replace(/\s*\([^)]*\)\s*$/, '') : null;   // "Myanmar (Birmanie)" → "Myanmar"
  } catch {
    return null;
  }
}

/** Shehar ka naam — slug se table, warna asal (DB / backend) naam.
 *  cityName(lang, city) bhi: registry ka shehar → curated naam, warna backend ke
 *  `names` (DB ke naye shehar, Nov 2026), warna English. */
export function cityName(lang, slug, fallback) {
  if (slug && typeof slug === 'object') {
    const city = slug;
    if (lang === 'en') return city.name;
    return CITY_NAMES[city.slug]?.[lang] || city.names?.[lang] || city.name;
  }
  if (lang === 'en') return fallback;
  return CITY_NAMES[slug]?.[lang] || fallback;
}

/** country: { iso2, name } (data/countries.js) — ya sirf naam string (purana data) */
export function countryName(lang, country) {
  const name = typeof country === 'string' ? country : country?.name;
  if (lang === 'en' || !country || typeof country === 'string') return name;
  return NAME_OVERRIDE[country.iso2]?.[lang] || intlRegion(lang, country.iso2) || name;
}

const VOWEL = /^[aeiouyàâäéèêëîïôöùûüœæ]/i;
const startsWithA = (s) => /^[aàá]/i.test(s);

export function inCity(lang, city) {
  const name = cityName(lang, city);
  const over = CITY_IN[city.slug]?.[lang];
  if (over) return over;
  switch (lang) {
    case 'de': return `in ${name}`;
    case 'it': return `${startsWithA(name) ? 'ad' : 'a'} ${name}`;
    case 'fr': return `à ${name}`;
    case 'es': return `en ${name}`;
    default: return name;
  }
}

export function inCountry(lang, country) {
  const name = countryName(lang, country);
  const over = COUNTRY_GRAMMAR[lang]?.[country?.iso2]?.in;
  if (over) return over;
  switch (lang) {
    case 'de': return `in ${name}`;
    case 'it': return `in ${name}`;
    case 'es': return `en ${name}`;
    case 'fr': {
      if (/e$/i.test(name) || VOWEL.test(name)) return `en ${name}`;
      return `au ${name}`;
    }
    default: return name;
  }
}

export function toCountry(lang, country) {
  const over = COUNTRY_GRAMMAR[lang]?.[country?.iso2]?.to;
  if (over) return over;
  const name = countryName(lang, country);
  switch (lang) {
    case 'de': return `nach ${name}`;
    case 'es': return `a ${name}`;
    default: return inCountry(lang, country);   // fr / it: wahi preposition
  }
}
