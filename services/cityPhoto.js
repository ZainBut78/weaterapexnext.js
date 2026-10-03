// ─────────────────────────────────────────────────────────────
//  Shehar ki photo (Pexels URL) — SERVER par.
//
//  Backend round A6: pehle yeh `/weather/current/` sirf `image_url` ke
//  liye call karta tha — har city/month page render par backend 15-din
//  ka Open-Meteo forecast bhi maang leta tha (jo page dikhata hi nahi).
//  Ab photo `/weather/cities/` se: EK call (1 ghanta cache) mein saare
//  shehron ki `image_url` (DB se, backend koi external call nahi karta).
//
//  • Sirf whitelist wale shehar (data/cities.js) — anjaan naam par koi call nahi
//  • DB mein photo na ho (shehar ka /current/ kabhi call hi nahi hua) → sirf
//    us shehar ke liye purana rasta (/current/, 3 ghante cache). Backend
//    woh photo DB mein save kar leta hai, to agli dafa yeh bhi band.
//  • Na mile / backend band / 429 → null (page apna purana neela design dikhaye)
//
//  Istemal: city page hero + CTA, Climate Guides cards, share image.
// ─────────────────────────────────────────────────────────────
import { serverGet } from './serverApi';
import { ENDPOINTS } from '../config/endpoints';
import { isKnownCity } from '../data/cities';

export const CITY_PHOTO_REVALIDATE = 60 * 60 * 3;
export const CITIES_INDEX_REVALIDATE = 60 * 60;

/** slug → image_url (backend `/weather/cities/`, ek call, 1 h cache). Fail → khaali Map. */
export async function getCitiesIndex() {
  try {
    const data = await serverGet(ENDPOINTS.weather.cities, { revalidate: CITIES_INDEX_REVALIDATE });
    return new Map((data?.cities || []).map((c) => [c.slug, c]));
  } catch {
    return new Map();
  }
}

/**
 * Jin pages ne history pehle se li hai: photo usi jawab se (0 extra calls,
 * backend round A6). Purana backend `image_url` na bheje → getCityPhoto.
 */
export async function photoFromHistory(data, slug) {
  return data?.image_url || getCityPhoto(slug);
}

export async function getCityPhoto(slug) {
  if (!slug || !isKnownCity(slug)) return null;
  const fromIndex = (await getCitiesIndex()).get(slug)?.image_url;
  if (fromIndex) return fromIndex;
  // Fallback (sirf jin ki photo DB mein abhi nahi): purana rasta
  try {
    const data = await serverGet(ENDPOINTS.weather.current, {
      params: { city: slug.replace(/-/g, ' ') },
      revalidate: CITY_PHOTO_REVALIDATE,
    });
    return data?.image_url || null;
  } catch {
    return null;
  }
}

// Size helpers ab utils/pexels.js mein (browser components bhi use karte hain)
export { pexelsSized, pexelsSrcSet } from '../utils/pexels';
