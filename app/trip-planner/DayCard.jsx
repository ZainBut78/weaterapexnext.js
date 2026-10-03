'use client';

// ─────────────────────────────────────────────────────────────
//  Trip Planner day card — owner ne round 3 mein "Option 2" (bara card)
//  chuna (audit N3). Mobile 1 column, tablet 2, desktop 3.
//
//  Is mein (owner spec):
//   • Score "7.3 / 10" + lafz (Excellent/Good/Fair/Poor) + upar rang ka legend
//   • Har metric ka label: "High 22° · Low 14°", "Rain chance 40%", "Wind 12 km/h"
//   • "Best for: …" chip + saaf wajah (text-sm, gray-600) + "Best time" (day_parts)
//   • Tareekh formatted ("Fri, Oct 2"); "Best day" / "Least ideal" pills
//   • Site ke maujooda rang/fonts; nayi library nahi; °C/°F + km/h/mph
// ─────────────────────────────────────────────────────────────
import { Thermometer, Umbrella, Wind, Clock, Award, CloudLightning } from 'lucide-react';
import { getMeteoconIcon } from '@/utils/meteoconsMap';
import { getWeatherDescription } from '@/utils/weatherDescriptions';
import { useUnits } from '@/context/UnitsContext';
import {
  ACTIVITY_META, SCORE_LEGEND, activityReason, bestTimeOfDay, dayIconCode, formatDay, scoreBand,
} from './dayInsights';

// Icon (backend weather/conditions.py): display_code = din ke ghanton ka
// NUMAINDA haal; purana backend → weather_code. Ek geela ghanta ab poore
// din ko barish ka icon nahi banata — us ki jagah chhota "shower" badge.

function ConditionBadges({ day }) {
  if (!day.shower_risk && !day.thunder_risk) return null;
  return (
    <div className="mt-1 flex flex-col items-center gap-1">
      {day.shower_risk && (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 ring-1 ring-sky-200 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
          <Umbrella className="w-3 h-3" /> Shower possible{(day.shower_probability ?? day.rain_probability) > 0 ? ` ${day.shower_probability ?? day.rain_probability}%` : ''}
        </span>
      )}
      {day.thunder_risk && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 ring-1 ring-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
          <CloudLightning className="w-3 h-3" /> Thunderstorm possible {day.thunder_probability}%
        </span>
      )}
    </div>
  );
}

// Din ke hisse — har ek ka apna icon + rain % (backend day_parts.display_code)
const PARTS = [['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening']];
function DayPartIcons({ parts }) {
  if (!parts || !PARTS.some(([k]) => parts[k]?.display_code != null)) return null;
  return (
    <div className="mx-5 mt-3 grid grid-cols-3 gap-2" aria-label="Weather during the day">
      {PARTS.map(([key, label]) => {
        const p = parts[key];
        if (!p) return <div key={key} />;
        const title = getWeatherDescription(p.display_code).title;
        return (
          <div key={key} className="flex flex-col items-center rounded-lg bg-gray-50 py-1.5" title={title}>
            <span className="text-[11px] font-semibold text-gray-500">{label}</span>
            <img loading="lazy" decoding="async" src={getMeteoconIcon(p.display_code, false)} alt={`${label}: ${title}`} width={32} height={32} className="w-8 h-8" />
            <span className="text-[11px] font-semibold text-gray-600">{p.rain_probability}% rain</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Cards ke upar ka legend ──────────────────────────────────
export function ScoreLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 mb-4">
      <span className="font-semibold text-gray-700">Day score (out of 10):</span>
      {SCORE_LEGEND.map((l) => (
        <span key={l.label} className="inline-flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${l.dot}`} />
          <span className="font-semibold text-gray-700">{l.label}</span>
          <span className="text-gray-500">{l.range}</span>
        </span>
      ))}
    </div>
  );
}

function useDayView(day) {
  const units = useUnits();
  const band = scoreBand(day.score);
  const date = formatDay(day.date);
  const iconCode = dayIconCode(day);
  const weather = getWeatherDescription(iconCode).title;
  const act = ACTIVITY_META[day.recommended_activity] || ACTIVITY_META.city_sightseeing;
  const reason = activityReason(day, units);
  const bestTime = bestTimeOfDay(day.day_parts);
  const score = Number.isFinite(Number(day.score)) ? Number(day.score).toFixed(1) : '—';
  return { units, band, date, weather, iconCode, act, reason, bestTime, score };
}

function DayPill({ isBest, isWorst }) {
  if (isBest) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500 text-white">
        <Award className="w-3 h-3" /> Best day
      </span>
    );
  }
  if (isWorst) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
        Least ideal
      </span>
    );
  }
  return null;
}

function BestFor({ act, bestTime }) {
  const Icon = act.icon;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f5ff] border border-[#d6e4ff] px-2.5 py-1 text-xs font-semibold text-[#002244]">
        <Icon className={`w-3.5 h-3.5 ${act.color}`} />
        <span className="text-gray-500 font-medium">Best for:</span> {act.label}
      </span>
      {bestTime && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
          <Clock className="w-3.5 h-3.5 text-[#0077b6]" />
          <span className="text-gray-500 font-medium">Best time:</span> {bestTime.label}
          <span className="text-gray-400 font-medium">({bestTime.hours})</span>
        </span>
      )}
    </div>
  );
}

// Ek din ka card
export default function DayCard({ day, isBest, isWorst }) {
  const { units, band, date, weather, iconCode, act, reason, bestTime, score } = useDayView(day);
  return (
    <div className={`relative flex flex-col rounded-2xl border bg-white overflow-hidden transition-shadow hover:shadow-md ${
      isBest ? 'border-green-400 ring-1 ring-green-200' : isWorst ? 'border-amber-300' : 'border-gray-200'
    }`}>
      {/* Upar: tareekh + pill */}
      <div className="flex items-center justify-between px-5 pt-4">
        <p className="text-sm font-bold text-[#002244]">
          {date.weekday}, <span className="text-gray-500 font-semibold">{date.short}</span>
        </p>
        <DayPill isBest={isBest} isWorst={isWorst} />
      </div>

      {/* Score + mausam */}
      <div className="flex items-center justify-between gap-3 px-5 pt-3">
        <div>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-extrabold ${band.text}`}>{score}</span>
            <span className="text-base font-semibold text-gray-400">/ 10</span>
          </div>
          <span className={`inline-flex items-center gap-1.5 mt-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${band.soft} ${band.text} ring-1 ${band.ring}`}>
            <span className={`w-2 h-2 rounded-full ${band.dot}`} /> {band.label}
          </span>
        </div>
        <div className="text-center shrink-0">
          <img loading="lazy" decoding="async" src={getMeteoconIcon(iconCode, false)} alt={weather} width={64} height={64} className="w-16 h-16 mx-auto" />
          <p className="text-xs font-medium text-gray-600 max-w-[7rem] leading-tight">{weather}</p>
          <ConditionBadges day={day} />
        </div>
      </div>

      {/* Din ke hisse — mausam din mein badalta hai */}
      <DayPartIcons parts={day.day_parts} />

      {/* Metrics */}
      <dl className="mx-5 mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100 text-sm">
        <div className="flex items-center justify-between px-3 py-2">
          <dt className="flex items-center gap-2 text-gray-500"><Thermometer className="w-4 h-4 text-red-400" />Temperature</dt>
          <dd className="font-semibold text-gray-800">High {units.temp(day.temp_max)}° · Low {units.temp(day.temp_min)}°</dd>
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <dt className="flex items-center gap-2 text-gray-500"><Umbrella className="w-4 h-4 text-blue-400" />Rain chance</dt>
          <dd className="font-semibold text-gray-800">{day.rain_probability ?? '—'}%</dd>
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <dt className="flex items-center gap-2 text-gray-500"><Wind className="w-4 h-4 text-teal-400" />Wind</dt>
          <dd className="font-semibold text-gray-800">{day.wind_kmh == null ? '—' : `${units.wind(day.wind_kmh)} ${units.windUnit}`}</dd>
        </div>
      </dl>

      <div className="px-5 pt-4 pb-5 mt-auto space-y-2.5">
        <BestFor act={act} bestTime={bestTime} />
        <p className="text-sm text-gray-600 leading-snug">{reason}</p>
      </div>
    </div>
  );
}
