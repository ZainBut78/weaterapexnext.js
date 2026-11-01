'use client';

// Climate Guides page ke woh hisse jo browser mein chalte hain (typing,
// clicks). Baqi page (heading, text) server par banta hai — page.js.
import { useState } from 'react';
import Link from '@/components/LocaleLink';
import { useLang, useLocaleRouter, useT } from '@/i18n/client';
import { intlLocale } from '@/i18n/format';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { pexelsSized, pexelsSrcSet } from '@/utils/pexels';
import { isKnownCity } from '@/data/cities';
import { canonicalCityName, exactCity } from '@/utils/fuzzyCity';
import { cityPath } from '@/data/countries';

// "Search any city..." — shehar ka naam likh kar us ke climate page par jana.
// 160 wale shehar → seedha. Baqi (owner, Oct 2026) → /api/places/open: pehle
// hamara DB, na mile to Open-Meteo se shehar + us ka data DB mein → page.
// Pehle yahan /weather/<slug> par 404 aata tha.
// status → messages `guides.status.*` (q = jo user ne likha)
const STATUS_KEYS = ['not_found', 'rate_limited', 'limit', 'unsupported', 'error'];

export function CitySearchForm() {
  const [customCity, setCustomCity] = useState('');
  const [state, setState] = useState({ kind: 'idle' });   // loading | choose | message
  // d.path backend/route se bina zaban ke aata hai — router khud /de/... lagata hai
  const router = useLocaleRouter();
  const t = useT();
  const lang = useLang();
  const busy = state.kind === 'loading';

  const open = async (payload, label) => {
    setState({ kind: 'loading', label });
    let d = {};
    try {
      const r = await fetch('/api/places/open', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      d = await r.json().catch(() => ({}));
    } catch {
      d = { status: 'error' };
    }
    if (d.status === 'ok' && d.path) {
      router.push(d.path);            // "loading" tab tak jab tak naya page na khule
    } else if (d.status === 'choose' && d.choices?.length) {
      setState({ kind: 'choose', label, choices: d.choices });
    } else if (d.status === 'not_a_city') {
      setState({
        kind: 'message',
        text: t(d.suggestions?.length ? 'guides.notACityPick' : 'guides.notACity', { label: d.label }),
        suggestions: d.suggestions || [],
      });
    } else {
      const key = STATUS_KEYS.includes(d.status) ? d.status : 'error';
      setState({ kind: 'message', text: t(`guides.status.${key}`, { q: label }) });
    }
  };

  const handleCustomSearch = (e) => {
    e.preventDefault();
    const text = customCity.trim();
    if (!text || busy) return;
    // Hamari list ka shehar kisi bhi zaban / spelling mein ("東京", "Londra") → seedha
    const known = exactCity(text) || exactCity(canonicalCityName(text));
    if (known && isKnownCity(known.slug)) router.push(cityPath(known.slug));
    else open(lang === 'en' ? { q: text } : { q: text, lang }, text);   // English = pehle jaisi body
  };

  const place = (c) => [c.name, c.admin1 && c.admin1 !== c.name ? c.admin1 : null, c.country].filter(Boolean).join(', ');

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleCustomSearch} className="flex gap-2">
        <input
          type="text"
          value={customCity}
          onChange={(e) => setCustomCity(e.target.value)}
          placeholder={t('guides.searchPlaceholder')}
          aria-label={t('guides.searchLabel')}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-[#0077b6] hover:bg-[#0092cd] disabled:opacity-70 text-white px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Search size={16} />
          {t('guides.view')}
        </button>
      </form>
      <div aria-live="polite" className="text-sm text-left">
        {state.kind === 'loading' && (
          <p className="mt-3 text-gray-600">{t('guides.loadingCity', { label: state.label })}</p>
        )}
        {state.kind === 'choose' && (
          <div className="mt-3">
            <p className="text-gray-700 mb-2">{t('guides.moreThanOne', { label: state.label })}</p>
            <ul className="space-y-1.5">
              {state.choices.map((c) => (
                <li key={`${c.geo_id}-${c.slug}`}>
                  <button
                    type="button"
                    onClick={() => open(c.geo_id ? { geoId: c.geo_id } : { q: `${c.name}, ${c.country}` }, place(c))}
                    className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-[#0077b6] hover:bg-blue-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-800">{place(c)}</span>
                    {c.population > 0 && <span className="text-gray-500"> · {t('guides.people', { n: c.population.toLocaleString(intlLocale(lang)) })}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {state.kind === 'message' && (
          <div className="mt-3 text-gray-700">
            <p>{state.text}</p>
            {state.suggestions?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {state.suggestions.map((s) => (
                  <button key={s.slug} type="button" onClick={() => open({ q: `${s.name}, ${s.country}` }, s.name)}
                    className="px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-[#0077b6] text-gray-700">
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// "Popular Destinations" heading + filter box + shehron ke cards.
// Server par pehli dafa search khaali hota hai, is liye HTML mein SAARE
// cards asli <a href> links ban kar jate hain — Google inhein follow karta hai.
export function CityGrid({ cities }) {
  const [search, setSearch] = useState('');
  const t = useT();

  const filtered = cities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900">
          {t('guides.popular')}
        </h2>
        <div className="relative w-56 hidden sm:block">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('guides.filterPlaceholder')}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map((city, index) => (
          <CityCard key={city.slug} city={city} index={index} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-semibold text-slate-500">{t('guides.noMatch', { search })}</p>
          <p className="text-sm mt-1">
            {t('guides.noMatchHint')}
          </p>
        </div>
      )}
    </>
  );
}

// Shehar ka card. Photo ho to peeche photo + gehra parda + safed text
// (Popular Destinations jaisa — owner ki farmaish). Photo na ho ya load
// na ho → pehle jaisa safed card.
// index: grid mein jagah — pehle 4 cards eager (upar screen par nazar
// aate hain), sirf pehla fetchPriority high (LCP), baqi lazy. Tasveer card
// ke size ki (400/800 w) — pehle poori 1200px wali aati thi (LCP 2.4 s).
const CARD_RATIO = 0.72; // h-36 card ≈ 400×288
function CityCard({ city, index }) {
  const [broken, setBroken] = useState(false);
  const photo = broken ? null : city.photo;

  if (!photo) {
    return (
      <Link
        href={cityPath(city.slug)}
        className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all"
      >
        <p className="font-semibold text-slate-900">{city.name}</p>
        <p className="text-sm text-slate-400">{city.country}</p>
      </Link>
    );
  }

  return (
    <Link
      href={cityPath(city.slug)}
      className="group relative block h-32 sm:h-36 rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-all"
    >
      <img
        src={pexelsSized(photo, 400, CARD_RATIO)}
        srcSet={pexelsSrcSet(photo, [400, 800], CARD_RATIO)}
        sizes="(min-width: 768px) 270px, (min-width: 640px) 33vw, 50vw"
        alt={`${city.name}, ${city.country}`}
        loading={index < 4 ? 'eager' : 'lazy'}
        fetchPriority={index === 0 ? 'high' : undefined}
        decoding="async"
        width={400}
        height={288}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        onError={() => setBroken(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#002244]/85 via-[#002244]/35 to-[#002244]/10" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="font-semibold text-white leading-tight">{city.name}</p>
        <p className="text-sm text-white/80">{city.country}</p>
      </div>
    </Link>
  );
}

// Purani site mein yeh <button onClick={navigate}> tha — wahi rakha hai
// (Phase A = bilkul wahi). Phase B mein ise asli link banana hai.
export function PlanTripButton() {
  const router = useLocaleRouter();
  const t = useT();
  return (
    <button
      onClick={() => router.push('/trip-planner')}
      className="inline-flex items-center gap-2 bg-white text-[#0077b6] font-bold px-6 py-3 rounded-full shadow hover:bg-blue-50 transition-colors"
    >
      {t('guides.planInstead')} <ArrowRight size={18} />
    </button>
  );
}
