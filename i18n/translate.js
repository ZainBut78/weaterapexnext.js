// ─────────────────────────────────────────────────────────────
//  t() — messages/{lang}.json se string (server + client dono)
//
//  t('nav.home')                         → "Home"
//  t('hero.title', { city: 'Berlin' })   → "{city}" ki jagah Berlin
//  Plural: value object ho { one, other } (aur ja/… ke liye sirf other) —
//  t('days', { count: 3 }) Intl.PluralRules se sahi shakal chunta hai.
//
//  Key na mile → English (messages/en.json) fallback + dev mein warning.
//  scripts/check-messages.mjs har zaban mein har key ki maujoodgi pakki
//  karta hai — is liye production mein fallback kabhi nahi lagna chahiye.
// ─────────────────────────────────────────────────────────────
import { Fragment, createElement } from 'react';
import { INTL_LOCALE } from './config';

function lookup(obj, key) {
  let cur = obj;
  for (const part of key.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[part];
  }
  return cur;
}

function fill(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined || vars[k] === null ? m : String(vars[k])));
}

export function makeT(lang, messages, fallback) {
  const rules = new Intl.PluralRules(INTL_LOCALE[lang] || 'en-US');
  const t = (key, vars) => {
    let v = lookup(messages, key);
    if (v === undefined && fallback) {
      v = lookup(fallback, key);
      if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] ${lang}: missing "${key}"`);
    }
    if (v === undefined) return key;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const n = vars?.count;
      if (typeof n === 'number' && (v.other !== undefined)) {
        v = v[rules.select(n)] ?? v.other;
      } else {
        return v;                        // poora namespace / object maanga gaya
      }
    }
    return typeof v === 'string' ? fill(v, vars) : v;
  };
  t.raw = (key) => lookup(messages, key) ?? (fallback ? lookup(fallback, key) : undefined);
  // Text ke beech React element: t.rich('x', { email: <b>{e}</b> }) → array
  t.rich = (key, vars = {}) => {
    const str = t(key, Object.fromEntries(Object.entries(vars).filter(([, v]) => typeof v !== 'object')));
    return String(str).split(/(\{\w+\})/).filter(Boolean).map((part, i) => {
      const m = /^\{(\w+)\}$/.exec(part);
      return createElement(Fragment, { key: i }, m && vars[m[1]] !== undefined ? vars[m[1]] : part);
    });
  };
  t.lang = lang;
  return t;
}

/** Sirf yeh namespaces (top-level keys) — client ko poori file na bhejni pare. */
export function pickNamespaces(messages, names) {
  const out = {};
  for (const n of names) if (messages[n] !== undefined) out[n] = messages[n];
  return out;
}
