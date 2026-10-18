// ─────────────────────────────────────────────────────────────
//  /weather/<slug>  — sirf MULK ka page (country hub).
//
//  <slug> = MULK (/weather/united-kingdom) → country page (Phase C2).
//  Sirf 2+ shehar wale mulk (1-shehar wale → proxy.js 308 → /weather/<country>/<city>).
//
//  <slug> = SHEHAR (/weather/london) — purana Section 1 climate page. SEO
//  fixes (Oct 2026, owner option 1): woh /weather/<country>/<city> mein
//  merge ho gaya; proxy.js 301 karta hai. Proxy kisi wajah se na chale to
//  yahan bhi permanentRedirect (page kabhi 200 nahi deta → duplicate nahi).
//  Dono na hon → 404 (backend call se pehle).
// ─────────────────────────────────────────────────────────────
import { notFound, permanentRedirect } from 'next/navigation';
import CountryClimate from '@/components/climate/CountryClimate';
import { isKnownCity } from '@/data/cities';
import { getCountry, cityPath, countryPath } from '@/data/countries';
import { getCityRegistry } from '@/services/cityRegistry';
import { pageMetadata } from '@/utils/seo';
import { getCityPhoto } from '@/services/cityPhoto';
import { getClimateSummary, getHistories } from '@/services/history';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

// Shehar registry se (static + DB ke mukammal shehar). 2+ → hub; 1 → us
// shehar par 308 (proxy static list se pehle hi karta hai; yeh DB ke naye
// shehron ke liye); 0 → 404.
async function resolve(rawSlug) {
  const slug = decodeURIComponent(rawSlug).toLowerCase();
  // Purana city URL (original 160) → merged page (proxy.js 301 pehle hi kar deta hai)
  if (isKnownCity(slug)) permanentRedirect(cityPath(slug));
  const country = getCountry(slug);
  if (!country) notFound();
  const reg = await getCityRegistry();
  const list = reg.citiesOfCountry(country.slug);
  if (list.length === 1) permanentRedirect(reg.cityPath(list[0].slug));
  if (list.length === 0) notFound();
  return { kind: 'country', country, list, reg };
}

export async function generateMetadata({ params }) {
  const r = await resolve((await params).slug);

  if (r.kind === 'country') {
    const n = r.list.length;
    return pageMetadata({
      title: `${r.country.name} Weather by Month & City`,
      description: `Month-by-month climate for ${n} cities in ${r.country.name}: average highs and lows, rainfall and the best months to visit, from 20 years of weather data.`,
      path: countryPath(r.country.slug),
      kicker: 'Weather by month & city',
    });
  }

  return {};
}

export default async function WeatherSlugPage({ params }) {
  const r = await resolve((await params).slug);

  // ── MULK (preview) ──────────────────────────────────────────
  if (r.kind === 'country') {
    // Registry: sirf mukammal data wale shehar (static + DB)
    const list = r.list;
    // Backend round C2: saare shehar EK climate-summary call mein (koi 6 wali
    // hadd nahi). Summary na mile (purana backend) → purana rasta (≤ 6 calls).
    const summary = await getClimateSummary({ cities: list.map((c) => c.slug) });
    const histories = summary || (await getHistories(list.map((c) => c.slug))).data;
    // Photos: cities index (1 call, 1 h cache) — sirf jin ka data aaya
    const photos = new Map(await Promise.all([...histories.keys()].map(async (s) => [s, await getCityPhoto(s)])));
    const cities = list.map((c) => ({ slug: c.slug, name: c.name, href: r.reg.cityPath(c.slug), photo: photos.get(c.slug) || null }));
    return (
      <CountryClimate
        country={r.country}
        cities={cities}
        histories={histories}
        crumbs={[
          { name: 'Home', path: '/' },
          { name: 'Weather', path: '/weather' },
          { name: r.country.name, path: countryPath(r.country.slug) },
        ]}
      />
    );
  }
  notFound();
}
