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

const UNKNOWN = 'unknown';

// Number(null) aur Number('') dono 0 dete hain, aur 0 = "clear sky".
// Yani null aane par site "Sunny" likh deti. Pehle hi reject karo.
function toCode(value) {
  if (value === null || value === undefined || value === '') return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function dayKey(code, rainProb) {
  const c = toCode(code);
  if (!Number.isFinite(c)) return UNKNOWN;

  // Toofan — sirf yeh teen codes. Pehle `c >= 95` tha, jis se 999 jaisa
  // anjaan code bhi "Thunderstorms" ban jata tha. Jo cheez hum jaante
  // nahi, us ka dawa bhi nahi karna chahiye.
  if (c === 95) return 'thunder';
  if (c === 96 || c === 99) return 'thunderHail';

  // Barf (71-77) aur barf ki bauchharein (85, 86)
  if (c === 75 || c === 86) return 'heavySnow';
  if (c === 85) return 'snowShowers';
  if (c === 77) return 'snowGrains';
  if (c === 71 || c === 73) return 'snow';

  // Jamne wali barish — alag se batana zaroori hai, sadak phisalti hai.
  if (c === 66) return 'freezingRain';
  if (c === 67) return 'heavyFreezingRain';
  if (c === 56 || c === 57) return 'freezingDrizzle';

  // Barish ki bauchharein (80-82)
  if (c === 82) return 'violentShowers';
  if (c === 80 || c === 81) {
    return rainProb > 70
      ? 'heavyShowers'
      : 'rainShowers';
  }

  // Barish (61-65)
  if (c === 65) return 'heavyRain';
  if (c === 63) return 'rain';
  if (c === 61) {
    return rainProb > 70
      ? 'rainMostDay'
      : 'lightRain';
  }

  // Boondaback (51-55)
  if (c >= 51 && c <= 55) return 'drizzle';

  // Dhund
  if (c === 45 || c === 48) return 'foggy';

  // Saaf / badal
  if (c === 3) return 'cloudy';
  if (c === 1 || c === 2) return 'partlySunny';
  if (c === 0) return 'sunny';

  return UNKNOWN;
}

function nightKey(code) {
  const c = toCode(code);
  if (!Number.isFinite(c)) return 'unknown';
  if (c === 95 || c === 96 || c === 99) return 'storms';
  if (c === 75 || c === 86) return 'heavySnow';
  if (c === 85 || c === 77 || c === 71 || c === 73) return 'snow';
  if (c === 66 || c === 67) return 'freezingRain';
  if (c === 56 || c === 57) return 'freezingDrizzle';
  if (c >= 80 && c <= 82) return 'showers';
  if (c >= 61 && c <= 65) return 'rainLikely';
  if (c >= 51 && c <= 55) return 'drizzle';
  if (c === 45 || c === 48) return 'foggy';
  if (c === 3) return 'overcast';
  if (c === 1 || c === 2) return 'partlyCloudy';
  if (c === 0) return 'clearSky';
  return 'unknown';
}

// i18n (Oct 2026): text messages ke `wx` / `wxNight` namespaces mein (layout
// har page ko deta hai). `t` = useT() / getT() — har caller deta hai.
// (en.json yahan import NAHI — warna poori file client bundle mein jati.)
export function getWeatherDescription(code, rainProb, t) {
  const k = dayKey(code, rainProb);
  return { key: k, title: t(`wx.${k}.title`), desc: t(`wx.${k}.desc`) };
}

export function getNightDescription(code, t) {
  return t(`wxNight.${nightKey(code)}`);
}
