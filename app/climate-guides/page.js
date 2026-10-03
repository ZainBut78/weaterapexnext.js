// ─────────────────────────────────────────────────────────────
//  CLIMATE GUIDES  →  URL: /climate-guides
//
//  Purana src/pages/ClimateGuides.jsx — wahi design.
//  Server component: heading, text aur shehron ki list HTML mein hi
//  aati hai. Search/filter/button browser wale hisse hain —
//  ClimateGuidesClient.jsx ('use client').
// ─────────────────────────────────────────────────────────────
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CitySearchForm, CityGrid, PlanTripButton } from './ClimateGuidesClient';
import { pageMetadata } from '@/utils/seo';
import { connection } from 'next/server';
import { getCityPhoto } from '@/services/cityPhoto';
import Link from 'next/link';
import { ArrowRight, CalendarRange } from 'lucide-react';
import { cityPath, countryOfCity } from '@/data/countries';

export const metadata = pageMetadata({
  title: 'Climate Guides',
  description: 'Month-by-month climate guides built on 20 years of historical weather data.',
  path: '/climate-guides',
});

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

export default async function ClimateGuidesPage() {
  // Build ke waqt 24 shehron ka loop NA chale (API quota) — page request
  // par banta hai; photos upar wale cache se aati hain.
  await connection();
  const cities = await withPhotos(FEATURED_CITIES);

  return (
    <div className="min-h-screen bg-[#f3f7ff]">
      <Navbar />

      <div className="bg-gradient-to-b from-white to-blue-50 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-3">
            City Climate Guides
          </h1>
          <p className="text-slate-500 text-lg mb-8">
            Explore average temperatures, rainfall, and weather
            patterns for cities around the world
          </p>

          <CitySearchForm />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <CityGrid cities={cities} />

        {/* Phase C2: Section 2 — Month-by-Month Weather Guides (live).
            Safed card style (Section 1 ke photo cards se alag); link naye
            by-month pages par + "Browse all countries" → /weather. */}
        {(
          <section className="mt-14" aria-labelledby="by-month-heading">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
              <div>
                <h2 id="by-month-heading" className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <CalendarRange className="w-6 h-6 text-[#0077b6]" /> Month-by-Month Weather Guides
                </h2>
                <p className="text-slate-500 mt-1">What each month is like — temperatures, rain and the best time to visit.</p>
              </div>
              <Link href="/weather" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0077b6] hover:underline">
                Browse all countries <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {cities.map((c) => (
                <Link key={c.slug} href={cityPath(c.slug)} className="group block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all">
                  <p className="font-semibold text-slate-900">{c.name} by month</p>
                  <p className="text-sm text-slate-400">{countryOfCity(c.slug)?.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 bg-gradient-to-r from-[#0077b6] to-[#00a8e8] rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-extrabold mb-1">Can't find your city?</h2>
          <p className="text-white/80 text-sm sm:text-base mb-5">
            Search any city above and we'll generate its climate guide instantly.
          </p>
          <PlanTripButton />
        </div>
      </div>

      <Footer />
    </div>
  );
}
