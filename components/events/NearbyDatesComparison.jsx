'use client';

import { useRef, useState } from 'react';
import { Droplets, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMeteoconIcon } from '../../utils/meteoconsMap';
import { useUnits } from '../../context/UnitsContext';

const DATES_DEMO = [
  { label: 'Aug 15 (Selected)', score: 4.0, temp: 23, rain: 22, weather_code: 2, selected: true },
  { label: 'Tomorrow, Aug 16', score: 1.5, temp: 25, rain: 0, weather_code: 0, better: true },
  { label: 'Saturday, Aug 17', score: 7.2, temp: 20, rain: 85, weather_code: 61, worse: true },
  { label: 'Sunday, Aug 18', score: 3.1, temp: 24, rain: 15, weather_code: 0 },
  { label: 'Monday, Aug 19', score: 5.4, temp: 22, rain: 45, weather_code: 2 },
  { label: 'Tuesday, Aug 20', score: 6.8, temp: 21, rain: 70, weather_code: 61 },
  { label: 'Wednesday, Aug 21', score: 2.9, temp: 25, rain: 5, weather_code: 0, better: true },
  { label: 'Thursday, Aug 22', score: 4.3, temp: 23, rain: 30, weather_code: 2 },
];

const scoreColor = (score) => {
  if (score <= 3) return 'bg-slate-100 text-slate-700';
  if (score <= 6) return 'bg-orange-50 text-orange-600';
  return 'bg-red-50 text-red-500';
};

const NearbyDatesComparison = ({ dates = DATES_DEMO }) => {
  const units = useUnits(); // °C/°F (audit 3.2)
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 340;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">Nearby Dates Comparison</h3>
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
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth hide-scrollbar"
      >
        {dates.map((d, i) => {
          return (
            <div
              key={i}
              className={`relative bg-white rounded-2xl border p-5 min-w-[240px] shrink-0 ${
                d.best ? 'border-emerald-500 border-2' : d.better ? 'border-emerald-400 border-2' : 'border-gray-200'
              }`}
            >
              {d.best && (
                <span className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl">
                  RECOMMENDED
                </span>
              )}
              {!d.best && d.better && (
                <span className="absolute top-0 right-0 bg-emerald-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl">
                  BETTER OPTION
                </span>
              )}
              {d.selected && !d.best && (
                <span className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl">
                  SELECTED
                </span>
              )}

              <div className="flex items-start justify-between mb-3">
                <span className={`text-sm font-semibold ${d.selected ? 'text-slate-900' : 'text-slate-500'}`}>
                  {d.label}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${scoreColor(d.score)}`}>
                  {d.score.toFixed(1)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img loading="lazy" decoding="async" src={getMeteoconIcon(d.weather_code, false)} alt={d.label} className="w-7 h-7" />
                  <span className="text-2xl font-bold text-slate-900">{units.temp(d.temp)}°</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Droplets size={14} className={d.rain > 50 ? 'text-red-400' : 'text-slate-400'} />
                  <span className={d.rain > 50 ? 'text-red-500 font-semibold' : 'text-slate-500'}>
                    {d.rain}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NearbyDatesComparison;