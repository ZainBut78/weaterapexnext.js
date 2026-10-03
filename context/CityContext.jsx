'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CityContext = createContext(null);
const STORAGE_KEY = 'weatherApex_city';

export function CityProvider({ children }) {
  // NEXT.JS KI WAJAH SE BADLA:
  // Vite mein yahan `useState(() => localStorage.getItem(...) || 'london')`
  // tha. Next.js har component pehle SERVER par bhi chalata hai, aur
  // server par `localStorage` hota hi nahi — page wahin crash ho jata.
  // Ab: shuru mein `null` (server par aur browser ke pehle render mein
  // ek jaisa), phir neeche useEffect mein — jo sirf browser mein chalta
  // hai — saved city ya 'london'. User ko farq nahi: tab tak weather
  // card "Loading..." dikhata hai, bilkul pehle ki tarah.
  const [city, setCityState] = useState(null);
  const [geoAttempted, setGeoAttempted] = useState(false);

  const setCity = (c) => {
    localStorage.setItem(STORAGE_KEY, c);
    setCityState(c);
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    // Pehle jaisa: saved city ho to wahi, warna London — aur neeche
    // location milne par us ka shehar.
    setCityState(saved || 'london');
    if (saved) {
      setGeoAttempted(true);
      return;
    }

    if (!navigator.geolocation) {
      setGeoAttempted(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // BUG JO THEEK HUA: pehle yahan
          //   https://geocoding-api.open-meteo.com/v1/reverse
          // tha. Open-Meteo ki yeh service MAUJOOD HI NAHI hai (sirf
          // naam-se-dhoondna `/v1/search` hai) — har dafa 404 aata tha,
          // naam kabhi nahi milta tha, error chupchap nigla jata tha aur
          // location dene ke bawajood London hi rehta tha. Kuch save bhi
          // nahi hota tha, is liye har reload par yehi hota.
          //
          // BigDataCloud ka client-side endpoint: muft (commercial bhi),
          // koi API key nahi. Sharait: call browser se ho aur device ki
          // ASLI location (HTML5 Geolocation) se ho — yahan bilkul yehi
          // hai. Server se is endpoint ko call karna mana hai.
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
          );
          const data = await res.json();
          // `city` aam taur par shehar hota hai; chhote ilaqon mein khaali
          // aata hai to `locality` (qasba/mohalla) — dono na hon to London.
          const name = (data?.city || data?.locality || '').trim();
          if (name) {
            localStorage.setItem(STORAGE_KEY, name.toLowerCase());
            setCityState(name.toLowerCase());
          }
        } catch {
          // geocoding fail — default city stays
        }
        setGeoAttempted(true);
      },
      () => setGeoAttempted(true),
      { timeout: 5000 }
    );
  }, []);

  return (
    <CityContext.Provider value={{ city, setCity, geoAttempted }}>
      {children}
    </CityContext.Provider>
  );
}

export const useCity = () => useContext(CityContext);
