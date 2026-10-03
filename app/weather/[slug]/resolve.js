// /weather/<country>/<city>[/<month>] ke params ki jaanch — backend call se PEHLE.
// Ghalat mulk, whitelist se bahar shehar, ya shehar kisi aur mulk ka → 404.
import { notFound } from 'next/navigation';
import { isKnownCity, getCity } from '@/data/cities';
import { getCountry, countryOfCity } from '@/data/countries';
import { monthBySlug } from '@/utils/climateMath';

export function resolveCity(countrySlug, citySlug) {
  const country = getCountry(decodeURIComponent(countrySlug));
  const slug = decodeURIComponent(citySlug);
  if (!country || !isKnownCity(slug) || countryOfCity(slug)?.slug !== country.slug) notFound();
  return { country, city: getCity(slug) };
}

export function resolveMonth(monthSlug) {
  const month = monthBySlug(decodeURIComponent(monthSlug));
  if (!month) notFound(); // /smarch → 404
  return month;
}
