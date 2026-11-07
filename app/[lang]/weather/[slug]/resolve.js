// /weather/<country>/<city>[/<month>] ke params ki jaanch — backend history call se PEHLE.
// Shehar ab registry se (services/cityRegistry.js): static 160 + DB ke mukammal
// shehar. Ghalat mulk, registry se bahar shehar, ya shehar kisi aur mulk ka → 404.
// DB duplicate slug (jaise "newyork") → 301 asli shehar ke URL par.
import { notFound, permanentRedirect } from 'next/navigation';
import { getCountry } from '@/data/countries';
import { monthBySlug } from '@/utils/climateMath';
import { getCityRegistry } from '@/services/cityRegistry';
import { backendDownError } from '@/services/serverApi';
import { localePath } from '@/i18n/config';
import { currentLang } from '@/i18n/server';

export async function resolveCity(countrySlug, citySlug, monthSlug = null) {
  const country = getCountry(decodeURIComponent(countrySlug));
  const slug = decodeURIComponent(citySlug);
  if (!country) notFound();
  const reg = await getCityRegistry();
  const canonical = reg.aliases.get(slug);
  if (canonical && reg.has(canonical)) {
    // i18n: redirect usi zaban mein (/de/... → /de/...)
    const lang = await currentLang();
    permanentRedirect(localePath(lang, monthSlug ? reg.monthPath(canonical, monthSlug) : reg.cityPath(canonical)));
  }
  const city = reg.get(slug);
  // Backend band: sirf static list hai, DB ka shehar us mein nahi. Asli 404 nahi hai:
  // notFound() cache ho kar achhe page ki jagah le leta hai, recovery ke baad bhi.
  if (!city && reg.degraded) throw backendDownError(`city ${slug}`);
  if (!city || city.countrySlug !== country.slug) notFound();
  return { country, city, reg };
}

export function resolveMonth(monthSlug) {
  const month = monthBySlug(decodeURIComponent(monthSlug));
  if (!month) notFound(); // /smarch → 404
  return month;
}
