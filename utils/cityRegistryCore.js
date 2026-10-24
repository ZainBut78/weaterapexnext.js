// ─────────────────────────────────────────────────────────────
//  City registry ka asal hisaab (pure — koi fetch/React nahi), taake
//  scripts/registry-report.mjs aur tests seedha chala sakein.
//  Server wrapper: services/cityRegistry.js (index fetch + cache).
//  rows = backend /weather/cities/ ke `cities` (ya null = backend down).
// ─────────────────────────────────────────────────────────────
import { CITIES } from '../data/cities.js';
import { COUNTRIES, countryOfCity as staticCountryOfCity, getCountry } from '../data/countries.js';
import { cityTags as staticTags } from '../data/cityTags.js';

const SLUG_OK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Backend ka country naam → COUNTRIES (source ya display naam, dono chalte hain)
const BY_COUNTRY_NAME = new Map();
for (const c of COUNTRIES) {
  if (c.source) BY_COUNTRY_NAME.set(c.source.toLowerCase(), c);   // Hong Kong: source null (static shehar)
  BY_COUNTRY_NAME.set(c.name.toLowerCase(), c);
}
const COUNTRY_ALIASES = {
  'united states of america': 'united states', us: 'usa', uk: 'united kingdom',
  'republic of türkiye': 'turkey', 'türkiye': 'turkey', turkiye: 'turkey',
};
function countryFromName(name) {
  const n = String(name || '').trim().toLowerCase();
  return BY_COUNTRY_NAME.get(n) || BY_COUNTRY_NAME.get(COUNTRY_ALIASES[n] || '') || null;
}

// "New York" / "newyork" / "New-York" → "newyork" (duplicate pakarne ke liye)
const nameKey = (name) => String(name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export function buildRegistry(rows) {
  const statics = CITIES.map((c) => ({
    slug: c.slug, name: c.name, country: c.country, countrySlug: staticCountryOfCity(c.slug).slug,
    lat: c.lat, lon: c.lon, tz: c.tz || null, tags: staticTags(c.slug), isStatic: true,
  }));
  const staticSlugs = new Set(statics.map((c) => c.slug));
  const seen = new Map(statics.map((c) => [`${nameKey(c.name)}|${c.countrySlug}`, c.slug]));
  // naam → pehla shehar (kisi bhi mulk mein) — galat geocoding pakarne ke liye
  const byName = new Map(statics.map((c) => [nameKey(c.name), c]));
  const idx = rows ? new Map(rows.map((r) => [r.slug, r])) : null;

  // Mukammal (12 mahine) → `cities` (lists, links, sitemap). Adhoore (DB mein
  // hain, kuch mahine ya kuch nahi) → `partial`: un ka URL khulta hai (404
  // nahi) aur page khulne par backend sirf zaroori data laata hai (owner, Oct
  // 2026: "jitna data chahiye utni calls"), magar list/link mein nahi.
  // months = kin mahinon ka poora 20-saal average (sitemap ke month pages).
  const isComplete = (row) => row && row.history_complete !== false;
  const monthsOf = (row) => (isComplete(row) ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    : (Array.isArray(row?.months_complete) ? row.months_complete : []));
  // Static: backend index mil gaya → mukammal list mein, baqi partial; index nahi → sab
  const cities = idx ? statics.filter((c) => isComplete(idx.get(c.slug))) : statics;
  const partial = idx ? statics.filter((c) => idx.get(c.slug) && !isComplete(idx.get(c.slug))) : [];
  // Shehar ke climate data ki aakhri asal tabdeeli (backend climate_updated_at) —
  // sitemap lastmod (deploy par nahi badalta). Purana backend → null.
  if (idx) {
    for (const c of [...cities, ...partial]) {
      c.dataDate = idx.get(c.slug)?.climate_updated_at || null;
      c.months = monthsOf(idx.get(c.slug));
    }
  }
  const aliases = new Map();   // duplicate slug → canonical slug
  const skipped = [];

  if (rows) {
    // Canonical pehle: slug jo naam se banta hai ("new-york"), phir baqi
    const extra = rows.filter((r) => !staticSlugs.has(r.slug))
      .sort((a, b) => (slugify(a.name) === a.slug ? 0 : 1) - (slugify(b.name) === b.slug ? 0 : 1) || a.slug.localeCompare(b.slug));
    for (const r of extra) {
      const country = countryFromName(r.country);
      if (!country) { skipped.push({ slug: r.slug, reason: `unknown country "${r.country}"` }); continue; }
      const key = `${nameKey(r.name)}|${country.slug}`;
      if (seen.has(key)) { aliases.set(r.slug, seen.get(key)); continue; }
      // Wahi naam magar doosra mulk (DB "newyork" = Scotland ki basti, galat
      // geocoding) → khud page nahi; owner review kare
      const twin = byName.get(nameKey(r.name));
      if (twin && twin.countrySlug !== country.slug) {
        skipped.push({ slug: r.slug, reason: `same name as ${twin.slug} (${twin.country}) but country "${r.country}" — review` });
        continue;
      }
      if (!SLUG_OK.test(r.slug)) { skipped.push({ slug: r.slug, reason: 'invalid slug' }); continue; }
      if (getCountry(r.slug)) { skipped.push({ slug: r.slug, reason: 'slug equals a country slug' }); continue; }
      if (typeof r.lat !== 'number' || typeof r.lon !== 'number') { skipped.push({ slug: r.slug, reason: 'no coordinates' }); continue; }
      seen.set(key, r.slug);
      byName.set(nameKey(r.name), { slug: r.slug, country: country.name, countrySlug: country.slug });
      (r.history_complete === true ? cities : partial).push({
        slug: r.slug, name: r.name, country: country.name, countrySlug: country.slug,
        lat: r.lat, lon: r.lon, tz: null,
        tags: { coastal: !!r.is_coastal, hiking: !!r.has_hiking_trails }, isStatic: false,
        dataDate: r.climate_updated_at || null,
        months: r.history_complete === true ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : monthsOf(r),
      });
    }
  }

  const bySlug = new Map([...cities, ...partial].map((c) => [c.slug, c]));
  const byCountry = new Map();
  for (const c of cities) byCountry.set(c.countrySlug, [...(byCountry.get(c.countrySlug) || []), c]);
  for (const list of byCountry.values()) list.sort((a, b) => (a.isStatic === b.isStatic ? 0 : a.isStatic ? -1 : 1));

  return {
    degraded: !rows,
    cities,      // mukammal — lists, links, sitemap
    partial,     // adhoore — sirf URL khulta hai
    aliases,
    skipped,
    get: (slug) => bySlug.get(slug) || null,
    has: (slug) => bySlug.has(slug),
    citiesOfCountry: (countrySlug) => byCountry.get(countrySlug) || [],
    hasCountryPage: (countrySlug) => (byCountry.get(countrySlug) || []).length >= 2,
    cityPath: (slug) => {
      const c = bySlug.get(slug);
      return c ? `/weather/${c.countrySlug}/${c.slug}` : null;
    },
    monthPath: (slug, monthSlug) => {
      const c = bySlug.get(slug);
      return c ? `/weather/${c.countrySlug}/${c.slug}/${monthSlug}` : null;
    },
  };
}

