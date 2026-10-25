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
import { resolveCity, resolveMonth } from '../../resolve';
import MonthGuide from '@/components/climate/MonthGuide';
import RelatedArticles from '@/components/RelatedArticles';
import { countryPath } from '@/data/countries';
import { pageMetadata } from '@/utils/seo';
import { photoFromHistory } from '@/services/cityPhoto';
import { getClimateSummary, getHistories, MAX_FANOUT, requireHistory, yearsOf } from '@/services/history';
import { incompleteRobots } from '@/utils/robots';
import { rowFor, visitVerdict } from '@/utils/climateMath';
import { pickElsewhere } from '@/utils/elsewhere';
import { getTravelNote } from '@/services/guides';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

async function load(params) {
  const p = await params;
  const month = resolveMonth(p.month);
  const { country, city, reg } = await resolveCity(p.slug, p.city, month.slug);
  const data = await requireHistory(city.slug, month.num);   // adhoora shehar → sirf yeh mahina; backend down → 5xx
  return { country, city, month, data, reg };
}

export async function generateMetadata({ params }) {
  const { country, city, month, data, reg } = await load(params);
  const row = rowFor(data.monthly_data, month.num);
  const f = (c) => (c == null ? '—' : `${Math.round(c * 10) / 10}°C (${Math.round((c * 9 / 5 + 32) * 10) / 10}°F)`);
  const verdict = visitVerdict(row);
  const title = `${city.name} Weather in ${month.name}: Temperature, Rain & Tips`;
  // Is mahine ka 20-saal data abhi mukammal nahi → noindex, follow; mukammal → pehle jaisa
  return { ...pageMetadata({
    absoluteTitle: title,
    imageTitle: `${city.name} Weather in ${month.name}`,
    kicker: country.name,
    city: city.slug,
    description: `${month.name} in ${city.name}: average high ${f(row?.avg_high)}, low ${f(row?.avg_low)}, ${row?.rainy_days ?? '—'} rainy days and ${row?.sunshine_hours ?? '—'} h of sunshine a day. ${verdict ? `${verdict.label} time to visit` : 'Climate guide'} — comparisons and packing tips.`,
    path: reg.monthPath(city.slug, month.slug),
  }), ...incompleteRobots(data, month.num) };
}

export default async function MonthPage({ params }) {
  const { country, city, month, data, reg } = await load(params);
  const [photo, note, summary] = await Promise.all([
    photoFromHistory(data, city.slug),       // history ka image_url (0 calls); purana backend → cities index
    getTravelNote(city.slug, month.slug),    // content/guides/<city>/<month>.md (optional)
    getClimateSummary({ month: month.num }), // saare mukammal shehar, is mahine — 1 call, 24 h
  ]);

  // Usi mulk ke doosre shehar — saare link (internal linking). Data:
  // summary se (koi cap nahi); summary na ho → purana rasta (≤ MAX_FANOUT calls)
  // Sirf mukammal data wale shehar (adhoore ka link nahi — owner review)
  const otherCities = reg.citiesOfCountry(country.slug).filter((c) => c.slug !== city.slug);
  let rowOf;
  if (summary) {
    rowOf = (slug) => summary.get(slug)?.month_data || null;
  } else {
    const { data: histories } = await getHistories(otherCities.map((c) => c.slug), { max: MAX_FANOUT - 1 });
    rowOf = (slug) => (histories.has(slug) ? rowFor(histories.get(slug).monthly_data, month.num) : null);
  }
  const others = otherCities.map((c) => ({
    slug: c.slug, name: c.name, href: reg.monthPath(c.slug, month.slug), row: rowOf(c.slug),
  }));

  // Warmer / drier places — sirf summary ho to (asal numbers, max 5, 2 se kam → nahi)
  const elsewhere = summary
    ? pickElsewhere({
      city,
      cities: reg.cities,   // static + DB ke mukammal shehar
      row: rowFor(data.monthly_data, month.num),
      summary,
      hrefFor: (slug) => reg.monthPath(slug, month.slug),
    })
    : [];

  const cityHref = reg.cityPath(city.slug);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Weather', path: '/weather' },
    ...(reg.hasCountryPage(country.slug) ? [{ name: country.name, path: countryPath(country.slug) }] : []),
    { name: city.name, path: cityHref },
    { name: month.name, path: reg.monthPath(city.slug, month.slug) },
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
      monthHref={(m) => reg.monthPath(city.slug, m)}
      others={others}
      elsewhere={elsewhere}
      years={yearsOf(data)}
      tags={city.tags}
      note={note}
      related={<RelatedArticles city={city.slug} month={month.num} limit={3} />}
    />
  );
}
