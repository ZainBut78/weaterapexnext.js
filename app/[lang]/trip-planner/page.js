// ─────────────────────────────────────────────────────────────
//  TRIP PLANNER  →  URL: /trip-planner
//
//  Purana src/pages/TripPlanner.jsx — wahi design.
//  Heading + intro text SERVER par (Google ke liye HTML mein).
//  Form, city suggestions, API calls aur results browser mein —
//  TripPlannerTool.jsx.
// ─────────────────────────────────────────────────────────────
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TripPlannerTool from './TripPlannerTool';
import { pageMetadata } from '@/utils/seo';
import { getT } from '@/i18n/server';
import ClientMessages from '@/i18n/ClientMessages';
import ToolGuide from '@/components/tools/ToolGuide';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  return pageMetadata({ title: t('trip.metaTitle'), description: t('trip.metaDescription'), path: '/trip-planner', lang });
}

export default async function TripPlannerPage({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  return (
    <div className="min-h-screen bg-[#f3f7ff] font-sans">
      <Navbar />
      {/* Ek <main> landmark — Navbar/Footer bahar (a11y Task 7) */}
      <main>
      <ClientMessages lang={lang} ns={['trip', 'cityNeeded', 'weather', 'wx']}>
      <TripPlannerTool
        intro={
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#002244]">{t('trip.h1')}</h1>
            <p className="text-gray-500 mt-1">{t('trip.intro')}</p>
          </div>
        }
      />
      </ClientMessages>
      {/* Tool ke neeche server content (Nov 2026) — tool waisa hi */}
      <ToolGuide kind="trip" lang={lang} />
      </main>
      <Footer />
    </div>
  );
}
