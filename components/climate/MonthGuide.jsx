// ─────────────────────────────────────────────────────────────
//  MONTH CLIMATE GUIDE — /weather/<country>/<city>/<month>  (Phase C2)
//  Server component. Har jumla is shehar + is mahine ke APNE numbers se
//  (utils/climateMath.js) — naam badal kar ek jaisa text nahi; data se
//  bahar koi "fact" (events, prices) nahi. Temperatures dono units mein
//  (server HTML: °C pehle). Sab kuch server HTML mein (table, article, links).
//  Order (brief §2.2): hero · quick answer · stats · 12-row table ·
//  chips · article · verdict · travel notes · other cities · warmer/drier
//  elsewhere (backend climate summary) · related articles (backend
//  recommendation) · CTA · data note.
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';
import {
  Thermometer, ThermometerSnowflake, Droplets, CloudRain, Sun, Waves,
  Shirt, Umbrella, Glasses, ArrowRight, CalendarRange, MapPin, Info, Sparkles,
  NotebookPen, Check, X, Compass,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd, { breadcrumbs } from '@/components/JsonLd';
import { UnitTemp, UnitDeltaSigned } from './UnitText';
import { QuickAnswer, heroLine, tableIntro, FeelSection, RainSection, DaylightSection, CompareSection, quickQuestions, suitWhy, tipText } from './MonthStory';
import { monthFacts } from '@/utils/monthNarrative';
import UnitTempShort from './UnitTempShort';
import { VERDICT_STYLE } from './CityByMonth';
import { pexelsSized, pexelsSrcSet } from '@/services/cityPhoto';
import { renderMarkdown } from '@/utils/markdown';
import {
  MONTHS, rowFor, monthPacking, mmToIn, warmerThanCount, monthSuits,
} from '@/utils/climateMath';
import { getCity } from '@/data/cities';

const PACK_ICON = { layers: Shirt, rain: Umbrella, sun: Sun, warm: ThermometerSnowflake, jacket: Shirt, shades: Glasses, light: Shirt };

/**
 * @param p.data   history   @param p.city {slug,name}   @param p.country {slug,name}
 * @param p.month  {num,slug,name}   @param p.photo   @param p.crumbs   @param p.cityHref
 * @param p.monthHref (slug) => URL  @param p.others [{slug,name,href,row}]
 * @param p.years {start,end}  @param p.tags {coastal,hiking}  @param p.note md|null
 * @param p.related  <RelatedArticles/> element (server component) ya null
 * @param p.elsewhere [{slug,name,country,href,row,warmer,drier}] (utils/elsewhere.js)
 */
export default function MonthGuide({ data, city, country, month, photo, crumbs, cityHref, monthHref, others, years, tags, note, related = null, elsewhere = [] }) {
  const monthly = data.monthly_data || [];
  // "Singapore, Singapore" nahi — shehar aur mulk ka naam ek ho to ek dafa
  const place = city.name === country.name ? city.name : `${city.name}, ${country.name}`;
  // lat / lon / timezone (daylight) — data/cities.js
  const geo = { ...city, ...(getCity(city.slug) || {}) };
  const f = monthFacts(monthly, month.num, geo);
  const { row, verdict, relRank } = f;
  const packing = monthPacking(row);
  const warmer = warmerThanCount(monthly, month.num);
  const suits = monthSuits(row, tags, month.num);
  const questions = quickQuestions(f, geo, month, packing, warmer);
  const maxHigh = Math.max(...monthly.map((m) => m.avg_high ?? -99));
  const minHigh = Math.min(...monthly.map((m) => m.avg_high ?? 99));

  const stats = [
    { icon: Thermometer, label: 'Avg high', value: <UnitTemp c={row?.avg_high} />, tone: 'bg-orange-50 border-orange-200 text-orange-600' },
    { icon: ThermometerSnowflake, label: 'Avg low', value: <UnitTemp c={row?.avg_low} />, tone: 'bg-blue-50 border-blue-200 text-blue-600' },
    { icon: Droplets, label: 'Rainfall', value: row?.avg_rainfall != null ? `${Math.round(row.avg_rainfall)} mm (${mmToIn(row.avg_rainfall)} in)` : '—', tone: 'bg-indigo-50 border-indigo-200 text-indigo-600' },
    { icon: CloudRain, label: 'Rainy days', value: row?.rainy_days != null ? `${row.rainy_days} days` : '—', tone: 'bg-sky-50 border-sky-200 text-sky-700' },
    { icon: Sun, label: 'Sunshine', value: row?.sunshine_hours != null ? `${row.sunshine_hours} h / day` : '—', tone: 'bg-amber-50 border-amber-200 text-amber-600' },
    { icon: Waves, label: 'Humidity', value: row?.humidity != null ? `${row.humidity}%` : '—', tone: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-[#f3f7ff]">
      <JsonLd data={breadcrumbs(crumbs)} />
      <Navbar />

      {/* 1. Hero */}
      <div className="relative bg-gradient-to-br from-[#002244] via-[#0077b6] to-[#00a8e8] text-white overflow-hidden">
        {photo && (
          <>
            <img src={pexelsSized(photo, 1280)} srcSet={pexelsSrcSet(photo)} sizes="100vw" alt={`${place} skyline`} width={1280} height={720} fetchPriority="high" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#001528]/85 via-[#001528]/70 to-[#001528]/70" />
          </>
        )}
        <div className="relative max-w-6xl mx-auto px-4 py-14 sm:py-16 text-center">
          <nav aria-label="Breadcrumb" className="text-xs text-blue-100/90 mb-3">
            {crumbs.slice(0, -1).map((b) => (
              <span key={b.path}><Link href={b.path} className="hover:underline">{b.name}</Link> <span aria-hidden="true">›</span> </span>
            ))}
            <span className="text-white font-semibold">{month.name}</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">{city.name} Weather in {month.name}</h1>
          <p className="text-blue-100/90 max-w-2xl mx-auto">
            {heroLine(f, month, place, years)}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* 2. Quick answer + 3. stats */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <p className="text-lg text-gray-700 leading-relaxed">
            <QuickAnswer f={f} city={city} month={month} />
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`rounded-xl border p-3 ${s.tone}`}>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1"><Icon className="w-3.5 h-3.5" /> {s.label}</div>
                  <p className="font-bold text-sm leading-snug">{s.value}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. {Month} vs the rest of the year — 12-row table */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <CalendarRange className="w-5 h-5 text-[#0077b6]" />
            <h2 className="text-xl font-bold text-[#002244]">{month.name} vs the rest of the year</h2>
          </div>
          <p className="text-gray-600 mb-4">
            {tableIntro(f, month, city, warmer) ?? <>{month.name} compared with every other month in {city.name}.</>}
          </p>
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th scope="col" className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 font-semibold rounded-l-lg">Month</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">Avg high</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">vs {month.name}</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Rain</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap rounded-r-lg">Rainy days</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS.map((m) => {
                  const r = rowFor(monthly, m.num);
                  const active = m.num === month.num;
                  const diff = r?.avg_high != null && row?.avg_high != null ? r.avg_high - row.avg_high : null;
                  const bg = active ? 'bg-[#e8f1ff]' : 'bg-white';
                  return (
                    <tr key={m.slug} className={active ? 'font-semibold' : ''} aria-current={active ? 'page' : undefined}>
                      <th scope="row" className={`sticky left-0 z-10 ${bg} px-3 py-2 border-t border-gray-100 text-left`}>
                        <Link href={monthHref(m.slug)} className={`hover:underline ${active ? 'text-[#0077b6]' : 'text-gray-800'}`}>{m.name}</Link>
                      </th>
                      <td className={`${bg} px-3 py-2 border-t border-gray-100 whitespace-nowrap`}><UnitTemp c={r?.avg_high} /></td>
                      <td className={`${bg} px-3 py-2 border-t border-gray-100 whitespace-nowrap ${diff > 0 ? 'text-orange-600' : diff < 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                        {active ? '—' : <UnitDeltaSigned c={diff} />}
                      </td>
                      <td className={`${bg} px-3 py-2 border-t border-gray-100 whitespace-nowrap`}>{r?.avg_rainfall != null ? `${Math.round(r.avg_rainfall)} mm` : '—'}</td>
                      <td className={`${bg} px-3 py-2 border-t border-gray-100`}>{r?.rainy_days ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. 12 month chips */}
        <nav aria-label={`${city.name} weather by month`} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2">
            {MONTHS.map((m) => {
              const r = rowFor(monthly, m.num);
              const pct = r?.avg_high != null && maxHigh > minHigh ? 25 + ((r.avg_high - minHigh) / (maxHigh - minHigh)) * 75 : 50;
              const active = m.num === month.num;
              return (
                <Link key={m.slug} href={monthHref(m.slug)} aria-current={active ? 'page' : undefined} aria-label={`${city.name} weather in ${m.name}`}
                  className={`flex flex-col items-center rounded-xl border px-1 pt-2 pb-1.5 transition-colors ${active ? 'border-[#0077b6] bg-[#e8f1ff]' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'}`}>
                  <span className="text-[11px] font-semibold text-gray-600 leading-tight text-center"><UnitTempShort c={r?.avg_high} /></span>
                  <span className="relative w-3 h-12 mt-1 rounded-full bg-gray-100 overflow-hidden">
                    <span className={`absolute bottom-0 inset-x-0 rounded-full ${active ? 'bg-[#0077b6]' : 'bg-orange-300'}`} style={{ height: `${pct}%` }} />
                  </span>
                  <span className={`mt-1 text-xs font-bold ${active ? 'text-[#0077b6]' : 'text-gray-700'}`}>{m.short}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* 6. Article — data se */}
        <article className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 text-gray-700 leading-relaxed space-y-6">
          <section>
            <h2 className="text-xl font-bold text-[#002244] mb-2">What {month.name} feels like in {city.name}</h2>
            <FeelSection f={f} city={geo} month={month} />
          </section>
          {f.rain && (
            <section>
              <h2 className="text-xl font-bold text-[#002244] mb-2">Rain in {city.name} in {month.name}</h2>
              <RainSection f={f} city={geo} month={month} />
            </section>
          )}
          {f.daylight && (
            <section>
              <h2 className="text-xl font-bold text-[#002244] mb-2">Daylight and sunshine in {month.name}</h2>
              <DaylightSection f={f} city={geo} month={month} />
            </section>
          )}
          <section>
            <h2 className="text-xl font-bold text-[#002244] mb-2">How {month.name} compares to the rest of the year</h2>
            <CompareSection f={f} city={geo} month={month} />
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#002244] mb-3">Who {month.name} suits</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {suits.map((s) => (
                <li key={s.key} className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 ${s.ok ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50/60'}`}>
                  {s.ok ? <Check className="w-4 h-4 mt-1 text-green-600 shrink-0" /> : <X className="w-4 h-4 mt-1 text-gray-400 shrink-0" />}
                  <span><strong className="text-gray-900">{s.label}:</strong> {s.key === 'indoor' ? 'a good choice' : s.ok ? 'a good fit' : 'less ideal'} — {suitWhy(f, s)}.</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#002244] mb-3">Tips for visiting {city.name} in {month.name}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {packing.map((p) => {
                const Icon = PACK_ICON[p.key] || Shirt;
                return (
                  <div key={p.key} className="rounded-xl border border-gray-100 bg-[#EFF6FF] p-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-2"><Icon className="w-5 h-5 text-[#0077b6]" /></div>
                    <h3 className="text-sm font-bold text-[#002244] mb-1">{p.title}</h3>
                    <p className="text-xs text-gray-600 leading-snug">{tipText(f, p)}</p>
                  </div>
                );
              })}
            </div>
          </section>
          {questions.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-[#002244] mb-3">Quick questions</h2>
              <div className="space-y-4">
                {questions.map((x) => (
                  <div key={x.q}>
                    <h3 className="font-bold text-[#002244] mb-1">{x.q}</h3>
                    <p>{x.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* 7. Verdict — absolute + relative */}
        {verdict && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h2 className="text-xl font-bold text-[#002244]">Is {month.name} a good time to visit {city.name}?</h2>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ring-1 ${VERDICT_STYLE[verdict.label]}`}>{verdict.label}</span>
            </div>
            <p className="text-gray-700 leading-relaxed">
              <strong>{verdict.label}</strong> — {verdict.reasons.map((r) => r.text).join(', ')}.
              {relRank && (
                <> Within {city.name}&apos;s own year, {month.name} ranks <strong>#{relRank} of 12</strong>
                  {relRank <= 3 ? <> — one of the 3 best months to visit.</> : relRank >= 10 ? <> — one of the least comfortable months.</> : '.'}</>
              )}
            </p>
          </section>
        )}

        {/* 8. Travel notes (haath se likhe, optional) */}
        {note && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 text-gray-700 leading-relaxed">
            <div className="flex items-center gap-2 mb-1">
              <NotebookPen className="w-5 h-5 text-[#0077b6]" />
              <h2 className="text-xl font-bold text-[#002244]">Travel notes: {city.name} in {month.name}</h2>
            </div>
            {renderMarkdown(note)}
          </section>
        )}

        {/* 9. Isi mahine doosre shehar */}
        {others.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="w-5 h-5 text-[#0077b6]" />
              <h2 className="text-xl font-bold text-[#002244]">{month.name} in other {country.name} cities</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {others.map((o) => (
                <Link key={o.slug} href={o.href} className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all">
                  <p className="font-semibold text-slate-900">{o.name}</p>
                  {o.row ? (
                    <p className="text-sm text-slate-500 mt-1">High <UnitTempShort c={o.row.avg_high} /> · {Math.round(o.row.avg_rainfall ?? 0)} mm</p>
                  ) : (
                    <p className="text-sm text-slate-400 mt-1">{month.name} guide</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 9b. Warmer / drier elsewhere (backend round C2 — climate summary se).
            Sirf asal numbers, max 5, 2 se kam hon to section nahi. */}
        {elsewhere.length >= 2 && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <Compass className="w-5 h-5 text-[#0077b6]" />
              <h2 className="text-xl font-bold text-[#002244]">
                {elsewhere.some((e) => e.warmer) && elsewhere.some((e) => e.drier) ? 'Warmer or drier' : elsewhere[0].warmer ? 'Warmer' : 'Drier'} places in {month.name}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {elsewhere.map((e) => (
                <Link key={e.slug} href={e.href} className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all">
                  <span className="block font-semibold text-slate-900 leading-snug">{e.name}</span>
                  <span className="block text-xs text-slate-400 mb-2">{e.country}</span>
                  <span className="block text-sm text-slate-600">High <UnitTempShort c={e.row.avg_high} /></span>
                  <span className="block text-sm text-slate-600">{e.row.rainy_days ?? '—'} rainy days</span>
                  <span className="mt-2 flex flex-wrap gap-1">
                    {e.warmer && <span className="rounded-full bg-orange-50 text-orange-600 ring-1 ring-orange-200 px-2 py-0.5 text-[11px] font-bold">Warmer</span>}
                    {e.drier && <span className="rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200 px-2 py-0.5 text-[11px] font-bold">Drier</span>}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 10. Related articles — backend recommendation (server component slot) */}
        {related}

        {/* 11. CTA */}
        <section className="relative overflow-hidden bg-gradient-to-r from-[#0077b6] to-[#00a8e8] rounded-2xl p-8 sm:p-10 text-center text-white">
          {photo && (
            <>
              <img src={pexelsSized(photo, 1280)} srcSet={pexelsSrcSet(photo, [640, 960, 1280])} sizes="(min-width: 1152px) 1088px, 100vw" alt="" aria-hidden="true" width={1280} height={720} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001528]/85 via-[#001528]/70 to-[#001528]/70" />
            </>
          )}
          <div className="relative">
            <Sparkles className="w-7 h-7 mx-auto mb-2 text-white/90" />
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">Plan a trip to {city.name}</h2>
            <p className="text-white/85 mb-6">Get a day-by-day weather score for your exact travel dates.</p>
            <Link href={`/trip-planner?city=${city.slug}`} className="inline-flex items-center gap-2 bg-white text-[#0077b6] font-bold px-7 py-3.5 rounded-full hover:bg-blue-50 transition-colors">
              Open the Trip Planner <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* 12. Data note */}
        <p className="text-sm text-gray-500 leading-relaxed">
          <Info className="inline w-4 h-4 -mt-0.5 mr-1.5 align-middle" />
          Monthly averages from {years.end - years.start + 1} years of Open-Meteo history ({years.start}–{years.end}), not a forecast — see all 12 months in{' '}
          <Link href={cityHref} className="text-[#0077b6] font-semibold hover:underline">{city.name} weather by month</Link>.
        </p>
      </div>

      <Footer />
    </div>
  );
}
