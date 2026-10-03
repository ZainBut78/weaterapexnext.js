// ─────────────────────────────────────────────────────────────
//  PRIVACY POLICY  →  URL: /privacy
//  Purana src/pages/PrivacyPolicy.jsx — wahi design, wahi text.
//  Server component: poora text HTML mein Google tak jata hai.
// ─────────────────────────────────────────────────────────────
import { Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { pageMetadata } from '@/utils/seo';

export const metadata = pageMetadata({
  title: 'Privacy Policy',
  description: 'How WeatherApex handles your data.',
  path: '/privacy',
});

const sections = [
  { title: '1. Information We Collect', content: 'We collect information you provide during registration: username, email address, and password (stored as a salted hash). We also collect API usage logs including endpoint accessed, timestamp, and response status code. City search queries are logged temporarily for service improvement. We do NOT collect precise location data, browsing history, or personal identification documents.' },
  { title: '2. How We Use Your Information', content: 'Your email is used for account verification (OTP), password resets, and critical service notifications. Usage logs are used to enforce rate limits, diagnose errors, and improve our API. We do not sell, rent, or share your personal data with third parties. Aggregated, anonymized statistics may be used for public transparency reports.' },
  { title: '3. Data Storage & Security', content: 'Passwords are hashed using Django\'s PBKDF2 algorithm. API keys are stored as SHA-256 hashes — we cannot recover your key if lost. Data is stored on PostgreSQL databases hosted in secure data centers. We use HTTPS for all API communications. Free usage logs (IP-based) are retained for 30 days and then anonymized.' },
  { title: '4. Cookies', content: 'We use essential cookies for authentication (JWT tokens stored in localStorage on the client side). No tracking cookies, analytics cookies, or third-party cookies are used. You can clear your local storage at any time — this will log you out but won\'t affect core functionality. We do not use fingerprinting or any user-tracking technologies.' },
  { title: '5. Third-Party Data', content: 'Weather data is sourced from Open-Meteo, a free open-data weather API. Open-Meteo uses ECMWF, DWD, and other public meteorological models. We do not control the accuracy of third-party data sources. Geocoding is performed via Open-Meteo\'s geocoding API — no address data is stored permanently.' },
  { title: '6. Your Rights', content: 'You may request deletion of your account and associated data at any time by emailing privacy@weatherapex.com. Account deletion removes your user profile, API keys, and usage logs within 30 days. You may request a copy of your stored data. OTP records are automatically deleted after 10 minutes (expiry) or upon use.' },
  { title: '7. Children\'s Privacy', content: 'WeatherApex is not directed at children under 13. We do not knowingly collect information from children. If you believe a child has provided us with personal data, contact us immediately and we will delete it.' },
  { title: '8. Changes to This Policy', content: 'We may update this privacy policy periodically. Material changes will be announced via email to registered users. Continued use of the Service after changes constitutes acceptance of the updated policy.' },
  { title: '9. Contact', content: 'For privacy-related inquiries, contact our Data Protection Officer at privacy@weatherapex.com. Physical address: WeatherApex HQ, Lahore, Pakistan.' },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#f3f7ff] font-sans">
      {/* Navbar + Footer: pehle yeh page "band gali" tha — koi link nahi (audit 2.6-c) */}
      <Navbar />
      <div className="bg-[#002244] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Shield className="w-12 h-12 text-blue-300 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
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