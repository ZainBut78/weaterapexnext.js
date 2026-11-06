'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Award, Sun,
  CloudRain, MapPin, Globe,
  ShoppingBag, ChevronDown, Droplets, Sun as SunIcon, Footprints,
  Shirt, Backpack, X, Calendar, CalendarRange, Info
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchTripPlan, fetchCountryRecommend } from '@/services/weatherService';
import useCitySuggest from '@/hooks/useCitySuggest';
import { canonicalCityName, matchCities } from '@/utils/fuzzyCity';
import { canonicalCountryName, cityDisplayName, countryLabel } from '@/utils/placeLabel';
import {
  forecastWindow, inForecast, fmtShort, daysBetween,
} from '@/utils/forecastWindow';
import ForecastDayPicker from './ForecastDayPicker';
import CityNeededNotice from '@/components/CityNeededNotice';
import { formatDay } from './dayInsights';
import DayCard, { ScoreLegend } from './DayCard';
import FreeLimitNotice from '@/components/FreeLimitNotice';
import { useLang, useT } from '@/i18n/client';
import { apiErrorText } from '@/utils/apiErrors';

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
  const t = useT();
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
          <span className="text-slate-400 text-sm">{t('trip.noImage')}</span>
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
  const t = useT();
  const lang = useLang();
  const fs = (iso) => fmtShort(iso, lang);
  const [mode, setMode] = useState('city');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  // Tareekhon ki window (utils/forecastWindow — browser vs UTC vs
  // Open-Meteo ka hisaab wahan). Next.js: component pehle SERVER par bhi
  // banta hai (timezone alag) — is liye "aaj" browser mein useEffect mein.
  const [win, setWin] = useState(null);
  useEffect(() => {
    setWin(forecastWindow());
  }, []);
  // 'forecast' = 16 din ke chips (default) · 'estimate' = aage ki tareekhein,
  // 20 saal ke records se andaza (owner ka faisla — sirf city mode)
  const [rangeMode, setRangeMode] = useState('forecast');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searched, setSearched] = useState({ type: '', query: '', start: '', end: '' });
  const [selectedCitySlug, setSelectedCitySlug] = useState(null);
  const [countryQuery, setCountryQuery] = useState('');

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [formErrors, setFormErrors] = useState({});

  const isCityMode = mode === 'city';
  const isEstimate = isCityMode && rangeMode === 'estimate';

  // Suggestions: local fuzzy (160 cities, zero API) + API — debounce,
  // abort aur cache hook ke andar (UX fixes B4)
  const { items: suggestions, didYouMean } = useCitySuggest(city, { enabled: isCityMode });

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
    setCity(s.label || s.name);      // user ki zaban mein dikhe; bhejte waqt canonicalCityName → English
    setShowSuggestions(false);
    setHighlightIdx(-1);
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
  // "Max 20 days supported for now") — estimate mode mein yeh had wahi.
  const MAX_TRIP_DAYS = 20;

  // Window se bahar ki tareekh backend tak KABHI nahi jaati (UX fixes C).
  const validateForm = useCallback(() => {
    const errors = {};
    if (isCityMode && !city.trim()) errors.city = t('trip.err.city');
    if (!isCityMode && !country.trim()) errors.country = t('trip.err.country');
    // Taaza window — tab raat 12 ke paar khula rahe to purana "aaj" na chale
    const fresh = win ? forecastWindow() : null;
    if (fresh && fresh.end !== win.end) setWin(fresh);
    if (!fresh) {
      errors.dates = t('trip.err.wait');
    } else if (!isEstimate) {
      if (!startDate) errors.dates = t('trip.err.tapBoth');
      else if (!endDate) errors.dates = t('trip.err.tapLast');
      else if (!inForecast(fresh, startDate) || !inForecast(fresh, endDate) || endDate < startDate) {
        errors.dates = t('trip.err.outOfRange', { from: fs(fresh.start), to: fs(fresh.end) });
      }
    } else {
      if (!startDate) errors.startDate = t('trip.err.startDate');
      else if (startDate < fresh.start || startDate > fresh.estimateMax) {
        errors.startDate = t('trip.err.startRange', { from: fs(fresh.start), to: fs(fresh.estimateMax) });
      }
      if (!endDate) errors.endDate = t('trip.err.endDate');
      else if (startDate && endDate < startDate) errors.endDate = t('trip.err.endBeforeStart');
      else if (endDate < fresh.estimateFrom) {
        errors.endDate = t('trip.err.estimateFrom', { date: fs(fresh.estimateFrom) });
      } else if (endDate > fresh.estimateMax) {
        errors.endDate = t('trip.err.endMax', { date: fs(fresh.estimateMax) });
      } else if (startDate) {
        const days = daysBetween(startDate, endDate) + 1;
        if (days > MAX_TRIP_DAYS) {
          errors.endDate = t('trip.err.maxDays', { max: MAX_TRIP_DAYS, days });
        }
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [city, country, startDate, endDate, isCityMode, isEstimate, win, t, lang]);

  // Forecast <-> estimate badalne par purani tareekhein saaf (ek ki tareekh
  // doosre mein ghalat hoti hai)
  const switchRange = (next) => {
    setRangeMode(next);
    setStartDate('');
    setEndDate('');
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.dates; delete copy.startDate; delete copy.endDate;
      return copy;
    });
  };

  const switchMode = (next) => {
    setMode(next);
    setSelectedCitySlug(null);
    // Country mode sirf forecast — estimate ki tareekhein wahan nahi chaltin
    if (next === 'country' && rangeMode === 'estimate') switchRange('forecast');
  };

  const handlePlan = (e) => {
    e.preventDefault();
    setSelectedCitySlug(null);
    if (!validateForm()) return;
    // "東京" / "Londra" / "Munchen" → hamari list ka English naam (backend usi se chalta hai)
    const query = isCityMode ? canonicalCityName(city).toLowerCase() : canonicalCountryName(country);
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
  const freeLimit = ['free_limit_reached', 'user_daily_limit'].includes(error?.response?.data?.code);

  // Searched (pehle se validate shuda) tareekhein hi dobara — form mein
  // baad mein chhedi gayi tareekh bina check ke backend tak na jaye
  const pickSuggestedCity = (name) => {
    setMode('city');
    setSelectedCitySlug(null);
    setCity(name);
    setShowSuggestions(false);
    setSearched({ type: 'city', query: name.trim().toLowerCase(),
                  start: searched.start, end: searched.end });
  };

  const switchToCountryMode = () => {
    const place = error?.response?.data?.place || error?.response?.data?.country || '';
    setMode('country');
    setSelectedCitySlug(null);
    setCountry(place);
    // Country mode sirf forecast: estimate ki tareekhein ho to user chips se chune
    const forecastDates = win && inForecast(win, searched.start) && inForecast(win, searched.end);
    if (!forecastDates) {
      switchRange('forecast');
      return;
    }
    if (place) {
      setSearched({ type: 'country', query: place, start: searched.start, end: searched.end });
    }
  };

  // Shehar nahi mila (404) -> local "Did you mean" (UX fixes B4)
  const cityNotFound = searched.type === 'city' && error?.response?.status === 404;
  const notFoundMatches = cityNotFound ? matchCities(searched.query, { partial: false, limit: 3, lang }) : [];
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
            <button type="button" onClick={() => switchMode('city')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isCityMode ? 'bg-[#0077b6] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              <MapPin className="inline w-3.5 h-3.5 mr-1" /> {t('trip.byCity')}
            </button>
            <button type="button" onClick={() => switchMode('country')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                !isCityMode ? 'bg-[#0077b6] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              <Globe className="inline w-3.5 h-3.5 mr-1" /> {t('trip.byCountry')}
            </button>
          </div>

          {/* City upar, neeche tareekhein (chips poori chaurai lete hain),
              aakhir mein button — pehle teeno ek line mein the */}
          <div className="flex flex-col gap-5">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                {isCityMode ? t('trip.city') : t('trip.country')}
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
                      setShowSuggestions(true);
                      setHighlightIdx(-1);
                      clearError('city');
                    } else {
                      setCountry(e.target.value);
                      clearError('country');
                    }
                  }}
                  onKeyDown={isCityMode ? handleKeyDown : undefined}
                  onFocus={() => { if (isCityMode && suggestions.length > 0) setShowSuggestions(true); }}
                  placeholder={isCityMode ? t('trip.cityPlaceholder') : t('trip.countryPlaceholder')}
                  className={isCityMode ? inputClass('city') : inputClass('country')}
                  autoComplete="off"
                  {...(isCityMode ? {
                    role: 'combobox',
                    'aria-label': t('trip.city'),
                    'aria-autocomplete': 'list',
                    'aria-expanded': showSuggestions && suggestions.length > 0,
                    'aria-controls': 'trip-city-suggestions',
                    'aria-activedescendant': highlightIdx >= 0 ? `trip-city-opt-${highlightIdx}` : undefined,
                  } : {})}
                />
                {showSuggestions && isCityMode && suggestions.length > 0 && (
                  <ul
                    ref={dropdownRef}
                    id="trip-city-suggestions"
                    role="listbox"
                    aria-label={t('search.suggestions')}
                    className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto"
                  >
                    {didYouMean && (
                      <li role="presentation" className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-500">
                        {t('search.didYouMean')}
                      </li>
                    )}
                    {suggestions.map((s, i) => (
                      <li
                        key={s.slug || `${s.name}-${s.country}`}
                        id={`trip-city-opt-${i}`}
                        role="option"
                        aria-selected={i === highlightIdx}
                        onClick={() => selectSuggestion(s)}
                        onMouseEnter={() => setHighlightIdx(i)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                          i === highlightIdx ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-medium">{s.label || s.name}</span>
                        <span className="text-xs text-gray-400 ml-auto">{s.countryLabel || s.country}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {formErrors.city && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><X className="w-3 h-3" />{formErrors.city}</p>}
              {formErrors.country && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><X className="w-3 h-3" />{formErrors.country}</p>}
            </div>
            <div className="w-full">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-600">{t('trip.tripDates')}</span>
                {isEstimate ? (
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                    {t('trip.estimate')}
                  </span>
                ) : (
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                    {t('trip.liveForecast')}
                  </span>
                )}
              </div>

              {!isEstimate ? (
                <ForecastDayPicker
                  win={win}
                  start={startDate}
                  end={endDate}
                  invalid={!!formErrors.dates}
                  onChange={(s, e) => { setStartDate(s); setEndDate(e); clearError('dates'); }}
                />
              ) : (
                <>
                  <p className="flex items-start gap-2 text-sm font-semibold bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2 mb-3">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    {t('trip.estimateNote')}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="trip-est-start" className="block text-sm font-semibold text-gray-600 mb-1.5">{t('trip.startDate')}</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          id="trip-est-start"
                          type="date"
                          value={startDate}
                          onChange={(e) => { setStartDate(e.target.value); clearError('startDate'); }}
                          min={win?.start}
                          max={win?.estimateMax}
                          className={dateInputClass('startDate')}
                        />
                      </div>
                      {formErrors.startDate && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><X className="w-3 h-3" />{formErrors.startDate}</p>}
                    </div>
                    <div>
                      <label htmlFor="trip-est-end" className="block text-sm font-semibold text-gray-600 mb-1.5">{t('trip.endDate')}</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          id="trip-est-end"
                          type="date"
                          value={endDate}
                          onChange={(e) => { setEndDate(e.target.value); clearError('endDate'); }}
                          min={win ? (startDate > win.estimateFrom ? startDate : win.estimateFrom) : undefined}
                          max={win?.estimateMax}
                          className={dateInputClass('endDate')}
                        />
                      </div>
                      {formErrors.endDate && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><X className="w-3 h-3" />{formErrors.endDate}</p>}
                    </div>
                  </div>
                  {win && (
                    <p className="text-xs text-gray-500 mt-2">
                      {t('trip.estimateHint', { date: fs(win.estimateFrom) })}
                    </p>
                  )}
                </>
              )}

              {formErrors.dates && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><X className="w-3 h-3 shrink-0" />{formErrors.dates}</p>}

              {/* Aage ki tareekhein — sirf city mode (country mode sirf forecast) */}
              {isCityMode && (
                <button
                  type="button"
                  onClick={() => switchRange(isEstimate ? 'forecast' : 'estimate')}
                  className="mt-2 inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-[#0077b6] hover:underline"
                >
                  <CalendarRange className="w-4 h-4" />
                  {isEstimate ? t('trip.backToForecast') : t('trip.furtherAhead')}
                </button>
              )}
            </div>
            <button
              type="submit"
              className="w-full md:w-auto md:self-end px-8 py-2.5 bg-[#0077b6] hover:bg-[#005f8f] text-white font-semibold rounded-lg transition-colors shadow-sm"
            >
              {isCityMode ? t('trip.planTrip') : t('trip.exploreCountry')}
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
            {cityNotFound ? (
              <>
                <p className="text-red-600 font-semibold">
                  {t('weather.notFound', { query: searched.query })}
                  {notFoundMatches.length > 0 && ` ${t('weather.didYouMean')}`}
                </p>
                {notFoundMatches.length > 0 ? (
                  <p className="mt-2 flex flex-wrap justify-center items-center gap-x-2 gap-y-1">
                    {notFoundMatches.map((m, i) => (
                      <span key={m.slug} className="inline-flex items-center gap-2">
                        {i > 0 && <span className="text-red-300" aria-hidden="true">·</span>}
                        <button
                          type="button"
                          onClick={() => pickSuggestedCity(m.name)}
                          className="min-h-11 px-2 font-bold text-[#0077b6] hover:underline"
                        >
                          {m.label}, {countryLabel(m.country, lang)}
                        </button>
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="text-red-400 text-sm mt-1">{t('weather.checkSpelling')}</p>
                )}
              </>
            ) : (
              <>
                <p className="text-red-600 font-semibold">{t('trip.fetchFailed')}</p>
                <p className="text-red-400 text-sm mt-1">
                  {apiErrorText(error, { t, lang, english: error.response?.data?.detail || error.response?.data?.error || error.message })}
                </p>
              </>
            )}
          </div>
        )}

        {!data && !isLoading && !error && !needsCity && !freeLimit && (
          <div className="text-center py-20">
            <Sun className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400">{t('trip.emptyTitle')}</h2>
            <p className="text-gray-400 mt-1">{t('trip.emptyText')}</p>
          </div>
        )}

        {data && 'cities' in data && !isLoading && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 px-1">
              <Globe className="w-5 h-5 text-[#0077b6]" />
              <h2 className="text-xl font-bold text-[#002244]">{t('trip.citiesIn', { country: countryLabel(data.country, lang) })}</h2>
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
                    alt={cityDisplayName(c.city, lang)}
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
                        {cityDisplayName(c.city, lang)}
                      </h3>
                      <p className="text-xs font-semibold text-white/70 mt-0.5 truncate">{countryLabel(c.country, lang)}</p>
                      <span className="inline-block mt-2 text-xs font-bold text-white/0 group-hover:text-white/90 transition-colors">
                        {t('trip.viewDetails')}
                      </span>
                    </div>
                    <ScoreRing score={c.average_score} size="sm" />
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">{t('trip.clickCity')}</p>
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
              {t('trip.backToCities')}
            </button>
            <CityResult data={tripData} typed={searched.query} />
          </div>
        )}

        {showCityResult && !isLoading && !selectedCitySlug && tripData && (
          <CityResult data={tripData} typed={searched.query} />
        )}
      </div>
  );
}

function PackingCard({ item }) {
  const t = useT();
  const catMap = {
    rain: { icon: Droplets, bg: 'bg-blue-50', iconColor: 'text-blue-500', pill: 'bg-blue-100 text-blue-700', tag: t('trip.packing.rain') },
    sun: { icon: SunIcon, bg: 'bg-orange-50', iconColor: 'text-orange-500', pill: 'bg-orange-100 text-orange-700', tag: t('trip.packing.sun') },
    activity: { icon: Footprints, bg: 'bg-green-50', iconColor: 'text-green-500', pill: 'bg-green-100 text-green-700', tag: t('trip.packing.activity') },
    clothing: { icon: Shirt, bg: 'bg-purple-50', iconColor: 'text-purple-500', pill: 'bg-purple-100 text-purple-700', tag: t('trip.packing.clothing') },
    gear: { icon: Backpack, bg: 'bg-teal-50', iconColor: 'text-teal-500', pill: 'bg-teal-100 text-teal-700', tag: t('trip.packing.gear') },
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
          {t('trip.shopAmazon')}
        </a>
      </div>
    </div>
  );
}

function CityResult({ data, typed }) {
  const t = useT();
  const lang = useLang();
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
          alt={cityDisplayName(data.city, lang, typed)}
          overlay
          className="h-64 sm:h-80 lg:h-[26rem]"
        />

        {/* Neeche se upar gehra hota gradient — text har tasveer par parha jaye */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#001528]/92 via-[#001528]/45 to-[#001528]/5 pointer-events-none" />

        {/* Forecast / historical ka pill — upar bayein */}
        <div className="absolute top-4 left-4 sm:top-5 sm:left-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-white/25">
            {data.data_source === 'forecast' ? t('trip.liveForecast') : t('trip.historicalEstimate')}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 lg:p-8">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-sm leading-tight">
                {cityDisplayName(data.city, lang, typed)}
              </h2>
              <p className="text-sm sm:text-base font-semibold text-white/80 mt-0.5">
                {countryLabel(data.country, lang)}
              </p>
              <p className="inline-flex items-center gap-2 mt-3 text-xs sm:text-sm font-semibold text-white/90">
                <CalendarRange className="w-4 h-4 shrink-0" />
                {data.start_date} → {data.end_date}
              </p>
            </div>

            <div className="text-center shrink-0">
              <ScoreRing score={data.overall_score} />
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mt-2">
                {t('trip.overall')}
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
          <span className="font-semibold text-green-700">{t('trip.bestDay')}</span>
          <span className="text-green-600">{data.best_day ? formatDay(data.best_day, lang).long : t('trip.na')}</span>
        </div>
        {data.worst_day && (
          // "Worst Day" (laal) → "Least ideal" (audit N3 — kam manfi)
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
            <CloudRain className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-amber-800">{t('trip.leastIdeal')}</span>
            <span className="text-amber-700">{formatDay(data.worst_day, lang).long}</span>
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
            <h3 className="text-lg font-bold text-[#002244]">{t('trip.packingTitle')}</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">{t('trip.packingText', { city: cityDisplayName(data.city, lang, typed) })}</p>
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
              {showAllPacking ? t('trip.showLess') : t('trip.viewMore')}
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