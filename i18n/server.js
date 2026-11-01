// ─────────────────────────────────────────────────────────────
//  i18n — SIRF server (pages, layouts, metadata, sitemap)
//
//  ENABLED_LOCALES (server env, Hostinger): kaunsi zabanein "live" hain —
//  misal "en,de". Jo is mein NAHI (default: sirf en):
//    • har page noindex (meta + X-Robots-Tag, proxy.js)
//    • sitemap, hreflang aur language switcher se bahar
//  Page phir bhi khulta hai (review ke liye) — Google ko sirf noindex.
//  Owner ki shart: zaban tab hi on ho jab us ke climate templates (Phase 3)
//  AUR blog tarjume dono tayyar hon.
// ─────────────────────────────────────────────────────────────
import { lang as rootLang } from 'next/root-params';
import { DEFAULT_LOCALE, isLocale, parseEnabledLocales } from './config';
import { makeT } from './translate';
import en from '@/messages/en.json';
import de from '@/messages/de.json';
import it from '@/messages/it.json';
import ja from '@/messages/ja.json';
import fr from '@/messages/fr.json';
import es from '@/messages/es.json';

const DICTS = { en, de, it, ja, fr, es };

export const enabledLocales = () => parseEnabledLocales(process.env.ENABLED_LOCALES);

export const isEnabledLocale = (lang) => enabledLocales().includes(lang);

export function getDictionary(lang) {
  return DICTS[isLocale(lang) ? lang : DEFAULT_LOCALE];
}

/** t() — lang na diya ho to root param (/[lang]) se. */
export async function getT(lang) {
  const l = isLocale(lang) ? lang : await currentLang();
  return makeT(l, getDictionary(l), l === DEFAULT_LOCALE ? null : en);
}

/** Maujooda page ki zaban (app/[lang] ka root param). */
export async function currentLang() {
  try {
    const l = await rootLang();
    return isLocale(l) ? l : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;              // route handler / sitemap (root param nahi)
  }
}
