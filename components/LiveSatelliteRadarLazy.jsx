'use client';

// ─────────────────────────────────────────────────────────────
//  "Weather Map" section (homepage)
//
//  Perf fixes (Oct 2026): pehle POORA section (heading samait) `ssr: false`
//  tha — "Weather Map" heading (mobile LCP element) JS + weather data ke
//  baad hi paint hoti thi (render delay ~3.6 s). Ab:
//   • Section ka dabba + heading server HTML mein — pehle paint par.
//   • Subtitle (shehar, temp) data aane par; tab tak utni hi jagah.
//   • Leaflet map (JS ~42K gz + CSS) sirf jab section screen ke qareeb
//     aaye (IntersectionObserver) — alag chunk. Jagah 420px pehle se → CLS 0.
//  Leaflet `window` maangti hai → map `ssr: false` hi rehta hai.
// ─────────────────────────────────────────────────────────────
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useCity } from '../context/CityContext';
import { useCurrentWeather } from '../hooks/useWeather';
import { useUnits } from '../context/UnitsContext';

const LeafletMap = dynamic(() => import('./LiveSatelliteRadar'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-800 animate-pulse" />,
});

export default function LiveSatelliteRadar() {
  const { city } = useCity();
  const { data } = useCurrentWeather(city);
  const units = useUnits();
  const boxRef = useRef(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) {
      setNear(true);
      return undefined;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setNear(true);
        io.disconnect();
      }
    }, { rootMargin: '400px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="w-full bg-[#0f172a] py-10">
      <div className="max-w-[1000px] mx-auto px-4 font-sans">
        <div className="mb-6">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Weather Map
          </h2>
          {data ? (
            <p className="text-sm text-slate-300 font-medium mt-1">
              {data.city}, {data.country} &mdash; {units.temp1(data.current.temperature_2m)}{units.tempSymbol} &bull; Precipitation Radar
            </p>
          ) : (
            <div className="h-5 mt-1 w-72 max-w-full bg-slate-800 rounded-lg animate-pulse" aria-hidden="true" />
          )}
        </div>

        <div
          ref={boxRef}
          className="relative w-full h-[420px] rounded-3xl border border-slate-700/60 shadow-inner overflow-hidden bg-slate-800"
        >
          {near && data ? <LeafletMap data={data} /> : <div className="h-full w-full bg-slate-800 animate-pulse" aria-hidden="true" />}
        </div>
      </div>
    </div>
  );
}
