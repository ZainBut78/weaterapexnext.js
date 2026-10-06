'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useCity } from '../context/CityContext';
import { useCurrentWeather } from '../hooks/useWeather';
import { getWeatherIcon } from '../utils/weatherIconMap';
import { getMeteoconIcon } from '../utils/meteoconsMap';
import { isNightHour } from '../utils/isNightHour';
import { getWeatherDescription } from '../utils/weatherDescriptions';
import WeatherBackground from './WeatherBackground';
import { WeatherCardSkeleton } from './HomeSkeletons';
import { useUnits } from '../context/UnitsContext';
import { matchCities } from '../utils/fuzzyCity';

// windUnit: 'km/h' ya 'mph' (UnitsContext). Pehle yahan 'm/s' likha tha —
// ghalat: backend km/h bhejta hai (Open-Meteo default). Audit 3.2.
function getGraphData(activeTab, hourlyData, windUnit) {
  if (activeTab === 'Temperature') {
    return hourlyData.map(h => ({
      value: h.temp,
      label: `${h.temp}°`,
      color: '#fca311',
    }));
  }
  if (activeTab === 'Precipitation') {
    return hourlyData.map(h => ({
      value: h.precip,
      label: `${h.precip}%`,
      color: '#3B82F6',
    }));
  }
  if (activeTab === 'Wind') {
    return hourlyData.map(h => ({
      value: h.windSpeed,
      label: `${h.windSpeed}${windUnit}`,
      color: '#10B981',
    }));
  }
  return [];
}

// Reference point = city ka apna local time (data.current.time from Open-Meteo),
// browser ka Date() nahi — taake timezone mismatch na ho (production users).
// hourly.time city-local ISO hai ("2026-08-02T20:00"), isliye string compare
// chronological hota hai aur koi timezone conversion pitfalls nahi hain.
function getUpcomingHours(hourlyData, currentTimeStr, count = 12) {
  const times = hourlyData?.time || [];
  if (times.length === 0) {
    return { time: [], temperature_2m: [], precipitation_probability: [], wind_speed_10m: [], weather_code: [], is_day: [] };
  }

  const ref = currentTimeStr || times[times.length - 1];
  let startIndex = times.findIndex(t => t >= ref);

  if (startIndex === -1) {
    // Exact match na mile to fallback — sabse aakhri count hours
    startIndex = Math.max(0, times.length - count);
  }

  const slice = (arr) => (arr ? arr.slice(startIndex, startIndex + count) : []);
  return {
    time: slice(times),
    temperature_2m: slice(hourlyData.temperature_2m),
    precipitation_probability: slice(hourlyData.precipitation_probability),
    wind_speed_10m: slice(hourlyData.wind_speed_10m),
    weather_code: slice(hourlyData.weather_code),
    // Open-Meteo ka is_day — har ghante ke liye 1/0, asli sunrise/sunset se
    is_day: slice(hourlyData.is_day),
  };
}

// Meteocons CDN icon render karta hai; load fail hone par
// lucide-react ke getWeatherIcon fallback par degrade (graceful).
function MeteoconIcon({ weatherCode, isNight, sizeClass }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    const { icon: FallbackIcon, color } = getWeatherIcon(weatherCode, isNight);
    return <FallbackIcon className={`${sizeClass} ${color}`} strokeWidth={1.5} />;
  }

  return (
    <img
      src={getMeteoconIcon(weatherCode, isNight)}
      alt="weather icon"
      loading="lazy"
      decoding="async"
      className={sizeClass}
      onError={() => setFailed(true)}
    />
  );
}

function HourlyStrip({ hours, activeTab, windUnit }) {
  const controls = useAnimation();
  const trackRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  // Exact pixel width — ek complete "set" = pehle N cards + unka gap.
  // scrollWidth/2 gap ke hisaab se half-gap off hota hai, isliye
  // width+gap per card measure karte hain taake loop zero-jump ho.
  useEffect(() => {
    if (!trackRef.current || hours.length === 0) return;
    const track = trackRef.current;
    const cards = track.children;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    let setWidth = 0;
    for (let i = 0; i < hours.length; i++) {
      setWidth += cards[i].offsetWidth + gap;
    }
    setScrollDistance(setWidth);
  }, [hours]);

  const startScroll = () => {
    if (isPaused || scrollDistance === 0) return;
    controls.start({
      x: [0, -scrollDistance],
      transition: {
        duration: hours.length * 2.5,
        ease: 'linear',
        repeat: Infinity,
      },
    });
  };

  const pauseScroll = () => {
    setIsPaused(true);
    controls.stop();
  };

  const resumeScroll = () => {
    setIsPaused(false);
    startScroll();
  };

  useEffect(() => {
    startScroll();
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollDistance]);

  const displayHours = [...hours, ...hours];

  return (
    <div
      className="overflow-hidden px-2"
      onMouseEnter={pauseScroll}
      onMouseLeave={resumeScroll}
      onTouchStart={pauseScroll}
      onTouchEnd={resumeScroll}
    >
      <motion.div
        ref={trackRef}
        animate={controls}
        drag="x"
        dragConstraints={{ left: -scrollDistance, right: 0 }}
        onDragStart={pauseScroll}
        onDragEnd={resumeScroll}
        className="flex gap-5 cursor-grab active:cursor-grabbing w-max"
      >
        {displayHours.map((point, index) => {
          return (
            <div key={index} className="flex flex-col items-center gap-2 w-20 shrink-0">
              <span>{point.time}</span>
              <MeteoconIcon weatherCode={point.weatherCode} isNight={isNightHour(point.time, point.isDay)} sizeClass="w-14 h-14" />
              <p className="text-sm font-bold text-gray-900">
                {activeTab === 'Precipitation' ? `${point.precip}%` :
                 activeTab === 'Wind' ? `${point.windSpeed}${windUnit}` :
                 `${point.temp}°`}
              </p>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

// Shehar nahi mila (backend 404) — generic error ki jagah madad: hamari
// 160 cities se "Did you mean" (local, zero API calls). UX fixes B3.
// Sirf message badla hai, card wahi hai.
function CityNotFoundMessage({ query, onPick }) {
  const matches = matchCities(query, { partial: false, limit: 3 });
  return (
    <div className="text-lg">
      <p className="text-red-500">
        We couldn&apos;t find &ldquo;{query}&rdquo;.
        {matches.length > 0 && ' Did you mean:'}
      </p>
      {matches.length > 0 ? (
        <p className="mt-3 flex flex-wrap justify-center items-center gap-x-2 gap-y-2">
          {matches.map((m, i) => (
            <React.Fragment key={m.slug}>
              {i > 0 && <span className="text-gray-300" aria-hidden="true">·</span>}
              <button
                type="button"
                onClick={() => onPick(m.name)}
                className="min-h-11 px-3 font-bold text-[#0077b6] hover:underline"
              >
                {m.name}, {m.country}
              </button>
            </React.Fragment>
          ))}
        </p>
      ) : (
        <p className="mt-2 text-base text-gray-500">Check the spelling or try a nearby big city.</p>
      )}
    </div>
  );
}

const WeatherCard = () => {
  const { city, setCity } = useCity();
  const { data, isLoading, isError, error } = useCurrentWeather(city);
  const [activeTab, setActiveTab] = useState('Temperature');
  // °C/°F + km/h/mph (audit 3.2) — hook early return se PEHLE
  const units = useUnits();
  const navLinks = ['Temperature', 'Precipitation', 'Wind'];

  // `!city`: Next.js mein city pehle render par null hoti hai (browser
  // ki saved city useEffect mein aati hai). Tab bhi "Loading" hi
  // dikhe — warna ek pal ke liye "Could not load" chamak jata.
  // Loading ke waqt asli card jitna bara skeleton (CLS fix — HomeSkeletons.jsx)
  if (isLoading || !city) {
    return <WeatherCardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-[900px] mx-auto text-[#0077b6] text-center">
          {error?.response?.status === 404 ? (
            <CityNotFoundMessage query={city} onPick={(name) => setCity(name.toLowerCase())} />
          ) : (
            <p className="text-lg text-red-500">Could not load weather data.</p>
          )}
        </div>
      </div>
    );
  }

  const current = data.current;
  const hourly = data.hourly_forecast && data.hourly_forecast.time?.length ? data.hourly_forecast : data.hourly_today;
  const temp = units.temp(current.temperature_2m);
  const humidity = current.relative_humidity_2m;
  const wind = units.wind(current.wind_speed_10m);
  const weatherCode = current.weather_code;
  const precip = current.precipitation ?? 0;
  // current.is_day bhi Open-Meteo se aata hai — waqt ke andaze se behtar
  const isCurrentlyNight = isNightHour(current.time, current.is_day);
  const weatherTitle = getWeatherDescription(weatherCode).title;
  const displayCity = data.city || city;
  const displayCountry = data.country || '';

  // Ab-se-aage 12 ghantay — reference point = city ka local current time
  const upcoming = getUpcomingHours(hourly, current?.time, 12);
  const hourlyData = upcoming.time.map((t, i) => ({
    time: t.slice(11, 16),
    temp: units.temp(upcoming.temperature_2m[i]),
    precip: upcoming.precipitation_probability[i],
    windSpeed: units.wind(upcoming.wind_speed_10m[i]),
    weatherCode: upcoming.weather_code[i],
    isDay: upcoming.is_day?.[i],
  }));

  const graphValues = getGraphData(activeTab, hourlyData, units.windUnit)
    .filter((g) => Number.isFinite(g.value));
  const values = graphValues.map(g => g.value);
  // Math.min/max khali array pe Infinity/-Infinity dete hain -> NaN
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 0;
  const range = Math.max(maxVal - minVal, 1);
  const graphColor = graphValues[0]?.color || '#fca311';

  // BUG THA: x = index * (300 / (length - 1)). Sirf EK point bache to
  // 300/0 = Infinity aur 0 * Infinity = NaN -> SVG path/circle/text sab
  // NaN ho kar chart gayab ho jata tha (console mein red errors).
  // Yeh raat ko asal mein hota hai jab hourly_today ke sirf 1 ghanta bacha ho.
  const stepX = graphValues.length > 1 ? 300 / (graphValues.length - 1) : 0;
  const pointAt = (point, index) => ({
    x: graphValues.length > 1 ? index * stepX + 50 : 200,
    y: 80 - ((point.value - minVal) / range) * 60,
  });

  const pathData = graphValues.map((point, index) => {
    const { x, y } = pointAt(point, index);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const dotPoints = graphValues.map((point, index) => {
    const { x, y } = pointAt(point, index);
    return { x, y, label: point.label };
  });

  const hasChart = graphValues.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="relative bg-white rounded-3xl shadow-xl p-5 sm:p-7 lg:p-10 max-w-[900px] mx-auto overflow-hidden">
        
        <WeatherBackground weatherCode={weatherCode} />

        <div className="relative z-10 text-[#0077b6]">
        {/* Mobile pe yeh do block ek doosre ke UPAR overlap kar rahe the
            (fixed flex row + gap-12 + 375px). Ab mobile pe stack, lg pe
            bilkul pehle jaisa row. */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 lg:gap-12 mb-6 lg:mb-10">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <MeteoconIcon weatherCode={weatherCode} isNight={isCurrentlyNight} sizeClass="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 shrink-0" />
            <div className="min-w-0">
              {/* Pehle <h1> tha — home par do <h1> ban jate (FeaturesSection
                  ka bhi). Ab <div>, same classes (andar <div> hai, is liye
                  <p> nahi — <p> ke andar <div> ghalat HTML hai). */}
              <div className="text-5xl sm:text-6xl font-extrabold flex items-start">
                {temp}<span className="text-2xl sm:text-3xl font-bold mt-1">°</span>
                {/* °C / °F toggle (audit 3.2). Pehle dono sirf likhe the magar
                    number hamesha °C ka tha — US user ke liye dhoka. Ab yahi
                    do lafz button hain; chuni hui unit neeli. Size wahi. */}
                <div className="flex flex-col ml-2 sm:ml-3 text-xl sm:text-2xl text-[#4a607a]" role="group" aria-label="Temperature unit">
                  {['C', 'F'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => units.setUnit(u)}
                      aria-pressed={units.unit === u}
                      aria-label={u === 'C' ? 'Show Celsius' : 'Show Fahrenheit'}
                      className={`text-left leading-[inherit] cursor-pointer transition-colors ${units.unit === u ? 'text-[#0077b6]' : 'text-[#4a607a]/45 hover:text-[#4a607a]'}`}
                    >
                      °{u}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm font-semibold text-[#4a607a] mt-1">
                {weatherTitle} &bull; {displayCity}{displayCountry ? `, ${displayCountry}` : ''}
              </p>
            </div>
          </div>
          
          {/* flex gap-10 mobile pe 198px bahar nikal raha tha -> grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:flex lg:gap-10 text-xs sm:text-sm font-semibold text-[#4a607a] shrink-0">
            <div className="text-center">
              <span>Precipitation</span>
              <p className="text-xl sm:text-2xl font-bold text-[#0077b6] mt-1">{precip}%</p>
            </div>
            <div className="text-center">
              <span>Humidity</span>
              <p className="text-xl sm:text-2xl font-bold text-[#0077b6] mt-1">{humidity}%</p>
            </div>
            <div className="text-center">
              <span>Wind</span>
              <p className="text-xl sm:text-2xl font-bold text-[#0077b6] mt-1 flex items-baseline justify-center gap-1">
                {wind}{units.windUnit}
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-100 flex gap-6 sm:gap-8 text-sm font-bold text-[#4a607a] mb-6 sm:mb-8 overflow-x-auto">
          {navLinks.map((link) => (
            <button
              key={link}
              onClick={() => setActiveTab(link)}
              className={`relative min-h-11 py-3 shrink-0 transition-colors hover:text-[#0077b6] ${
                activeTab === link ? 'text-[#0077b6]' : ''
              }`}
            >
              {link}
              {activeTab === link && (
                <span className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-[#0077b6] rounded-t-md" />
              )}
            </button>
          ))}
        </div>

        <div className="relative h-32 sm:h-40 w-full mb-6 sm:mb-8">
          {!hasChart && (
            <div className="h-full flex items-center justify-center text-sm text-[#4a607a]">
              Hourly chart is not available right now.
            </div>
          )}
          {hasChart && (
          <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="curveGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={graphColor} stopOpacity="0.2" />
                <stop offset="100%" stopColor={graphColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`${pathData} L 350 100 L 50 100 Z`}
              fill="url(#curveGradient)"
            />
            <path
              d={pathData}
              fill="none"
              stroke={graphColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
            
            {dotPoints.map((point, index) => (
              <React.Fragment key={index}>
                <circle cx={point.x} cy={point.y} r="3" fill={graphColor} />
                <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize="6" fontWeight="bold" fill={graphColor}>{point.label}</text>
              </React.Fragment>
            ))}
          </svg>
          )}
        </div>

        <HourlyStrip hours={hourlyData} activeTab={activeTab} windUnit={units.windUnit} />
      </div>{/* end z-10 */}
      </div>
    </div>
  );
};

export default WeatherCard;
