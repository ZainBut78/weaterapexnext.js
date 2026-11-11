// ─────────────────────────────────────────────────────────────
//  Trip Planner / Events ke NEECHE content (Nov 2026): score kaise, misaal, use cases, FAQ, links.
//  Server par poora (Google/Bing ke liye HTML mein). Runtime par koi backend call nahi:
//  misaal ke numbers aur blog links data/toolGuides.json se (python manage.py tool_examples),
//  shehar static list se. Backend band ho to bhi page poora.
//  Text: components/tools/guideText.js. FAQ JSON-LD wahi strings (hoobahoo).
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { UnitTempWhole } from '@/components/climate/UnitText';
import { INTL_LOCALE, localePath } from '@/i18n/config';
import { cityName } from '@/i18n/places';
import { buildRegistry } from '@/utils/cityRegistryCore';
import examples from '@/data/toolGuides.json';
import { guideText } from './guideText';
import { UseCaseLinks } from './UseCaseGuide';

// Mashhoor static shehar: in ke URLs pehle se maujood (data/cities.js)
const POPULAR = ['london', 'paris', 'rome', 'barcelona', 'lisbon', 'new-york', 'tokyo', 'dubai'];
const staticRegistry = buildRegistry(null);

const monthName = (lang, m) => new Intl.DateTimeFormat(INTL_LOCALE[lang] || 'en-US', { month: 'long', timeZone: 'UTC' })
  .format(new Date(Date.UTC(2026, m - 1, 1)));
const num = (lang, v) => Number(v).toLocaleString(INTL_LOCALE[lang] || 'en-US', { maximumFractionDigits: 1 });
const list = (lang, items) => new Intl.ListFormat(INTL_LOCALE[lang] || 'en-US', { type: 'conjunction' }).format(items);

function tripExample(lang, L) {
  const { months } = examples.trip;
  const best = months.reduce((a, m) => (m.score > a.score ? m : a));
  const worst = months.reduce((a, m) => (m.score < a.score ? m : a));
  const rainOnly = months.every((m) => m.high <= 32 && m.low >= 5);
  return {
    cols: [L.cols.month, L.cols.high, L.cols.rain, L.cols.score],
    rows: months.map((m) => [monthName(lang, m.month), <UnitTempWhole key="t" c={m.high} />, `${m.rain}%`, num(lang, m.score)]),
    outro: L.exampleOutro({
      best: monthName(lang, best.month), bestScore: num(lang, best.score),
      worst: monthName(lang, worst.month), worstScore: num(lang, worst.score), rainOnly,
    }),
  };
}

function eventExample(lang, L) {
  const { months } = examples.events;
  const low = months.filter((m) => m.level === 'low');
  const lowest = low.length ? low : [months.reduce((a, m) => (m.risk < a.risk ? m : a))];
  const high = months.reduce((a, m) => (m.risk > a.risk ? m : a));
  return {
    cols: [L.cols.month, L.cols.rain, L.cols.high, L.cols.humidity, L.cols.risk],
    rows: months.map((m) => [monthName(lang, m.month), `${m.rain}%`, <UnitTempWhole key="t" c={m.high} />, `${m.humidity}%`,
      `${num(lang, m.risk)} (${L.levels[m.level]})`]),
    outro: L.exampleOutro({
      lowMonths: list(lang, lowest.map((m) => monthName(lang, m.month))),
      lowScore: list(lang, [...new Set(lowest.map((m) => num(lang, m.risk)))]),
      high: monthName(lang, high.month), highScore: num(lang, high.risk),
    }),
  };
}

const H2 = 'text-2xl font-bold text-slate-900 mt-12 mb-4';
const P = 'text-slate-700 leading-relaxed mb-4';

export default function ToolGuide({ kind, lang }) {
  const all = guideText(lang);
  const L = all[kind];
  const data = examples[kind];
  const city = cityName(lang, data.city, staticRegistry.get(data.city)?.name || data.city);
  const [from, to] = examples.period;
  const ex = kind === 'trip' ? tripExample(lang, L) : eventExample(lang, L);
  const posts = data.blog[lang] || [];
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: L.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };

  return (
    <section className="max-w-4xl mx-auto px-4 pb-16" aria-labelledby={`${kind}-guide`}>
      {/* Naya section (Nov 2026): har use-case page ka link */}
      <UseCaseLinks kind={kind} lang={lang} />
      <h2 id={`${kind}-guide`} className={H2}>{L.scoreTitle}</h2>
      {L.score.map((p) => <p key={p.slice(0, 24)} className={P}>{p}</p>)}

      <h2 className={H2}>{L.exampleTitle(city)}</h2>
      <p className={P}>{L.exampleIntro(city, from, to)}</p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm text-left border border-slate-200 bg-white">
          <thead className="bg-slate-50 text-slate-600">
            <tr>{ex.cols.map((c) => <th key={c} scope="col" className="px-3 py-2 font-semibold">{c}</th>)}</tr>
          </thead>
          <tbody>
            {ex.rows.map((r) => (
              <tr key={r[0]} className="border-t border-slate-100">
                {r.map((cell, i) => (i === 0
                  ? <th key={i} scope="row" className="px-3 py-1.5 font-medium text-slate-800">{cell}</th>
                  : <td key={i} className="px-3 py-1.5 text-slate-700">{cell}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={P}>{ex.outro}</p>

      <h2 className={H2}>{L.useTitle}</h2>
      <ul className="space-y-2 mb-4">
        {L.uses.map(([name, text]) => (
          <li key={name} className="text-slate-700 leading-relaxed"><strong className="text-slate-900">{name}:</strong> {text}</li>
        ))}
      </ul>

      <h2 className={H2}>FAQ</h2>
      {L.faq.map(([q, a]) => (
        <div key={q} className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{q}</h3>
          <p className="text-slate-700 leading-relaxed">{a}</p>
        </div>
      ))}
      <JsonLd data={faqLd} />

      <h2 className={H2}>{all.citiesTitle}</h2>
      <ul className="flex flex-wrap gap-2 mb-4">
        {POPULAR.map((slug) => {
          const c = staticRegistry.get(slug);
          return (
            <li key={slug}>
              <Link href={localePath(lang, staticRegistry.cityPath(slug))} className="inline-block rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-[#0077b6] hover:underline">
                {cityName(lang, slug, c.name)}
              </Link>
            </li>
          );
        })}
      </ul>

      {posts.length > 0 && (
        <>
          <h2 className={H2}>{all.blogTitle}</h2>
          <ul className="list-disc pl-5 space-y-1">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={localePath(lang, `/blog/${p.slug}`)} className="text-[#0077b6] hover:underline">{p.title}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
