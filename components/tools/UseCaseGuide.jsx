// ─────────────────────────────────────────────────────────────
//  Use-case pages (/events/<slug>, /trip-planner/<slug>) ka content (Nov 2026).
//  Server par poora, runtime par koi backend call nahi: data/useCases.json
//  (python manage.py usecase_examples) + static shehar. Text: usecases/<lang>.js.
//  FAQ JSON-LD wahi strings jo page par hain (hoobahoo).
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { INTL_LOCALE, localePath } from '@/i18n/config';
import { cityName } from '@/i18n/places';
import { buildRegistry } from '@/utils/cityRegistryCore';
import { MONTHS } from '@/utils/climateMath';
import data from '@/data/useCases.json';
import { useCaseText } from './usecases';
import { exampleText } from './usecases/examples';

import { EVENT_USECASES, TRIP_USECASES } from '@/utils/useCases';

export { EVENT_USECASES, TRIP_USECASES };
export const usecasesOf = (kind) => (kind === 'events' ? EVENT_USECASES : TRIP_USECASES);
export const hubPath = (kind) => (kind === 'events' ? '/events' : '/trip-planner');
export const eventTypeOf = (slug) => data.events[slug]?.type;

// Hamare page ki ginti (tool ka rule nahi; text mein saaf likha hai)
const BEACH_MIN_HIGH = 24;
const HIKE_HIGH = [15, 28];
const GOOD_SCORE = 8;
const CITY_GOOD = 7;

const reg = buildRegistry(null);
const locale = (lang) => INTL_LOCALE[lang] || 'en-US';
const monthName = (lang, m) => new Intl.DateTimeFormat(locale(lang), { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, m - 1, 1)));
const monthShort = (lang, m) => new Intl.DateTimeFormat(locale(lang), { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, m - 1, 1)));
const num = (lang, v) => Number(v).toLocaleString(locale(lang), { maximumFractionDigits: 1 });
const listOf = (lang, items) => new Intl.ListFormat(locale(lang), { type: 'conjunction' }).format(items);
const best = (arr, key, low = false) => arr.reduce((a, x) => ((low ? x[key] < a[key] : x[key] > a[key]) ? x : a));
const monthLink = (slug, m) => reg.monthPath(slug, MONTHS[m - 1].slug);

/** Table + data se bane jumle. Har row: [city slug, ...cells]; links: shehar ke month pages. */
function buildTable(kind, slug, lang, T) {
  const C = T.common.cols;
  const city = (s) => cityName(lang, s, reg.get(s)?.name || s);
  if (kind === 'events') {
    const rows = data.events[slug].cities.map((c) => {
      const lo = best(c.months, 'risk', true);
      const hi = best(c.months, 'risk');
      return { slug: c.slug, lo, hi, low: c.months.some((m) => m.level === 'low') };
    });
    const top = best(rows.map((r) => ({ ...r, risk: r.lo.risk })), 'risk', true);
    return {
      cols: [C.city, C.lowRisk, C.highRisk],
      rows: rows.map((r) => ({
        slug: r.slug,
        cells: [city(r.slug), `${monthName(lang, r.lo.month)} · ${num(lang, r.lo.risk)} (${T.common.levels[r.lo.level]})`,
          `${monthName(lang, r.hi.month)} · ${num(lang, r.hi.risk)} (${T.common.levels[r.hi.level]})`],
        month: r.lo.month,
      })),
      outro: { bestCity: city(top.slug), bestMonth: monthName(lang, top.lo.month), bestRisk: num(lang, top.lo.risk),
        lowCount: rows.filter((r) => r.low).length, total: rows.length },
    };
  }
  const cities = data.trip[slug].cities;
  if (slug === 'city-break') {
    const rows = cities.map((c) => ({ slug: c.slug, top: best(c.months, 'score'), good: c.months.filter((m) => m.score >= CITY_GOOD) }));
    const top = best(rows.map((r) => ({ ...r, score: r.top.score })), 'score');
    return {
      cols: [C.city, C.bestMonth, C.goodMonths],
      rows: rows.map((r) => ({ slug: r.slug, month: r.top.month,
        cells: [city(r.slug), `${monthName(lang, r.top.month)} · ${num(lang, r.top.score)}`, `${r.good.length}/12`] })),
      outro: { bestCity: city(top.slug), bestMonth: monthName(lang, top.top.month), bestScore: num(lang, top.top.score),
        allGood: rows.filter((r) => r.good.length === 12).length, total: rows.length },
    };
  }
  const fits = slug === 'beach'
    ? (m) => m.high >= BEACH_MIN_HIGH && m.score >= GOOD_SCORE
    : (m) => m.high >= HIKE_HIGH[0] && m.high <= HIKE_HIGH[1] && m.score >= GOOD_SCORE;
  const rows = cities.map((c) => {
    const ok = c.months.filter(fits);
    return { slug: c.slug, ok, top: ok.length ? best(ok, 'score') : null };
  });
  const most = best(rows.map((r) => ({ ...r, n: r.ok.length })), 'n');
  return {
    cols: [C.city, slug === 'beach' ? C.beachMonths : C.hikingMonths, C.bestMonth],
    rows: rows.map((r) => ({ slug: r.slug, month: r.top?.month,
      cells: [city(r.slug), r.ok.length ? listOf(lang, r.ok.map((m) => monthShort(lang, m.month))) : T.common.none,
        r.top ? `${monthName(lang, r.top.month)} · ${num(lang, r.top.score)}` : '—'] })),
    outro: { withCount: rows.filter((r) => r.ok.length).length, total: rows.length,
      topCity: city(most.slug), topN: most.ok.length },
  };
}

/** Hal kiya hua misaal: numbers JSON se (asal Python score functions), jumla examples.js se */
function workedExample(kind, slug, lang, T) {
  const E = exampleText(lang);
  if (kind === 'events') {
    const fmt = (e) => ({
      rain: e.rain, wind: e.wind, temp: e.temp, humidity: e.humidity, risk: num(lang, e.risk), level: T.common.levels[e.level],
      sum: ['rain', 'wind', 'heat', 'humidity'].map((k) => num(lang, e.parts[k])).join(' + '),
    });
    const [a, b] = data.events[slug].example;
    return E[slug](fmt(a), fmt(b));
  }
  const fmt = (e) => ({ rain: e.rain, wind: e.wind, high: e.high, score: num(lang, e.score), activity: E.activities[e.activity] });
  const [a, b] = data.trip[slug].example;
  return E[slug](fmt(a), fmt(b));
}

const H2 = 'text-2xl font-bold text-slate-900 mt-12 mb-4';
const P = 'text-slate-700 leading-relaxed mb-4';
const LINK = 'text-[#0077b6] hover:underline';

export default function UseCaseGuide({ kind, slug, lang }) {
  const T = useCaseText(lang);
  const U = T[slug];
  const table = buildTable(kind, slug, lang, T);
  const [from, to] = data.period;
  const blogKey = kind === 'events' ? 'events' : slug;
  const posts = data.blog[blogKey]?.[lang] || [];
  const siblings = usecasesOf(kind).filter((s) => s !== slug);
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: U.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };

  return (
    <section className="max-w-4xl mx-auto px-4 pb-16" aria-labelledby={`${slug}-factors`}>
      <h2 id={`${slug}-factors`} className={H2}>{U.factorsTitle}</h2>
      {U.factors.map((p) => <p key={p.slice(0, 24)} className={P}>{p}</p>)}
      <p className={P}>{workedExample(kind, slug, lang, T)}</p>

      <h2 className={H2}>{U.tableTitle}</h2>
      <p className={P}>{U.tableIntro(from, to)}</p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm text-left border border-slate-200 bg-white">
          <thead className="bg-slate-50 text-slate-600">
            <tr>{table.cols.map((c) => <th key={c} scope="col" className="px-3 py-2 font-semibold">{c}</th>)}</tr>
          </thead>
          <tbody>
            {table.rows.map((r) => (
              <tr key={r.slug} className="border-t border-slate-100">
                <th scope="row" className="px-3 py-1.5 font-medium">
                  <Link href={localePath(lang, reg.cityPath(r.slug))} className={LINK}>{r.cells[0]}</Link>
                </th>
                {r.cells.slice(1).map((cell, i) => <td key={i} className="px-3 py-1.5 text-slate-700">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={P}>{U.tableOutro(table.outro)}</p>

      <h2 className={H2}>{U.tipsTitle}</h2>
      <ul className="list-disc pl-5 space-y-2 mb-4 text-slate-700">
        {U.tips.map((tip) => <li key={tip.slice(0, 24)}>{tip}</li>)}
      </ul>

      <h2 className={H2}>FAQ</h2>
      {U.faq.map(([q, a]) => (
        <div key={q} className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{q}</h3>
          <p className="text-slate-700 leading-relaxed">{a}</p>
        </div>
      ))}
      <JsonLd data={faqLd} />

      <h2 className={H2}>{T.common.moreTitle}</h2>
      <ul className="space-y-1 mb-4">
        <li><Link href={localePath(lang, hubPath(kind))} className={LINK}>{T.common.hub[kind]}</Link></li>
        {siblings.map((s) => (
          <li key={s}><Link href={localePath(lang, `${hubPath(kind)}/${s}`)} className={LINK}>{T[s].h1}</Link></li>
        ))}
      </ul>

      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">{T.common.monthPagesTitle}</h3>
      <ul className="flex flex-wrap gap-2 mb-4">
        {table.rows.filter((r) => r.month).map((r) => (
          <li key={r.slug}>
            <Link href={localePath(lang, monthLink(r.slug, r.month))} className="inline-block rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-[#0077b6] hover:underline">
              {T.common.monthPage(r.cells[0], monthName(lang, r.month))}
            </Link>
          </li>
        ))}
      </ul>

      {posts.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">{T.common.blogTitle}</h3>
          <ul className="list-disc pl-5 space-y-1">
            {posts.map((p) => <li key={p.slug}><Link href={localePath(lang, `/blog/${p.slug}`)} className={LINK}>{p.title}</Link></li>)}
          </ul>
        </>
      )}
    </section>
  );
}

/** Hub (/events, /trip-planner) par: "Plan by use case" — saare use-case pages ke links */
export function UseCaseLinks({ kind, lang }) {
  const T = useCaseText(lang);
  return (
    <>
      <h2 className={H2}>{T.common.planTitle}</h2>
      <ul className="grid sm:grid-cols-2 gap-2 mb-4">
        {usecasesOf(kind).map((s) => (
          <li key={s}>
            <Link href={localePath(lang, `${hubPath(kind)}/${s}`)} className="block rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-[#0077b6]">
              <span className="font-semibold text-slate-900">{T[s].h1}</span>
              <span className="block text-sm text-slate-600">{T[s].intro}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
