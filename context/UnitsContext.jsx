'use client';

// ─────────────────────────────────────────────────────────────
//  °C / °F (+ km/h / mph) — poori site ek hi unit mein (audit 3.2)
//
//  • Backend hamesha °C aur km/h bhejta hai (Open-Meteo default —
//    backend `wind_speed_unit` nahi bhejta). Yahan sirf dikhane ke liye
//    badalte hain.
//  • Server par aur browser ke pehle render mein HAMESHA °C (hydration
//    safe). Asli faisla useEffect mein:
//      1) user ka apna chunav (localStorage) — hamesha sab se upar
//      2) warna browser language 'en-US' → °F (US visitors)
//      3) warna °C
//  • °F ke saath hawa mph, °C ke saath km/h (owner, round 3).
//  • i18n (Oct 2026): English ke ilawa har zaban mein °C pehle — browser
//    'en-US' hone par bhi khud °F nahi (user khud chune to chune). Numbers
//    zaban ki shakal mein (fmt / tempDual1): de/it/fr/es → 21,9.
// ─────────────────────────────────────────────────────────────
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLang } from '@/i18n/client';
import { intlLocale } from '@/i18n/format';

const STORAGE_KEY = 'weatherApex_units';
const UnitsContext = createContext(null);

const toF = (c) => c * 9 / 5 + 32;
const toMph = (kmh) => kmh / 1.609344;

export function UnitsProvider({ children }) {
  const [unit, setUnitState] = useState('C');
  const pageLang = useLang();

  useEffect(() => {
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch {}
    if (saved === 'C' || saved === 'F') {
      setUnitState(saved);
      return;
    }
    if (pageLang !== 'en') return;          // °C pehle (owner, i18n)
    const lang = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    if (/^en-US$/i.test(lang)) setUnitState('F');
  }, [pageLang]);

  const setUnit = useCallback((u) => {
    setUnitState(u);
    try { localStorage.setItem(STORAGE_KEY, u); } catch {}
  }, []);

  const value = useMemo(() => {
    const isF = unit === 'F';
    const nf = new Intl.NumberFormat(intlLocale(pageLang), { maximumFractionDigits: 1 });
    // Display number zaban ki shakal mein (21.9 → "21,9"); null → null
    const fmt = (n) => (n == null ? null : nf.format(n));
    return {
      unit,
      setUnit,
      fmt,
      tempSymbol: isF ? '°F' : '°C',
      windUnit: isF ? 'mph' : 'km/h',
      // °C (backend) → dikhane wali unit, gol number. null/undefined → null
      temp: (c) => (c == null || !Number.isFinite(Number(c)) ? null : Math.round(isF ? toF(Number(c)) : Number(c))),
      // Ek decimal wala (city page ki table jaisa: 21.9°C)
      temp1: (c) => (c == null || !Number.isFinite(Number(c)) ? null : Math.round((isF ? toF(Number(c)) : Number(c)) * 10) / 10),
      // Dono units, ek decimal: chuni hui pehle — "15°C (59°F)" / "59°F (15°C)".
      // City page (round 4): server HTML mein dono units (Google + US
      // visitors); lambai taqreeban barabar, is liye toggle par CLS nahi.
      tempDual1: (c) => {
        if (c == null || !Number.isFinite(Number(c))) return null;
        const r1 = (v) => Math.round(v * 10) / 10;
        const cTxt = `${fmt(r1(Number(c)))}°C`;
        const fTxt = `${fmt(r1(toF(Number(c))))}°F`;
        return isF ? `${fTxt} (${cTxt})` : `${cTxt} (${fTxt})`;
      },
      // km/h (backend) → km/h ya mph, gol number
      wind: (kmh) => (kmh == null || !Number.isFinite(Number(kmh)) ? null : Math.round(isF ? toMph(Number(kmh)) : Number(kmh))),
    };
  }, [unit, setUnit, pageLang]);

  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}

export const useUnits = () => useContext(UnitsContext);
