import { pageMetadata } from '@/utils/seo';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
// ─────────────────────────────────────────────────────────────
//  PRICING  →  URL: /pricing
//  Purane App.jsx ka <ComingSoon title="Pricing" /> — wahi design.
// ─────────────────────────────────────────────────────────────

export const metadata = pageMetadata({
  // noindex: abhi sirf 'Coming Soon' — asli pricing aane tak Google se
  // bahar, sitemap se bhi bahar (owner, round 2, 2.3).
  title: 'Pricing',
  description: 'WeatherApex plans and pricing.',
  path: '/pricing',
  noindex: true,
});

export default function PricingPage() {
  return (
    // Navbar + Footer (audit 2.6-c). "Coming Soon" beech mein wahi rehta hai.
    <div className="min-h-screen flex flex-col bg-[#f3f7ff]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-32">
        <h1 className="text-2xl font-bold text-[#002244]">Pricing — Coming Soon</h1>
      </div>
      <Footer />
    </div>
  );
}
