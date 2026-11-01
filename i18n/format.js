// ─────────────────────────────────────────────────────────────
//  Zaban ke hisaab se numbers / dates / mahine (Intl) — server + client
//
//  en = en-US (site pehle se yahi istemal karti thi) → English bilkul wahi.
//  de/it/fr/es: 21,7 (decimal comma) — Intl khud. ja: 1月.
// ─────────────────────────────────────────────────────────────
import { INTL_LOCALE } from './config';

const loc = (lang) => INTL_LOCALE[lang] || INTL_LOCALE.en;

/** Number: formatNumber('de', 21.7, 1) → "21,7" · digits = zyada se zyada decimals */
export function formatNumber(lang, n, digits = 0, opts = {}) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '';
  return new Intl.NumberFormat(loc(lang), { maximumFractionDigits: digits, ...opts }).format(Number(n));
}

/** Date (Date ya 'YYYY-MM-DD' / ISO) — options Intl.DateTimeFormat wale */
export function formatDate(lang, d, opts = { year: 'numeric', month: 'long', day: 'numeric' }) {
  const date = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00Z`) : new Date(d);
  const o = opts.timeZone ? opts : { ...opts, timeZone: 'UTC' };
  return new Intl.DateTimeFormat(loc(lang), o).format(date);
}

/** Mahine ka naam (1–12): monthName('de', 1) → "Januar", ('ja', 1) → "1月" */
export function monthName(lang, num, style = 'long') {
  return new Intl.DateTimeFormat(loc(lang), { month: style, timeZone: 'UTC' }).format(new Date(Date.UTC(2021, num - 1, 1)));
}

/** Hafte ka din (Date) */
export function weekdayName(lang, d, style = 'long') {
  return new Intl.DateTimeFormat(loc(lang), { weekday: style, timeZone: 'UTC' }).format(new Date(d));
}

/** Mulk ka naam ISO code se (Intl.DisplayNames): ('de', 'JP') → "Japan", ('ja','JP') → "日本" */
export function countryName(lang, iso2, fallback) {
  if (!iso2) return fallback;
  try {
    return new Intl.DisplayNames([loc(lang)], { type: 'region' }).of(iso2) || fallback;
  } catch {
    return fallback;
  }
}

export const intlLocale = loc;
