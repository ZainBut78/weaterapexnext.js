// ─────────────────────────────────────────────────────────────
//  "What to wear in <City> in <Month>" ke facts (Step 6, Nov 2026) — sirf hisaab
//
//  Sirf mahana numbers, is liye har temperature "around". Subah = low + 20% of swing,
//  shaam = low + 50% of swing (owner; London ke 20 saal ke hourly data ke qareeb).
//  Tips (monthPacking) aur FAQ (eveningAdvice) wale hi rules: page khud se nahi takrata.
// ─────────────────────────────────────────────────────────────
import { DAYS_IN, eveningAdvice } from './monthNarrative.js';

export const morningTemp = (hi, lo) => lo + 0.2 * (hi - lo);
export const eveningTemp = (hi, lo) => lo + 0.5 * (hi - lo);

/** Tips ke hi thresholds: warm tip (hi < 12 ya lo < 5), raat garam (lo >= 22) */
export function wearBand(hi, lo, wintry) {
  if (hi < 5 || wintry === 'snow') return 'winter';
  if (hi < 12 || lo < 5) return 'cold';
  if (hi < 22) return 'mild';
  return lo >= 22 ? 'hot' : 'warm';
}

function yearKind(band, cold) {
  if (band === 'winter') return 'winter';
  if (cold >= 28) return 'hot';
  return cold >= 15 ? 'cooler' : 'normal';
}

export function wearFacts({ row, f, packing, history, monthNum }) {
  if (!row || !history) return null;
  const hi = row.avg_high;
  const lo = row.avg_low;
  if (typeof hi !== 'number' || typeof lo !== 'number') return null;
  const band = wearBand(hi, lo, f.wintry);
  const keys = new Set((packing || []).map((p) => p.key));
  const evening = eveningTemp(hi, lo);
  const eve = eveningAdvice(f.swing, lo);

  const afternoon = band === 'winter' || band === 'cold' || band === 'mild' ? band
    : hi >= 32 ? 'hot' : hi > 28 ? 'warmSun' : 'warm';
  let eveningKey = band;
  if (eve === 'warm') eveningKey = 'warmNight';
  else if (eve === 'same') eveningKey = 'same';
  else if (band === 'winter' && evening <= 2) eveningKey = 'ice';

  // Hafte ke geele din; Tips mein rain protection ho to "0" nahi likhte
  const days = f.rain?.days ?? row.rainy_days ?? 0;
  const wet = Math.round((days / DAYS_IN[monthNum - 1]) * 7);
  const wetWeek = wet === 0 && keys.has('rain') ? 1 : wet;

  const items = [];
  if (band === 'winter') items.push(keys.has('rain') ? 'coatWet' : 'coat', 'midThermal', 'glovesHat');
  else if (band === 'cold') items.push('jacketHat', 'mid2');
  else if (band === 'mild') items.push('lightJacket', 'lightLayers');
  else if (band === 'warm') items.push('lightClothes', ...(eve === 'same' ? [] : ['thinLayer']));
  else items.push('looseClothes');
  if (band !== 'winter' && keys.has('rain')) items.push('rainJacket');
  if (hi > 28) items.push('sunKit');
  else if (keys.has('shades')) items.push('shades');
  if (hi >= 32) items.push('bottle');
  if (band === 'winter' || f.wintry) items.push('boots');
  else if (keys.has('shoes') || wetWeek >= 3) items.push('wpShoes');
  else items.push(hi >= 28 ? 'lightShoes' : 'walkShoes');

  const cold = history.records.find((r) => r.key === 'cold');
  const warm = history.records.find((r) => r.key === 'warm');
  const year = cold?.year != null && warm?.year != null
    ? { kind: yearKind(band, cold.value), coldYear: cold.year, coldHigh: cold.value, warmYear: warm.year, warmHigh: warm.value, from: history.from, to: history.to }
    : null;

  return {
    band,
    temps: { morning: morningTemp(hi, lo), afternoon: hi, evening },
    keys: { morning: band, afternoon, evening: eveningKey },
    wetWeek,
    wintry: Boolean(f.wintry),
    size: f.rain?.size ?? null,
    perDay: f.rain?.perDay ?? null,
    items,
    year,
  };
}
