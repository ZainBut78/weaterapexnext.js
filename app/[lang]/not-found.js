// ─────────────────────────────────────────────────────────────
//  404 PAGE — har ghalat URL aur har notFound() call par yahi dikhta hai
//  Purana src/pages/NotFound.jsx — wahi design.
//  Next.js is par khud HTTP 404 status aur <meta name="robots" content="noindex">
//  lagata hai (purane Helmet wala noindex ab zaroori nahi).
// ─────────────────────────────────────────────────────────────
import Link from '@/components/LocaleLink';
import { getT } from '@/i18n/server';
import { Compass, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { LOCALES, localePath } from '@/i18n/config';
import { I18nProvider } from '@/i18n/client';

// Switcher: '/it/<ghalat-url>' bhi 404 hota — har zaban ka home
const ALTERNATES = Object.fromEntries(LOCALES.map((l) => [l, localePath(l, '/')]));

export async function generateMetadata() {
  const t = await getT();
  return { title: t('notFound.title') };
}

// Pehle koi catch-all route nahi tha: /koi-ghalat-url par bilkul KHAALI
// safed page aata tha (body text length = 0). Ab proper 404.
const NotFound = async () => {
  const t = await getT();
  return (
  <I18nProvider alternates={ALTERNATES}>
  <div className="min-h-screen flex flex-col bg-[#f8fafc]">
    <Navbar />

    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-[#0077b6] mb-6">
          <Compass className="w-8 h-8" />
        </div>
        <p className="text-sm font-bold tracking-widest text-[#0077b6] mb-2">404</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002244] mb-3">
          {t('notFound.heading')}
        </h1>
        <p className="text-slate-500 mb-8">
          {t('notFound.text')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-full text-sm font-semibold text-white bg-[#00a8e8] hover:bg-[#0092cd] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t('notFound.backHome')}
          </Link>
          <Link
            href="/trip-planner"
            className="inline-flex items-center justify-center min-h-12 px-6 rounded-full text-sm font-semibold text-slate-700 border border-[#d6e4ff] hover:bg-white transition-colors"
          >
            {t('notFound.planTrip')}
          </Link>
        </div>
      </div>
    </main>

    <Footer />
  </div>
  </I18nProvider>
  );
};

export default NotFound;
