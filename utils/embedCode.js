// ─────────────────────────────────────────────────────────────
//  Bloggers ka copy code (Nov 2026): iframe + iframe ke BAHAR ek saada link (backlink sirf woh
//  ginta hai). Anchor = brand + page ka naam, keyword-stuffing nahi. Pure: client copy box aur
//  tests/unit/embedCode.test.mjs dono yahi function chalate hain. Zaban ka text (utils/embedCodeText)
//  bahar se aata hai, taake browser bundle mein sirf ek zaban ho.
// ─────────────────────────────────────────────────────────────
import { MONTH_HEIGHT, MONTH_SLUGS, YEAR_HEIGHT, esc, fillTitle } from './embedConst.js';

export const SITE = 'https://weatherapex.com';
const LOCALE = { en: 'en-GB', de: 'de-DE', it: 'it-IT', ja: 'ja-JP', fr: 'fr-FR', es: 'es-ES' };
const prefix = (lang) => (lang === 'en' ? '' : `/${lang}`);
export const monthName = (lang, m) => new Intl.DateTimeFormat(LOCALE[lang] || 'en-GB', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, m - 1, 1)));

/** Widget aur us ke page ka path (zaban ke prefix ke saath) */
export function embedPaths({ lang, countrySlug, citySlug, monthNum }) {
  const place = `${countrySlug}/${citySlug}${monthNum ? `/${MONTH_SLUGS[monthNum - 1]}` : ''}`;
  return { widget: `${prefix(lang)}/embed/${place}`, page: `${prefix(lang)}/weather/${place}` };
}

/**
 * @param o.cityName  shehar ka naam code ki zaban mein
 * @param o.monthNum  1–12 ya null (saal bhar)
 * @param o.text      utils/embedCodeText/<lang>.js (isi zaban ka)
 */
export function embedCode({ lang, countrySlug, citySlug, cityName, monthNum = null, theme = 'light', trip = false, text: C }) {
  const paths = embedPaths({ lang, countrySlug, citySlug, monthNum });
  const title = monthNum ? fillTitle(C.titleMonth, cityName, monthName(lang, monthNum)) : fillTitle(C.titleYear, cityName);
  const src = `${SITE}${paths.widget}${theme === 'dark' ? '?theme=dark' : ''}`;
  const height = monthNum ? MONTH_HEIGHT : YEAR_HEIGHT;
  const lines = [
    `<iframe src="${esc(src)}" width="100%" height="${height}" style="border:0" loading="lazy" title="${esc(title)}"></iframe>`,
    `<p style="font-size:13px">${esc(C.data)} <a href="${esc(`${SITE}${paths.page}`)}">WeatherApex — ${esc(title)}</a></p>`,
  ];
  if (trip) {
    lines.push(`<p style="font-size:13px">${esc(C.trip[0])}<a href="${esc(`${SITE}${prefix(lang)}/trip-planner`)}">${esc(C.trip[1])}</a>${esc(C.trip[2])}</p>`);
  }
  return lines.join('\n');
}
