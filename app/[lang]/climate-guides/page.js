// ─────────────────────────────────────────────────────────────
//  CLIMATE GUIDES  →  URL: /climate-guides
//
//  Purana src/pages/ClimateGuides.jsx — wahi design.
//  Server component: heading, text aur shehron ki list HTML mein hi
//  aati hai. Search/filter/button browser wale hisse hain —
//  ClimateGuidesClient.jsx ('use client').
// ─────────────────────────────────────────────────────────────
import Navbar from '@/components/Navbar';
import { onlyReady } from '@/services/history';
import Footer from '@/components/Footer';
import { CitySearchForm, CityGrid, PlanTripButton } from './ClimateGuidesClient';
import { pageMetadata } from '@/utils/seo';
import { connection } from 'next/server';
import { getCityPhoto } from '@/services/cityPhoto';
import Link from '@/components/LocaleLink';
import { getT } from '@/i18n/server';
import { countryName } from '@/i18n/format';
import { cityName } from '@/i18n/places';
import ClientMessages from '@/i18n/ClientMessages';
import { ArrowRight, CalendarRange } from 'lucide-react';
import { cityPath, countryOfCity } from '@/data/countries';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  return pageMetadata({ title: t('guides.metaTitle'), description: t('guides.metaDescription'), path: '/climate-guides', lang });
}

// Backend se bhi aa sakta hai (GET /api/weather/cities/ jaisa endpoint
// bana kar) — abhi ke liye static list, baad mein dynamic bana sakte hain
const FEATURED_CITIES = [
  { name: 'London', slug: 'london', country: 'United Kingdom' },
  { name: 'Paris', slug: 'paris', country: 'France' },
  { name: 'Barcelona', slug: 'barcelona', country: 'Spain' },
  { name: 'Rome', slug: 'rome', country: 'Italy' },
  { name: 'Tokyo', slug: 'tokyo', country: 'Japan' },
  { name: 'Dubai', slug: 'dubai', country: 'UAE' },
  { name: 'New York', slug: 'new-york', country: 'USA' },
  { name: 'Sydney', slug: 'sydney', country: 'Australia' },
  { name: 'Mumbai', slug: 'mumbai', country: 'India' },
  { name: 'Cairo', slug: 'cairo', country: 'Egypt' },
  { name: 'Singapore', slug: 'singapore', country: 'Singapore' },
  { name: 'Bangkok', slug: 'bangkok', country: 'Thailand' },
  { name: 'Seoul', slug: 'seoul', country: 'South Korea' },
  { name: 'Istanbul', slug: 'istanbul', country: 'Turkey' },
  { name: 'Berlin', slug: 'berlin', country: 'Germany' },
  { name: 'Toronto', slug: 'toronto', country: 'Canada' },
  { name: 'Karachi', slug: 'karachi', country: 'Pakistan' },
  { name: 'Lahore', slug: 'lahore', country: 'Pakistan' },
  { name: 'Islamabad', slug: 'islamabad', country: 'Pakistan' },
  { name: 'Amsterdam', slug: 'amsterdam', country: 'Netherlands' },
  { name: 'Madrid', slug: 'madrid', country: 'Spain' },
  { name: 'Vienna', slug: 'vienna', country: 'Austria' },
  { name: 'Cape Town', slug: 'cape-town', country: 'South Africa' },
  { name: 'Mexico City', slug: 'mexico-city', country: 'Mexico' },
];

// Har card ke peeche shehar ki photo (owner ki farmaish, round 2).
// Wahi Pexels `image_url` jo backend current weather ke saath bhejta hai.
// 3 ghante cache — visitor jitne bhi aayein, har shehar ki backend call
// 3 ghante mein zyada se zyada ek. Kisi ki photo na mile → pehle jaisa
// safed card.
async function withPhotos(cities) {
  return Promise.all(cities.map(async (c) => ({ ...c, photo: await getCityPhoto(c.slug) })));
}

export default async function ClimateGuidesPage({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  // Build ke waqt 24 shehron ka loop NA chale (API quota) — page request
  // par banta hai; photos upar wale cache se aati hain.
  await connection();
  // Sirf jin ka 20-saal data mukammal (adhoore shehar ka link nahi)
  const ready = await withPhotos(await onlyReady(FEATURED_CITIES));
  // Mulk ka naam: English mein wahi (UAE, USA); baqi zabanein Intl.DisplayNames
  const cityCountry = (c) => (lang === 'en' ? c.country : countryName(lang, countryOfCity(c.slug)?.iso2, c.country));
  // Shehar ka naam bhi user ki zaban mein (ロンドン, Londra) — pehle English reh jata tha
  const cities = ready.map((c) => ({ ...c, name: cityName(lang, c), country: cityCountry(c) }));

  return (
    <div className="min-h-screen bg-[#f3f7ff]">
      <Navbar />
      {/* Ek <main> landmark — Navbar/Footer bahar (a11y Task 7) */}
      <main>

      <div className="bg-gradient-to-b from-white to-blue-50 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-3">
            {t('guides.h1')}
          </h1>
          <p className="text-slate-500 text-lg mb-8">
            {t('guides.intro')}
          </p>

          <ClientMessages lang={lang} ns={['guides']}>
            <CitySearchForm />
          </ClientMessages>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <ClientMessages lang={lang} ns={['guides']}>
          <CityGrid cities={cities} />
        </ClientMessages>

        {/* Phase C2: Section 2 — Month-by-Month Weather Guides (live).
            Safed card style (Section 1 ke photo cards se alag); link naye
            by-month pages par + "Browse all countries" → /weather. */}
        {(
          <section className="mt-14" aria-labelledby="by-month-heading">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
              <div>
                <h2 id="by-month-heading" className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <CalendarRange className="w-6 h-6 text-[#0077b6]" /> {t('guides.byMonthTitle')}
                </h2>
                <p className="text-slate-500 mt-1">{t('guides.byMonthText')}</p>
              </div>
              <Link href="/weather" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0077b6] hover:underline">
                {t('guides.browseAll')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {cities.map((c) => (
                <Link key={c.slug} href={cityPath(c.slug)} className="group block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all">
                  <p className="font-semibold text-slate-900">{t('guides.cityByMonth', { city: c.name })}</p>
                  <p className="text-sm text-slate-400">{lang === 'en' ? countryOfCity(c.slug)?.name : c.country}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 bg-gradient-to-r from-[#0077b6] to-[#00a8e8] rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-extrabold mb-1">{t('guides.cantFind')}</h2>
          <p className="text-white/80 text-sm sm:text-base mb-5">
            {t('guides.cantFindText')}
          </p>
          <ClientMessages lang={lang} ns={['guides']}>
            <PlanTripButton />
          </ClientMessages>
        </div>
      </div>

      </main>
      <Footer />
    </div>
  );
}
