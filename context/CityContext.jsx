'use client';

import { createContext, useCallback, useContext, useState, useEffect } from 'react';

const CityContext = createContext(null);
const STORAGE_KEY = 'weatherApex_city';

export function CityProvider({ children }) {
  // NEXT.JS KI WAJAH SE: shuru mein `null` (server par aur browser ke pehle
  // render mein ek jaisa), phir useEffect mein — jo sirf browser mein chalta
  // hai — saved city ya 'london'. Tab tak weather card "Loading..." dikhata hai.
  const [city, setCityState] = useState(null);
  // 'idle' | 'locating' | 'denied' | 'error'
  const [geoStatus, setGeoStatus] = useState('idle');

  const setCity = (c) => {
    localStorage.setItem(STORAGE_KEY, c);
    setCityState(c);
  };

  // SEO/perf fixes (Task 5, Oct 2026): page load par location ki ijazat
  // NAHI maangte (Lighthouse "Requests the geolocation permission on page
  // load" — aur bina pooche popup bura tajurba). Saved city, warna London.
  // Location sirf jab user "Use my location" dabaye (locate()).
  useEffect(() => {
    setCityState(localStorage.getItem(STORAGE_KEY) || 'london');
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // BigDataCloud ka client-side endpoint: muft, koi API key nahi.
          // Sharait: call browser se ho aur device ki ASLI location (HTML5
          // Geolocation) se ho — yahan bilkul yehi hai.
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
          );
          const data = await res.json();
          // `city` aam taur par shehar; chhote ilaqon mein khaali → `locality`
          const name = (data?.city || data?.locality || '').trim();
          if (name) {
            localStorage.setItem(STORAGE_KEY, name.toLowerCase());
            setCityState(name.toLowerCase());
            setGeoStatus('idle');
          } else {
            setGeoStatus('error');
          }
        } catch {
          setGeoStatus('error');
        }
      },
      (err) => setGeoStatus(err && err.code === 1 ? 'denied' : 'error'),
      { timeout: 10000 }
    );
  }, []);

  return (
    <CityContext.Provider value={{ city, setCity, locate, geoStatus }}>
      {children}
    </CityContext.Provider>
  );
}

export const useCity = () => useContext(CityContext);
