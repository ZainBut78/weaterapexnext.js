'use client';

// City page ke temperature — DONO units, chuni hui pehle (round 4):
// server HTML "15°C (59°F)"; °F wale user ko browser mein "59°F (15°C)".
// (UnitsContext pehle render par hamesha °C deta hai → hydration safe.)
import { useUnits } from '@/context/UnitsContext';
import { generateClimateNarrative } from '@/utils/climateNarrative';

// Ek temperature, dono units: "21.9°C (71.4°F)". null → "—"
export function UnitTemp({ c }) {
  const units = useUnits();
  return <>{units.tempDual1(c) ?? '—'}</>;
}

// "London experiences its warmest weather in July, with average highs
// reaching 21.9°C (71.4°F)…" — wahi text, temperature dono units mein.
export function ClimateNarrative({ city, monthly }) {
  const units = useUnits();
  const text = generateClimateNarrative(city, monthly, (c) => units.tempDual1(c));
  return <>{text}</>;
}

// Do temperatures ka FARQ (hamesha musbat), dono units: "4.1°C (7.4°F)".
// °C ka farq × 1.8 = °F ka farq (32 nahi jodte).
export function UnitDelta({ c }) {
  const units = useUnits();
  if (c == null || !Number.isFinite(Number(c))) return <>—</>;
  const d = Math.abs(Number(c));
  const cTxt = `${Math.round(d * 10) / 10}°C`;
  const fTxt = `${Math.round(d * 1.8 * 10) / 10}°F`;
  return <>{units.unit === 'F' ? `${fTxt} (${cTxt})` : `${cTxt} (${fTxt})`}</>;
}

// Nishan ke saath farq: "+4.0°C (+7.2°F)" / "−4.4°C (−7.9°F)"; 0 → "same"
export function UnitDeltaSigned({ c }) {
  const units = useUnits();
  if (c == null || !Number.isFinite(Number(c))) return <>—</>;
  const d = Math.round(Number(c) * 10) / 10;
  if (d === 0) return <>same</>;
  const s = d > 0 ? '+' : '−';
  const cTxt = `${s}${Math.abs(d)}°C`;
  const fTxt = `${s}${Math.round(Math.abs(d) * 1.8 * 10) / 10}°F`;
  return <>{units.unit === 'F' ? `${fTxt} (${cTxt})` : `${cTxt} (${fTxt})`}</>;
}
