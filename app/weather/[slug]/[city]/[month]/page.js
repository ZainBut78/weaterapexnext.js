// ─────────────────────────────────────────────────────────────
//  /weather/<country>/<city>/<month>  — month climate guide (Phase C2, Section 2)
//
//  LIVE (Phase C2): indexable, sitemap mein, self-canonical. Data: wahi ek history call jo city page karta hai (same
//  URL + cache) → 1 shehar = 1 backend call, 13 pages ke liye.
//  Backend round (PART C):
//   • photo + saal (year_from/year_to) isi history jawab se (0 extra calls)
//   • "doosre shehar" + "warmer/drier places": climate summary ?month=M —
//     EK call (24 h cache, saare shehron ke is mahine ke liye same URL).
//     Summary na mile (purana backend) → purana rasta (≤ 6 history calls).
//   • related articles: backend recommendation (RelatedArticles)
// ─────────────────────────────────────────────────────────────
import { notFound } from 'next/navigation';
import { resolveCity, resolveMonth } from '../../resolve';
import MonthGuide from '@/components/climate/MonthGuide';
import RelatedArticles from '@/components/RelatedArticles';
import { citiesOfCountry, cityPath, countryPath, hasCountryPage, monthPath } from '@/data/countries';
import { getCity } from '@/data/cities';
import { pageMetadata } from '@/utils/seo';
import { photoFromHistory } from '@/services/cityPhoto';
import { getClimateSummary, getHistory, getHistories, MAX_FANOUT, yearsOf } from '@/services/history';
import { rowFor, visitVerdict } from '@/utils/climateMath';
import { pickElsewhere } from '@/utils/elsewhere';
import { cityTags } from '@/data/cityTags';
import { getTravelNote } from '@/services/guides';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

async function load(params) {
  const p = await params;
  const { country, city } = resolveCity(p.slug, p.city);
  const month = resolveMonth(p.month);
  const data = await getHistory(city.slug);
  if (!data) notFound();
  return { country, city, month, data };
}

export async function generateMetadata({ params }) {
  const { country, city, month, data } = await load(params);
  const row = rowFor(data.monthly_data, month.num);
  const f = (c) => (c == null ? '—' : `${Math.round(c * 10) / 10}°C (${Math.round((c * 9 / 5 + 32) * 10) / 10}°F)`);
  const verdict = visitVerdict(row);
  const title = `${city.name} Weather in ${month.name}: Temperature, Rain & Tips`;
  return pageMetadata({
    absoluteTitle: title,
    imageTitle: `${city.name} Weather in ${month.name}`,
    kicker: country.name,
    city: city.slug,
    description: `${month.name} in ${city.name}: average high ${f(row?.avg_high)}, low ${f(row?.avg_low)}, ${row?.rainy_days ?? '—'} rainy days and ${row?.sunshine_hours ?? '—'} h of sunshine a day. ${verdict ? `${verdict.label} time to visit` : 'Climate guide'} — comparisons and packing tips.`,
    path: monthPath(city.slug, month.slug),
  });
}

export default async function MonthPage({ params }) {
  const { country, city, month, data } = await load(params);
  const [photo, note, summary] = await Promise.all([
    photoFromHistory(data, city.slug),       // history ka image_url (0 calls); purana backend → cities index
    getTravelNote(city.slug, month.slug),    // content/guides/<city>/<month>.md (optional)
    getClimateSummary({ month: month.num }), // saare mukammal shehar, is mahine — 1 call, 24 h
  ]);

  // Usi mulk ke doosre shehar — saare link (internal linking). Data:
  // summary se (koi cap nahi); summary na ho → purana rasta (≤ MAX_FANOUT calls)
  const otherCities = citiesOfCountry(country.slug).filter((c) => c.slug !== city.slug);
  let rowOf;
  if (summary) {
    rowOf = (slug) => summary.get(slug)?.month_data || null;
  } else {
    const { data: histories } = await getHistories(otherCities.map((c) => c.slug), { max: MAX_FANOUT - 1 });
    rowOf = (slug) => (histories.has(slug) ? rowFor(histories.get(slug).monthly_data, month.num) : null);
  }
  const others = otherCities.map((c) => ({
    slug: c.slug, name: c.name, href: monthPath(c.slug, month.slug), row: rowOf(c.slug),
  }));

  // Warmer / drier places — sirf summary ho to (asal numbers, max 5, 2 se kam → nahi)
  const elsewhere = summary
    ? pickElsewhere({
      city: getCity(city.slug),
      row: rowFor(data.monthly_data, month.num),
      summary,
      hrefFor: (slug) => monthPath(slug, month.slug),
    })
    : [];

  const cityHref = cityPath(city.slug);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Weather', path: '/weather' },
    ...(hasCountryPage(country.slug) ? [{ name: country.name, path: countryPath(country.slug) }] : []),
    { name: city.name, path: cityHref },
    { name: month.name, path: monthPath(city.slug, month.slug) },
  ];

  return (
    <MonthGuide
      data={data}
      city={city}
      country={country}
      month={month}
      photo={photo}
      crumbs={crumbs}
      cityHref={cityHref}
      monthHref={(m) => monthPath(city.slug, m)}
      others={others}
      elsewhere={elsewhere}
      years={yearsOf(data)}
      tags={cityTags(city.slug)}
      note={note}
      related={<RelatedArticles city={city.slug} month={month.num} limit={3} />}
    />
  );
}
