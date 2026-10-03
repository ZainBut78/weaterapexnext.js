'use client';

import { useRef, useState } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMeteoconIcon } from '../../utils/meteoconsMap';
import { isNightHour } from '../../utils/isNightHour';

const getBarColor = (score) => {
  if (score <= 3) return '#34D399';
  if (score <= 6) return '#FB923C';
  return '#F87171';
};

const HOURLY_DEMO = [
  { hour: '12 PM', hour24: 12, weather_code: 3, score: 6.5 },
  { hour: '1 PM', hour24: 13, weather_code: 3, score: 5.2 },
  { hour: '2 PM', hour24: 14, weather_code: 0, score: 2.1, best: true },
  { hour: '3 PM', hour24: 15, weather_code: 2, score: 3.4, best: true },
  { hour: '4 PM', hour24: 16, weather_code: 2, score: 4.0, best: true },
  { hour: '5 PM', hour24: 17, weather_code: 51, score: 8.5 },
  { hour: '6 PM', hour24: 18, weather_code: 2, score: 5.8 },
  { hour: '7 PM', hour24: 19, weather_code: 3, score: 4.9 },
  { hour: '8 PM', hour24: 20, weather_code: 0, score: 3.6 },
  { hour: '9 PM', hour24: 21, weather_code: 2, score: 2.8 },
  { hour: '10 PM', hour24: 22, weather_code: 0, score: 2.2 },
];

const TimelineAnalysis = ({ hours = HOURLY_DEMO, window: bestWindow = null }) => {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const isInWindow = (h) => {
    if (bestWindow) {
      return h.hour24 >= bestWindow.startHour && h.hour24 <= bestWindow.endHour;
    }
    return !!h.best;
  };

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
            <Clock size={18} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Timeline Analysis</h3>
        </div>
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
      <p className="text-sm text-slate-500 mb-6 ml-12">
        We found the optimal {bestWindow ? `${bestWindow.endHour - bestWindow.startHour + 1}-hour window` : 'time window'} for your event to minimize weather disruptions.
      </p>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth hide-scrollbar"
      >
        {hours.map((h, i) => {
          const inWindow = isInWindow(h);
          // Pehle yahan fixed `hour24 >= 19 || < 6` tha. Ab backend
          // Open-Meteo ka asli is_day bhejta hai (us shehar ke sunrise/
          // sunset se), aur na mile to wohi purana andaza.
          const isNight = isNightHour(`T${String(h.hour24).padStart(2, '0')}:00`.slice(1), h.is_day);
          return (
            <div
              key={i}
              className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 min-w-[110px] shrink-0 ${
                inWindow ? 'border-blue-600' : 'border-transparent bg-slate-50'
              }`}
            >
              {inWindow && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full" />
              )}
              <span className={`text-xs font-semibold ${inWindow ? 'text-blue-600' : 'text-slate-400'}`}>
                {h.hour}
              </span>
              <img
                loading="lazy" decoding="async" src={getMeteoconIcon(h.weather_code, isNight)}
                alt={`${h.hour} weather`}
                className="w-8 h-8"
              />
              <span className="text-lg font-bold text-slate-900">{h.score.toFixed(1)}</span>
              <div className="w-full h-1 rounded-full" style={{ backgroundColor: getBarColor(h.score) }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineAnalysis;