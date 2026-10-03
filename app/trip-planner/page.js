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

export const metadata = pageMetadata({
  title: 'Trip Weather Planner',
  description: 'Score every day of your trip on rain, wind and temperature, and see which day is best for what.',
  path: '/trip-planner',
});

export default function TripPlannerPage() {
  return (
    <div className="min-h-screen bg-[#f3f7ff] font-sans">
      <Navbar />
      <TripPlannerTool
        intro={
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#002244]">Trip Planner</h1>
            <p className="text-gray-500 mt-1">Find the best days to travel with weather-based day scoring</p>
          </div>
        }
      />
      <Footer />
    </div>
  );
}
