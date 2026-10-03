'use client';

import React, { useRef, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchCurrentWeather } from '../services/weatherService';
import { getMeteoconIcon } from '../utils/meteoconsMap';
import { isNightHour } from '../utils/isNightHour';
import { useCity } from '../context/CityContext';
import { useUnits } from '../context/UnitsContext';

const cities = [
  { city: 'Paris', country: 'France' },
  { city: 'London', country: 'UK' },
  { city: 'Tokyo', country: 'Japan' },
  { city: 'Dubai', country: 'UAE' },
  { city: 'New York', country: 'USA' },
  { city: 'Sydney', country: 'Australia' },
  { city: 'Mumbai', country: 'India' },
  { city: 'Cairo', country: 'Egypt' },
  { city: 'Singapore', country: 'Singapore' },
  { city: 'Bangkok', country: 'Thailand' },
  { city: 'Seoul', country: 'South Korea' },
  { city: 'Istanbul', country: 'Turkey' },
  { city: 'Rome', country: 'Italy' },
  { city: 'Barcelona', country: 'Spain' },
  { city: 'Berlin', country: 'Germany' },
  { city: 'Toronto', country: 'Canada' },
];

const skylineSvgs = {
  Paris: (
    <svg viewBox="0 0 100 40" className="w-28 h-14 text-gray-300 fill-current opacity-40">
      <path d="M0,40 L100,40 L100,32 L95,32 L95,35 L85,35 L85,28 L80,28 L80,40 L65,40 L65,20 L60,10 L58,10 L58,0 L52,0 L52,10 L50,10 L45,20 L45,40 L30,40 L30,30 L25,30 L25,40 L10,40 L10,34 L0,34 Z" />
    </svg>
  ),
  London: (
    <svg viewBox="0 0 100 40" className="w-28 h-14 text-gray-300 fill-current opacity-40">
      <path d="M0,40 L100,40 L100,30 L90,30 L90,35 L80,35 L80,25 L75,15 L70,25 L70,40 L55,40 L55,30 L45,30 L45,40 L35,40 L35,10 L32,5 L28,10 L28,40 L15,40 L15,32 L0,32 Z" />
    </svg>
  ),
  Tokyo: (
    <svg viewBox="0 0 100 40" className="w-28 h-14 text-gray-300 fill-current opacity-40">
      <path d="M0,40 L100,40 L100,33 L92,33 L92,40 L80,40 L80,28 L75,28 L75,40 L65,40 L62,12 L60,2 L58,12 L55,40 L40,40 L40,30 L30,30 L30,40 L18,40 L18,25 L0,25 Z" />
    </svg>
  ),
  Dubai: (
    <svg viewBox="0 0 100 40" className="w-28 h-14 text-gray-300 fill-current opacity-40">
      <path d="M0,40 L100,40 L100,35 L90,35 L90,40 L78,40 L78,30 L70,30 L70,40 L58,40 L54,18 L52,0 L50,18 L46,40 L35,40 L35,32 L22,32 L22,40 L10,40 L10,36 L0,36 Z" />
    </svg>
  ),
};

const PopularDestinations = () => {
  const { setCity } = useCity();
  const units = useUnits(); // °C/°F (audit 3.2)
  const scrollRef = useRef(null);

  // Card dabane par wahi ho jo navbar search se hota hai: upar ka weather
  // card usi city ka ho jaye. Pehle card par koi onClick tha hi nahi —
  // tap/click se kuch nahi hota tha.
  //
  // Weather card aur yeh cards EK HI cache key use karte hain
  // (['currentWeather', city]) — is liye data foran aata hai, dobara API
  // call nahi hoti. Phir page upar scroll karte hain taake user ko nazar
  // aaye ke kya badla (warna card neeche se dabaya aur upar tabdeeli
  // hui — mobile par pata hi nahi chalta).
  const openCity = (name) => {
    setCity(name.toLowerCase());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  // Jin cities ki Pexels tasveer load na ho sake (404, network, blocker) —
  // un par tasveer ki jagah wahi skyline SVG, jo tasveer na hone par aata hai.
  const [brokenImages, setBrokenImages] = useState(() => new Set());

  const results = useQueries({
    queries: cities.map((c) => ({
      queryKey: ['currentWeather', c.city.toLowerCase()],
      queryFn: () => fetchCurrentWeather(c.city.toLowerCase()),
      staleTime: 1000 * 60 * 60 * 3,
    })),
  });

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 320;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  return (
    <div className="w-full bg-[#f8fbff] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-[#002244] tracking-tight">
            Popular Destinations
          </h2>
          <div className="flex gap-2">
            {showLeft && (
              <button
                onClick={() => scroll('left')}
                className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-white hover:border-gray-400 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {showRight && (
              <button
                onClick={() => scroll('right')}
                className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-white hover:border-gray-400 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto pb-2 scroll-smooth hide-scrollbar"
        >

          {cities.map((item, idx) => {
            const weatherData = results[idx]?.data;
            const isLoading = results[idx]?.isLoading;
            // Call fail ho jaye to `isLoading` false ho jata hai — pehle is
            // halat mein bhi icon dikhta tha (data nahi, to generic badal)
            // aur lagta tha mausam badal wala hai. Ab error par icon nahi.
            const isError = results[idx]?.isError && !weatherData;
            const temp = weatherData ? `${units.temp(weatherData.current.temperature_2m)}${units.tempSymbol}` : '—';
            // `?? 0` yahan bug tha: 0 ka matlab "clear sky" hai, to data
            // na hone par SURAJ dikhta tha. Ab raw value — icon khud
            // neutral badal ban jata hai.
            const code = weatherData?.current?.weather_code;
            // Ye 16 cities poori duniya mein phaili hui hain, to har waqt
            // in mein se aadhi par RAAT hoti hai. Pehle isNight hamesha
            // false tha — yani Tokyo mein raat ke 2 baje bhi chamakta
            // suraj. Ab har city apne LOCAL time se decide hoti hai
            // (Open-Meteo current.time city-local hota hai).
            const cityIsNight = isNightHour(
              weatherData?.current?.time,
              weatherData?.current?.is_day,
            );
            const imageUrl = brokenImages.has(item.city) ? null : weatherData?.image_url;

            return (
              <div
                key={idx}
                // <button> nahi banaya — button ki apni default styling
                // (text-align, font) card ka design badal deti. role +
                // tabIndex + Enter/Space se keyboard aur screen reader par
                // bhi button ki tarah kaam karta hai.
                role="button"
                tabIndex={0}
                aria-label={`Show weather for ${item.city}, ${item.country}`}
                onClick={() => openCity(item.city)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openCity(item.city);
                  }
                }}
                className="relative bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between h-40 min-w-[220px] shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0077b6] focus-visible:ring-offset-2"
              >
                {imageUrl ? (
                  <>
                    <img
                      loading="lazy" decoding="async" src={imageUrl} alt={item.city} className="absolute inset-0 w-full h-full object-cover"
                      onError={() => setBrokenImages((prev) => new Set(prev).add(item.city))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#002244]/85 via-[#002244]/35 to-[#002244]/10" />
                  </>
                ) : (
                  <div className="absolute right-0 bottom-0 pointer-events-none select-none z-0">
                    {skylineSvgs[item.city]}
                  </div>
                )}

                <div className="flex justify-between items-start z-10">
                  <div>
                    <h3 className={`text-xl font-bold leading-tight ${imageUrl ? 'text-white' : 'text-[#002244]'}`}>
                      {item.city}
                    </h3>
                    <p className={`text-xs font-semibold mt-0.5 ${imageUrl ? 'text-white/80' : 'text-gray-400'}`}>
                      {isLoading ? 'Loading...' : item.country}
                    </p>
                  </div>
                  {!isLoading && !isError && (
                    <img loading="lazy" decoding="async" src={getMeteoconIcon(code, cityIsNight)} alt={item.city} className="w-14 h-14 drop-shadow-md" />
                  )}
                </div>

                <div className="flex justify-between items-end z-10 mt-2">
                  <span className={`text-3xl font-extrabold ${imageUrl ? 'text-white' : 'text-[#002244]'}`}>
                    {temp}
                  </span>
                  {/* Asli <a href> city climate page ki taraf — Google ke liye
                      internal link (audit 2.6-a). Card dabane se shehar
                      badalta hai; is link par click/Enter card tak nahi
                      jata (stopPropagation), seedha climate page khulta hai. */}
                  <Link
                    href={`/weather/${item.city.toLowerCase().replace(/ /g, '-')}`}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className={`text-xs font-semibold mb-1 hover:underline focus:outline-none focus-visible:underline ${imageUrl ? 'text-white/90' : 'text-[#0077b6]'}`}
                  >
                    Climate guide →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PopularDestinations;
