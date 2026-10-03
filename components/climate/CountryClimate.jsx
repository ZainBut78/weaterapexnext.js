// ─────────────────────────────────────────────────────────────
//  COUNTRY CLIMATE PAGE — /weather/<country>  (Phase C, server component)
//
//  • Intro text shehron ke apne data se (sab se garam / thanda shehar,
//    aam taur par sab se geela mahina)
//  • City cards (Climate Guides wala photo style)
//  • Month × city table: har cell us shehar ke us mahine ke page ka link
//    (owner: cell-link). Mobile par table apne dabbe mein scroll, pehla
//    column (shehar) sticky.
//  • "Best months to visit" — har mahine ke visitVerdict ka average
//  Data sirf un shehron ka jo services/history.js ne diya (hadd 6).
//  Table aur intro SIRF mile hue data se; city cards (links) saare.
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';
import { MapPin, CalendarRange, Sparkles, Thermometer } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd, { breadcrumbs } from '@/components/JsonLd';
import UnitTempShort from './UnitTempShort';
import { UnitTemp } from './UnitText';
import { pexelsSized, pexelsSrcSet } from '@/utils/pexels';
import { MONTHS, annualMeanHigh, rowFor, visitVerdict } from '@/utils/climateMath';

// Halka rang-scale (average high °C) — sirf pas-e-manzar, text hamesha parha jaye
function heat(c) {
  if (c == null) return 'bg-white text-gray-400';
  if (c < 0) return 'bg-blue-100 text-blue-900';
  if (c < 10) return 'bg-sky-50 text-sky-900';
  if (c < 18) return 'bg-emerald-50 text-emerald-900';
  if (c < 25) return 'bg-amber-50 text-amber-900';
  if (c < 32) return 'bg-orange-100 text-orange-900';
  return 'bg-red-100 text-red-900';
}

export default function CountryClimate({ country, cities, histories, crumbs }) {
  const loaded = cities.filter((c) => histories.has(c.slug));

  // Intro: sab se garam / thanda shehar (saal ka avg high), sab se geela mahina
  const annual = loaded
    .map((c) => ({ c, v: annualMeanHigh(histories.get(c.slug).monthly_data) }))
    .filter((x) => x.v != null)
    .sort((a, b) => b.v - a.v);
  // "Sab se garam/thanda" sirf tab jab kam az kam 2 shehron ka data ho
  const warmest = annual.length > 1 ? annual[0] : null;
  const coolest = annual.length > 1 ? annual[annual.length - 1] : null;
  const single = annual.length === 1 ? annual[0] : null;
  const rainByMonth = MONTHS.map((m) => {
    const vals = loaded.map((c) => rowFor(histories.get(c.slug).monthly_data, m.num)?.avg_rainfall).filter((v) => typeof v === 'number');
    return { m, v: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
  }).filter((x) => x.v != null);
  const wettest = rainByMonth.sort((a, b) => b.v - a.v)[0];

  // Best months: har mahine ka average verdict score (loaded shehron par)
  const monthScores = MONTHS.map((m) => {
    const scores = loaded.map((c) => visitVerdict(rowFor(histories.get(c.slug).monthly_data, m.num))?.score).filter((s) => s != null);
    return { m, score: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null };
  }).filter((x) => x.score != null);
  const bestMonths = [...monthScores].sort((a, b) => b.score - a.score).slice(0, 3);
  const worstMonth = [...monthScores].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="min-h-screen bg-[#f3f7ff]">
      <JsonLd data={breadcrumbs(crumbs)} />
      <Navbar />

      <div className="bg-gradient-to-br from-[#002244] via-[#0077b6] to-[#00a8e8] text-white">
        <div className="max-w-6xl mx-auto px-4 py-14 text-center">
          <nav aria-label="Breadcrumb" className="text-xs text-blue-100/90 mb-3">
            {crumbs.slice(0, -1).map((b) => (
              <span key={b.path}><Link href={b.path} className="hover:underline">{b.name}</Link> <span aria-hidden="true">›</span> </span>
            ))}
            <span className="text-white font-semibold">{country.name}</span>
          </nav>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-3">{country.name} Weather by City &amp; Month</h1>
          <p className="text-blue-100/90 max-w-2xl mx-auto">
            Month-by-month averages for {cities.length} {cities.length === 1 ? 'city' : 'cities'} in {country.name}, from 20 years of historical weather data.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Intro — shehron ke data se */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Thermometer className="w-5 h-5 text-[#0077b6]" />
            <h2 className="text-xl font-bold text-[#002244]">Climate across {country.name}</h2>
          </div>
          {loaded.length ? (
            <p className="text-gray-600 leading-relaxed">
              {single && (
                <><strong className="text-gray-800">{single.c.name}</strong> has an average daytime high of <UnitTemp c={Math.round(single.v * 10) / 10} /> across the year</>
              )}
              {warmest && (
                <>Of the cities below, <strong className="text-gray-800">{warmest.c.name}</strong> is the warmest, with an average daytime high of <UnitTemp c={Math.round(warmest.v * 10) / 10} /> across the year</>
              )}
              {coolest && coolest.c.slug !== warmest?.c.slug && (
                <>, while <strong className="text-gray-800">{coolest.c.name}</strong> is the coolest at <UnitTemp c={Math.round(coolest.v * 10) / 10} /></>
              )}
              .{wettest && <> {loaded.length > 1 ? 'Across these cities' : `In ${loaded[0].name}`}, <strong className="text-gray-800">{wettest.m.name}</strong> is usually the wettest month (about {Math.round(wettest.v)} mm on average).</>}
            </p>
          ) : (
            <p className="text-gray-600">Climate data for these cities is being prepared.</p>
          )}
        </section>

        {/* Cities */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-[#0077b6]" />
            <h2 className="text-xl font-bold text-[#002244]">{country.name} cities by month</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {cities.map((c) =>
              c.photo ? (
                <Link key={c.slug} href={c.href} className="group relative block h-32 sm:h-36 rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-all">
                  <img src={pexelsSized(c.photo, 400, 0.72)} srcSet={pexelsSrcSet(c.photo, [400, 800], 0.72)} sizes="(min-width: 768px) 270px, (min-width: 640px) 33vw, 50vw" alt={`${c.name}, ${country.name}`} loading="lazy" decoding="async" width={400} height={288} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#002244]/85 via-[#002244]/35 to-[#002244]/10" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-semibold text-white leading-tight">{c.name}</p>
                    <p className="text-sm text-white/80">{country.name}</p>
                  </div>
                </Link>
              ) : (
                <Link key={c.slug} href={c.href} className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-400">{country.name}</p>
                </Link>
              ),
            )}
          </div>
        </section>

        {/* Month × city table — sirf jab kam az kam ek shehar ka data ho */}
        {loaded.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <CalendarRange className="w-5 h-5 text-[#0077b6]" />
            <h2 className="text-xl font-bold text-[#002244]">Average high by month</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">Tap a value to open that city&apos;s month guide.</p>
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="text-gray-500">
                  <th scope="col" className="sticky left-0 z-10 bg-white text-left font-semibold px-3 py-2 min-w-[8rem]">City</th>
                  {MONTHS.map((m) => (
                    <th key={m.slug} scope="col" className="font-semibold px-1 py-2 text-center min-w-[3.25rem]">{m.short}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Sirf woh shehar jin ka data is page par mila (backend #7 tak
                    hadd 6) — "—" wali khaali rows nahi (owner, Phase C2 live). */}
                {loaded.map((c) => {
                  const monthly = histories.get(c.slug)?.monthly_data;
                  return (
                    <tr key={c.slug}>
                      <th scope="row" className="sticky left-0 z-10 bg-white text-left font-semibold text-gray-800 px-3 py-1.5 border-t border-gray-100">
                        <Link href={c.href} className="hover:text-[#0077b6] hover:underline">{c.name}</Link>
                      </th>
                      {MONTHS.map((m) => {
                        const v = monthly ? rowFor(monthly, m.num)?.avg_high : null;
                        return (
                          <td key={m.slug} className="p-0.5 border-t border-gray-100">
                            {v != null ? (
                              <Link href={`${c.href}/${m.slug}`} className={`block rounded-md px-1 py-1.5 text-center font-semibold leading-tight hover:ring-2 hover:ring-[#0077b6] ${heat(v)}`} aria-label={`${c.name} in ${m.name}`}>
                                <UnitTempShort c={v} dual />
                              </Link>
                            ) : (
                              <span className="block px-1 py-1.5 text-center text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {/* Best months */}
        {bestMonths.length > 0 && (
          <section className="bg-[#EFF6FF] rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#0077b6]" />
              <h2 className="text-lg font-bold text-[#002244]">Best months to visit {country.name}</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Based on comfortable temperatures, rainy days and sunshine across {loaded.length === cities.length ? 'these cities' : `${loaded.map((c) => c.name).join(', ')}`},
              the most pleasant months are usually <strong className="text-gray-800">{bestMonths.map((b) => b.m.name).join(', ')}</strong>
              {worstMonth && <>; <strong className="text-gray-800">{worstMonth.m.name}</strong> is usually the least comfortable</>}.
              These are historical averages, not a forecast.
            </p>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}
