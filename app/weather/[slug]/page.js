// ─────────────────────────────────────────────────────────────
//  /weather/<slug>  — do kaam (ek hi URL level par):
//
//  1) <slug> = whitelist SHEHAR (/weather/london) → purana city climate
//     page, abhi LIVE. HTML bilkul pehle jaisa (CityClimate component).
//     Phase C section 3 mein yeh 308 → /weather/<country>/<city> hoga.
//  2) <slug> = MULK (/weather/united-kingdom) → country page.
//     LIVE (Phase C2). 1.3 option A: sirf 2+ shehar wale mulk (1-shehar
//     wale mulk → proxy.js 308 → /weather/<country>/<city>).
//  Dono na hon → 404 (backend call se pehle).
//
//  Singapore / Hong Kong: shehar aur mulk ka ek naam — shehar pehle
//  (purana live page waisa hi).
// ─────────────────────────────────────────────────────────────
import { notFound } from 'next/navigation';
import CityClimate from '@/components/climate/CityClimate';
import CountryClimate from '@/components/climate/CountryClimate';
import { isKnownCity, getCity, citiesInCountry } from '@/data/cities';
import { getCountry, hasCountryPage, citiesOfCountry, cityPath, countryPath, monthPath } from '@/data/countries';
import { MONTHS } from '@/utils/climateMath';
import { pageMetadata } from '@/utils/seo';
import { getCityPhoto, photoFromHistory } from '@/services/cityPhoto';
import { getClimateSummary, getHistory, getHistories, yearsOf } from '@/services/history';
import RelatedArticles from '@/components/RelatedArticles';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

function resolve(rawSlug) {
  const slug = decodeURIComponent(rawSlug);
  if (isKnownCity(slug)) return { kind: 'city', slug };
  const country = getCountry(slug);
  if (country && hasCountryPage(slug)) return { kind: 'country', country };
  notFound();
}

export async function generateMetadata({ params }) {
  const r = resolve((await params).slug);

  if (r.kind === 'country') {
    const n = citiesOfCountry(r.country.slug).length;
    return pageMetadata({
      title: `${r.country.name} Weather by Month & City`,
      description: `Month-by-month climate for ${n} cities in ${r.country.name}: average highs and lows, rainfall and the best months to visit, from 20 years of weather data.`,
      path: countryPath(r.country.slug),
      kicker: 'Weather by month & city',
    });
  }

  const data = await getHistory(r.slug);
  if (!data) return { title: 'Page not found' };
  const years = yearsOf(data);
  return pageMetadata({
    title: `${data.city} Climate & Weather Guide`,
    // Content round A4 (owner ka text): "climate / 20-year averages / charts"
    // — Section 2 "{City} Weather by Month" se takraav nahi. Sirf shehar ka
    // naam, is liye Singapore / Hong Kong mein naam ek hi dafa.
    description: `${data.city} climate: 20-year averages (${years.start}–${years.end}) for temperature, rainfall, rainy days and sunshine, with charts for the whole year and a full monthly table.`,
    path: `/weather/${r.slug}`,
    kicker: data.country,
    city: r.slug, // share image ke peeche shehar ki photo (owner ki farmaish)
  });
}

export default async function WeatherSlugPage({ params }) {
  const r = resolve((await params).slug);

  // ── MULK (preview) ──────────────────────────────────────────
  if (r.kind === 'country') {
    const list = citiesOfCountry(r.country.slug);
    // Backend round C2: saare shehar EK climate-summary call mein (koi 6 wali
    // hadd nahi). Summary na mile (purana backend) → purana rasta (≤ 6 calls).
    const summary = await getClimateSummary({ cities: list.map((c) => c.slug) });
    const histories = summary || (await getHistories(list.map((c) => c.slug))).data;
    // Photos: cities index (1 call, 1 h cache) — sirf jin ka data aaya
    const photos = new Map(await Promise.all([...histories.keys()].map(async (s) => [s, await getCityPhoto(s)])));
    const cities = list.map((c) => ({ slug: c.slug, name: c.name, href: cityPath(c.slug), photo: photos.get(c.slug) || null }));
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

  // ── SHEHAR (purana live page — wahi HTML) ───────────────────
  const citySlug = r.slug;
  const data = await getHistory(citySlug);
  if (!data) notFound();
  const cityInfo = getCity(citySlug);
  // Backend round A6: photo isi history jawab se (0 extra calls)
  const photo = await photoFromHistory(data, citySlug);
  const moreCities = citiesInCountry(cityInfo.country, citySlug)
    .slice(0, 6)
    .map((c) => ({ ...c, href: `/weather/${c.slug}` }));

  return (
    <CityClimate
      data={data}
      countryName={data.country}
      photo={photo}
      crumbs={[
        { name: 'Home', path: '/' },
        { name: 'Climate Guides', path: '/climate-guides' },
        { name: data.city, path: `/weather/${citySlug}` },
      ]}
      moreCities={moreCities}
      moreCitiesCountry={cityInfo.country}
      tripHref={`/trip-planner?city=${citySlug}`}
      // Phase C2: Section 2 (month-by-month) ka box + 12 month links
      monthByMonth={{
        href: cityPath(citySlug),
        months: MONTHS.map((m) => ({ name: m.name, short: m.short, href: monthPath(citySlug, m.slug) })),
      }}
      // Backend round B5: related articles (khaali ho to kuch nahi)
      related={<RelatedArticles city={citySlug} limit={3} />}
    />
  );
}
