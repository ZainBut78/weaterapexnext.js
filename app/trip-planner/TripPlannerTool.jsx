'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Award, Sun,
  CloudRain, MapPin, Globe,
  ShoppingBag, ChevronDown, Droplets, Sun as SunIcon, Footprints,
  Shirt, Backpack, X, Calendar, CalendarRange
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchTripPlan, fetchCountryRecommend, fetchCitySuggestions } from '@/services/weatherService';
import CityNeededNotice from '@/components/CityNeededNotice';
import { formatDay } from './dayInsights';
import DayCard, { ScoreLegend } from './DayCard';
import FreeLimitNotice from '@/components/FreeLimitNotice';

// ACTIVITY_META ab dayInsights.js mein (DayCard.jsx bhi use karta hai)

// Purana getActivitySuggestion hata diya (audit N3): woh backend ki activity
// se alag hisaab lagata tha aur takrata tha. Ab dayInsights.js (activityReason).

// getScoreColor hata diya — score ab tasveer ke UPAR ScoreRing mein
// dikhta hai (safed text + rang ki ring), to yeh light-background wale
// classes kisi jagah use nahi hote the.


// City ki tasveer.
//
// `overlay` mode mein is ke UPAR text aata hai (city ka naam, score),
// is liye do cheezein badalti hain:
//   * image na ho to bhaira slate-grey ke bajaye brand ka gradient —
//     safed text us par bhi saaf parha jata hai
//   * "No image available" wala text nahi dikhta (overlay khud bharpoor
//     hai, aur khaali dabbe se behtar lagta hai)
function CityImage({ src, alt, className, overlay = false }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const missing = !src || error;

  return (
    <div
      className={`relative w-full overflow-hidden ${
        missing && overlay
          ? 'bg-gradient-to-br from-[#0077b6] via-[#005a8d] to-[#002244]'
          : 'bg-slate-200'
      } ${className || 'h-36 sm:h-44'}`}
    >
      {!loaded && !missing && (
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]" />
      )}
      {missing && !overlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <span className="text-slate-400 text-sm">No image available</span>
        </div>
      )}
      {src && !error && (
        <img loading="lazy" decoding="async"
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`block w-full h-full object-cover object-center transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}

// Score ka gol badge — image ke upar bhi parha ja sake, is liye frosted
// background aur rang ki ring.
function ScoreRing({ score, size = 'lg' }) {
  const value = Number.isFinite(Number(score)) ? Number(score) : null;
  const ring =
    value === null ? 'ring-white/40'
      : value >= 9 ? 'ring-emerald-400'
      : value >= 7 ? 'ring-sky-400'
      : value >= 4 ? 'ring-amber-400'
      : 'ring-rose-400';
  const box = size === 'sm' ? 'w-14 h-14' : 'w-20 h-20 sm:w-24 sm:h-24';
  const num = size === 'sm' ? 'text-lg' : 'text-2xl sm:text-3xl';

  return (
    <div
      className={`${box} shrink-0 rounded-full bg-white/15 backdrop-blur-md ring-2 ${ring}
                  flex flex-col items-center justify-center text-white shadow-lg`}
    >
      <span className={`${num} font-extrabold leading-none`}>
        {value === null ? '—' : value}
      </span>
      <span className="text-[10px] font-semibold tracking-wider text-white/75 mt-0.5">
        / 10
      </span>
    </div>
  );
}

// Purana chhota DayCard hata diya — ab ./DayCard.jsx (owner, round 3 N3 option 2)

// Server page (page.js) heading/intro `intro` prop mein bhejta hai —
// woh HTML server par banta hai (Google ke liye). Form, suggestions,
// API calls aur results yahan browser mein chalte hain.
function TripPlannerTool({ intro }) {
  const [mode, setMode] = useState('city');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  // Local date. toISOString() UTC deta hai, jis se UTC+5 mein raat 12 se
  // subah 5 baje tak "aaj" ki tareekh bhi past lagti hai.
  //
  // Next.js: component pehle SERVER par bhi banta hai (timezone alag ho
  // sakta hai) — is liye "aaj" browser mein useEffect ke andar.
  const [todayStr, setTodayStr] = useState('');
  useEffect(() => {
    const d = new Date();
    setTodayStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }, []);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searched, setSearched] = useState({ type: '', query: '', start: '', end: '' });
  const [selectedCitySlug, setSelectedCitySlug] = useState(null);
  const [countryQuery, setCountryQuery] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [formErrors, setFormErrors] = useState({});

  const isCityMode = mode === 'city';

  const { data: tripData, isLoading: tripLoading, error: tripError } = useQuery({
    queryKey: ['tripPlan', searched.query, searched.start, searched.end],
    queryFn: () => fetchTripPlan(searched.query, searched.start, searched.end),
    enabled: searched.type === 'city' && !!searched.query && !!searched.start && !!searched.end,
    retry: false,
  });

  const { data: countryData, isLoading: countryLoading, error: countryError } = useQuery({
    queryKey: ['countryRecommend', searched.query, searched.start, searched.end],
    queryFn: () => fetchCountryRecommend(searched.query, searched.start, searched.end),
    enabled: searched.type === 'country' && !!searched.query && !!searched.start && !!searched.end && !selectedCitySlug,
    retry: false,
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!isCityMode || city.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetchCitySuggestions(city.trim());
        setSuggestions(res.results || []);
        setShowSuggestions(res.results?.length > 0);
        setHighlightIdx(-1);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [city, isCityMode]);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectSuggestion = (s) => {
    setCity(s.name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightIdx]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Backend 20 din se zyada ki trip support nahi karta (trip_planner ka
  // "Max 20 days supported for now"). Pehle user 3 mahine ki dates de kar
  // submit kar deta tha aur seedha 400 error aata tha. Ab pehle yahin
  // saaf message.
  const MAX_TRIP_DAYS = 20;

  const validateForm = useCallback(() => {
    const errors = {};
    if (isCityMode && !city.trim()) errors.city = 'Please enter a city name';
    if (!isCityMode && !country.trim()) errors.country = 'Please enter a country name';
    if (!startDate) errors.startDate = 'Please select a start date';
    if (!endDate) errors.endDate = 'Please select an end date';
    if (startDate && endDate) {
      if (endDate < startDate) {
        errors.endDate = 'End date must be on or after the start date';
      } else {
        const days =
          Math.round(
            (new Date(`${endDate}T00:00:00`) - new Date(`${startDate}T00:00:00`)) / 86400000
          ) + 1;
        if (days > MAX_TRIP_DAYS) {
          errors.endDate = `Trips up to ${MAX_TRIP_DAYS} days are supported (you selected ${days})`;
        }
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [city, country, startDate, endDate, isCityMode]);

  const handlePlan = (e) => {
    e.preventDefault();
    setSelectedCitySlug(null);
    if (!validateForm()) return;
    const query = isCityMode ? city.trim().toLowerCase() : country.trim();
    setSearched({ type: isCityMode ? 'city' : 'country', query, start: startDate, end: endDate });
  };

  const clearError = (field) => {
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const handleSelectCity = (slug) => {
    setSelectedCitySlug(slug);
    setCountryQuery(searched.query);
    setSearched({ type: 'city', query: slug, start: searched.start, end: searched.end });
  };

  const isShowingCountry = searched.type === 'country' && !selectedCitySlug;
  const data = selectedCitySlug ? tripData : (isShowingCountry ? countryData : tripData);
  const isLoading = selectedCitySlug ? tripLoading : (isShowingCountry ? countryLoading : tripLoading);
  const error = selectedCitySlug ? tripError : (isShowingCountry ? countryError : tripError);

  // Backend ne bataya ke user ne shehar ki jagah mulk/soobа likh diya.
  // Isay laal "error" banane ka koi faida nahi — user ko rasta dena hai.
  const errKind = error?.response?.data?.kind;
  const needsCity = errKind === 'country' || errKind === 'region';
  const freeLimit = error?.response?.data?.code === 'free_limit_reached';

  const pickSuggestedCity = (name) => {
    setMode('city');
    setSelectedCitySlug(null);
    setCity(name);
    setSearched({ type: 'city', query: name.trim().toLowerCase(),
                  start: startDate, end: endDate });
  };

  const switchToCountryMode = () => {
    const place = error?.response?.data?.place || error?.response?.data?.country || '';
    setMode('country');
    setSelectedCitySlug(null);
    setCountry(place);
    if (place) {
      setSearched({ type: 'country', query: place, start: startDate, end: endDate });
    }
  };
  const showCityResult = data && 'days' in (data || {});

  const inputClass = (field) =>
    `w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-colors ${
      formErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'
    }`;

  const dateInputClass = (field) =>
    `w-full pl-10 pr-3 py-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-colors ${
      formErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'
    }`;

  return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        {intro}

        <form onSubmit={handlePlan} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8" noValidate>
          <div className="flex gap-2 mb-5">
            <button type="button" onClick={() => { setMode('city'); setSelectedCitySlug(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isCityMode ? 'bg-[#0077b6] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              <MapPin className="inline w-3.5 h-3.5 mr-1" /> Search by City
            </button>
            <button type="button" onClick={() => { setMode('country'); setSelectedCitySlug(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                !isCityMode ? 'bg-[#0077b6] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              <Globe className="inline w-3.5 h-3.5 mr-1" /> Search by Country
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                {isCityMode ? 'City' : 'Country'}
              </label>
              <div className="relative">
                {isCityMode ? (
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                ) : (
                  <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={isCityMode ? city : country}
                  onChange={(e) => {
                    if (isCityMode) {
                      setCity(e.target.value);
                      clearError('city');
                    } else {
                      setCountry(e.target.value);
                      clearError('country');
                    }
                  }}
                  onKeyDown={isCityMode ? handleKeyDown : undefined}
                  onFocus={() => { if (isCityMode && suggestions.length > 0) setShowSuggestions(true); }}
                  placeholder={isCityMode ? 'e.g. London, Tokyo, Dubai' : 'e.g. Spain, Italy, Japan'}
                  className={isCityMode ? inputClass('city') : inputClass('country')}
                  autoComplete="off"
                />
                {showSuggestions && isCityMode && (
                  <ul
                    ref={dropdownRef}
                    className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto"
                  >
                    {suggestions.map((s, i) => (
                      <li
                        key={s.slug}
                        onClick={() => selectSuggestion(s)}
                        onMouseEnter={() => setHighlightIdx(i)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                          i === highlightIdx ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-gray-400 ml-auto">{s.country}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {formErrors.city && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><X className="w-3 h-3" />{formErrors.city}</p>}
              {formErrors.country && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><X className="w-3 h-3" />{formErrors.country}</p>}
            </div>
            <div className="w-full md:w-44">
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); clearError('startDate'); }}
                  min={todayStr}
                  className={dateInputClass('startDate')}
                />
              </div>
              {formErrors.startDate && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><X className="w-3 h-3" />{formErrors.startDate}</p>}
            </div>
            <div className="w-full md:w-44">
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); clearError('endDate'); }}
                  min={startDate || todayStr}
                  className={dateInputClass('endDate')}
                />
              </div>
              {formErrors.endDate && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><X className="w-3 h-3" />{formErrors.endDate}</p>}
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-8 py-2.5 bg-[#0077b6] hover:bg-[#005f8f] text-white font-semibold rounded-lg transition-colors shadow-sm mt-[26px]"
            >
              {isCityMode ? 'Plan Trip' : 'Explore Country'}
            </button>
          </div>
        </form>

        {isLoading && (
          <div className="py-8">
            <TripPlannerSkeleton isCountry={isShowingCountry} />
          </div>
        )}

        {needsCity && (
          <CityNeededNotice
            data={error.response.data}
            onPickCity={pickSuggestedCity}
            onSwitchToCountryMode={
              error.response.data.try_country_mode ? switchToCountryMode : undefined
            }
          />
        )}

        {freeLimit && <FreeLimitNotice data={error.response.data} />}

        {error && !needsCity && !freeLimit && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <CloudRain className="w-10 h-10 text-red-400 mx-auto mb-2" />
            <p className="text-red-600 font-semibold">Could not fetch data</p>
            <p className="text-red-400 text-sm mt-1">
              {error.response?.data?.detail || error.response?.data?.error || error.message}
            </p>
          </div>
        )}

        {!data && !isLoading && !error && !needsCity && !freeLimit && (
          <div className="text-center py-20">
            <Sun className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400">Plan Your Trip</h3>
            <p className="text-gray-400 mt-1">Search by city to get per-day scores, or by country to compare cities</p>
          </div>
        )}

        {data && 'cities' in data && !isLoading && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 px-1">
              <Globe className="w-5 h-5 text-[#0077b6]" />
              <h2 className="text-xl font-bold text-[#002244]">Cities in {data.country}</h2>
              <span className="text-sm text-gray-400 ml-auto">{data.start} → {data.end}</span>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {data.cities.map((c, idx) => (
                <button
                  key={c.slug}
                  onClick={() => handleSelectCity(c.slug)}
                  className="relative rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all text-left group"
                >
                  {/* Hero ke jaisa hi andaz — tasveer par naam aur score */}
                  <CityImage
                    src={c.image_url}
                    alt={c.city}
                    overlay
                    className="h-48 sm:h-56"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#001528]/92 via-[#001528]/40 to-[#001528]/5 pointer-events-none" />

                  {/* Rank — upar bayein */}
                  <span className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/25 flex items-center justify-center text-sm font-extrabold text-white">
                    {idx + 1}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight truncate">
                        {c.city}
                      </h3>
                      <p className="text-xs font-semibold text-white/70 mt-0.5 truncate">{c.country}</p>
                      <span className="inline-block mt-2 text-xs font-bold text-white/0 group-hover:text-white/90 transition-colors">
                        View details →
                      </span>
                    </div>
                    <ScoreRing score={c.average_score} size="sm" />
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">Click any city to see its detailed day-by-day trip plan</p>
          </div>
        )}

        {showCityResult && !isLoading && selectedCitySlug && tripData && (
          <div className="space-y-6">
            <button
              onClick={() => {
                setSelectedCitySlug(null);
                setSearched({ type: 'country', query: countryQuery, start: searched.start, end: searched.end });
              }}
              className="text-sm text-[#0077b6] hover:underline font-semibold"
            >
              ← Back to all cities
            </button>
            <CityResult data={tripData} />
          </div>
        )}

        {showCityResult && !isLoading && !selectedCitySlug && tripData && (
          <CityResult data={tripData} />
        )}
      </div>
  );
}

function PackingCard({ item }) {
  const catMap = {
    rain: { icon: Droplets, bg: 'bg-blue-50', iconColor: 'text-blue-500', pill: 'bg-blue-100 text-blue-700', tag: 'Rain Expected' },
    sun: { icon: SunIcon, bg: 'bg-orange-50', iconColor: 'text-orange-500', pill: 'bg-orange-100 text-orange-700', tag: 'High UV / Heat' },
    activity: { icon: Footprints, bg: 'bg-green-50', iconColor: 'text-green-500', pill: 'bg-green-100 text-green-700', tag: 'Outdoor Activity' },
    clothing: { icon: Shirt, bg: 'bg-purple-50', iconColor: 'text-purple-500', pill: 'bg-purple-100 text-purple-700', tag: 'Clothing' },
    gear: { icon: Backpack, bg: 'bg-teal-50', iconColor: 'text-teal-500', pill: 'bg-teal-100 text-teal-700', tag: 'Essential Gear' },
  };
  const nameLower = item.item.toLowerCase();
  let cat = catMap.gear;
  if (nameLower.includes('rain') || nameLower.includes('umbrella') || nameLower.includes('jacket')) cat = catMap.rain;
  else if (nameLower.includes('sun') || nameLower.includes('sunblock') || nameLower.includes('hat') || nameLower.includes('uv')) cat = catMap.sun;
  else if (nameLower.includes('hiking') || nameLower.includes('trekking') || nameLower.includes('daypack') || nameLower.includes('walking')) cat = catMap.activity;
  else if (nameLower.includes('shirt') || nameLower.includes('jacket') || nameLower.includes('scarf') || nameLower.includes('fleece')) cat = catMap.clothing;

  const Icon = cat.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="h-40 bg-white p-3 flex items-center justify-center">
        {item.image_url ? (
          <img loading="lazy" decoding="async"
            src={item.image_url}
            alt={item.item}
            className="w-full h-32 object-contain rounded-lg"
            onError={(e) => { e.currentTarget.src = '/placeholder-product.svg'; }}
          />
        ) : (
          <div className={`w-full h-32 rounded-lg ${cat.bg} flex items-center justify-center`}>
            <Icon className={`w-10 h-10 ${cat.iconColor}`} />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cat.pill}`}>
            {cat.tag}
          </span>
          {item.price_display && (
            <span className="text-sm font-extrabold text-[#002244]">{item.price_display}</span>
          )}
        </div>
        <h4 className="text-base font-bold text-[#002244] mb-1">{item.item}</h4>
        <p className="text-sm text-gray-500 leading-snug line-clamp-2 mb-4">{item.reason}</p>
        <a
          href={item.affiliate_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto w-full block text-center py-2 bg-[#0077b6] hover:bg-[#0092cd] rounded-lg text-sm font-semibold text-white transition-colors"
        >
          Shop on Amazon
        </a>
      </div>
    </div>
  );
}

function CityResult({ data }) {
  const [showAllPacking, setShowAllPacking] = useState(false);
  const products = data?.packing_suggestions || [];
  const visibleProducts = showAllPacking ? products : products.slice(0, 3);

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* HERO — pehle tasveer ek patli patti thi (h-48) aur us ke
          neeche alag safed dabbe mein naam/score. Dono alag alag lagte
          the aur tasveer bekar chaurai mein phaili hui dikhti thi.
          Ab tasveer khud card hai: uske upar gradient, us par naam aur
          score. Height bhi screen ke sath barhti hai. */}
      <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-200">
        <CityImage
          src={data.image_url}
          alt={data.city}
          overlay
          className="h-64 sm:h-80 lg:h-[26rem]"
        />

        {/* Neeche se upar gehra hota gradient — text har tasveer par parha jaye */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#001528]/92 via-[#001528]/45 to-[#001528]/5 pointer-events-none" />

        {/* Forecast / historical ka pill — upar bayein */}
        <div className="absolute top-4 left-4 sm:top-5 sm:left-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-white/25">
            {data.data_source === 'forecast' ? 'Live forecast' : 'Historical estimate'}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 lg:p-8">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-sm leading-tight">
                {data.city}
              </h2>
              <p className="text-sm sm:text-base font-semibold text-white/80 mt-0.5">
                {data.country}
              </p>
              <p className="inline-flex items-center gap-2 mt-3 text-xs sm:text-sm font-semibold text-white/90">
                <CalendarRange className="w-4 h-4 shrink-0" />
                {data.start_date} → {data.end_date}
              </p>
            </div>

            <div className="text-center shrink-0">
              <ScoreRing score={data.overall_score} />
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mt-2">
                Overall
              </p>
            </div>
          </div>
        </div>
      </div>

      {data.note && (
        <p className="text-sm text-gray-500 italic px-1">{data.note}</p>
      )}

      <div className="flex flex-col md:flex-row gap-3 text-sm">
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
          <Award className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-green-700">Best Day:</span>
          <span className="text-green-600">{data.best_day ? formatDay(data.best_day).long : 'N/A'}</span>
        </div>
        {data.worst_day && (
          // "Worst Day" (laal) → "Least ideal" (audit N3 — kam manfi)
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
            <CloudRain className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-amber-800">Least ideal:</span>
            <span className="text-amber-700">{formatDay(data.worst_day).long}</span>
          </div>
        )}
      </div>

      <div>
      {/* Score ka matlab — rang + lafz (audit N3) */}
      <ScoreLegend />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.days.map((day) => (
          <DayCard
            key={day.date}
            day={day}
            isBest={day.date === data.best_day}
            isWorst={day.date === data.worst_day}
          />
        ))}
      </div>
      </div>

      {products.length > 0 && (
        <div className="bg-[#EFF6FF] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-5 h-5 text-[#0077b6]" />
            <h3 className="text-lg font-bold text-[#002244]">Packing Recommendations</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">Curated gear for your predicted weather conditions in {data.city}.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((item, idx) => (
              <PackingCard key={idx} item={item} />
            ))}
          </div>
          {products.length > 3 && (
            <button
              onClick={() => setShowAllPacking(!showAllPacking)}
              className="mx-auto flex items-center gap-2 text-[#0077b6] font-semibold text-sm hover:text-blue-700 mt-6 transition-colors"
            >
              {showAllPacking ? 'Show Less' : 'View More Products'}
              <ChevronDown size={16} className={`transition-transform ${showAllPacking ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SkeletonBlock({ className }) {
  return (
    <div
      className={`relative overflow-hidden animate-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] ${className}`}
    />
  );
}

function TripPlannerSkeleton({ isCountry }) {
  if (isCountry) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <SkeletonBlock className="w-6 h-6 rounded-lg" />
          <SkeletonBlock className="h-5 w-52 rounded-lg" />
          <SkeletonBlock className="h-4 w-24 rounded-lg ml-auto" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <SkeletonBlock className="h-36 sm:h-44 w-full" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <SkeletonBlock className="h-5 w-24 rounded-lg" />
                  <SkeletonBlock className="h-8 w-14 rounded-lg" />
                </div>
                <SkeletonBlock className="h-3 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <SkeletonBlock className="h-48 sm:h-56 w-full" />
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <SkeletonBlock className="h-7 w-48 rounded-lg" />
              <SkeletonBlock className="h-4 w-36 rounded-lg" />
            </div>
            <SkeletonBlock className="h-10 w-24 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <SkeletonBlock className="h-11 w-full md:w-64 rounded-lg" />
        <SkeletonBlock className="h-11 w-full md:w-64 rounded-lg" />
      </div>

      {/* Naye DayCard (option 2) jaisa grid aur size */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 min-h-[380px]">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-4 w-24 rounded-lg" />
              <SkeletonBlock className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-10 w-24 rounded-lg" />
              <SkeletonBlock className="h-16 w-16 rounded-full" />
            </div>
            <SkeletonBlock className="h-28 w-full rounded-xl" />
            <SkeletonBlock className="h-6 w-2/3 rounded-full" />
            <SkeletonBlock className="h-4 w-full rounded-lg" />
          </div>
        ))}
      </div>

      <div className="bg-[#EFF6FF] rounded-2xl p-6">
        <SkeletonBlock className="h-5 w-48 rounded-lg mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <SkeletonBlock className="w-12 h-12 rounded-xl" />
              <SkeletonBlock className="h-5 w-3/4 rounded-lg" />
              <SkeletonBlock className="h-3 w-full rounded-lg" />
              <SkeletonBlock className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TripPlannerTool;