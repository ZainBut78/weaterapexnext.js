'use client';

// ─────────────────────────────────────────────────────────────
//  Language switcher (i18n Phase 1) — isi page ka doosri zaban wala URL
//
//  • Sirf ENABLED_LOCALES wali zabanein (owner: tayyar na ho to chhupi)
//  • Page ne alternates diye hon (blog ke alag slugs) to wahi, aur jo zaban
//    us list mein nahi us ka link NAHI (woh version hai hi nahi)
//  • Sirf ek zaban (aaj: English) → kuch render nahi — design bilkul wahi
//  • Saade <a> links (crawlable); koi auto-redirect / cookie nahi
//  • WeatherSpark jaisa (Oct 2026): header mein dropdown (mobile par bhi,
//    menu khole baghair), footer mein saari zabanein "Deutsch (German)".
//    Dropdown <details> nahi — iOS Safari par bahar tap se band nahi hota tha
//    aur "back" par khula reh jata tha. translate="no": browser ka translator
//    "Deutsch" waghera ko na badle.
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { LOCALE_ENGLISH_NAMES, LOCALE_NAMES, localePath } from '@/i18n/config';
import { useAlternates, useBarePathname, useEnabledLocales, useLang, useT } from '@/i18n/client';

export function useLanguageOptions() {
  const lang = useLang();
  const enabled = useEnabledLocales();
  const alternates = useAlternates();
  const bare = useBarePathname();
  const list = enabled.includes(lang) ? enabled : [...enabled, lang];
  return list
    .map((l) => ({ lang: l, name: LOCALE_NAMES[l], href: alternates ? alternates[l] : localePath(l, bare), current: l === lang }))
    .filter((o) => o.current || o.href);
}

const fullName = (o) => (o.lang === 'en' ? o.name : `${o.name} (${LOCALE_ENGLISH_NAMES[o.lang]})`);

export default function LanguageSwitcher({ variant = 'dropdown' }) {
  const t = useT();
  const options = useLanguageOptions();
  if (options.length < 2) return null;

  if (variant === 'footer') {
    return (
      <nav aria-label={t('langSwitch.label')} translate="no" className="mt-10">
        <p className="flex items-center gap-2 text-sm font-bold text-[#002244] mb-3">
          <Globe className="w-4 h-4" aria-hidden="true" /> {t('langSwitch.label')}
        </p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-2 text-sm">
          {options.map((o) => (
            <li key={o.lang}>
              {o.current ? (
                <span lang={o.lang} aria-current="true" className="font-semibold text-[#0077b6]">{fullName(o)}</span>
              ) : (
                <a href={o.href} hrefLang={o.lang} lang={o.lang} className="text-[#4a607a] hover:text-[#0077b6] transition-colors">
                  {fullName(o)}
                </a>
              )}
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  if (variant === 'menu') {
    return (
      <nav aria-label={t('langSwitch.label')} translate="no" className="flex flex-wrap gap-2">
        {options.map((o) => (o.current ? (
          <span key={o.lang} lang={o.lang} aria-current="true" className="font-semibold text-[#0077b6]">{o.name}</span>
        ) : (
          <a key={o.lang} href={o.href} hrefLang={o.lang} lang={o.lang} className="text-[#4a607a] hover:text-[#0077b6] transition-colors">
            {o.name}
          </a>
        )))}
      </nav>
    );
  }

  return <LanguageDropdown options={options} label={t('langSwitch.label')} />;
}

function LanguageDropdown({ options, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find((o) => o.current);

  useEffect(() => {
    if (!open) return undefined;
    // pointerdown: iOS par bhi bahar ka tap pakarta hai (click nahi hota non-clickable par)
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  // Safari "back" (bfcache) par purana khula state wapas na aaye
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener('pageshow', close);
    return () => window.removeEventListener('pageshow', close);
  }, []);

  return (
    <div ref={ref} className="relative" translate="no">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 min-h-11 px-2 rounded-lg text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-[#f0f5ff] transition-colors"
      >
        <Globe className="w-4 h-4" aria-hidden="true" /> {current?.lang.toUpperCase()}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <ul className="absolute right-0 mt-1 min-w-48 py-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          {options.map((o) => (
            <li key={o.lang}>
              {o.current ? (
                <span lang={o.lang} aria-current="true" className="flex items-center min-h-11 px-4 text-sm font-semibold text-[#0077b6]">{fullName(o)}</span>
              ) : (
                <a
                  href={o.href}
                  hrefLang={o.lang}
                  lang={o.lang}
                  onClick={() => setOpen(false)}
                  className="flex items-center min-h-11 px-4 text-sm text-gray-700 hover:bg-[#f0f5ff]"
                >
                  {fullName(o)}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
