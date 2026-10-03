// ─────────────────────────────────────────────────────────────
//  TERMS OF SERVICE  →  URL: /terms
//  Purana src/pages/TermsOfService.jsx — wahi design, wahi text.
//  Server component: poora text HTML mein Google tak jata hai.
// ─────────────────────────────────────────────────────────────
import { FileText } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { pageMetadata } from '@/utils/seo';

export const metadata = pageMetadata({
  title: 'Terms of Service',
  description: 'WeatherApex terms of service.',
  path: '/terms',
});

const sections = [
  { title: '1. Acceptance of Terms', content: 'By accessing or using WeatherApex ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. We reserve the right to update these terms at any time; continued use constitutes acceptance of changes.' },
  { title: '2. Description of Service', content: 'WeatherApex provides weather data, trip planning recommendations, event risk scoring, and API access for developers. The Service is provided "as is" and we make no guarantees about accuracy, availability, or fitness for a particular purpose.' },
  { title: '3. User Accounts', content: 'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration. One person may not maintain multiple free accounts. Accounts found to be in violation may be suspended without notice.' },
  { title: '4. API Usage Limits', content: 'Free API access is limited to 100 total calls per API key. Once exhausted, the key will be deactivated. You may register a new account to obtain a new key. Automated account creation or any attempt to circumvent rate limits is prohibited and will result in permanent ban.' },
  { title: '5. Acceptable Use', content: 'You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to breach security or test vulnerabilities without written authorization; (c) redistribute or resell API data without explicit permission; (d) use automated tools to scrape, crawl, or extract data beyond normal API usage; (e) interfere with other users\' access to the Service.' },
  { title: '6. Intellectual Property', content: 'The WeatherApex name, logo, and interface design are proprietary. The underlying weather data is sourced from Open-Meteo and other public sources. Our scoring algorithms, activity recommendations, and city intelligence layers are trade secrets.' },
  { title: '7. Limitation of Liability', content: 'WeatherApex shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service. Weather forecasts are inherently uncertain — always verify critical decisions with local authorities. Our total liability is limited to the amount you paid for the Service (if any).' },
  { title: '8. Termination', content: 'We may suspend or terminate your access at any time for violation of these terms, without prior notice. Upon termination, your API keys will be revoked immediately. You may stop using the Service at any time.' },
  { title: '9. Governing Law', content: 'These terms are governed by the laws of Pakistan. Any disputes shall be resolved in the courts of Lahore, Pakistan.' },
  { title: '10. Contact', content: 'For questions about these terms, contact us at legal@weatherapex.com. We aim to respond within 5 business days.' },
];

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#f3f7ff] font-sans">
      {/* Navbar + Footer: pehle yeh page "band gali" tha — koi link nahi (audit 2.6-c) */}
      <Navbar />
      <div className="bg-[#002244] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <FileText className="w-12 h-12 text-blue-300 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-blue-200">Last updated: July 30, 2026</p>
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
      <Footer />
    </div>
  );
}