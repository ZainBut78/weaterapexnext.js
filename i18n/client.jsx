'use client';

// ─────────────────────────────────────────────────────────────
//  Client components ke liye zaban + strings (React context)
//
//  Layout <I18nProvider> lagata hai — sirf woh namespaces jo client
//  components ko chahiye (poori messages file har page ke payload mein
//  nahi). Kisi tool page ko apne namespaces chahiye hon to woh andar ek
//  aur <I18nProvider messages={...}> lagata hai — upar wale ke saath merge.
// ─────────────────────────────────────────────────────────────
import { createContext, useContext, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { DEFAULT_LOCALE, barePath, localePath } from './config';
import { makeT } from './translate';

const I18nContext = createContext({ lang: DEFAULT_LOCALE, messages: {}, enabled: [DEFAULT_LOCALE], alternates: null });

// `alternates` (optional): { en: '/blog/x', de: '/de/blog/y' } — is page ke
// doosri zabanon wale URL. Jo zaban is mein NAHI, us ka version nahi →
// switcher us ko nahi dikhata. Na diya ho → har zaban mein wahi path.
export function I18nProvider({ lang, messages, enabled, alternates, children }) {
  const parent = useContext(I18nContext);
  const value = useMemo(() => ({
    lang: lang || parent.lang,
    enabled: enabled || parent.enabled,
    messages: messages ? { ...parent.messages, ...messages } : parent.messages,
    alternates: alternates || parent.alternates,
  }), [lang, enabled, messages, alternates, parent]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useLang = () => useContext(I18nContext).lang;
export const useEnabledLocales = () => useContext(I18nContext).enabled;
export const useAlternates = () => useContext(I18nContext).alternates;

export function useT() {
  const { lang, messages } = useContext(I18nContext);
  return useMemo(() => makeT(lang, messages), [lang, messages]);
}

/** '/blog' → '/de/blog' (maujooda zaban ke hisaab se) */
export function useLocalePath() {
  const lang = useLang();
  return useMemo(() => (path) => localePath(lang, path), [lang]);
}

/** usePathname bina zaban ke — server (/en/x) aur browser (/x) dono par '/x' */
export function useBarePathname() {
  return barePath(usePathname() || '/');
}

/** useRouter jaisa — push/replace/prefetch ke andar ke path par zaban ka prefix */
export function useLocaleRouter() {
  const router = useRouter();
  const lp = useLocalePath();
  return useMemo(() => ({
    ...router,
    push: (href, opts) => router.push(lp(href), opts),
    replace: (href, opts) => router.replace(lp(href), opts),
    prefetch: (href, opts) => router.prefetch(lp(href), opts),
  }), [router, lp]);
}
