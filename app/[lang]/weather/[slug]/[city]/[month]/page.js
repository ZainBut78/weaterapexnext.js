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
import { getCityYears, getClimateSummary, getHistories, MAX_FANOUT, requireHistory, yearsOf } from '@/services/history';
import { incompleteRobots } from '@/utils/robots';
import { rowFor, visitVerdict } from '@/utils/climateMath';
import { pickElsewhere } from '@/utils/elsewhere';
import { getTravelNote } from '@/services/guides';
import { getT } from '@/i18n/server';
import ClientMessages from '@/i18n/ClientMessages';
import { cityName, countryName } from '@/i18n/places';
import { climateText } from '@/components/climate/text';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

async function load(params) {
  const p = await params;
  const lang = p.lang;
  const month = resolveMonth(p.month);
  const { country, city, reg } = await resolveCity(p.slug, p.city, month.slug);
  const data = await requireHistory(city.slug, month.num);   // adhoora shehar → sirf yeh mahina; backend down → 5xx
  return { country, city, month, data, reg, lang };
}

export async function generateMetadata({ params }) {
  const { country, city, month, data, reg, lang } = await load(params);
  const row = rowFor(data.monthly_data, month.num);
  const verdict = visitVerdict(row);
  const L = climateText(lang);
  const cityN = cityName(lang, city);
  const countryN = countryName(lang, country);
  const meta = L.monthMeta({ cityN, countryN, city, country, monthN: L.month(month.num), monthNum: month.num, row, verdict });
  // Is mahine ka 20-saal data abhi mukammal nahi → noindex, follow; mukammal → pehle jaisa
  return pageMetadata({
    absoluteTitle: meta.title,
    imageTitle: meta.imageTitle,
    kicker: meta.kicker,
    city: city.slug,
    description: meta.description,
    path: reg.monthPath(city.slug, month.slug),
    lang,
    ...incompleteRobots(data, month.num),   // noindex → hreflang bhi nahi
  });
}

export default async function MonthPage({ params }) {
  const { country, city, month, data, reg, lang } = await load(params);
  const t = await getT(lang);
  const [photo, note, summary, yearData] = await Promise.all([
    photoFromHistory(data, city.slug),       // history ka image_url (0 calls); purana backend → cities index
    // content/guides/<city>/<month>.md (optional) — SIRF English. Owner (i18n):
    // doosri zabanon par yeh notes chhupe (English body text kabhi prefix ke
    // neeche nahi); tarjuma baad ke phase mein.
    lang === 'en' ? getTravelNote(city.slug, month.slug) : null,
    getClimateSummary({ month: month.num }), // saare mukammal shehar, is mahine — 1 call, 24 h
    getCityYears(city.slug),                 // "what 20 years show" — shehar par 1 call, 24 h
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
    slug: c.slug, name: c.name, names: c.names, href: reg.monthPath(c.slug, month.slug), row: rowOf(c.slug),
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
  const L = climateText(lang);
  const crumbs = [
    { name: t('nav.home'), path: '/' },
    { name: t('weatherHub.crumb'), path: '/weather' },
    ...(reg.hasCountryPage(country.slug) ? [{ name: countryName(lang, country), path: countryPath(country.slug) }] : []),
    { name: cityName(lang, city), path: cityHref },
    { name: L.month(month.num), path: reg.monthPath(city.slug, month.slug) },
  ];

  return (
    <ClientMessages lang={lang} ns={['climate']}>
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
        yearData={yearData}
        lang={lang}
      />
    </ClientMessages>
  );
}
