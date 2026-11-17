// ─────────────────────────────────────────────────────────────
//  City / month page par naya section (Nov 2026): "Use this data on your site".
//  Server: har zaban mein shehar ka naam, labels aur SIRF is zaban ka copy-code text; client EmbedBox options aur copy chalata hai.
//  data-embed-section: freeze test sirf is section ke naye links ki ijazat deta hai.
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';
import { LOCALES, localePath } from '@/i18n/config';
import { cityName } from '@/i18n/places';
import { embedBoxText } from '@/utils/embedBoxText';
import { codeText } from '@/utils/embedCodeText';
import { WIDGET_PAGE } from '@/utils/embedConst';
import { widgetPageText } from '@/utils/widgetPageText';
import EmbedBox from './EmbedBox';

export default function EmbedSection({ lang, city, country, monthNum = null }) {
  const text = embedBoxText(lang);
  const names = Object.fromEntries(LOCALES.map((l) => [l, cityName(l, city)]));
  return (
    <section data-embed-section aria-labelledby={`embed-${city.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 id={`embed-${city.slug}`} className="text-xl font-bold text-slate-900 mb-1">{text.title}</h2>
      <p className="text-sm text-slate-600 mb-4">{text.intro}</p>
      <EmbedBox lang={lang} countrySlug={country.slug} citySlug={city.slug} names={names} monthNum={monthNum} text={text} codeText={codeText(lang)} />
      <p className="mt-4 text-sm"><Link href={localePath(lang, WIDGET_PAGE)} className="text-[#0077b6] hover:underline">{widgetPageText(lang).sectionLink}</Link></p>
    </section>
  );
}
