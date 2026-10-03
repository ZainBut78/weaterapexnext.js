'use client';

// Chhoti jagah (table cell, month chip) ke liye temperature.
// `dual`: do lines — upar chuni hui unit, neeche doosri (chhoti).
// Server HTML mein hamesha °C pehle (UnitsContext pehla render °C).
import { useUnits } from '@/context/UnitsContext';

const toF = (c) => c * 9 / 5 + 32;

export default function UnitTempShort({ c, dual = false }) {
  const units = useUnits();
  if (c == null || !Number.isFinite(Number(c))) return <>—</>;
  const cVal = Math.round(Number(c));
  const fVal = Math.round(toF(Number(c)));
  const [first, second] = units.unit === 'F' ? [`${fVal}°F`, `${cVal}°C`] : [`${cVal}°C`, `${fVal}°F`];
  if (!dual) return <>{first}</>;
  return (
    <>
      <span className="block">{first}</span>
      <span className="block text-[10px] opacity-70">{second}</span>
    </>
  );
}
