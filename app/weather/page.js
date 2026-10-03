// ─────────────────────────────────────────────────────────────
//  /weather — hub: saare mulk, regions mein (Phase C)
//
//  LIVE (Phase C2): indexable, sitemap mein. Backend call: 0 (sirf data/cities.js + data/countries.js).
//  1.3 option A: 2+ shehar → country page; 1 shehar → seedha shehar page.
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';
import { Globe2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd, { breadcrumbs } from '@/components/JsonLd';
import { CITIES } from '@/data/cities';
import { REGIONS, COUNTRIES, citiesOfCountry, hasCountryPage, countryPath, cityPath } from '@/data/countries';
import { pageMetadata } from '@/utils/seo';

export const metadata = pageMetadata({
  absoluteTitle: 'Weather by Country & Month — WeatherApex',
  imageTitle: 'Weather by Country & Month',
  description: `Climate guides for ${CITIES.length} cities in ${COUNTRIES.length} countries and territories — month-by-month temperatures, rainfall and the best time to visit.`,
  path: '/weather',
});

export default function WeatherHub() {
  const groups = REGIONS.map((r) => ({
    ...r,
    countries: COUNTRIES.filter((c) => c.region === r.key)
      .map((c) => {
        const list = citiesOfCountry(c.slug);
        return { ...c, count: list.length, href: hasCountryPage(c.slug) ? countryPath(c.slug) : cityPath(list[0].slug), only: list.length === 1 ? list[0].name : null };
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));

  return (
    <div className="min-h-screen bg-[#f3f7ff]">
      <JsonLd data={breadcrumbs([{ name: 'Home', path: '/' }, { name: 'Weather', path: '/weather' }])} />
      <Navbar />

      <div className="bg-gradient-to-b from-white to-blue-50 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-3">Weather by Country</h1>
          <p className="text-slate-500 text-lg">
            Month-by-month weather for {CITIES.length} cities in {COUNTRIES.length} countries and territories, built on 20 years of historical weather data.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {groups.map((g) => (
          <section key={g.key}>
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-[#0077b6]" /> {g.name}
              </h2>
              <span className="text-sm text-slate-400">{g.countries.length} countries · {g.countries.reduce((a, c) => a + c.count, 0)} cities</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {g.countries.map((c) => (
                <Link key={c.slug} href={c.href} className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-400">{c.only ? c.only : `${c.count} cities`}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Footer />
    </div>
  );
}
