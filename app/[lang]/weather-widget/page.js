// ─────────────────────────────────────────────────────────────
//  /weather-widget (Nov 2026, Embed Step 3): bloggers ke liye landing page, indexable.
//  Kya dikhata hai, live demo, shehar/mahina picker (wahi copy box), FAQ + FAQPage JSON-LD
//  (page wale jumle hoobahoo). Outreach emails mein yahi page jata hai.
//  Server HTML mein /embed/ ka koi href/src nahi: demo iframe aur preview sirf browser mein.
//  Shehar registry se (city hub jaisa; 1 cached index call, backend down → static shehar).
// ─────────────────────────────────────────────────────────────
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd, { breadcrumbs } from '@/components/JsonLd';
import WidgetDemo from '@/components/climate/WidgetDemo';
import WidgetPicker from '@/components/climate/WidgetPicker';
import { getT } from '@/i18n/server';
import { LOCALES } from '@/i18n/config';
import { cityName } from '@/i18n/places';
import { countryName } from '@/i18n/format';
import { COUNTRIES } from '@/data/countries';
import { getCityRegistry } from '@/services/cityRegistry';
import { embedBoxText } from '@/utils/embedBoxText';
import { codeText } from '@/utils/embedCodeText';
import { embedPaths } from '@/utils/embedCode';
import { WIDGET_PAGE } from '@/utils/embedConst';
import { widgetPageText } from '@/utils/widgetPageText';
import { pageMetadata } from '@/utils/seo';

const DEMO = { countrySlug: 'france', citySlug: 'paris', monthNum: 5 };
const H2 = 'text-2xl font-bold text-slate-900 mt-10 mb-3';
const P = 'text-slate-700 leading-relaxed mb-3';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const W = widgetPageText(lang);
  return pageMetadata({ title: W.metaTitle, description: W.metaDescription, path: WIDGET_PAGE, lang });
}

/** Picker ke shehar: is zaban ke naam se tarteeb; doosri zaban ka naam sirf jab English se alag ho */
function pickerCities(lang, cities) {
  const iso = new Map(COUNTRIES.map((c) => [c.slug, c.iso2]));
  const list = cities.map((c) => {
    const en = cityName('en', c);
    const n = { en };
    for (const l of LOCALES) {
      const name = cityName(l, c);
      if (name !== en) n[l] = name;
    }
    return { s: c.slug, c: c.countrySlug, n, t: n[lang] || en, country: c.country };
  });
  const count = new Map();
  for (const c of list) count.set(c.t, (count.get(c.t) || 0) + 1);
  return list
    .map(({ country, ...c }) => (count.get(c.t) > 1 ? { ...c, t: `${c.t} (${countryName(lang, iso.get(c.c), country)})` } : c))
    .sort((a, b) => a.t.localeCompare(b.t, lang));
}

export default async function WeatherWidgetPage({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  const W = widgetPageText(lang);
  const reg = await getCityRegistry();
  const cities = pickerCities(lang, reg.cities);
  const initial = cities.some((c) => c.s === DEMO.citySlug) ? DEMO.citySlug : cities[0]?.s;
  const demoSrc = embedPaths({ lang, ...DEMO }).widget;
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: W.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };

  return (
    <div className="min-h-screen bg-[#f3f7ff] font-sans">
      <JsonLd data={breadcrumbs([{ name: t('nav.home'), path: '/' }, { name: W.h1, path: WIDGET_PAGE }], lang)} />
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10 pb-16">
        <h1 className="text-3xl font-bold text-[#002244] mb-3">{W.h1}</h1>
        <p className="text-lg text-slate-600 leading-relaxed">{W.intro}</p>

        <h2 className={H2}>{W.showsTitle}</h2>
        <ul className="list-disc pl-5 space-y-2 mb-4 text-slate-700">
          {W.shows.map((s) => <li key={s.slice(0, 24)}>{s}</li>)}
        </ul>

        <h2 className={H2}>{W.demoTitle}</h2>
        <p className={P}>{W.demoIntro}</p>
        <WidgetDemo src={demoSrc} title={W.demoTitleAttr} />

        <h2 className={H2}>{W.pickTitle}</h2>
        <p className={P}>{W.pickIntro}</p>
        {initial && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <WidgetPicker lang={lang} cities={cities} initial={initial} monthNum={DEMO.monthNum} label={W.city} text={embedBoxText(lang)} codeText={codeText(lang)} />
          </div>
        )}

        <h2 className={H2}>{W.howTitle}</h2>
        <ol className="list-decimal pl-5 space-y-2 mb-4 text-slate-700">
          {W.how.map((s) => <li key={s.slice(0, 24)}>{s}</li>)}
        </ol>

        <h2 className={H2}>{W.faqTitle}</h2>
        {W.faq.map(([q, a]) => (
          <div key={q} className="mb-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{q}</h3>
            <p className="text-slate-700 leading-relaxed">{a}</p>
          </div>
        ))}
        <JsonLd data={faqLd} />
      </main>
      <Footer />
    </div>
  );
}
