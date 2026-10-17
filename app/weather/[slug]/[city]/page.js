// ─────────────────────────────────────────────────────────────
//  /weather/<country>/<city>  — "{City} Weather by Month" + climate guide
//
//  LIVE: indexable, sitemap mein, self-canonical. SEO fixes (Oct 2026):
//  purana Section 1 (/weather/<city>) isi page mein merge — woh URL ab
//  301 → yahan (proxy.js). Title/description dono irade (month by month +
//  climate/charts) cover karte hain; har shehar ka description apne
//  numbers se alag. Data: wahi ek history call jo 12 month pages bhi
//  use karte hain (same URL + cache).
//  Params ghalat → 404, backend call se pehle (../resolve.js).
// ─────────────────────────────────────────────────────────────
import { notFound } from 'next/navigation';
import { resolveCity } from '../resolve';
import { getCity } from '@/data/cities';
import CityByMonth from '@/components/climate/CityByMonth';
import RelatedArticles from '@/components/RelatedArticles';
import { citiesOfCountry, cityPath, countryPath, hasCountryPage, monthPath } from '@/data/countries';
import { pageMetadata } from '@/utils/seo';
import { photoFromHistory } from '@/services/cityPhoto';
import { getHistory, yearsOf } from '@/services/history';
import { bestMonths, yearExtremes } from '@/utils/climateMath';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const p = await params;
  const { country, city } = resolveCity(p.slug, p.city);
  const data = await getHistory(city.slug);
  if (!data) return { title: 'Page not found' };
  const x = yearExtremes(data.monthly_data);
  const best = bestMonths(data.monthly_data, 3).map((m) => m.name);
  return pageMetadata({
    absoluteTitle: `${city.name} Weather by Month: Climate, Rain & Best Time to Visit`,
    imageTitle: `${city.name} Weather by Month`,
    kicker: country.name,
    city: city.slug,
    // Har shehar alag: apne warmest/coolest/wettest + best months
    description: `${city.name === country.name ? city.name : `${city.name}, ${country.name}`} month by month: warmest in ${x.warmest?.month.name}, coolest in ${x.coolest?.month.name}, wettest in ${x.wettest?.month.name}. Best months to visit: ${best.join(', ')}. 20-year averages with charts.`,
    path: cityPath(city.slug),
  });
}

export default async function CityByMonthPage({ params }) {
  const p = await params;
  const { country, city } = resolveCity(p.slug, p.city);
  const data = await getHistory(city.slug);
  if (!data) notFound();
  // Backend round A6: photo isi history jawab se (0 extra calls)
  const photo = await photoFromHistory(data, city.slug);

  const others = citiesOfCountry(country.slug)
    .filter((c) => c.slug !== city.slug)
    .map((c) => ({ slug: c.slug, name: c.name, href: cityPath(c.slug) }));

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Weather', path: '/weather' },
    ...(hasCountryPage(country.slug) ? [{ name: country.name, path: countryPath(country.slug) }] : []),
    { name: city.name, path: cityPath(city.slug) },
  ];

  return (
    <CityByMonth
      data={data}
      city={city}
      country={country}
      photo={photo}
      crumbs={crumbs}
      monthHref={(m) => monthPath(city.slug, m)}
      others={others}
      years={yearsOf(data)}
      geo={getCity(city.slug) || {}}
      tripHref={`/trip-planner?city=${city.slug}`}
      related={<RelatedArticles city={city.slug} limit={3} />}
    />
  );
}
