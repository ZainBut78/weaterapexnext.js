// ─────────────────────────────────────────────────────────────
//  404 PAGE — har ghalat URL aur har notFound() call par yahi dikhta hai
//  Purana src/pages/NotFound.jsx — wahi design.
//  Next.js is par khud HTTP 404 status aur <meta name="robots" content="noindex">
//  lagata hai (purane Helmet wala noindex ab zaroori nahi).
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Page not found',
};

// Pehle koi catch-all route nahi tha: /koi-ghalat-url par bilkul KHAALI
// safed page aata tha (body text length = 0). Ab proper 404.
const NotFound = () => (
  <div className="min-h-screen flex flex-col bg-[#f8fafc]">
    <Navbar />

    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-[#0077b6] mb-6">
          <Compass className="w-8 h-8" />
        </div>
        <p className="text-sm font-bold tracking-widest text-[#0077b6] mb-2">404</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002244] mb-3">
          This page drifted off the map
        </h1>
        <p className="text-slate-500 mb-8">
          The page you're looking for doesn't exist or has moved. Let's get you
          back to the forecast.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-full text-sm font-semibold text-white bg-[#00a8e8] hover:bg-[#0092cd] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <Link
            href="/trip-planner"
            className="inline-flex items-center justify-center min-h-12 px-6 rounded-full text-sm font-semibold text-slate-700 border border-[#d6e4ff] hover:bg-white transition-colors"
          >
            Plan a trip
          </Link>
        </div>
      </div>
    </main>

    <Footer />
  </div>
);

export default NotFound;
