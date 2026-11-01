import { pageMetadata } from '@/utils/seo';
import { getT } from '@/i18n/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
// ─────────────────────────────────────────────────────────────
//  PRICING  →  URL: /pricing
//  Purane App.jsx ka <ComingSoon title="Pricing" /> — wahi design.
// ─────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  return pageMetadata({
    // noindex: abhi sirf 'Coming Soon' — asli pricing aane tak Google se
    // bahar, sitemap se bhi bahar (owner, round 2, 2.3).
    title: t('pricing.title'),
    description: t('pricing.metaDescription'),
    path: '/pricing',
    noindex: true,
    lang,
  });
}

export default async function PricingPage({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  return (
    // Navbar + Footer (audit 2.6-c). "Coming Soon" beech mein wahi rehta hai.
    <div className="min-h-screen flex flex-col bg-[#f3f7ff]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-32">
        <h1 className="text-2xl font-bold text-[#002244]">{t('pricing.comingSoon')}</h1>
      </main>
      <Footer />
    </div>
  );
}
