// ─────────────────────────────────────────────────────────────
//  /events/<use case> (Nov 2026): wedding, concert, marathon, festival, picnic-bbq.
//  Wahi tool, event type pehle se chuna hua, neeche us use case ka content.
//  Static: runtime par koi backend call nahi (data/useCases.json). Ghalat slug → 404.
// ─────────────────────────────────────────────────────────────
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventRiskTool from '../EventRiskTool';
import { pageMetadata } from '@/utils/seo';
import ClientMessages from '@/i18n/ClientMessages';
import UseCaseGuide, { EVENT_USECASES, eventTypeOf } from '@/components/tools/UseCaseGuide';
import { useCaseText } from '@/components/tools/usecases';

export const dynamicParams = false;

export function generateStaticParams() {
  return EVENT_USECASES.map((usecase) => ({ usecase }));
}

export async function generateMetadata({ params }) {
  const { lang, usecase } = await params;
  const U = useCaseText(lang)[usecase];
  return pageMetadata({ title: U.title, description: U.meta, path: `/events/${usecase}`, lang });
}

export default async function EventUseCasePage({ params }) {
  const { lang, usecase } = await params;
  const U = useCaseText(lang)[usecase];
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main>
      <ClientMessages lang={lang} ns={['events', 'cityNeeded']}>
      <EventRiskTool
        initialType={eventTypeOf(usecase)}
        intro={
          <div className="max-w-5xl mx-auto text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-3">{U.h1}</h1>
            <p className="text-slate-500 text-lg">{U.intro}</p>
          </div>
        }
      />
      </ClientMessages>
      <UseCaseGuide kind="events" slug={usecase} lang={lang} />
      </main>
      <Footer />
    </div>
  );
}
