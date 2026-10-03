import { Sun, Moon, Cloud, Cloudy, CloudSun, CloudMoon, CloudFog, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudHail } from 'lucide-react';

// Yeh Meteocons ka FALLBACK hai — CDN se icon load na ho to yeh chalta
// hai (WeatherCard ka MeteoconIcon onError par is par degrade karta hai).
//
// Yahan bhi 85/86 (snow showers) chhoot rahe the: woh 82 se bare aur 95
// se chhote hain, is liye aakhri `return Cloud` mein gir kar KHAALI
// BADAL dikhate the. Ab barf ki bauchhar par barf ka icon aata hai.
export function getWeatherIcon(code, isNight = false) {
  const c = Number(code);
  if (!Number.isFinite(c)) return { icon: Cloud, color: 'text-slate-400', label: 'Not available' };

  if (c === 0)
    return isNight
      ? { icon: Moon, color: 'text-indigo-300', label: 'Clear Night' }
      : { icon: Sun, color: 'text-amber-500', label: 'Sunny' };
  if (c === 1 || c === 2)
    return isNight
      ? { icon: CloudMoon, color: 'text-indigo-400', label: 'Partly Cloudy' }
      : { icon: CloudSun, color: 'text-amber-400', label: 'Partly Cloudy' };
  if (c === 3)
    return { icon: Cloudy, color: 'text-slate-400', label: 'Cloudy' };
  if (c === 45 || c === 48)
    return { icon: CloudFog, color: 'text-slate-400', label: 'Foggy' };
  if (c >= 51 && c <= 57)
    return { icon: CloudDrizzle, color: 'text-blue-400', label: 'Drizzle' };
  if (c >= 61 && c <= 67)
    return { icon: CloudRain, color: 'text-blue-500', label: 'Rainy' };
  if ((c >= 71 && c <= 77) || c === 85 || c === 86)
    return { icon: CloudSnow, color: 'text-sky-300', label: 'Snowy' };
  if (c >= 80 && c <= 82)
    return { icon: CloudRain, color: 'text-blue-600', label: 'Showers' };
  if (c === 96 || c === 99)
    return { icon: CloudHail, color: 'text-purple-500', label: 'Thunderstorm with hail' };
  if (c >= 95)
    return { icon: CloudLightning, color: 'text-purple-500', label: 'Thunderstorm' };

  return { icon: Cloud, color: 'text-slate-400', label: 'Not available' };
}
