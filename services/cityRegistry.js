// ─────────────────────────────────────────────────────────────
//  CITY REGISTRY — site par kaun se shehar hain (dynamic, Oct 2026)
//
//  Pehle sirf hardcoded 160 (data/cities.js). Ab: woh 160 + backend DB ka
//  har woh shehar jis ka 20-saal data mukammal ho (`history_complete`) aur
//  mulk hamari COUNTRIES list mein mile. Naya shehar DB mein mukammal hote
//  hi us ka /weather/<country>/<city> + 12 month pages, sitemap aur links
//  khud ban jate hain (index 1 ghanta cache, tag "cities" — backend
//  /api/revalidate se foran bhi taaza kar sakta hai).
//
//  • Static 160: wahi slug/naam/tz/tags — canonical URL nahi badalta;
//    purana /weather/<city> 301 (proxy.js) sirf inhi ke liye.
//  • DB duplicate (jaise "newyork" bhi aur "new-york" bhi): naam + mulk
//    ek → ek hi shehar; doosra slug `aliases` mein (us ka URL 301 → asli).
//  • Mulk COUNTRIES mein na mile / slug kisi mulk ke slug jaisa → shamil
//    nahi (`skipped`, wajah ke saath — report ke liye).
//  • Backend down → sirf static 160 (site gayab na ho; data na mile to
//    page waise bhi 5xx).
//  Sirf SERVER par (services/serverApi).
// ─────────────────────────────────────────────────────────────
import { cache } from 'react';
import { serverGet } from './serverApi';
import { ENDPOINTS } from '@/config/endpoints';
import { buildRegistry } from '@/utils/cityRegistryCore';

const CITIES_INDEX_REVALIDATE = 60 * 60;   // cityPhoto / history wala hi fetch (ek cache entry)

async function fetchIndex() {
  const data = await serverGet(ENDPOINTS.weather.cities, { revalidate: CITIES_INDEX_REVALIDATE, tags: ['cities'] });
  return data?.cities || [];
}

/** Ek request mein ek dafa (React cache); fetch khud 1 ghanta cache. */
export const getCityRegistry = cache(async () => {
  try {
    return buildRegistry(await fetchIndex());
  } catch {
    return buildRegistry(null);
  }
});
