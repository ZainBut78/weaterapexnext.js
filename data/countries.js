// ─────────────────────────────────────────────────────────────
//  COUNTRIES — URL slug + display naam (Phase C 1.1, owner approved)
//
//  `cities.js` (backend ki copy) mein mulk ke naam chhote/alag hain
//  ("USA", "UAE"). URL aur page par hamesha yahan wala naam/slug:
//    USA → United States (united-states), UAE → United Arab Emirates.
//  Hong Kong: backend mein China ke andar, magar owner ke faisle se alag
//  territory (log "hong kong weather" search karte hain).
//  Regions: backend ke sirf 3 (europe/usa/other) → hub ke liye 6.
// ─────────────────────────────────────────────────────────────
import { CITIES } from './cities.js';

export const REGIONS = [
  { key: 'europe', name: 'Europe' },
  { key: 'north-america', name: 'North America' },
  { key: 'latin-america', name: 'Latin America' },
  { key: 'middle-east-africa', name: 'Middle East & Africa' },
  { key: 'asia', name: 'Asia' },
  { key: 'oceania', name: 'Oceania' },
];

// source = `cities.js` ka country value
export const COUNTRIES = [
  { source: 'Austria', name: 'Austria', slug: 'austria', iso2: 'AT', region: 'europe' },
  { source: 'Belgium', name: 'Belgium', slug: 'belgium', iso2: 'BE', region: 'europe' },
  { source: 'Czech Republic', name: 'Czech Republic', slug: 'czech-republic', iso2: 'CZ', region: 'europe' },
  { source: 'Denmark', name: 'Denmark', slug: 'denmark', iso2: 'DK', region: 'europe' },
  { source: 'Finland', name: 'Finland', slug: 'finland', iso2: 'FI', region: 'europe' },
  { source: 'France', name: 'France', slug: 'france', iso2: 'FR', region: 'europe' },
  { source: 'Germany', name: 'Germany', slug: 'germany', iso2: 'DE', region: 'europe' },
  { source: 'Greece', name: 'Greece', slug: 'greece', iso2: 'GR', region: 'europe' },
  { source: 'Hungary', name: 'Hungary', slug: 'hungary', iso2: 'HU', region: 'europe' },
  { source: 'Ireland', name: 'Ireland', slug: 'ireland', iso2: 'IE', region: 'europe' },
  { source: 'Italy', name: 'Italy', slug: 'italy', iso2: 'IT', region: 'europe' },
  { source: 'Netherlands', name: 'Netherlands', slug: 'netherlands', iso2: 'NL', region: 'europe' },
  { source: 'Norway', name: 'Norway', slug: 'norway', iso2: 'NO', region: 'europe' },
  { source: 'Poland', name: 'Poland', slug: 'poland', iso2: 'PL', region: 'europe' },
  { source: 'Portugal', name: 'Portugal', slug: 'portugal', iso2: 'PT', region: 'europe' },
  { source: 'Russia', name: 'Russia', slug: 'russia', iso2: 'RU', region: 'europe' },
  { source: 'Spain', name: 'Spain', slug: 'spain', iso2: 'ES', region: 'europe' },
  { source: 'Sweden', name: 'Sweden', slug: 'sweden', iso2: 'SE', region: 'europe' },
  { source: 'Switzerland', name: 'Switzerland', slug: 'switzerland', iso2: 'CH', region: 'europe' },
  { source: 'United Kingdom', name: 'United Kingdom', slug: 'united-kingdom', iso2: 'GB', region: 'europe' },
  { source: 'USA', name: 'United States', slug: 'united-states', iso2: 'US', region: 'north-america' },
  { source: 'Canada', name: 'Canada', slug: 'canada', iso2: 'CA', region: 'north-america' },
  { source: 'Mexico', name: 'Mexico', slug: 'mexico', iso2: 'MX', region: 'north-america' },
  { source: 'Argentina', name: 'Argentina', slug: 'argentina', iso2: 'AR', region: 'latin-america' },
  { source: 'Brazil', name: 'Brazil', slug: 'brazil', iso2: 'BR', region: 'latin-america' },
  { source: 'Colombia', name: 'Colombia', slug: 'colombia', iso2: 'CO', region: 'latin-america' },
  { source: 'Costa Rica', name: 'Costa Rica', slug: 'costa-rica', iso2: 'CR', region: 'latin-america' },
  { source: 'Ecuador', name: 'Ecuador', slug: 'ecuador', iso2: 'EC', region: 'latin-america' },
  { source: 'UAE', name: 'United Arab Emirates', slug: 'united-arab-emirates', iso2: 'AE', region: 'middle-east-africa' },
  { source: 'Turkey', name: 'Turkey', slug: 'turkey', iso2: 'TR', region: 'middle-east-africa' },
  { source: 'Iran', name: 'Iran', slug: 'iran', iso2: 'IR', region: 'middle-east-africa' },
  { source: 'Egypt', name: 'Egypt', slug: 'egypt', iso2: 'EG', region: 'middle-east-africa' },
  { source: 'Nigeria', name: 'Nigeria', slug: 'nigeria', iso2: 'NG', region: 'middle-east-africa' },
  { source: 'South Africa', name: 'South Africa', slug: 'south-africa', iso2: 'ZA', region: 'middle-east-africa' },
  { source: 'Azerbaijan', name: 'Azerbaijan', slug: 'azerbaijan', iso2: 'AZ', region: 'asia' },
  { source: 'Bangladesh', name: 'Bangladesh', slug: 'bangladesh', iso2: 'BD', region: 'asia' },
  { source: 'China', name: 'China', slug: 'china', iso2: 'CN', region: 'asia' },
  { source: null, name: 'Hong Kong', slug: 'hong-kong', iso2: 'HK', region: 'asia' },
  { source: 'India', name: 'India', slug: 'india', iso2: 'IN', region: 'asia' },
  { source: 'Indonesia', name: 'Indonesia', slug: 'indonesia', iso2: 'ID', region: 'asia' },
  { source: 'Japan', name: 'Japan', slug: 'japan', iso2: 'JP', region: 'asia' },
  { source: 'Malaysia', name: 'Malaysia', slug: 'malaysia', iso2: 'MY', region: 'asia' },
  { source: 'Myanmar', name: 'Myanmar', slug: 'myanmar', iso2: 'MM', region: 'asia' },
  { source: 'Nepal', name: 'Nepal', slug: 'nepal', iso2: 'NP', region: 'asia' },
  { source: 'Pakistan', name: 'Pakistan', slug: 'pakistan', iso2: 'PK', region: 'asia' },
  { source: 'Philippines', name: 'Philippines', slug: 'philippines', iso2: 'PH', region: 'asia' },
  { source: 'Singapore', name: 'Singapore', slug: 'singapore', iso2: 'SG', region: 'asia' },
  { source: 'South Korea', name: 'South Korea', slug: 'south-korea', iso2: 'KR', region: 'asia' },
  { source: 'Sri Lanka', name: 'Sri Lanka', slug: 'sri-lanka', iso2: 'LK', region: 'asia' },
  { source: 'Thailand', name: 'Thailand', slug: 'thailand', iso2: 'TH', region: 'asia' },
  { source: 'Vietnam', name: 'Vietnam', slug: 'vietnam', iso2: 'VN', region: 'asia' },
  { source: 'Australia', name: 'Australia', slug: 'australia', iso2: 'AU', region: 'oceania' },
  { source: 'New Zealand', name: 'New Zealand', slug: 'new-zealand', iso2: 'NZ', region: 'oceania' },
];

// Shehar jin ka mulk backend se alag rakhna hai (city slug → country slug)
const CITY_COUNTRY_OVERRIDE = { 'hong-kong': 'hong-kong' };

const BY_SLUG = new Map(COUNTRIES.map((c) => [c.slug, c]));
const BY_SOURCE = new Map(COUNTRIES.filter((c) => c.source).map((c) => [c.source, c]));

export const getCountry = (slug) => BY_SLUG.get(slug) || null;

/** Shehar (cities.js entry ya slug) → country object */
export function countryOfCity(city) {
  const c = typeof city === 'string' ? CITIES.find((x) => x.slug === city) : city;
  if (!c) return null;
  const override = CITY_COUNTRY_OVERRIDE[c.slug];
  return override ? BY_SLUG.get(override) : BY_SOURCE.get(c.country) || null;
}

/** Mulk ke saare whitelist shehar (cities.js ki tarteeb) */
export const citiesOfCountry = (countrySlug) =>
  CITIES.filter((c) => countryOfCity(c)?.slug === countrySlug);

/** 1.3 option A: country page sirf 2+ shehar wale mulk ka */
export const hasCountryPage = (countrySlug) => citiesOfCountry(countrySlug).length >= 2;

/** Naye URLs */
export const countryPath = (countrySlug) => `/weather/${countrySlug}`;
export const cityPath = (citySlug) => `/weather/${countryOfCity(citySlug).slug}/${citySlug}`;
export const monthPath = (citySlug, monthSlug) => `${cityPath(citySlug)}/${monthSlug}`;
