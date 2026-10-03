// ─────────────────────────────────────────────────────────────
//  CITY WEATHER BY MONTH — /weather/<country>/<city>  (Phase C2, Section 2)
//  Server component. Historical page (Section 1) ki copy NAHI:
//  intro (saal ke extremes), relative best months, 12 month cards (har
//  card us mahine ka apna data + faisla + link), Section 1 ka link,
//  usi mulk ke doosre shehar. Data: wahi ek history call (0 izafi).
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';
import { ArrowRight, CalendarRange, MapPin, Sparkles, Info, Droplets, CloudRain, Sun, BookOpen } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd, { breadcrumbs } from '@/components/JsonLd';
import { UnitTemp } from './UnitText';
import { pexelsSized, pexelsSrcSet } from '@/services/cityPhoto';
import { MONTHS, rowFor, visitVerdict, yearExtremes, bestMonths, mmToIn } from '@/utils/climateMath';

export const VERDICT_STYLE = {
  Great: 'bg-green-50 text-green-700 ring-green-200',
  Good: 'bg-blue-50 text-blue-700 ring-blue-200',
  Fair: 'bg-amber-50 text-amber-700 ring-amber-200',
  Poor: 'bg-red-50 text-red-700 ring-red-200',
};

/**
 * @param p.data       history response
 * @param p.city       { slug, name }
 * @param p.country    { slug, name }
 * @param p.photo      Pexels URL | null
 * @param p.crumbs
 * @param p.monthHref  (monthSlug) => URL
 * @param p.section1Href  /weather/<city>
 * @param p.others     [{ slug, name, href }]
 * @param p.years      { start, end }
 */
export default function CityByMonth({ data, city, country, photo, crumbs, monthHref, section1Href, others, years, related = null }) {
  const monthly = data.monthly_data || [];
  // "Singapore, Singapore" nahi
  const place = city.name === country.name ? city.name : `${city.name}, ${country.name}`;
  const x = yearExtremes(monthly);
  const best = bestMonths(monthly, 3);

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
            <span className="text-white font-semibold">{city.name}</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">{city.name} Weather by Month</h1>
          <p className="text-blue-100/90 max-w-2xl mx-auto">
            Twelve months of {place} weather — averages from {years.start}–{years.end}.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* 2. Intro — saal ke extremes */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <p className="text-lg text-gray-700 leading-relaxed">
            {x.warmest && <>{city.name}&apos;s warmest month is <strong className="text-gray-900">{x.warmest.month.name}</strong> (average high <UnitTemp c={x.warmest.row.avg_high} />)</>}
            {x.coolest && <> and the coolest is <strong className="text-gray-900">{x.coolest.month.name}</strong> (<UnitTemp c={x.coolest.row.avg_high} />)</>}.
            {x.wettest && <> The most rain falls in <strong className="text-gray-900">{x.wettest.month.name}</strong> (about {Math.round(x.wettest.row.avg_rainfall)} mm)</>}
            {x.driest && <>, and <strong className="text-gray-900">{x.driest.month.name}</strong> is the driest (about {Math.round(x.driest.row.avg_rainfall)} mm)</>}.
            {x.sunniest && <> <strong className="text-gray-900">{x.sunniest.month.name}</strong> is the sunniest, with about {x.sunniest.row.sunshine_hours} hours of sunshine a day.</>}
          </p>
        </section>

        {/* 3. Best months (relative — is shehar ke apne saal mein) */}
        {best.length > 0 && (
          <section className="bg-[#EFF6FF] rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#0077b6]" />
              <h2 className="text-xl font-bold text-[#002244]">Best months to visit {city.name}</h2>
            </div>
            <ol className="grid gap-3 sm:grid-cols-3">
              {best.map((m, i) => {
                const v = visitVerdict(rowFor(monthly, m.num));
                return (
                  <li key={m.slug}>
                    <Link href={monthHref(m.slug)} className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-blue-300 transition-colors">
                      <span>
                        <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                        <span className="block text-lg font-bold text-[#002244]">{m.name}</span>
                      </span>
                      {v && <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${VERDICT_STYLE[v.label]}`}>{v.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-sm text-gray-500">Ranked within {city.name}&apos;s own year by temperature comfort, rainy days and sunshine — historical averages, not a forecast.</p>
          </section>
        )}

        {/* 4. 12 month cards */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CalendarRange className="w-5 h-5 text-[#0077b6]" />
            <h2 className="text-xl font-bold text-[#002244]">{city.name} month by month</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {MONTHS.map((m) => {
              const r = rowFor(monthly, m.num);
              const v = visitVerdict(r);
              return (
                <Link key={m.slug} href={monthHref(m.slug)} className="group flex flex-col bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-[#002244]">{m.name}</h3>
                    {v && <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${VERDICT_STYLE[v.label]}`}>{v.label}</span>}
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">High</span> <strong><UnitTemp c={r?.avg_high} /></strong>
                    <br />
                    <span className="text-gray-500">Low</span> <strong><UnitTemp c={r?.avg_low} /></strong>
                  </p>
                  <dl className="mt-3 space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-indigo-400" /><dt className="sr-only">Rainfall</dt><dd>{r?.avg_rainfall != null ? `${Math.round(r.avg_rainfall)} mm (${mmToIn(r.avg_rainfall)} in)` : '—'}</dd></div>
                    <div className="flex items-center gap-1.5"><CloudRain className="w-3.5 h-3.5 text-sky-500" /><dt className="sr-only">Rainy days</dt><dd>{r?.rainy_days ?? '—'} rainy days</dd></div>
                    <div className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-500" /><dt className="sr-only">Sunshine</dt><dd>{r?.sunshine_hours ?? '—'} h sunshine / day</dd></div>
                  </dl>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#0077b6]">
                    {m.name} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 5. Section 1 ka link */}
        <Link href={section1Href} className="group flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 hover:border-blue-300 hover:shadow-md transition-all">
          <span className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[#0077b6] shrink-0" />
            <span>
              <span className="block text-lg font-bold text-[#002244]">Full 20-year climate guide for {city.name}</span>
              <span className="text-sm text-gray-500">Charts, the monthly averages table and packing tips</span>
            </span>
          </span>
          <ArrowRight className="w-5 h-5 text-[#0077b6] shrink-0 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* 6. Usi mulk ke doosre shehar */}
        {others.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="w-5 h-5 text-[#0077b6]" />
              <h2 className="text-xl font-bold text-[#002244]">More {country.name} cities by month</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {others.map((o) => (
                <Link key={o.slug} href={o.href} className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all">
                  <p className="font-semibold text-slate-900">{o.name}</p>
                  <p className="text-sm text-slate-400">Weather by month</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 7. Related articles (backend round B5) — khaali ho to kuch nahi */}
        {related}

        <p className="text-sm text-gray-500 leading-relaxed">
          <Info className="inline w-4 h-4 -mt-0.5 mr-1.5 align-middle" />
          Based on {years.end - years.start + 1} years of historical weather data ({years.start}–{years.end}) from Open-Meteo. Monthly averages, not a forecast.
        </p>
      </div>

      <Footer />
    </div>
  );
}
