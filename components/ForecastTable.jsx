'use client';

import React from 'react';
import { Droplets } from 'lucide-react';
import { useCity } from '../context/CityContext';
import { useCurrentWeather } from '../hooks/useWeather';
import { getMeteoconIcon } from '../utils/meteoconsMap';
import { getWeatherDescription, getNightDescription } from '../utils/weatherDescriptions';
import { ForecastSkeleton } from './HomeSkeletons';
import { useUnits } from '../context/UnitsContext';

const ForecastTable = () => {
  const { city } = useCity();
  const { data, isLoading, isError } = useCurrentWeather(city);
  const units = useUnits(); // °C/°F (audit 3.2)

  // `!city`: Next.js mein city pehle render par null hoti hai (browser
  // ki saved city useEffect mein aati hai). Tab bhi "Loading" hi
  // dikhe — warna ek pal ke liye "Could not load" chamak jata.
  // Loading ke waqt asli table jitna bara skeleton (CLS fix — HomeSkeletons.jsx)
  if (isLoading || !city) {
    return <ForecastSkeleton />;
  }

  if (isError || !data?.forecast_7day) {
    return null;
  }

  const forecast = data.forecast_7day;

  // "Aaj" = SHEHAR ki apni tareekh (Open-Meteo `current.time` city-local
  // hota hai, jaise "2026-09-27T08:00"), visitor ki ghari nahi. Pehle
  // US se Sydney dekhne par ghalat row "TODAY" banti thi (audit 1.4).
  const cityToday = data.current?.time?.slice(0, 10);

  const forecastData = forecast.time.map((dateStr, idx) => {
    // "YYYY-MM-DD" ko khud tod kar UTC mein banate aur UTC mein hi format
    // karte hain — browser ka timezone din/tareekh ko aage-peeche nahi kar sakta.
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    const isToday = dateStr === cityToday;

    const dayName = isToday
      ? 'TODAY'
      : date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();

    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });

    const code = forecast.weather_code[idx];
    const precip = forecast.precipitation_probability_max[idx];
    const weatherInfo = getWeatherDescription(code, precip ?? 0);
    const iconUrl = getMeteoconIcon(code, false);

    return {
      day: dayName,
      date: formattedDate,
      iconUrl,
      hi: `${units.temp(forecast.temperature_2m_max[idx])}°`,
      lo: `${units.temp(forecast.temperature_2m_min[idx])}°`,
      title: weatherInfo.title,
      desc: weatherInfo.desc,
      night: getNightDescription(code),
      precip: precip != null ? `${precip}%` : '—',
      isHighlighted: isToday,
    };
  });

  return (
    <div className="w-full bg-white py-8 border-t border-gray-100">
      <div className="max-w-[1000px] mx-auto px-4 font-sans">
        <h2 className="text-3xl font-extrabold text-[#002244] mb-6 tracking-tight">
          Long-range Forecast
        </h2>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Column header sirf desktop par — mobile par har row khud label wali hai */}
          <div className="bg-[#f2f6fd] border-b border-gray-200 px-6 py-3 hidden md:grid grid-cols-12 text-[11px] font-bold text-gray-500 uppercase tracking-wider items-center">
            <div className="col-span-2">Day</div>
            <div className="col-span-1 text-center">Cond</div>
            <div className="col-span-2">Hi / Lo</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2">Night</div>
            <div className="col-span-1 text-right">Precip</div>
          </div>

          <div className="bg-white divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {forecastData.map((item, idx) => {
              const precipClass = `font-bold text-xs ${parseInt(item.precip) > 30 ? 'text-blue-600' : 'text-gray-600'}`;
              return (
                <React.Fragment key={idx}>
                {/* MOBILE (< 768px) — stacked row (audit 3.3). Pehle 12-column
                    table 390px par text kaat deti thi ("Light rai…"). Ab:
                    upar din + icon + mausam + hi/lo, neeche raat. */}
                <div
                  className={`md:hidden relative px-4 py-3 text-sm ${item.isHighlighted ? 'bg-[#e8f1ff]' : 'bg-white'}`}
                >
                  {item.isHighlighted && (
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#0077b6]" />
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-14 shrink-0">
                      <span className="block font-bold text-[#002244] leading-tight">{item.day}</span>
                      <span className="text-xs font-semibold text-gray-500">{item.date}</span>
                    </div>
                    <img loading="lazy" decoding="async" src={item.iconUrl} alt={item.title} width={48} height={48} className="w-12 h-12 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="block font-semibold text-gray-900 leading-tight">{item.title}</span>
                      <span className="block text-xs text-gray-500 leading-snug">{item.desc}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-bold text-gray-800 whitespace-nowrap">
                        <span className="text-base text-black">{item.hi}</span>
                        <span className="text-gray-400 font-medium"> / {item.lo}</span>
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <Droplets className="w-3.5 h-3.5 text-blue-500 inline" />
                        <span className={precipClass}>{item.precip}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-600 mt-1.5 pl-[128px]">
                    <span className="text-gray-400">Night: </span>{item.night}
                  </p>
                </div>

                {/* DESKTOP (≥ 768px) — bilkul pehle wali table row */}
                <div
                  className={`relative px-6 py-3.5 hidden md:grid grid-cols-12 items-center text-sm transition-colors hover:bg-blue-50/50 ${
                    item.isHighlighted ? 'bg-[#e8f1ff]' : 'bg-white'
                  }`}
                >
                  {item.isHighlighted && (
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#0077b6]" />
                  )}

                  <div className="col-span-2">
                    <span className="block font-bold text-[#002244] leading-tight">
                      {item.day}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      {item.date}
                    </span>
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <img loading="lazy" decoding="async" src={item.iconUrl} alt={item.title} className="w-14 h-14" />
                  </div>

                  <div className="col-span-2 font-bold text-gray-800">
                    <span className="text-base text-black">{item.hi}</span>
                    <span className="text-gray-400 font-medium"> / {item.lo}</span>
                  </div>

                  <div className="col-span-4 pr-2">
                    <span className="block font-semibold text-gray-900 leading-tight">
                      {item.title}
                    </span>
                    <span className="text-xs text-gray-500 leading-tight block truncate">
                      {item.desc}
                    </span>
                  </div>

                  <div className="col-span-2 text-xs font-medium text-gray-600 truncate">
                    {item.night}
                  </div>

                  <div className="col-span-1 text-right flex items-center justify-end gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-500 inline" />
                    <span
                      className={`font-bold text-xs ${
                        parseInt(item.precip) > 30 ? 'text-blue-600' : 'text-gray-600'
                      }`}
                    >
                      {item.precip}
                    </span>
                  </div>
                </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastTable;
