// ─────────────────────────────────────────────────────────────
//  Sooraj ka waqt — NOAA solar calculator ka standard formula
//  (https://gml.noaa.gov/grad/solcalc/ — "General Solar Position
//  Calculations"). Koi API call nahi, koi library nahi.
//  Sunrise/sunset = sooraj ka markaz ufuq se 0.833° neeche (refraction +
//  sooraj ka radius). Nateeja UTC minutes; local waqt Intl + IANA timezone
//  se (DST khud shamil). Aam taur par ±1–2 minute tak durust.
// ─────────────────────────────────────────────────────────────

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/**
 * @param {number} year @param {number} month 1–12 @param {number} day
 * @param {number} lat  @param {number} lon (east +)
 * @returns {{ sunriseUtc: number|null, sunsetUtc: number|null, dayMinutes: number, polar: 'day'|'night'|null }}
 *          sunrise/sunset = UTC ke minutes (us din 00:00 UTC se)
 */
export function solarDay(year, month, day, lat, lon) {
  const start = Date.UTC(year, 0, 1);
  const doy = Math.round((Date.UTC(year, month - 1, day) - start) / 86400000) + 1;
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const gamma = ((2 * Math.PI) / (leap ? 366 : 365)) * (doy - 1); // dopahar ke qareeb kaafi

  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

  const cosH = Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(decl)) - Math.tan(rad(lat)) * Math.tan(decl);
  if (cosH > 1) return { sunriseUtc: null, sunsetUtc: null, dayMinutes: 0, polar: 'night' };
  if (cosH < -1) return { sunriseUtc: null, sunsetUtc: null, dayMinutes: 1440, polar: 'day' };
  const ha = deg(Math.acos(cosH));
  const noon = 720 - 4 * lon - eqTime;
  return { sunriseUtc: noon - 4 * ha, sunsetUtc: noon + 4 * ha, dayMinutes: 8 * ha, polar: null };
}

/** UTC minutes (us din) → "7:14 am" shehar ke local waqt mein */
export function localClock(year, month, day, utcMinutes, tz) {
  const d = new Date(Date.UTC(year, month - 1, day) + Math.round(utcMinutes) * 60000);
  return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true })
    .format(d).replace(/\s+/g, ' ').toLowerCase();
}

/** 645 → "10 h 45 min" */
export function hoursMinutes(mins) {
  const m = Math.round(Math.abs(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? (r ? `${h} h ${r} min` : `${h} h`) : `${r} min`;
}

/**
 * Mahine ki 15 tareekh ka daylight + pichle mahine ki 15 se farq.
 * Saal: 2025 (fixed) — daylight saal-ba-saal ~1 min se kam badalta hai,
 * aur fixed saal se page ka text har build par ek jaisa rehta hai.
 * @returns {null | { sunrise, sunset, dayMinutes, change, polar }}
 */
export function monthDaylight(city, monthNum, year = 2025) {
  if (!city || typeof city.lat !== 'number' || typeof city.lon !== 'number' || !city.tz) return null;
  const cur = solarDay(year, monthNum, 15, city.lat, city.lon);
  const pm = monthNum === 1 ? 12 : monthNum - 1;
  const prev = solarDay(monthNum === 1 ? year - 1 : year, pm, 15, city.lat, city.lon);
  return {
    sunrise: cur.sunriseUtc == null ? null : localClock(year, monthNum, 15, cur.sunriseUtc, city.tz),
    sunset: cur.sunsetUtc == null ? null : localClock(year, monthNum, 15, cur.sunsetUtc, city.tz),
    dayMinutes: Math.round(cur.dayMinutes),
    change: Math.round(cur.dayMinutes - prev.dayMinutes),
    polar: cur.polar,
  };
}
