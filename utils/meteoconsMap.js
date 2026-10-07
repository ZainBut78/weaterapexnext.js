// Meteocons animated weather icons — https://meteocons.com (MIT, Bas Milius)
// Pehle cdn.meteocons.com (3.0.0-next.10) se aate the — live par kabhi load
// hi nahi hote the. Ab wahi 20 SVG (fill, 3.0.0-next.10) apni site par:
// public/icons/meteocons/ — koi bahar ki CDN nahi (owner, Oct 2026).
// Naya icon name map mein daalo to us ki SVG bhi wahan rakho
// (scripts/check-icons.mjs har name ki file check karta hai).
const METEOCONS_BASE = "/icons/meteocons";

// ══════════════════════════════════════════════════════════════════════
// WMO Weather interpretation codes (WW) — Open-Meteo ka poora set.
// Reference: https://open-meteo.com/en/docs  (WMO Weather interpretation codes)
//
// AHEM: user icon dekh kar mausam samajhta hai, temperature dekh kar
// nahi. Agar barish ho aur hum khaali badal dikha dein, aur wahi banda
// Google par barish ka icon dekhe, to hamari site ka bharosa khatam.
// Is liye HAR code ka apna icon hona chahiye — koi code chhoota na ho.
//
// Pehle yeh 7 codes map mein MAUJOOD HI NAHI THE, aur `|| "cloudy"`
// fallback ki wajah se sab **khaali badal** dikhate the:
//     56, 57  freezing drizzle   -> ab drizzle
//     66, 67  freezing rain      -> ab rain / heavy rain
//     77      snow grains        -> ab snow
//     85, 86  snow showers       -> ab snow / heavy snow
// Yani barf aur barish dono soorton mein user ko sirf badal dikhta tha.
// ══════════════════════════════════════════════════════════════════════
const WMO_TO_METEOCONS = {
  // ── Saaf / badal ────────────────────────────────────────────────
  0: "clear-day",             // Clear sky
  1: "partly-cloudy-day",     // Mainly clear
  2: "partly-cloudy-day",     // Partly cloudy
  3: "cloudy",                // Overcast

  // ── Dhund ───────────────────────────────────────────────────────
  45: "fog-day",              // Fog                          <- round 3: din/raat
  48: "fog-day",              // Depositing rime fog

  // ── Halki boondaback (drizzle) ──────────────────────────────────
  51: "drizzle",              // Drizzle: light
  53: "drizzle",              // Drizzle: moderate
  55: "drizzle",              // Drizzle: dense
  56: "drizzle",              // Freezing drizzle: light      <- pehle missing
  57: "drizzle",              // Freezing drizzle: dense      <- pehle missing

  // ── Barish ──────────────────────────────────────────────────────
  61: "rain",                 // Rain: slight
  63: "rain",                 // Rain: moderate
  65: "extreme-day-rain",     // Rain: heavy
  66: "rain",                 // Freezing rain: light         <- pehle missing
  67: "extreme-day-rain",     // Freezing rain: heavy         <- pehle missing

  // ── Barf ────────────────────────────────────────────────────────
  71: "snow",                 // Snow fall: slight
  73: "snow",                 // Snow fall: moderate
  75: "extreme-day-snow",     // Snow fall: heavy
  77: "snow",                 // Snow grains                  <- pehle missing

  // ── Barish ki bauchharein (showers) ─────────────────────────────
  80: "partly-cloudy-day-rain", // Rain showers: slight      <- round 3: din/raat
  81: "partly-cloudy-day-rain", // Rain showers: moderate
  82: "extreme-day-rain",     // Rain showers: violent

  // ── Barf ki bauchharein ─────────────────────────────────────────
  85: "partly-cloudy-day-snow", // Snow showers: slight      <- pehle missing; round 3: din/raat
  86: "extreme-day-snow",     // Snow showers: heavy          <- pehle missing

  // ── Toofan ──────────────────────────────────────────────────────
  95: "thunderstorms-day",    // Thunderstorm: slight/moderate <- round 3: din/raat
  96: "thunderstorms-day",    // Thunderstorm with slight hail
  99: "thunderstorms-day",    // Thunderstorm with heavy hail
};

// Raat ko (Open-Meteo is_day = 0) yeh icons apne raat wale version se badalte hain.
// Round 3 (audit 3.1): bauchhar, barf ki bauchhar, dhund aur toofan ke din/raat
// icons Meteocons 3.0.0-next.10 fill mein maujood hain — pehle din-raat ek jaisa tha.
// Har WMO code × din/raat ka URL scripts/check-icons.mjs se 200 verify hota hai.
const NIGHT_VARIANTS = {
  "clear-day": "clear-night",
  "partly-cloudy-day": "partly-cloudy-night",
  "extreme-day-rain": "extreme-night-rain",
  "extreme-day-snow": "extreme-night-snow",
  "partly-cloudy-day-rain": "partly-cloudy-night-rain",
  "partly-cloudy-day-snow": "partly-cloudy-night-snow",
  "fog-day": "fog-night",
  "thunderstorms-day": "thunderstorms-night",
};

// Code hi na mile (backend se null/undefined aaya) to neutral badal.
// KHABARDAAR: yahan "clear-day" kabhi mat karna — data na hone par
// confident suraj dikhana sab se bura jhoot hai.
const UNKNOWN_ICON = "cloudy";

// KHABARDAAR: seedha Number() use karna khatarnaak hai —
//     Number(null) === 0   aur   Number('') === 0
// aur 0 ka matlab "clear sky" hai. Yani backend se null aane par ya
// khaali string par site CHAMAKTA SURAJ dikha deti — wohi jhoot jis se
// bachna tha. Is liye null/undefined/khaali ko pehle hi reject karte hain.
function toCode(value) {
  if (value === null || value === undefined || value === '') return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

/** Is code ka hamare paas asli icon hai? (false = data missing/unknown) */
export function hasKnownIcon(weatherCode) {
  const code = toCode(weatherCode);
  return Number.isFinite(code) && Object.prototype.hasOwnProperty.call(WMO_TO_METEOCONS, code);
}

function resolveIconName(weatherCode, isNight) {
  let iconName = hasKnownIcon(weatherCode)
    ? WMO_TO_METEOCONS[toCode(weatherCode)]
    : UNKNOWN_ICON;
  if (isNight && NIGHT_VARIANTS[iconName]) iconName = NIGHT_VARIANTS[iconName];
  return iconName;
}

export function getMeteoconIcon(weatherCode, isNight = false) {
  return `${METEOCONS_BASE}/${resolveIconName(weatherCode, isNight)}.svg`;
}

/** Sirf debugging/verification page ke liye — icon ka naam. */
export function getMeteoconName(weatherCode, isNight = false) {
  return resolveIconName(weatherCode, isNight);
}

export { WMO_TO_METEOCONS };
