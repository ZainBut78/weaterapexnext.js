// ─────────────────────────────────────────────────────────────
//  Auth forms ka error message (hardening, Oct 2026)
//
//  Backend ab login / register / OTP par rate limit + lockout lagata hai:
//  HTTP 429 {"error", "code", "retry_after"} (+ Retry-After header).
//  429 par generic "Login failed" ki jagah saaf message; baqi errors
//  pehle jaise (backend ka `error`, warna fallback).
//  i18n: `t` (useT) diya ho to 429 wala message us zaban mein.
//  Phase 5: `lang` (doosri zaban) → backend ka `code` → errors.api.<code>;
//  code na ho → `fallback` (us zaban ka). English: pehle jaisa backend text.
// ─────────────────────────────────────────────────────────────
export function authErrorMessage(err, fallback, t, lang) {
  const res = err?.response;
  if (res?.status === 429) {
    const secs = Number(res.data?.retry_after) || Number(res.headers?.['retry-after']) || 60;
    const mins = Math.max(1, Math.ceil(secs / 60));
    if (t) return t('auth.tooMany', { count: mins });
    return `Too many attempts, try again in ${mins} minute${mins === 1 ? '' : 's'}.`;
  }
  if (t && lang && lang !== 'en') {
    const code = typeof res?.data?.code === 'string' ? res.data.code : '';
    const key = `errors.api.${code}`;
    const v = /^[a-z0-9_]+$/.test(code) ? t(key, res.data.params || {}) : null;
    return v && v !== key ? v : fallback;
  }
  return res?.data?.error || fallback;
}
