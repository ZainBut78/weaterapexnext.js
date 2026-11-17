'use client';

// Landing page ka picker (Nov 2026): shehar chuno, baqi options wahi EmbedBox (city/month pages wala).
// cities: [{ s: slug, c: countrySlug, t: is zaban mein label, n: { en, ja, … sirf jo English se alag } }]
import { useState } from 'react';
import EmbedBox from './EmbedBox';

export default function WidgetPicker({ lang, cities, initial, monthNum, label, text, codeText }) {
  const [slug, setSlug] = useState(initial);
  const city = cities.find((c) => c.s === slug) || cities[0];
  return (
    <div>
      <label className="mb-4 block max-w-sm text-sm font-medium text-slate-700">{label}
        <select className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm" value={city.s} onChange={(e) => setSlug(e.target.value)}>
          {cities.map((c) => <option key={c.s} value={c.s}>{c.t}</option>)}
        </select>
      </label>
      <EmbedBox key={city.s} lang={lang} countrySlug={city.c} citySlug={city.s} names={city.n} monthNum={monthNum} text={text} codeText={codeText} />
    </div>
  );
}
