// ─────────────────────────────────────────────────────────────
//  PRIVACY POLICY  →  URL: /privacy
//  Purana src/pages/PrivacyPolicy.jsx — wahi design, wahi text.
//  Server component: poora text HTML mein Google tak jata hai.
// ─────────────────────────────────────────────────────────────
import { Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { pageMetadata } from '@/utils/seo';
import { getT } from '@/i18n/server';
import { formatDate } from '@/i18n/format';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  return pageMetadata({ title: t('privacy.title'), description: t('privacy.metaDescription'), path: '/privacy', lang });
}

// Sections ka text messages ke `privacy.sections` mein (har zaban ka apna)
const UPDATED = '2026-07-30';

export default async function PrivacyPolicy({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  const sections = t.raw('privacy.sections');
  return (
    <div className="min-h-screen bg-[#f3f7ff] font-sans">
      {/* Navbar + Footer: pehle yeh page "band gali" tha — koi link nahi (audit 2.6-c) */}
      <Navbar />
      {/* Ek <main> landmark — Navbar/Footer bahar (a11y Task 7) */}
      <main>
      <div className="bg-[#002244] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Shield className="w-12 h-12 text-blue-300 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-3">{t('privacy.title')}</h1>
          <p className="text-blue-200">{t('common.lastUpdated', { date: formatDate(lang, UPDATED, { month: 'long', day: 'numeric', year: 'numeric' }) })}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-lg font-bold text-[#002244] mb-2">{s.title}</h2>
              <p className="text-gray-600 leading-relaxed text-sm">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}