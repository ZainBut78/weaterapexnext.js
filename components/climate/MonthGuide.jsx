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
import Link from '@/components/LocaleLink';   // i18n: andar ke links zaban ka prefix lete hain
import {
  Thermometer, ThermometerSnowflake, Droplets, CloudRain, Sun, Waves,
  Shirt, Umbrella, Glasses, ArrowRight, CalendarRange, MapPin, Info, Sparkles,
  NotebookPen, Check, X, Compass,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd, { ORGANIZATION, breadcrumbs } from '@/components/JsonLd';
import { SITE_URL } from '@/utils/seo';
import { UnitTemp, UnitDeltaSigned } from './UnitText';
import { monthFacts } from '@/utils/monthNarrative';
import UnitTempShort from './UnitTempShort';
import { VERDICT_STYLE } from './CityByMonth';
import { pexelsSized, pexelsSrcSet } from '@/services/cityPhoto';
import { preload } from 'react-dom';
import { renderMarkdown } from '@/utils/markdown';
import {
  MONTHS, rowFor, monthPacking, mmToIn, warmerThanCount, monthSuits,
} from '@/utils/climateMath';
import { getCity } from '@/data/cities';
import { getCountry } from '@/data/countries';
import { localePath } from '@/i18n/config';
import { cityName, countryName } from '@/i18n/places';
import { climateText } from './text';

const PACK_ICON = { layers: Shirt, rain: Umbrella, sun: Sun, warm: ThermometerSnowflake, jacket: Shirt, shades: Glasses, light: Shirt };

/**
 * @param p.data   history   @param p.city {slug,name}   @param p.country {slug,name}
 * @param p.month  {num,slug,name}   @param p.photo   @param p.crumbs   @param p.cityHref
 * @param p.monthHref (slug) => URL  @param p.others [{slug,name,href,row}]
 * @param p.years {start,end}  @param p.tags {coastal,hiking}  @param p.note md|null
 * @param p.related  <RelatedArticles/> element (server component) ya null
 * @param p.elsewhere [{slug,name,country,href,row,warmer,drier}] (utils/elsewhere.js)
 */
// lang (i18n Phase 1): links/breadcrumb JSON-LD; copy Phase 3 mein
export default function MonthGuide({ data, city, country, month: monthIn, photo, crumbs, cityHref, monthHref, others, years, tags, note, related = null, elsewhere = [], lang = 'en' }) {
  const L = climateText(lang);
  const { QuickAnswer, heroLine, tableIntro, FeelSection, RainSection, DaylightSection, CompareSection, quickQuestions, suitWhy, tipText } = L.story;
  const monthly = data.monthly_data || [];
  const cityN = cityName(lang, city);
  const countryN = countryName(lang, country);
  // Kahani ke jumlon ke liye — naam is zaban mein (English: bilkul wahi objects)
  const month = lang === 'en' ? monthIn : { ...monthIn, name: L.month(monthIn.num) };
  // "Singapore, Singapore" nahi — shehar aur mulk ka naam ek ho to ek dafa
  const place = L.place(cityN, countryN);
  // lat / lon / timezone (daylight) — data/cities.js
  const geoBase = { ...city, ...(getCity(city.slug) || {}) };
  const geo = lang === 'en' ? geoBase : { ...geoBase, name: cityN };
  const f = monthFacts(monthly, month.num, geo, L.locale);
  const { row, verdict, relRank } = f;
  const packing = monthPacking(row);
  const warmer = warmerThanCount(monthly, month.num);
  const suits = monthSuits(row, tags, month.num);
  const questions = quickQuestions(f, geo, month, packing, warmer);
  const cityL = lang === 'en' ? city : { ...city, name: cityN };
  const maxHigh = Math.max(...monthly.map((m) => m.avg_high ?? -99));
  const minHigh = Math.min(...monthly.map((m) => m.avg_high ?? 99));
  // Range ke baad ka asal data (jaise October 2026) — backend har mahine khud laata hai
  // (owner, Oct 2026). Purana backend / abhi nahi aaya → line nahi.
  const latest = (data.recent || []).find((r) => r.month === month.num && r.year > years.end) || null;

  const stats = [
    { icon: Thermometer, label: L.stat.avgHigh, value: <UnitTemp c={row?.avg_high} />, tone: 'bg-orange-50 border-orange-200 text-orange-600' },
    { icon: ThermometerSnowflake, label: L.stat.avgLow, value: <UnitTemp c={row?.avg_low} />, tone: 'bg-blue-50 border-blue-200 text-blue-600' },
    { icon: Droplets, label: L.stat.rainfall, value: row?.avg_rainfall != null ? L.rainMmIn(row.avg_rainfall) : '—', tone: 'bg-indigo-50 border-indigo-200 text-indigo-600' },
    { icon: CloudRain, label: L.stat.rainyDays, value: row?.rainy_days != null ? L.statDays(row.rainy_days) : '—', tone: 'bg-sky-50 border-sky-200 text-sky-700' },
    { icon: Sun, label: L.stat.sunshine, value: row?.sunshine_hours != null ? L.statSun(row.sunshine_hours) : '—', tone: 'bg-amber-50 border-amber-200 text-amber-600' },
    { icon: Waves, label: L.stat.humidity, value: row?.humidity != null ? `${row.humidity}%` : '—', tone: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
  ];

  // Hero (LCP) tasveer <head> mein preload — HTML parse hone se pehle request
  // shuru; wahi srcset/sizes jo <img> par (perf, Oct 2026)
  if (photo) {
    preload(pexelsSized(photo, 1280), {
      as: 'image',
      imageSrcSet: pexelsSrcSet(photo),
      imageSizes: '(max-width: 640px) 60vw, 100vw',
      fetchPriority: 'high',
    });
  }
  return (
    <div className="min-h-screen bg-[#f3f7ff]">
      <JsonLd data={breadcrumbs(crumbs, lang)} />
      {/* Dataset (SEO cities round, owner "haan"): page asal mein 2006–2025 ke
          climate normals hain — Article + banawati dateModified se zyada sahi.
          FAQPage nahi (Google aam sites par FAQ rich results nahi dikhata). */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        ...L.monthDataset({ cityN, place, monthN: month.name, years }),
        url: `${SITE_URL}${localePath(lang, crumbs[crumbs.length - 1].path)}`,
        inLanguage: lang,
        temporalCoverage: `${years.start}/${years.end}`,
        ...(typeof geo.lat === 'number' ? {
          spatialCoverage: {
            '@type': 'Place',
            name: place,
            geo: { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lon },
          },
        } : {}),
        variableMeasured: L.variables,
        creator: ORGANIZATION,
        isBasedOn: 'https://open-meteo.com/',
        license: 'https://creativecommons.org/licenses/by/4.0/',
      }} />
      <Navbar />
      {/* Ek <main> landmark — Navbar/Footer bahar (a11y Task 7) */}
      <main>

      {/* 1. Hero */}
      <div className="relative bg-gradient-to-br from-[#002244] via-[#0077b6] to-[#00a8e8] text-white overflow-hidden">
        {photo && (
          <>
            <img src={pexelsSized(photo, 1280)} srcSet={pexelsSrcSet(photo)} sizes="(max-width: 640px) 60vw, 100vw" alt={L.skylineAlt(place)} width={1280} height={720} fetchPriority="high" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
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
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">{L.monthH1(cityN, month.name)}</h1>
          <p className="text-blue-100/90 max-w-2xl mx-auto">
            {heroLine(f, month, place, years)}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* 2. Quick answer + 3. stats */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <p className="text-lg text-gray-700 leading-relaxed">
            <QuickAnswer f={f} city={cityL} month={month} />
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
          {latest && (
            <p className="mt-4 text-sm text-gray-600">
              <L.Latest monthN={month.name} latest={latest} row={row} years={years} />
            </p>
          )}
        </section>

        {/* 4. {Month} vs the rest of the year — 12-row table */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <CalendarRange className="w-5 h-5 text-[#0077b6]" />
            <h2 className="text-xl font-bold text-[#002244]">{L.vsYearTitle(month.name)}</h2>
          </div>
          <p className="text-gray-600 mb-4">
            {tableIntro(f, month, cityL, warmer) ?? L.tableFallback(month.name, cityN)}
          </p>
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th scope="col" className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 font-semibold rounded-l-lg">{L.th.month}</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">{L.th.avgHigh}</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">{L.th.vs(month.name)}</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">{L.th.rain}</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap rounded-r-lg">{L.th.rainyDays}</th>
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
                        <Link href={monthHref(m.slug)} className={`hover:underline ${active ? 'text-[#0077b6]' : 'text-gray-800'}`}>{L.month(m.num)}</Link>
                      </th>
                      <td className={`${bg} px-3 py-2 border-t border-gray-100 whitespace-nowrap`}><UnitTemp c={r?.avg_high} /></td>
                      <td className={`${bg} px-3 py-2 border-t border-gray-100 whitespace-nowrap ${diff > 0 ? 'text-orange-600' : diff < 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                        {active ? '—' : <UnitDeltaSigned c={diff} />}
                      </td>
                      <td className={`${bg} px-3 py-2 border-t border-gray-100 whitespace-nowrap`}>{r?.avg_rainfall != null ? L.rainMm(r.avg_rainfall) : '—'}</td>
                      <td className={`${bg} px-3 py-2 border-t border-gray-100`}>{r?.rainy_days ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. 12 month chips */}
        <nav aria-label={L.chipsLabel(cityN)} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2">
            {MONTHS.map((m) => {
              const r = rowFor(monthly, m.num);
              const pct = r?.avg_high != null && maxHigh > minHigh ? 25 + ((r.avg_high - minHigh) / (maxHigh - minHigh)) * 75 : 50;
              const active = m.num === month.num;
              return (
                <Link key={m.slug} href={monthHref(m.slug)} aria-current={active ? 'page' : undefined} aria-label={L.chipAria(cityN, L.month(m.num))}
                  className={`flex flex-col items-center rounded-xl border px-1 pt-2 pb-1.5 transition-colors ${active ? 'border-[#0077b6] bg-[#e8f1ff]' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'}`}>
                  <span className="text-[11px] font-semibold text-gray-600 leading-tight text-center"><UnitTempShort c={r?.avg_high} /></span>
                  <span className="relative w-3 h-12 mt-1 rounded-full bg-gray-100 overflow-hidden">
                    <span className={`absolute bottom-0 inset-x-0 rounded-full ${active ? 'bg-[#0077b6]' : 'bg-orange-300'}`} style={{ height: `${pct}%` }} />
                  </span>
                  <span className={`mt-1 text-xs font-bold ${active ? 'text-[#0077b6]' : 'text-gray-700'}`}>{L.monthShort(m.num)}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* 6. Article — data se */}
        <article className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 text-gray-700 leading-relaxed space-y-6">
          <section>
            <h2 className="text-xl font-bold text-[#002244] mb-2">{L.feelTitle(month.name, cityN)}</h2>
            <FeelSection f={f} city={geo} month={month} />
          </section>
          {f.rain && (
            <section>
              <h2 className="text-xl font-bold text-[#002244] mb-2">{L.rainTitle(cityN, month.name)}</h2>
              <RainSection f={f} city={geo} month={month} />
            </section>
          )}
          {f.daylight && (
            <section>
              <h2 className="text-xl font-bold text-[#002244] mb-2">{L.daylightTitle(month.name)}</h2>
              <DaylightSection f={f} city={geo} month={month} />
            </section>
          )}
          <section>
            <h2 className="text-xl font-bold text-[#002244] mb-2">{L.compareTitle(month.name)}</h2>
            <CompareSection f={f} city={geo} month={month} />
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#002244] mb-3">{L.suitsTitle(month.name)}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {suits.map((s) => (
                <li key={s.key} className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 ${s.ok ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50/60'}`}>
                  {s.ok ? <Check className="w-4 h-4 mt-1 text-green-600 shrink-0" /> : <X className="w-4 h-4 mt-1 text-gray-400 shrink-0" />}
                  <span>{L.SuitLine
                    ? <L.SuitLine label={L.suitLabel(s)} status={L.suitStatus(s)} why={suitWhy(f, s)} />
                    : <><strong className="text-gray-900">{L.suitLabel(s)}:</strong> {L.suitStatus(s)} — {suitWhy(f, s)}.</>}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#002244] mb-3">{L.tipsTitle(cityN, month.name)}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {packing.map((p) => {
                const Icon = PACK_ICON[p.key] || Shirt;
                return (
                  <div key={p.key} className="rounded-xl border border-gray-100 bg-[#EFF6FF] p-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-2"><Icon className="w-5 h-5 text-[#0077b6]" /></div>
                    <h3 className="text-sm font-bold text-[#002244] mb-1">{L.packTitle(p)}</h3>
                    <p className="text-xs text-gray-600 leading-snug">{tipText(f, p)}</p>
                  </div>
                );
              })}
            </div>
          </section>
          {questions.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-[#002244] mb-3">{L.questionsTitle}</h2>
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
              <h2 className="text-xl font-bold text-[#002244]">{L.verdictTitle(month.name, cityN)}</h2>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ring-1 ${VERDICT_STYLE[verdict.label]}`}>{L.verdict(verdict.label)}</span>
            </div>
            <p className="text-gray-700 leading-relaxed">
              <L.VerdictText verdict={verdict} relRank={relRank} cityN={cityN} monthN={month.name} reasons={L.reasons(verdict)} />
            </p>
          </section>
        )}

        {/* 8. Travel notes (haath se likhe, optional) */}
        {note && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 text-gray-700 leading-relaxed">
            <div className="flex items-center gap-2 mb-1">
              <NotebookPen className="w-5 h-5 text-[#0077b6]" />
              <h2 className="text-xl font-bold text-[#002244]">{L.notesTitle(cityN, month.name)}</h2>
            </div>
            {renderMarkdown(note)}
          </section>
        )}

        {/* 9. Isi mahine doosre shehar */}
        {others.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="w-5 h-5 text-[#0077b6]" />
              <h2 className="text-xl font-bold text-[#002244]">{L.othersTitle(month.name, countryN, country)}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {others.map((o) => (
                <Link key={o.slug} href={o.href} className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all">
                  <p className="font-semibold text-slate-900">{cityName(lang, o)}</p>
                  {o.row ? (
                    <p className="text-sm text-slate-500 mt-1"><L.OtherHigh row={o.row} /></p>
                  ) : (
                    <p className="text-sm text-slate-400 mt-1">{L.otherGuide(month.name)}</p>
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
                {L.elsewhereTitle(elsewhere.some((e) => e.warmer) && elsewhere.some((e) => e.drier) ? 'both' : elsewhere[0].warmer ? 'warmer' : 'drier', month.name)}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {elsewhere.map((e) => (
                <Link key={e.slug} href={e.href} className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all">
                  <span className="block font-semibold text-slate-900 leading-snug">{cityName(lang, e)}</span>
                  <span className="block text-xs text-slate-400 mb-2">{lang === 'en' ? e.country : countryName(lang, getCountry(e.countrySlug) || e.country)}</span>
                  <span className="block text-sm text-slate-600"><L.ElsewhereHigh row={e.row} /></span>
                  <span className="block text-sm text-slate-600">{L.elsewhereRainy(e.row.rainy_days)}</span>
                  <span className="mt-2 flex flex-wrap gap-1">
                    {e.warmer && <span className="rounded-full bg-orange-50 text-orange-600 ring-1 ring-orange-200 px-2 py-0.5 text-[11px] font-bold">{L.warmer}</span>}
                    {e.drier && <span className="rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200 px-2 py-0.5 text-[11px] font-bold">{L.drier}</span>}
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
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">{L.ctaMonthTitle(cityN)}</h2>
            <p className="text-white/85 mb-6">{L.ctaMonthText}</p>
            <Link href={`/trip-planner?city=${city.slug}`} className="inline-flex items-center gap-2 bg-white text-[#0077b6] font-bold px-7 py-3.5 rounded-full hover:bg-blue-50 transition-colors">
              {L.ctaMonthButton} <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* 12. Data note */}
        <p className="text-sm text-gray-500 leading-relaxed">
          <Info className="inline w-4 h-4 -mt-0.5 mr-1.5 align-middle" />
          <L.MonthDataNote years={years} cityHref={cityHref} cityN={cityN} />
        </p>
      </div>

      </main>
      <Footer />
    </div>
  );
}
