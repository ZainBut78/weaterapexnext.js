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
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { serverGet } from '@/services/serverApi';
import { ENDPOINTS } from '@/config/endpoints';
import { DEFAULT_CITY } from '@/config/defaults';
import { getT } from '@/i18n/server';
import ClientMessages from '@/i18n/ClientMessages';
import { HOME_NAMESPACES } from '@/i18n/namespaces';

// Perf (Oct 2026): pehli screen (weather card, forecast, map heading) server
// HTML mein — default shehar ka data yahin. 10 min ISR (current weather).
export const revalidate = 600;

async function defaultCityWeather() {
  try {
    return await serverGet(ENDPOINTS.weather.current, { params: { city: DEFAULT_CITY }, revalidate: 600 });
  } catch {
    return null;   // backend band → pehle jaisa: browser khud mangwaye
  }
}

// Home ka structured data: Organization + WebSite (audit 2.4)
const homeJsonLd = (lang) => ({
  '@context': 'https://schema.org',
  '@graph': [
    { ...ORGANIZATION, '@id': `${SITE_URL}/#organization` },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: lang,
    },
  ],
});

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  return pageMetadata({
    absoluteTitle: t('home.metaTitle'),
    imageTitle: t('home.metaImageTitle'),
    description: t('home.metaDescription'),
    path: '/',
    lang,
  });
}

export default async function HomePage({ params }) {
  const { lang } = await params;
  // React Query cache mein default shehar ka data — WeatherCard / ForecastTable /
  // map wahi key (['currentWeather', 'london']) parhte hain, koi browser call nahi
  const qc = new QueryClient();
  const weather = await defaultCityWeather();
  if (weather) qc.setQueryData(['currentWeather', DEFAULT_CITY], weather);
  return (
    <div className="min-h-screen bg-[#f3f7ff]">
      <JsonLd data={homeJsonLd(lang)} />
      <Navbar />
      <main className="space-y-0">
        <ClientMessages lang={lang} ns={HOME_NAMESPACES}>
          <HydrationBoundary state={dehydrate(qc)}>
            <WeatherCard />
            <LiveSatelliteRadar />
            <ForecastTable />
          </HydrationBoundary>
          <PopularDestinations />
        </ClientMessages>
        <FeaturesSection />
        <ApexWorkflow />
        <Article />
      </main>
      <Footer />
    </div>
  );
}
