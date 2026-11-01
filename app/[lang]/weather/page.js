// ─────────────────────────────────────────────────────────────
//  /weather — hub: saare mulk, regions mein (Phase C)
//
//  LIVE (Phase C2): indexable, sitemap mein. Shehar registry se (static 160 +
//  DB ke mukammal shehar — services/cityRegistry.js; 1 cached index call).
//  1.3 option A: 2+ shehar → country page; 1 shehar → seedha shehar page.
// ─────────────────────────────────────────────────────────────
import Link from '@/components/LocaleLink';
import { getT } from '@/i18n/server';
import { countryName } from '@/i18n/format';
import { cityName } from '@/i18n/places';
import { Globe2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd, { breadcrumbs } from '@/components/JsonLd';
import { getCityRegistry } from '@/services/cityRegistry';
import { REGIONS, COUNTRIES, countryPath } from '@/data/countries';
import { pageMetadata } from '@/utils/seo';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  const reg = await getCityRegistry();
  const nCountries = new Set(reg.cities.map((c) => c.countrySlug)).size;
  return pageMetadata({
    absoluteTitle: t('weatherHub.metaTitle'),
    imageTitle: t('weatherHub.metaImageTitle'),
    description: t('weatherHub.metaDescription', { cities: reg.cities.length, countries: nCountries }),
    path: '/weather',
    lang,
  });
}

export default async function WeatherHub({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  // Mulk / region ke naam: English mein wahi; baqi Intl.DisplayNames + messages
  const cName = (c) => (lang === 'en' ? c.name : countryName(lang, c.iso2, c.name));
  // Registry: sirf mukammal data wale shehar (static + DB); jis mulk ka koi
  // shehar tayyar nahi woh chhup jaye
  const reg = await getCityRegistry();
  const nCountries = new Set(reg.cities.map((c) => c.countrySlug)).size;
  const groups = REGIONS.map((r) => ({
    ...r,
    countries: COUNTRIES.filter((c) => c.region === r.key && reg.citiesOfCountry(c.slug).length > 0)
      .map((c) => {
        const list = reg.citiesOfCountry(c.slug);
        return { ...c, name: cName(c), count: list.length, href: reg.hasCountryPage(c.slug) ? countryPath(c.slug) : reg.cityPath(list[0].slug), only: list.length === 1 ? cityName(lang, list[0]) : null };
      })
      .sort((a, b) => a.name.localeCompare(b.name, lang)),
  }));

  return (
    <div className="min-h-screen bg-[#f3f7ff]">
      <JsonLd data={breadcrumbs([{ name: t('nav.home'), path: '/' }, { name: t('weatherHub.crumb'), path: '/weather' }], lang)} />
      <Navbar />
      {/* Ek <main> landmark — Navbar/Footer bahar (a11y Task 7) */}
      <main>

      <div className="bg-gradient-to-b from-white to-blue-50 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-3">{t('weatherHub.h1')}</h1>
          <p className="text-slate-500 text-lg">
            {t('weatherHub.intro', { cities: reg.cities.length, countries: nCountries })}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {groups.map((g) => (
          <section key={g.key}>
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-[#0077b6]" /> {lang === 'en' ? g.name : t(`weatherHub.regions.${g.key}`)}
              </h2>
              <span className="text-sm text-slate-400">{t('weatherHub.regionCount', { countries: g.countries.length, cities: g.countries.reduce((a, c) => a + c.count, 0) })}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {g.countries.map((c) => (
                <Link key={c.slug} href={c.href} className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-400">{c.only ? c.only : t('weatherHub.cities', { count: c.count })}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      </main>
      <Footer />
    </div>
  );
}
