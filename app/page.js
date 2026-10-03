// ─────────────────────────────────────────────────────────────
//  HOME PAGE  →  URL: /
//
//  Purane project ka src/pages/LandingPage.jsx — wahi sections, wahi
//  tarteeb. Farq sirf itna:
//   • Yeh file SERVER component hai (upar 'use client' nahi). Jo
//     sections sirf text hain (Features, Workflow, Articles) woh server
//     par hi HTML ban jate hain — Google ko seedha nazar aate hain.
//   • Weather card, forecast, destinations browser mein data mangwate
//     hain — un ki files mein 'use client' likha hai.
//   • Title/description ab `metadata` se (purana RouteMeta.jsx).
// ─────────────────────────────────────────────────────────────
import Navbar from '@/components/Navbar';
import WeatherCard from '@/components/WeatherCard';
import LiveSatelliteRadar from '@/components/LiveSatelliteRadarLazy';
import ForecastTable from '@/components/ForecastTable';
import PopularDestinations from '@/components/PopularDestinations';
import FeaturesSection from '@/components/FeaturesSection';
import ApexWorkflow from '@/components/ApexWorkflow';
import Article from '@/components/Article';
import Footer from '@/components/Footer';
import { pageMetadata, SITE_NAME, SITE_URL } from '@/utils/seo';
import JsonLd, { ORGANIZATION } from '@/components/JsonLd';

// Home ka structured data: Organization + WebSite (audit 2.4)
const HOME_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    { ...ORGANIZATION, '@id': `${SITE_URL}/#organization` },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en',
    },
  ],
};

export const metadata = pageMetadata({
  absoluteTitle: 'WeatherApex — Weather intelligence for trips & outdoor events',
  imageTitle: 'Weather Forecasts, Trip Planning & Climate Guides',
  description: 'Plan trips and outdoor events with confidence. Day-by-day weather scoring, event risk analysis and 20 years of climate history for cities worldwide.',
  path: '/',
});

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f3f7ff]">
      <JsonLd data={HOME_JSON_LD} />
      <Navbar />
      <main className="space-y-0">
        <WeatherCard />
        <LiveSatelliteRadar />
        <ForecastTable />
        <PopularDestinations />
        <FeaturesSection />
        <ApexWorkflow />
        <Article />
      </main>
      <Footer />
    </div>
  );
}
