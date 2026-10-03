// ─────────────────────────────────────────────────────────────
//  CITY CLIMATE GUIDE — page ka poora design (server component)
//
//  Do URLs isi ko render karte hain:
//   • /weather/<city>            (purana, abhi live)
//   • /weather/<country>/<city>  (Phase C, preview)
//  Design bilkul ek — sirf breadcrumb, "More cities" ke links aur mulk ka
//  naam props se aate hain. Purane URL ke props purani values dete hain,
//  is liye us ka HTML nahi badla.
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';
import {
  Thermometer, Droplets, Sun, Umbrella, Shirt,
  ArrowRight, CalendarRange, CloudRain, MapPin
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MONTH_SHORT } from '@/utils/climateNarrative';
import { TemperatureChart, RainfallChart, SunshineChart } from './ClimateCharts';
import MonthlyTable from './MonthlyTable';
import { UnitTemp, ClimateNarrative } from './UnitText';
import { pexelsSized, pexelsSrcSet } from '@/services/cityPhoto';
import JsonLd, { breadcrumbs } from '@/components/JsonLd';

/**
 * @param {object}   p.data              backend history response

 * @param {string}   p.countryName       hero ke upar (purana: data.country)
 * @param {string|null} p.photo          Pexels URL
 * @param {{name:string,path:string}[]} p.crumbs  breadcrumb JSON-LD
 * @param {{slug:string,name:string,country:string,href:string}[]} p.moreCities
 * @param {string}   p.moreCitiesCountry "More cities in …"
 * @param {string}   p.tripHref
 * @param {{href:string, months:{name:string,short:string,href:string}[]}|null} p.monthByMonth
 *        Phase C2: Section 2 ka link box (sirf jab diya jaye)
 */
export default function CityClimate({ data, countryName, photo, crumbs, moreCities, moreCitiesCountry, tripHref, monthByMonth, related = null }) {
  const monthly = data.monthly_data || [];
  const chartData = monthly.map((m) => ({
    month: MONTH_SHORT[(m.month || 1) - 1],
    high: m.avg_high,
    low: m.avg_low,
    rain: m.avg_rainfall,
    sunshine: m.sunshine_hours,
    humidity: m.humidity,
  }));


  const photoAlt = `${data.city}, ${countryName} skyline`;

  const withHighs = monthly.filter((m) => typeof m.avg_high === 'number');
  const withRain = monthly.filter((m) => typeof m.avg_rainfall === 'number');

  const packing = [{ icon: Shirt, title: 'Versatile Layers', text: 'Light layers that work for both mild afternoons and cooler evenings.' }];
  if (withRain.length) {
    const wettest = withRain.reduce((a, b) => (a.avg_rainfall > b.avg_rainfall ? a : b));
    if (wettest.avg_rainfall > 60) {
      packing.push({ icon: Umbrella, title: 'Rain Protection', text: 'A compact umbrella and a light rain jacket for the wettest months.' });
    }
  }
  if (withHighs.length) {
    const hottest = withHighs.reduce((a, b) => (a.avg_high > b.avg_high ? a : b));
    if (hottest.avg_high > 30) {
      packing.push({ icon: Sun, title: 'Sun Protection', text: 'Sunscreen, a wide-brimmed hat and sunglasses for hot, sunny days.' });
    }
    const coldest = withHighs.reduce((a, b) => (a.avg_high < b.avg_high ? a : b));
    if (coldest.avg_high < 10) {
      packing.push({ icon: CloudRain, title: 'Warm Layers', text: 'A warm jacket or fleece for chilly mornings and evenings.' });
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f7ff]">
      {/* Home › Climate Guides › City (audit 2.4) */}
      <JsonLd data={breadcrumbs(crumbs)} />
      <Navbar />

      <div className="relative bg-gradient-to-br from-[#002244] via-[#0077b6] to-[#00a8e8] text-white overflow-hidden">
        {photo && (
          <>
            {/* LCP image: lazy NAHI, fetchPriority high, mobile ko chhoti
                file (srcSet). absolute hai — hero ki height text se banti
                hai, is liye photo aane par layout nahi hilta (CLS 0). */}
            <img
              src={pexelsSized(photo, 1280)}
              srcSet={pexelsSrcSet(photo)}
              sizes="100vw"
              alt={photoAlt}
              width={1280}
              height={720}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* #001528 parda, kam az kam 70% — sab se roshan photo par bhi
                safed text ~7:1, text-blue-200 ~4.9:1 (WCAG 4.5:1 se upar) */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#001528]/85 via-[#001528]/70 to-[#001528]/70" />
          </>
        )}
        <div className="relative max-w-6xl mx-auto px-4 py-16 text-center">
          <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-2">{countryName}</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">{data.city} Climate & Weather Guide</h1>
          <p className="text-blue-100/90 max-w-2xl mx-auto">
            Average temperatures, rainfall and conditions through the year, based on 20 years of historical data.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Thermometer className="w-5 h-5 text-[#0077b6]" />
            <h2 className="text-xl font-bold text-[#002244]">Climate Overview</h2>
          </div>
          <p className="text-gray-600 leading-relaxed"><ClimateNarrative city={data.city} monthly={monthly} /></p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p className="text-orange-500 font-bold"><UnitTemp c={withHighs.length ? withHighs.reduce((a, b) => (a.avg_high > b.avg_high ? a : b)).avg_high : null} /></p>
              <p className="text-gray-500 text-xs">Hottest month avg high</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-blue-500 font-bold"><UnitTemp c={withHighs.length ? withHighs.reduce((a, b) => (a.avg_high < b.avg_high ? a : b)).avg_high : null} /></p>
              <p className="text-gray-500 text-xs">Coolest month avg high</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
              <p className="text-indigo-500 font-bold">{withRain.length ? Math.round(withRain.reduce((a, b) => (a.avg_rainfall > b.avg_rainfall ? a : b)).avg_rainfall) : '—'}mm</p>
              <p className="text-gray-500 text-xs">Wettest month avg</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <p className="text-emerald-500 font-bold">{withRain.length ? Math.round(withRain.reduce((a, b) => (a.avg_rainfall < b.avg_rainfall ? a : b)).avg_rainfall) : '—'}mm</p>
              <p className="text-gray-500 text-xs">Driest month avg</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Thermometer className="w-5 h-5 text-[#0077b6]" />
            <h2 className="text-xl font-bold text-[#002244]">Temperature by Month</h2>
          </div>
          <TemperatureChart chartData={chartData} />
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Droplets className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold text-[#002244]">Rainfall by Month</h2>
            </div>
            <RainfallChart chartData={chartData} />
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Sun className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-[#002244]">Sunshine Hours</h2>
            </div>
            <SunshineChart chartData={chartData} />
          </section>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <CalendarRange className="w-5 h-5 text-[#0077b6]" />
            <h2 className="text-xl font-bold text-[#002244]">Monthly Averages</h2>
          </div>
          <MonthlyTable monthly={monthly} />
        </section>

        <section className="bg-[#EFF6FF] rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <Shirt className="w-5 h-5 text-[#0077b6]" />
            <h2 className="text-lg font-bold text-[#002244]">What to Pack</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Suggested packing for {data.city}'s climate.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {packing.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-[#0077b6]" />
                  </div>
                  <h4 className="text-sm font-bold text-[#002244] mb-1">{p.title}</h4>
                  <p className="text-xs text-gray-500 leading-snug">{p.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Usi mulk ke doosre shehar — asli <a href> links (audit 2.6-b).
            Whitelist se, zyada se zyada 6; na hon to section hi nahi.
            Card design wahi jo Climate Guides page ka hai. */}
        {moreCities.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-[#0077b6]" />
              <h2 className="text-xl font-bold text-[#002244]">More cities in {moreCitiesCountry}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {moreCities.map((c) => (
                <Link
                  key={c.slug}
                  href={c.href}
                  className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-400">{c.country}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Phase C2: Section 2 (month-by-month) ka link box + 12 month links.
            Sirf yahi izafa; baqi page bilkul wahi. */}
        {monthByMonth && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <Link href={monthByMonth.href} className="group flex items-center justify-between gap-3 mb-4">
              <span className="flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-[#0077b6]" />
                <span className="text-xl font-bold text-[#002244] group-hover:text-[#0077b6]">See {data.city} weather month by month</span>
              </span>
              <ArrowRight className="w-5 h-5 text-[#0077b6] shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {monthByMonth.months.map((m) => (
                <Link key={m.href} href={m.href} className="text-center rounded-lg border border-gray-200 py-2 text-sm font-semibold text-gray-700 hover:border-blue-300 hover:text-[#0077b6] hover:bg-blue-50/40 transition-colors" aria-label={`${data.city} weather in ${m.name}`}>
                  {m.short}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Backend round B5: related articles (backend recommendation) —
            server component; khaali ho to kuch render nahi hota */}
        {related}

        <section className="relative overflow-hidden bg-gradient-to-r from-[#0077b6] to-[#00a8e8] rounded-2xl p-8 sm:p-10 text-center text-white">
          {photo && (
            <>
              {/* Wahi photo (browser cache se), neeche hai is liye lazy (N2) */}
              <img
                src={pexelsSized(photo, 1280)}
                srcSet={pexelsSrcSet(photo, [640, 960, 1280])}
                sizes="(min-width: 1152px) 1088px, 100vw"
                alt=""
                aria-hidden="true"
                width={1280}
                height={720}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001528]/85 via-[#001528]/70 to-[#001528]/70" />
            </>
          )}
          <div className="relative">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">Planning a trip to {data.city}?</h2>
          <p className="text-white/85 mb-6">Get a day-by-day weather plan for your exact travel dates.</p>
          <Link
            href={tripHref}
            className="inline-flex items-center gap-2 bg-white text-[#0077b6] font-bold px-7 py-3.5 rounded-full hover:bg-blue-50 transition-colors"
          >
            Use our Trip Planner
            <ArrowRight size={18} />
          </Link>
          </div>
        </section>

      </div>

      <Footer />
    </div>
  );
}
