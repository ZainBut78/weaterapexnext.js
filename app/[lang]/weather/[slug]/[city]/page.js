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
import { resolveCity } from '../resolve';
import CityByMonth from '@/components/climate/CityByMonth';
import RelatedArticles from '@/components/RelatedArticles';
import { countryPath } from '@/data/countries';
import { pageMetadata } from '@/utils/seo';
import { photoFromHistory } from '@/services/cityPhoto';
import { requireHistory, yearsOf } from '@/services/history';
import { incompleteRobots } from '@/utils/robots';
import { bestMonths, yearExtremes } from '@/utils/climateMath';
import { getT } from '@/i18n/server';
import ClientMessages from '@/i18n/ClientMessages';
import { cityName, countryName } from '@/i18n/places';
import { climateText } from '@/components/climate/text';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const p = await params;
  const { country, city, reg } = await resolveCity(p.slug, p.city);
  const data = await requireHistory(city.slug);
  const x = yearExtremes(data.monthly_data);
  const L = climateText(p.lang);
  const best = bestMonths(data.monthly_data, 3).map((m) => L.month(m.num));
  const cityN = cityName(p.lang, city);
  const countryN = countryName(p.lang, country);
  // Har shehar alag: apne warmest/coolest/wettest + best months (text: zaban ki file)
  const meta = L.cityMeta({ cityN, countryN, country, city, x, best });
  // Data abhi mukammal nahi (kuch mahine) → noindex, follow; mukammal → pehle jaisa
  return pageMetadata({
    absoluteTitle: meta.title,
    imageTitle: meta.imageTitle,
    kicker: countryN,
    city: city.slug,
    description: meta.description,
    path: reg.cityPath(city.slug),
    lang: p.lang,
    ...incompleteRobots(data),   // noindex → hreflang bhi nahi
  });
}

export default async function CityByMonthPage({ params }) {
  const p = await params;
  const { country, city, reg } = await resolveCity(p.slug, p.city);
  const data = await requireHistory(city.slug);
  // Backend round A6: photo isi history jawab se (0 extra calls)
  const photo = await photoFromHistory(data, city.slug);

  // Registry: static + DB ke mukammal shehar (adhoore shamil hi nahi)
  const others = reg.citiesOfCountry(country.slug)
    .filter((c) => c.slug !== city.slug)
    .map((c) => ({ slug: c.slug, name: c.name, names: c.names, href: reg.cityPath(c.slug) }));

  const t = await getT(p.lang);
  const crumbs = [
    { name: t('nav.home'), path: '/' },
    { name: t('weatherHub.crumb'), path: '/weather' },
    ...(reg.hasCountryPage(country.slug) ? [{ name: countryName(p.lang, country), path: countryPath(country.slug) }] : []),
    { name: cityName(p.lang, city), path: reg.cityPath(city.slug) },
  ];

  return (
    <ClientMessages lang={p.lang} ns={['climate']}>
      <CityByMonth
        data={data}
        city={city}
        country={country}
        photo={photo}
        crumbs={crumbs}
        monthHref={(m) => reg.monthPath(city.slug, m)}
        others={others}
        years={yearsOf(data)}
        geo={city}
        tripHref={`/trip-planner?city=${city.slug}`}
        related={<RelatedArticles city={city.slug} limit={3} />}
        lang={p.lang}
      />
    </ClientMessages>
  );
}
