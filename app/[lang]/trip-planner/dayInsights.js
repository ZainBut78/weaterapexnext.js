// ─────────────────────────────────────────────────────────────
//  Trip Planner — din ki "samajh" (audit N3 logic fix, frontend-only)
//
//  PEHLE: activity backend se aati thi (recommended_activity), magar card
//  ki italic line frontend ALAG hisaab (barish > 60 / > 30) se banta tha
//  → dono takrate the ("Sheltered Indoor" + "great for exploring
//  outdoors"). Hawa sirf ≤ 15° par check hoti thi. `day_parts` zaya.
//
//  AB: wajah ki line SIRF backend ki `recommended_activity` se, aur
//  numbers wahi thresholds jo backend (trip_planner/activity.py +
//  scoring.py) use karta hai — ek hi set, koi takraav nahi.
// ─────────────────────────────────────────────────────────────

import { UmbrellaOff, Trees, Mountain, Landmark, House, SunDim, Building2 } from 'lucide-react';
import { intlLocale } from '@/i18n/format';

// i18n (Oct 2026): saare lafz messages `trip.*` mein — functions `t` lete hain.

// Backend ki activity keys → icon, rang (label: t(`trip.activities.${key}`))
export const ACTIVITY_META = {
  beach_water: { key: 'beach_water', icon: UmbrellaOff, color: 'text-amber-500' },
  picnic_park: { key: 'picnic_park', icon: Trees, color: 'text-green-500' },
  hiking_outdoor: { key: 'hiking_outdoor', icon: Mountain, color: 'text-emerald-600' },
  indoor_museum: { key: 'indoor_museum', icon: Landmark, color: 'text-purple-500' },
  indoor_sheltered: { key: 'indoor_sheltered', icon: House, color: 'text-gray-500' },
  indoor_midday: { key: 'indoor_midday', icon: SunDim, color: 'text-orange-500' },
  city_sightseeing: { key: 'city_sightseeing', icon: Building2, color: 'text-blue-500' },
};

// Backend ke thresholds (trip_planner/activity.py, scoring.py) — agar
// backend badle to yahan bhi badlein.
export const T = {
  RAIN_INDOOR: 50,   // rain_prob > 50 → indoor_museum
  WIND_SHELTER: 30,  // wind_kmh > 30 → indoor_sheltered
  HOT: 32,           // temp_max > 32 → beach (coastal) / indoor_midday
  MILD_MIN: 18,      // 18–28° → beach (coastal, rain < 20) / hiking
  MILD_MAX: 28,
  RAIN_SCORE: 20,    // score: barish 20% se upar minus
  WIND_SCORE: 20,    // score: hawa 20 km/h se upar minus
};

// Score ka lafz (owner spec): Excellent ≥ 8.5, Good ≥ 7, Fair ≥ 5, Poor < 5.
// Rang site ke maujooda score rang hain (green / blue / amber / red).
export function scoreBand(score, t) {
  const s = Number(score);
  const band = (key, rest) => ({ key, label: key ? t(`trip.score.${key}`) : '—', ...rest });
  if (!Number.isFinite(s)) return band(null, { dot: 'bg-gray-300', text: 'text-gray-500', soft: 'bg-gray-50', ring: 'ring-gray-200' });
  if (s >= 8.5) return band('excellent', { dot: 'bg-green-500', text: 'text-green-700', soft: 'bg-green-50', ring: 'ring-green-200' });
  if (s >= 7) return band('good', { dot: 'bg-blue-500', text: 'text-blue-700', soft: 'bg-blue-50', ring: 'ring-blue-200' });
  if (s >= 5) return band('fair', { dot: 'bg-amber-500', text: 'text-amber-700', soft: 'bg-amber-50', ring: 'ring-amber-200' });
  return band('poor', { dot: 'bg-red-500', text: 'text-red-700', soft: 'bg-red-50', ring: 'ring-red-200' });
}

// label / range: t(`trip.score.${key}`), t(`trip.scoreRange.${key}`)
export const SCORE_LEGEND = [
  { key: 'excellent', dot: 'bg-green-500' },
  { key: 'good', dot: 'bg-blue-500' },
  { key: 'fair', dot: 'bg-amber-500' },
  { key: 'poor', dot: 'bg-red-500' },
];

// "2026-10-02" → { weekday: 'Fri', short: 'Oct 2', long: 'Fri, Oct 2' }
// Browser timezone se parse NAHI (din aage-peeche ho jata) — UTC mein.
// lang (i18n): us zaban ki shakal; en = pehle jaisa (en-US)
export function formatDay(dateStr, lang = 'en') {
  if (!dateStr) return { weekday: '', short: '', long: '' };
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const loc = intlLocale(lang);
  const weekday = dt.toLocaleDateString(loc, { weekday: 'short', timeZone: 'UTC' });
  const short = dt.toLocaleDateString(loc, { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return { weekday, short, long: `${weekday}, ${short}` };
}

// ── Din ka icon (backend weather/conditions.py) ──
// display_code = din ke ghanton ka NUMAINDA haal; purana backend / 16 din se
// aage (historical estimate) → weather_code. Wet codes backend jaise.
const WET_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 71, 73, 75, 77, 85, 86, 95, 96, 99]);
export const isWetCode = (code) => code != null && WET_CODES.has(Number(code));
export const dayIconCode = (day) => day?.display_code ?? day?.weather_code;

// Backend ki day score formula (scoring.py) — din ke hisson ko compare
// karne ke liye usi ka chhota roop. Hisse ka icon geela ho to bari penalty
// (woh hissa kabhi "Best time" nahi), shower / thunder badge par thodi.
function partPenalty(p) {
  let pen = 0;
  if (isWetCode(p.display_code)) pen += 5;
  if (p.shower_risk) pen += 0.5;
  if (p.thunder_risk) pen += 2;
  const rain = p.rain_probability ?? 0;
  if (rain > T.RAIN_SCORE) pen += Math.min(0.5 + ((rain - T.RAIN_SCORE) / 80) * 4.5, 5);
  if (p.wind_kmh != null && p.wind_kmh > T.WIND_SCORE) pen += Math.min(((p.wind_kmh - T.WIND_SCORE) / 10) * 0.5, 2);
  if (p.temp != null && (p.temp > 38 || p.temp < 0)) pen += 2;
  else if (p.temp != null && (p.temp > 32 || p.temp < 5)) pen += 1;
  return pen;
}

// Label / ghante: t(`trip.parts.${key}`), t(`trip.partHours.${key}`)
// `day_parts` se din ka sab se acha hissa. Sab barabar hon ya data na ho → null.
export function bestTimeOfDay(dayParts, t) {
  if (!dayParts) return null;
  const parts = Object.entries(dayParts).filter(([, p]) => p);
  if (parts.length < 2) return null;
  const scored = parts.map(([name, p]) => ({ name, pen: partPenalty(p) }));
  scored.sort((a, b) => a.pen - b.pen);
  if (scored[scored.length - 1].pen - scored[0].pen < 0.3) return null; // koi khaas farq nahi
  const name = scored[0].name;
  return { key: name, label: t(`trip.parts.${name}`), hours: t(`trip.partHours.${name}`) };
}

// Ek hi saaf line: activity KYUN (backend ki activity + wahi thresholds).
// units: UnitsContext (temp/wind ko user ki unit mein likhne ke liye).
export function activityReason(day, units, t) {
  const rain = day.rain_probability ?? 0;
  const wind = day.wind_kmh;
  const tMax = day.temp_max;
  const tTxt = (c) => `${units.temp(c)}°`;
  const wTxt = (k) => `${units.wind(k)} ${units.windUnit}`;
  const R = (key, vars) => t(`trip.reason.${key}`, vars);

  const wetDay = isWetCode(day.display_code);
  let line;
  switch (day.recommended_activity) {
    case 'indoor_museum':
      line = wetDay && day.wet_hours
        ? R('rainHours', { count: day.wet_hours })
        : R('rainChanceIndoor', { rain });
      break;
    case 'indoor_sheltered':
      line = R('strongWind', { wind: wTxt(wind) });
      break;
    case 'beach_water':
      line = tMax > T.HOT
        ? R('hotCoast', { temp: tTxt(tMax) })
        : R('warmCoast');
      break;
    case 'indoor_midday':
      line = R('veryHot', { temp: tTxt(tMax) });
      break;
    case 'hiking_outdoor':
      line = R('mildTrails', { temp: tTxt(tMax) });
      break;
    case 'picnic_park':
      line = R('mildParks', { temp: tTxt(tMax) });
      break;
    default:
      line = tMax < 12
        ? R('cool', { temp: tTxt(tMax) })
        : R('comfortable', { temp: tTxt(tMax) });
  }

  // Chhoti ehtiyaat — wahi thresholds; activity se takrati nahi.
  // Icon dry + 1–2 geele ghante (shower_risk) → umbrella wali line ki jagah
  // saaf baat: "Mostly dry — a passing shower is possible (26% chance)".
  const tips = [];
  if (day.shower_risk) {
    const p = day.shower_probability ?? rain;
    // imkaan 0% ho (sirf mm ki wajah se geela ghanta) to "(0% chance)" ajeeb lagta hai
    tips.push(p > 0 ? R('showerChance', { p }) : R('showerPossible'));
  } else if (day.recommended_activity !== 'indoor_museum' && rain > T.RAIN_SCORE) {
    tips.push(R('umbrella', { rain }));
  }
  if (day.thunder_risk) tips.push(R('thunder', { p: day.thunder_probability }));
  if (day.recommended_activity !== 'indoor_sheltered' && wind != null && wind > T.WIND_SCORE) tips.push(R('breezy', { wind: wTxt(wind) }));
  return [line, ...tips].join(' ');
}
