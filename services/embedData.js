// ─────────────────────────────────────────────────────────────
//  Embed widget ka data + jawab (Nov 2026). Server-only.
//  Wahi fetches jo city / month page karte hain (cities index, history, climate years), apne
//  fetch cache ke saath: backend band ho to cached data se widget 200 deta hai; kabhi cache na
//  hua ho to 503 + Retry-After. Sirf mukammal shehar (sitemap wale), warna 404.
// ─────────────────────────────────────────────────────────────
import { getCountry } from '@/data/countries';
import { getCityRegistry } from '@/services/cityRegistry';
import { getCityYears, getHistory, yearsOf } from '@/services/history';
import { localePath } from '@/i18n/config';
import { cityName } from '@/i18n/places';
import { SITE_URL } from '@/utils/seo';
import { monthBySlug } from '@/utils/climateMath';
import { embedText } from '@/utils/embedText';
import { monthModel, renderMessage, renderMonth, renderYear, yearModel } from '@/utils/embedWidget';

const BASE_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'X-Robots-Tag': 'noindex',
  'Content-Security-Policy': 'frame-ancestors *',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
const RETRY_AFTER_SECONDS = 120;

const html = (body, status, cache) => new Response(body, { status, headers: { ...BASE_HEADERS, 'Cache-Control': cache } });

/** GET handler ka poora kaam. params: { lang, country, city, month? } */
export async function embedResponse(request, params) {
  const { lang, country: countrySlug, city: citySlug, month: monthSlug } = params;
  const theme = request.nextUrl.searchParams.get('theme') === 'dark' ? 'dark' : 'light';
  const T = embedText(lang);
  const missing = () => html(renderMessage({ lang, theme, text: T.notFound }), 404, 'public, max-age=600');
  const down = () => {
    const res = html(renderMessage({ lang, theme, text: T.unavailable }), 503, 'no-store');
    res.headers.set('Retry-After', String(RETRY_AFTER_SECONDS));
    return res;
  };

  const country = getCountry(decodeURIComponent(countrySlug));
  const month = monthSlug ? monthBySlug(decodeURIComponent(monthSlug)) : null;
  if (!country || (monthSlug && !month)) return missing();

  const reg = await getCityRegistry();
  const city = reg.get(decodeURIComponent(citySlug));
  if (!city) return reg.degraded ? down() : missing();
  if (city.countrySlug !== country.slug || !reg.cities.includes(city)) return missing();

  let data;
  let yearData;
  try {
    [data, yearData] = await Promise.all([getHistory(city.slug), month ? getCityYears(city.slug) : null]);
  } catch {
    return down();
  }
  if (!data?.monthly_data?.length) return missing();

  const years = yearsOf(data);
  const period = T.period(years.start, years.end);
  const name = cityName(lang, city);
  const links = {
    page: `${SITE_URL}${localePath(lang, month ? reg.monthPath(city.slug, month.slug) : reg.cityPath(city.slug))}`,
    trip: `${SITE_URL}${localePath(lang, '/trip-planner')}`,
    events: `${SITE_URL}${localePath(lang, '/events')}`,
  };

  if (month) {
    const model = monthModel({ monthly: data.monthly_data, monthNum: month.num, yearData });
    if (!model) return missing();
    return html(renderMonth({ lang, theme, cityName: name, monthNum: month.num, model, period, links }), 200, 'public, max-age=3600');
  }
  const model = yearModel({ monthly: data.monthly_data });
  if (!model) return missing();
  return html(renderYear({ lang, theme, cityName: name, model, period, links }), 200, 'public, max-age=3600');
}
