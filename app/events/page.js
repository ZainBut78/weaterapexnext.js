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

export const metadata = pageMetadata({
  title: 'Outdoor Event Risk Score',
  description: 'Weather risk scoring for weddings, concerts, marathons and other outdoor events, with better nearby dates.',
  path: '/events',
});

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <EventRiskTool
        intro={
          <div className="max-w-5xl mx-auto text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-3">
              Outdoor Event Risk Score
            </h1>
            <p className="text-slate-500 text-lg">
              Plan with confidence. We analyze hyper-local weather
              patterns to evaluate the safety and comfort of your
              outdoor events.
            </p>
          </div>
        }
      />

      <Footer />
    </div>
  );
}
