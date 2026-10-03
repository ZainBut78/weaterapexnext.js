// ══════════════════════════════════════════════════════════════════════
// WMO code -> insaani zubaan mein mausam ka naam.
//
// Yeh text ICON ke sath dikhta hai (WeatherCard ka title, Trip Planner
// ke din ka label aur image alt). Dono ka MATCH karna zaroori hai —
// warna user ko barf ka icon dikhta hai aur neeche likha hota hai
// "Rain showers". Woh icon se zyada confusing hai.
//
// Pehle teen asli ghaltiyan thin:
//
//   1. BARF ko "Rain showers" likha jata tha.
//      71/73/75/77 `code <= 67` se nikal jate the aur seedha
//      `code <= 82 -> "Rain showers"` mein gir jate the. Yani barf
//      wale din icon ❄ hota tha aur text "Rain showers".
//
//   2. `rainProb > 70` ka check saare code checks se PEHLE tha, to woh
//      asli condition ko dabata tha:
//         code 95 (toofan) + 80% rain -> "Heavy showers" (toofan gayab)
//         code 75 (bhari barf) + 80%  -> "Heavy showers" (barf gayab)
//
//   3. Code 65 ka matlab "heavy rain" hai, magar rainProb 70 se kam ho
//      to usay "Light rain" likha jata tha.
//
// Ab tarteeb yeh hai: PEHLE asli WMO code ka faisla (kyunke wohi asal
// mausam hai), aur rain probability sirf usi soorat mein shiddat barhati
// hai jab code khud barish/bauchhar ka ho.
// ══════════════════════════════════════════════════════════════════════

const UNKNOWN = { title: "Not available", desc: "Weather data isn't available right now." };

// Number(null) aur Number('') dono 0 dete hain, aur 0 = "clear sky".
// Yani null aane par site "Sunny" likh deti. Pehle hi reject karo.
function toCode(value) {
  if (value === null || value === undefined || value === '') return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

export function getWeatherDescription(code, rainProb) {
  const c = toCode(code);
  if (!Number.isFinite(c)) return UNKNOWN;

  // Toofan — sirf yeh teen codes. Pehle `c >= 95` tha, jis se 999 jaisa
  // anjaan code bhi "Thunderstorms" ban jata tha. Jo cheez hum jaante
  // nahi, us ka dawa bhi nahi karna chahiye.
  if (c === 95) return { title: "Thunderstorms", desc: "Stormy conditions likely." };
  if (c === 96 || c === 99) return { title: "Thunderstorms with hail", desc: "Storms with hail likely." };

  // Barf (71-77) aur barf ki bauchharein (85, 86)
  if (c === 75 || c === 86) return { title: "Heavy snow", desc: "Heavy snowfall expected." };
  if (c === 85) return { title: "Snow showers", desc: "Periods of snow expected." };
  if (c === 77) return { title: "Snow grains", desc: "Fine snow grains expected." };
  if (c === 71 || c === 73) return { title: "Snow", desc: "Snowfall expected." };

  // Jamne wali barish — alag se batana zaroori hai, sadak phisalti hai.
  if (c === 66) return { title: "Freezing rain", desc: "Freezing rain — surfaces may be icy." };
  if (c === 67) return { title: "Heavy freezing rain", desc: "Heavy freezing rain — icy conditions." };
  if (c === 56 || c === 57) return { title: "Freezing drizzle", desc: "Freezing drizzle — surfaces may be icy." };

  // Barish ki bauchharein (80-82)
  if (c === 82) return { title: "Heavy showers", desc: "Violent rain showers expected." };
  if (c === 80 || c === 81) {
    return rainProb > 70
      ? { title: "Heavy showers", desc: "Significant rainfall expected." }
      : { title: "Rain showers", desc: "Periods of rain expected." };
  }

  // Barish (61-65)
  if (c === 65) return { title: "Heavy rain", desc: "Significant rainfall expected." };
  if (c === 63) return { title: "Rain", desc: "Steady rain expected." };
  if (c === 61) {
    return rainProb > 70
      ? { title: "Rain", desc: "Rain likely for much of the day." }
      : { title: "Light rain", desc: "Occasional light rain." };
  }

  // Boondaback (51-55)
  if (c >= 51 && c <= 55) return { title: "Drizzle", desc: "Light drizzle expected." };

  // Dhund
  if (c === 45 || c === 48) return { title: "Foggy", desc: "Reduced visibility likely." };

  // Saaf / badal
  if (c === 3) return { title: "Cloudy", desc: "Overcast conditions expected." };
  if (c === 1 || c === 2) return { title: "Partly sunny", desc: "Mix of sun and clouds." };
  if (c === 0) return { title: "Sunny", desc: "Clear skies throughout the day." };

  return UNKNOWN;
}

export function getNightDescription(code) {
  const c = toCode(code);
  if (!Number.isFinite(c)) return "Not available";
  if (c === 95 || c === 96 || c === 99) return "Storms possible";
  if (c === 75 || c === 86) return "Heavy snow";
  if (c === 85 || c === 77 || c === 71 || c === 73) return "Snow";
  if (c === 66 || c === 67) return "Freezing rain";
  if (c === 56 || c === 57) return "Freezing drizzle";
  if (c >= 80 && c <= 82) return "Showers";
  if (c >= 61 && c <= 65) return "Rain likely";
  if (c >= 51 && c <= 55) return "Drizzle";
  if (c === 45 || c === 48) return "Foggy";
  if (c === 3) return "Overcast";
  if (c === 1 || c === 2) return "Partly cloudy";
  if (c === 0) return "Clear sky";
  return "Not available";
}
