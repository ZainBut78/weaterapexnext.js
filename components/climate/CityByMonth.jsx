// ─────────────────────────────────────────────────────────────
//  CITY WEATHER BY MONTH + CLIMATE GUIDE — /weather/<country>/<city>
//
//  SEO fixes (Oct 2026, owner option 1 "merge, then 301"): purana Section 1
//  page (/weather/<city>, "City Climate & Weather Guide") isi page mein mil
//  gaya — /weather/<city> ab 301 → yahan (proxy.js). Upar wahi Section 2
//  (H1, intro, best months, 12 month cards); neeche Section 1 ka content:
//  stat tiles, temperature/rain/sun charts (lazy — LCP par asar nahi), poori
//  monthly table (server HTML), packing tips, trip planner CTA.
//  Section 1 ki narrative nahi dohrayi — wahi baatein intro (#2) mein hain
//  (ek page par ek hi summary; mahine ki tafseel month pages par).
//  Data: wahi ek history call (0 izafi).
// ─────────────────────────────────────────────────────────────
import Link from '@/components/LocaleLink';   // i18n: andar ke links zaban ka prefix lete hain
import {
  ArrowRight, CalendarRange, MapPin, Sparkles, Info, Droplets, CloudRain, Sun,
  BookOpen, Thermometer, Shirt, Umbrella,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd, { ORGANIZATION, breadcrumbs } from '@/components/JsonLd';
import { UnitTemp } from './UnitText';
import MonthlyTable from './MonthlyTable';
import LazyClimateChart from './LazyClimateChart';
import { pexelsSized, pexelsSrcSet } from '@/services/cityPhoto';
import { preload } from 'react-dom';
import { MONTHS, rowFor, visitVerdict, yearExtremes, bestMonths } from '@/utils/climateMath';
import { SITE_URL } from '@/utils/seo';
import { localePath } from '@/i18n/config';
import { cityName, countryName, inCity } from '@/i18n/places';
import { climateText } from './text';

// Purane Section 1 wali packing (wahi qawaid) — text zaban ki file se (L.cityPacking[key])
function packingFor(monthly) {
  const withHighs = monthly.filter((m) => typeof m.avg_high === 'number');
  const withRain = monthly.filter((m) => typeof m.avg_rainfall === 'number');
  const packing = [{ icon: Shirt, key: 'layers' }];
  if (withRain.length) {
    const wettest = withRain.reduce((a, b) => (a.avg_rainfall > b.avg_rainfall ? a : b));
    if (wettest.avg_rainfall > 60) {
      packing.push({ icon: Umbrella, key: 'rain' });
    }
  }
  if (withHighs.length) {
    const hottest = withHighs.reduce((a, b) => (a.avg_high > b.avg_high ? a : b));
    if (hottest.avg_high > 30) {
      packing.push({ icon: Sun, key: 'sun' });
    }
    const coldest = withHighs.reduce((a, b) => (a.avg_high < b.avg_high ? a : b));
    if (coldest.avg_high < 10) {
      packing.push({ icon: CloudRain, key: 'warm' });
    }
  }
  return packing;
}

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
 * @param p.others     [{ slug, name, href }]
 * @param p.years      { start, end }
 * @param p.geo        { lat, lon } (data/cities.js) — Dataset JSON-LD
 * @param p.tripHref   trip planner link
 */
// lang (i18n Phase 1): sirf links/breadcrumb JSON-LD ke liye. Is page ki copy
// (H1, intro, packing…) Phase 3 ke native templates mein tarjuma hogi.
export default function CityByMonth({ data, city, country, photo, crumbs, monthHref, others, years, geo = {}, tripHref, related = null, lang = 'en' }) {
  const L = climateText(lang);
  const monthly = data.monthly_data || [];
  const cityN = cityName(lang, city);
  const countryN = countryName(lang, country);
  // "Singapore, Singapore" nahi
  const place = L.place(cityN, countryN);
  const x = yearExtremes(monthly);
  const best = bestMonths(monthly, 3);
  const packing = packingFor(monthly);
  const chartData = monthly.map((m) => ({
    month: L.monthShort(m.month || 1),
    high: m.avg_high,
    low: m.avg_low,
    rain: m.avg_rainfall,
    sunshine: m.sunshine_hours,
    humidity: m.humidity,
  }));
  const withRain = monthly.filter((m) => typeof m.avg_rainfall === 'number');

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
      {/* Dataset — page 20 saal ke monthly climate normals hai (month pages jaisa) */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        ...L.cityDataset({ cityN, place, years }),
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
            <span className="text-white font-semibold">{cityN}</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">{L.cityH1(cityN)}</h1>
          <p className="text-blue-100/90 max-w-2xl mx-auto">
            {L.citySub(place, years)}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* 2. Intro — saal ke extremes */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <p className="text-lg text-gray-700 leading-relaxed">
            <L.CityIntro x={x} cityN={cityN} inCity={inCity(lang, city)} />
          </p>
        </section>

        {/* 3. Best months (relative — is shehar ke apne saal mein) */}
        {best.length > 0 && (
          <section className="bg-[#EFF6FF] rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#0077b6]" />
              <h2 className="text-xl font-bold text-[#002244]">{L.bestTitle(cityN)}</h2>
            </div>
            <ol className="grid gap-3 sm:grid-cols-3">
              {best.map((m, i) => {
                const v = visitVerdict(rowFor(monthly, m.num));
                return (
                  <li key={m.slug}>
                    <Link href={monthHref(m.slug)} className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-blue-300 transition-colors">
                      <span>
                        <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                        <span className="block text-lg font-bold text-[#002244]">{L.month(m.num)}</span>
                      </span>
                      {v && <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${VERDICT_STYLE[v.label]}`}>{L.verdict(v.label)}</span>}
                    </Link>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-sm text-gray-500">{L.bestNote(cityN)}</p>
          </section>
        )}

        {/* 4. 12 month cards */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CalendarRange className="w-5 h-5 text-[#0077b6]" />
            <h2 className="text-xl font-bold text-[#002244]">{L.monthByMonth(cityN)}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {MONTHS.map((m) => {
              const r = rowFor(monthly, m.num);
              const v = visitVerdict(r);
              return (
                <Link key={m.slug} href={monthHref(m.slug)} className="group flex flex-col bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-[#002244]">{L.month(m.num)}</h3>
                    {v && <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${VERDICT_STYLE[v.label]}`}>{L.verdict(v.label)}</span>}
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">{L.high}</span> <strong><UnitTemp c={r?.avg_high} /></strong>
                    <br />
                    <span className="text-gray-500">{L.low}</span> <strong><UnitTemp c={r?.avg_low} /></strong>
                  </p>
                  <dl className="mt-3 space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-indigo-400" /><dt className="sr-only">{L.srRainfall}</dt><dd>{r?.avg_rainfall != null ? L.rainMmIn(r.avg_rainfall) : '—'}</dd></div>
                    <div className="flex items-center gap-1.5"><CloudRain className="w-3.5 h-3.5 text-sky-500" /><dt className="sr-only">{L.srRainy}</dt><dd>{L.rainyDaysN(r?.rainy_days ?? '—')}</dd></div>
                    <div className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-500" /><dt className="sr-only">{L.srSun}</dt><dd>{L.sunPerDay(r?.sunshine_hours ?? '—')}</dd></div>
                  </dl>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#0077b6]">
                    {L.month(m.num)} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 5. Purana Section 1 (climate guide) — ab isi page par. Us ka H1
            yahan H2; andar ke dabbe H3 (heading order seedha). Design wahi
            safed cards / rang jo Section 1 par the. */}
        <section aria-labelledby="climate-guide" className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-[#0077b6]" />
              <h2 id="climate-guide" className="text-xl font-bold text-[#002244]">{L.guideTitle(cityN)}</h2>
            </div>
            <p className="text-gray-600">
              {L.guideSub(years)}
            </p>
          </div>

          {/* Saal ki 4 jhalkiyan (numbers; jumle intro #2 mein hain) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p className="text-orange-700 font-bold"><UnitTemp c={x.warmest?.row.avg_high} /></p>
              <p className="text-gray-600 text-xs">{L.tiles.hottest}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-blue-700 font-bold"><UnitTemp c={x.coolest?.row.avg_high} /></p>
              <p className="text-gray-600 text-xs">{L.tiles.coolest}</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
              <p className="text-indigo-700 font-bold">{withRain.length ? Math.round(withRain.reduce((a, b) => (a.avg_rainfall > b.avg_rainfall ? a : b)).avg_rainfall) : '—'}mm</p>
              <p className="text-gray-600 text-xs">{L.tiles.wettest}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <p className="text-emerald-700 font-bold">{withRain.length ? Math.round(withRain.reduce((a, b) => (a.avg_rainfall < b.avg_rainfall ? a : b)).avg_rainfall) : '—'}mm</p>
              <p className="text-gray-600 text-xs">{L.tiles.driest}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Thermometer className="w-5 h-5 text-[#0077b6]" />
              <h3 className="text-xl font-bold text-[#002244]">{L.tempByMonth}</h3>
            </div>
            <LazyClimateChart kind="temperature" chartData={chartData} label={L.chartTemp(cityN)} />
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Droplets className="w-5 h-5 text-blue-500" />
                <h3 className="text-xl font-bold text-[#002244]">{L.rainByMonth}</h3>
              </div>
              <LazyClimateChart kind="rainfall" chartData={chartData} label={L.chartRain(cityN)} />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Sun className="w-5 h-5 text-amber-500" />
                <h3 className="text-xl font-bold text-[#002244]">{L.sunHours}</h3>
              </div>
              <LazyClimateChart kind="sunshine" chartData={chartData} label={L.chartSun(cityN)} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <CalendarRange className="w-5 h-5 text-[#0077b6]" />
              <h3 className="text-xl font-bold text-[#002244]">{L.monthlyAverages}</h3>
            </div>
            <MonthlyTable monthly={monthly} />
          </div>

          <div className="bg-[#EFF6FF] rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-1">
              <Shirt className="w-5 h-5 text-[#0077b6]" />
              <h3 className="text-lg font-bold text-[#002244]">{L.whatToPack}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">{L.packIntro(cityN)}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {packing.map((p) => {
                const Icon = p.icon;
                const txt = L.cityPacking[p.key];
                return (
                  <div key={p.key} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-[#0077b6]" />
                    </div>
                    <h4 className="text-sm font-bold text-[#002244] mb-1">{txt.title}</h4>
                    <p className="text-xs text-gray-600 leading-snug">{txt.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. Usi mulk ke doosre shehar */}
        {others.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="w-5 h-5 text-[#0077b6]" />
              <h2 className="text-xl font-bold text-[#002244]">{L.moreCities(countryN, country)}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {others.map((o) => (
                <Link key={o.slug} href={o.href} className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all">
                  <p className="font-semibold text-slate-900">{cityName(lang, o)}</p>
                  <p className="text-sm text-slate-400">{L.weatherByMonth}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 7. Related articles (backend round B5) — khaali ho to kuch nahi */}
        {related}

        {/* 8. Trip planner CTA (purane Section 1 se). Photo neeche hai → lazy */}
        {tripHref && (
          <section className="relative overflow-hidden bg-gradient-to-r from-[#0077b6] to-[#00a8e8] rounded-2xl p-8 sm:p-10 text-center text-white">
            {photo && (
              <>
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
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">{L.ctaCityTitle(cityN)}</h2>
              <p className="text-white/90 mb-6">{L.ctaCityText}</p>
              <Link
                href={tripHref}
                className="inline-flex items-center gap-2 bg-white text-[#0077b6] font-bold px-7 py-3.5 rounded-full hover:bg-blue-50 transition-colors"
              >
                {L.ctaCityButton}
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>
        )}

        <p className="text-sm text-gray-500 leading-relaxed">
          <Info className="inline w-4 h-4 -mt-0.5 mr-1.5 align-middle" />
          {L.cityDataNote(years)}
        </p>
      </div>

      </main>
      <Footer />
    </div>
  );
}
