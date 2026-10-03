'use client';

// Climate Guides page ke woh hisse jo browser mein chalte hain (typing,
// clicks). Baqi page (heading, text) server par banta hai — page.js.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { pexelsSized, pexelsSrcSet } from '@/utils/pexels';

// "Search any city..." — shehar ka naam likh kar /weather/<slug> par jana.
export function CitySearchForm() {
  const [customCity, setCustomCity] = useState('');
  const router = useRouter();

  const handleCustomSearch = (e) => {
    e.preventDefault();
    if (customCity.trim()) {
      const slug = customCity.trim().toLowerCase().replace(/\s+/g, '-');
      router.push(`/weather/${slug}`);
    }
  };

  return (
    <form onSubmit={handleCustomSearch} className="flex gap-2 max-w-md mx-auto">
      <input
        type="text"
        value={customCity}
        onChange={(e) => setCustomCity(e.target.value)}
        placeholder="Search any city..."
        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
      />
      <button
        type="submit"
        className="bg-[#0077b6] hover:bg-[#0092cd] text-white px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
      >
        <Search size={16} />
        View
      </button>
    </form>
  );
}

// "Popular Destinations" heading + filter box + shehron ke cards.
// Server par pehli dafa search khaali hota hai, is liye HTML mein SAARE
// cards asli <a href> links ban kar jate hain — Google inhein follow karta hai.
export function CityGrid({ cities }) {
  const [search, setSearch] = useState('');

  const filtered = cities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900">
          Popular Destinations
        </h2>
        <div className="relative w-56 hidden sm:block">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter cities..."
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
          <p className="text-lg font-semibold text-slate-500">No cities match "{search}"</p>
          <p className="text-sm mt-1">
            Try the search box above to view any city's climate guide.
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
        href={`/weather/${city.slug}`}
        className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all"
      >
        <p className="font-semibold text-slate-900">{city.name}</p>
        <p className="text-sm text-slate-400">{city.country}</p>
      </Link>
    );
  }

  return (
    <Link
      href={`/weather/${city.slug}`}
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
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/trip-planner')}
      className="inline-flex items-center gap-2 bg-white text-[#0077b6] font-bold px-6 py-3 rounded-full shadow hover:bg-blue-50 transition-colors"
    >
      Plan a trip instead <ArrowRight size={18} />
    </button>
  );
}
