// ─────────────────────────────────────────────────────────────
//  Auth forms ka error message (hardening, Oct 2026)
//
//  Backend ab login / register / OTP par rate limit + lockout lagata hai:
//  HTTP 429 {"error", "code", "retry_after"} (+ Retry-After header).
//  429 par generic "Login failed" ki jagah saaf message; baqi errors
//  pehle jaise (backend ka `error`, warna fallback).
// ─────────────────────────────────────────────────────────────
export function authErrorMessage(err, fallback) {
  const res = err?.response;
  if (res?.status === 429) {
    const secs = Number(res.data?.retry_after) || Number(res.headers?.['retry-after']) || 60;
    const mins = Math.max(1, Math.ceil(secs / 60));
    return `Too many attempts, try again in ${mins} minute${mins === 1 ? '' : 's'}.`;
  }
  return res?.data?.error || fallback;
}
