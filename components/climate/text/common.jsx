// Doosri zabanon ki climate text files ke mushtarak helpers (Intl par)
import { INTL_LOCALE } from '@/i18n/config';
import { mmToIn } from '@/utils/climateMath';

export function intlHelpers(lang) {
  const loc = INTL_LOCALE[lang];
  const long = new Intl.DateTimeFormat(loc, { month: 'long', timeZone: 'UTC' });
  const short = new Intl.DateTimeFormat(loc, { month: 'short', timeZone: 'UTC' });
  const nf1 = new Intl.NumberFormat(loc, { maximumFractionDigits: 1 });
  const nf0 = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });
  const lf = new Intl.ListFormat(loc, { type: 'conjunction' });
  const date = (n) => new Date(Date.UTC(2021, n - 1, 1));
  return {
    loc,
    month: (n) => long.format(date(n)),
    monthShort: (n) => short.format(date(n)).replace(/\.$/, ''),
    list: (items) => lf.format(items),
    n1: (v) => (v == null ? '—' : nf1.format(v)),
    n0: (v) => (v == null ? '—' : nf0.format(Math.round(v))),
    mmToIn,
  };
}

// Pehla harf bara (jumle ke shuru mein)
export const cap = (s) => (s ? s[0].toLocaleUpperCase() + s.slice(1) : s);
