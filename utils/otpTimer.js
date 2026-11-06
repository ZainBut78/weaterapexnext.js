// ─────────────────────────────────────────────────────────────
//  OTP screens ka timer (Nov 2026) — pure helpers, hooks/useOtpSession.js inhi par
//
//  sessionStorage mein AAKHRI WAQT (timestamp) rakhte hain, baqi seconds nahi:
//  refresh ke baad bhi wahi timer, aur har tick Date.now() se (drift nahi).
//  Waqt server ke retry_after / expires_in se; purana backend na bheje → 60 s / 10 min.
// ─────────────────────────────────────────────────────────────
export const DEFAULT_RETRY_AFTER = 60;
export const DEFAULT_EXPIRES_IN = 600;

const storageKey = (scope) => `otp_session:${scope}`;

/** zain@gmail.com → z***@gmail.com */
export function maskEmail(email) {
  const [name, domain] = String(email || '').split('@');
  if (!name || !domain) return email || '';
  return `${name[0]}***@${domain}`;
}

/** 75 → "01:15" */
export function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function secondsLeft(endAt, now = Date.now()) {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}

export function makeSession(email, data, now = Date.now()) {
  return {
    email,
    sentAt: now,
    resendAt: now + (Number(data?.retry_after) || DEFAULT_RETRY_AFTER) * 1000,
    expiresAt: now + (Number(data?.expires_in) || DEFAULT_EXPIRES_IN) * 1000,
  };
}

export function loadSession(scope) {
  try {
    const session = JSON.parse(sessionStorage.getItem(storageKey(scope)));
    return session?.email && session.resendAt && session.expiresAt ? session : null;
  } catch {
    return null;
  }
}

export function saveSession(scope, session) {
  try {
    if (session) sessionStorage.setItem(storageKey(scope), JSON.stringify(session));
    else sessionStorage.removeItem(storageKey(scope));
  } catch {
    // Private mode waghera: timer sirf is page tak
  }
  return session;
}
