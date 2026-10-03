'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import EventSearchForm from '@/components/events/EventSearchForm';
import RiskResult from '@/components/events/RiskResult';
import TimelineAnalysis from '@/components/events/TimelineAnalysis';
import NearbyDatesComparison from '@/components/events/NearbyDatesComparison';
import CityNeededNotice from '@/components/CityNeededNotice';
import FreeLimitNotice from '@/components/FreeLimitNotice';
import { fetchEventRisk } from '@/services/weatherService';

// Pehle yahan yeh do functions the, jo rain probability se weather code
// KHUD BANA lete the kyunke backend asli code nahi bhejta tha:
//
//     hourCodeFor = rain > 60 ? 61 : rain > 30 ? 51 : 0
//     dayCodeFor  = rain > 50 ? 61 : rain > 20 ? 2  : 0
//
// Yeh bharosay ka masla tha. "Barish ka 35% imkaan" ka matlab yeh nahi
// ke barish HO rahi hai — magar hum boondaback ka icon dikha dete the.
// Aur ulta bhi: asli toofan jis ka imkaan 20% ho, us par SURAJ dikhta
// tha. Barf to kabhi dikh hi nahi sakti thi, kyunke yeh formula barf ka
// koi code paida hi nahi karta.
//
// Ab backend Open-Meteo ka ASLI weather_code bhejta hai (woh pehle bhi
// fetch ho raha tha, sirf response mein shamil nahi tha). Code na aaye
// to undefined jata hai — frontend phir neutral icon dikhata hai,
// jhoota suraj nahi.

const formatDateTimeLabel = (data) => {
  const d = new Date(data.event_date + 'T00:00:00');
  const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = data.event_time || data.best_time;
  if (!timeStr) return dateStr;
  const [h, m] = timeStr.split(':').map(Number);
  const dt = new Date(2000, 0, 1, h, m);
  const timeLabel = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dateStr} at ${timeLabel}`;
};

const buildTimelineHours = (breakdown) => {
  if (!breakdown || !breakdown.length) return [];
  const bestScore = Math.min(...breakdown.map((b) => b.risk_score));
  return breakdown.map((b) => {
    const h12 = b.hour % 12 === 0 ? 12 : b.hour % 12;
    return {
      hour: `${h12} ${b.hour >= 12 ? 'PM' : 'AM'}`,
      hour24: b.hour,
      weather_code: b.weather_code,
      is_day: b.is_day,
      score: b.risk_score,
      best: b.risk_score === bestScore,
    };
  });
};

const buildDatesComparison = (data) => {
  const eventDate = new Date(data.event_date + 'T00:00:00');
  const labelFor = (d, isSelected) => {
    const dd = new Date(d + 'T00:00:00');
    const diff = Math.round((dd - eventDate) / 86400000);
    if (isSelected) return `${dd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (Selected)`;
    if (diff === 1) return `Tomorrow, ${dd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    return dd.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const cards = [];
  cards.push({
    label: labelFor(data.event_date, true),
    score: data.risk_score,
    temp: data.temperature_c,
    rain: data.rain_probability,
    weather_code: data.weather_code,
    selected: true,
  });

  (data.alternate_dates || []).forEach((alt) => {
    cards.push({
      label: labelFor(alt.date, false),
      score: alt.risk_score,
      temp: alt.temperature_c,
      rain: alt.rain_probability,
      weather_code: alt.weather_code,
      better: alt.risk_score < data.risk_score,
      worse: alt.risk_score > data.risk_score,
    });
  });

  const bestScore = Math.min(...cards.map((c) => c.score));
  cards.forEach((c) => { c.best = c.score === bestScore; });

  return cards;
};

// Server page (page.js) heading/intro text `intro` prop mein bhejta hai —
// woh HTML server par hi banta hai (Google ke liye). Form aur results
// yahan browser mein chalte hain.
const EventRiskTool = ({ intro }) => {
  const [searched, setSearched] = useState(null);
  const formRef = useRef(null);

  // "Edit Details" button ka koi onClick hi nahi tha — click par kuch nahi
  // hota tha. Form isi page par upar maujood hai, is liye wahan scroll.
  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['eventRisk', searched],
    queryFn: () => fetchEventRisk(searched),
    enabled: !!searched,
    retry: false,
  });

  const handleSearch = (formData) => {
    const time = formData.time ? formData.time.split(':')[0] : null;
    setSearched({ city: formData.city, date: formData.date, type: formData.eventType, time });
  };

  const riskResultData = data && {
    eventType: data.event_type,
    city: `${data.city}, ${data.country}`,
    dateTimeLabel: formatDateTimeLabel(data),
    riskScore: data.risk_score,
    riskLevel: data.risk_level,
    rainProbability: data.rain_probability,
    windKmh: data.wind_kmh,
    temperatureC: data.temperature_c,
    humidityPct: data.humidity_pct,
    recommendation: data.recommendation,
    warning: data.day_context?.warning,
  };

  const hoursData = data ? buildTimelineHours(data.hourly_breakdown) : null;
  const bestWindow = data?.best_window ? {
    startHour: parseInt(data.best_window.start_time.split(':')[0], 10),
    endHour: parseInt(data.best_window.end_time.split(':')[0], 10),
  } : null;
  const datesData = data ? buildDatesComparison(data) : null;

  // Backend ne bataya ke yeh shehar nahi, mulk/soobа hai
  const errKind = error?.response?.data?.kind;
  const needsCity = errKind === 'country' || errKind === 'region';
  // Free calls khatam — yeh "error" nahi, signup ki dawat hai
  const freeLimit = error?.response?.data?.code === 'free_limit_reached';

  return (
    <>
      <div className="bg-gradient-to-b from-white to-blue-50 py-12 px-4">
        {intro}

        <div ref={formRef} className="scroll-mt-4">
          <EventSearchForm onSubmit={handleSearch} />
        </div>
      </div>

      {isLoading && (
        <div className="py-16 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Analyzing weather for your event...</p>
        </div>
      )}

      {/* Mulk/soobа ka naam — is ka apna khaas jawab hai, kyunke
          isay "error" ki tarah dikhana user ko koi rasta nahi deta.
          Uske bajaye usi mulk ke shehar click karne ke liye. */}
      {needsCity && (
        <div className="py-10 px-4">
          <CityNeededNotice
            data={error.response.data}
            onPickCity={(name) => setSearched((prev) => ({ ...prev, city: name }))}
          />
        </div>
      )}

      {freeLimit && (
        <div className="py-10 px-4">
          <FreeLimitNotice data={error.response.data} />
        </div>
      )}

      {error && !needsCity && !freeLimit && (
        <div className="py-10 px-4">
          <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-semibold">Could not fetch risk data</p>
            <p className="text-red-400 text-sm mt-1">
              {error.response?.data?.detail || error.response?.data?.error || error.message}
            </p>
          </div>
        </div>
      )}

      {data && (
        <div className="py-10 px-4 space-y-8">
          <RiskResult data={riskResultData} onEdit={scrollToForm} />
          {!searched.time && hoursData && hoursData.length > 0 && (
            <TimelineAnalysis hours={hoursData} window={bestWindow} />
          )}
          {datesData && datesData.length > 0 && (
            <NearbyDatesComparison dates={datesData} />
          )}
        </div>
      )}

    </>
  );
};

export default EventRiskTool;