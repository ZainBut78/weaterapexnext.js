// ─────────────────────────────────────────────────────────────
//  Backend error → user ki zaban mein (i18n Phase 5, Oct 2026)
//
//  Backend har user-facing error ke saath `code` (+ zaroorat ho to `params`)
//  bhejta hai, English `error` text waisa hi. English site: jo pehle dikhta
//  tha bilkul wahi (`english`). Doosri zaban: `errors.api.<code>`; code na ho /
//  pehchana na jaye (purana backend) → us zaban ka generic message — English
//  backend text kabhi /de/... par nahi.
// ─────────────────────────────────────────────────────────────
export function apiErrorText(err, { t, lang, english }) {
  if (!lang || lang === 'en') return english;
  const data = err?.response?.data;
  const code = typeof data?.code === 'string' ? data.code : '';
  if (/^[a-z0-9_]+$/.test(code)) {
    const key = `errors.api.${code}`;
    const v = t(key, data?.params && typeof data.params === 'object' ? data.params : {});
    if (v && v !== key) return v;
  }
  return t('errors.api.generic');
}
