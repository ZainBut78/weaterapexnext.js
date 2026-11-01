// ─────────────────────────────────────────────────────────────
//  EVENT RISK  →  URL: /events
//
//  Purana src/pages/EventRisk.jsx — wahi design.
//  Heading + intro text SERVER par (Google ke liye HTML mein).
//  Form, API call aur results browser mein — EventRiskTool.jsx.
// ─────────────────────────────────────────────────────────────
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventRiskTool from './EventRiskTool';
import { pageMetadata } from '@/utils/seo';
import { getT } from '@/i18n/server';
import ClientMessages from '@/i18n/ClientMessages';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  return pageMetadata({ title: t('events.metaTitle'), description: t('events.metaDescription'), path: '/events', lang });
}

export default async function EventsPage({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      {/* Ek <main> landmark — Navbar/Footer bahar (a11y Task 7) */}
      <main>

      <ClientMessages lang={lang} ns={['events', 'cityNeeded']}>
      <EventRiskTool
        intro={
          <div className="max-w-5xl mx-auto text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-3">
              {t('events.h1')}
            </h1>
            <p className="text-slate-500 text-lg">
              {t('events.intro')}
            </p>
          </div>
        }
      />
      </ClientMessages>

      </main>
      <Footer />
    </div>
  );
}
