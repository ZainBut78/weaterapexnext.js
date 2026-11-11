// ─────────────────────────────────────────────────────────────
//  /trip-planner/<use case> (Nov 2026): beach, city-break, hiking.
//  Wahi tool (trip tool mein "trip type" nahi, is liye waisa hi), neeche us use case ka content.
//  Static: runtime par koi backend call nahi (data/useCases.json). Ghalat slug → 404.
// ─────────────────────────────────────────────────────────────
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TripPlannerTool from '../TripPlannerTool';
import { pageMetadata } from '@/utils/seo';
import ClientMessages from '@/i18n/ClientMessages';
import UseCaseGuide, { TRIP_USECASES } from '@/components/tools/UseCaseGuide';
import { useCaseText } from '@/components/tools/usecases';

export const dynamicParams = false;

export function generateStaticParams() {
  return TRIP_USECASES.map((usecase) => ({ usecase }));
}

export async function generateMetadata({ params }) {
  const { lang, usecase } = await params;
  const U = useCaseText(lang)[usecase];
  return pageMetadata({ title: U.title, description: U.meta, path: `/trip-planner/${usecase}`, lang });
}

export default async function TripUseCasePage({ params }) {
  const { lang, usecase } = await params;
  const U = useCaseText(lang)[usecase];
  return (
    <div className="min-h-screen bg-[#f3f7ff] font-sans">
      <Navbar />
      <main>
      <ClientMessages lang={lang} ns={['trip', 'cityNeeded', 'weather', 'wx']}>
      <TripPlannerTool
        intro={
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#002244]">{U.h1}</h1>
            <p className="text-gray-500 mt-1">{U.intro}</p>
          </div>
        }
      />
      </ClientMessages>
      <UseCaseGuide kind="trip" slug={usecase} lang={lang} />
      </main>
      <Footer />
    </div>
  );
}
