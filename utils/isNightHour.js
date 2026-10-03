// ══════════════════════════════════════════════════════════════════════
// Din hai ya raat?
//
// TARJEEH: Open-Meteo ka `is_day` (1 = din, 0 = raat). Woh us jagah ke
// ASLI sunrise/sunset se bana hota hai, is liye har mulk aur har mausam
// khud-ba-khud theek ho jata hai:
//
//   Oslo, 15 June, raat 10 baje   -> is_day = 1  (abhi roshni hai)
//   Oslo, 15 Dec,  shaam 4 baje   -> is_day = 0  (andhera ho gaya)
//   Karachi, 15 June, shaam 7 baje-> is_day = 1
//   Karachi, 15 Dec,  shaam 6 baje-> is_day = 0
//
// Pehle sirf ek fixed usool tha: "19:00 se 06:00 tak raat". Us se
// Norway/Sweden/Canada jaise mulkon mein icon poore mausam ghalat rehta
// tha, aur bhoomadhya (equator) ke qareeb bhi thoda off hota tha.
//
// FALLBACK: agar `is_day` na aaye (purana cached response, ya Open-Meteo
// ne na bheja) to wohi purana waqt ka andaza — kuch na dikhane se behtar
// hai, aur icon ka rain/snow/sun wala hissa is se mutasir nahi hota,
// sirf din/raat ki shakl badalti hai.
// ══════════════════════════════════════════════════════════════════════

/** Waqt ki string se andaza (fallback). */
function isNightByHour(timeStr) {
  if (!timeStr) return false;
  // ISO ("2026-09-15T20:45") ya short ("20:00") dono handle karo
  const isoHour = parseInt(String(timeStr).slice(11, 13), 10);
  const shortHour = parseInt(String(timeStr).slice(0, 2), 10);
  const hour = Number.isNaN(isoHour) ? shortHour : isoHour;
  return Number.isNaN(hour) ? false : hour >= 19 || hour < 6;
}

/**
 * @param timeStr  city-local ISO waqt ya "HH:00"
 * @param isDay    Open-Meteo ka is_day — 1/0, true/false, ya null/undefined
 */
export function isNightHour(timeStr, isDay) {
  // 0 bhi valid jawab hai (raat), is liye `!isDay` nahi likh sakte.
  if (isDay === 1 || isDay === true) return false;
  if (isDay === 0 || isDay === false) return true;
  return isNightByHour(timeStr);
}

export { isNightByHour };
