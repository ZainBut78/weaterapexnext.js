// ─────────────────────────────────────────────────────────────
//  AARZI (Phase C preview): jin whitelist shehron ka 20-saal history
//  (2006–2025, 240 rows) LOCAL database mein mukammal hai.
//
//  Kyun: country page aur "doosre shehar" sections kai shehron ki history
//  maangte hain. Jis shehar ka data DB mein nahi, us ki call backend se
//  Open-Meteo tak jati hai (~261 weighted calls). Is liye fan-out sirf
//  in shehron tak, aur har page par hadd (services/history.js).
//
//  Source: read-only SQL check, local DB, 2026-09-27 — 64 mukammal,
//  3 adhoore (karachi, islamabad, quetta: 10 saal), 88 khaali.
//  Live (VPS) ka data alag hai — deploy se pehle backend ka read-only
//  "climate-summary" endpoint (Backend request #7) is file ki jagah lega.
// ─────────────────────────────────────────────────────────────
export const HISTORY_READY = new Set([
  'london', 'manchester', 'birmingham', 'edinburgh', 'glasgow', 'paris',
  'lyon', 'marseille', 'toulouse', 'nice', 'berlin', 'munich',
  'hamburg', 'frankfurt', 'cologne', 'madrid', 'barcelona', 'valencia',
  'seville', 'bilbao', 'rome', 'milan', 'naples', 'turin',
  'florence', 'amsterdam', 'rotterdam', 'the-hague', 'vienna', 'salzburg',
  'brussels', 'antwerp', 'dublin', 'cork', 'lisbon', 'porto',
  'stockholm', 'gothenburg', 'oslo', 'bergen', 'trondheim', 'copenhagen',
  'aarhus', 'helsinki', 'tampere', 'warsaw', 'krakow', 'gdansk',
  'prague', 'brno', 'budapest', 'athens', 'thessaloniki', 'istanbul',
  'ankara', 'antalya', 'zurich', 'geneva', 'moscow', 'saint-petersburg',
  'new-york', 'tokyo', 'dubai', 'singapore',
]);
