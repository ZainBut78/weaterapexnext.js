// ─────────────────────────────────────────────────────────────
//  Login tokens ke qawaid (Nov 2026) — apiClient aur AuthContext dono inhi par
//
//  Bug: purana (expire) access token har request ke saath jata tha. Django ka JWT
//  check AllowAny par bhi 401 de deta tha, is liye forgot password / OTP fail hote
//  the. Ab public auth calls par Authorization jata hi nahi. Doosra masla: website
//  endpoints expire token ko chupchap "anonymous" maante hain, is liye 401 kabhi nahi
//  aata tha aur navbar mein user logged-in dikhta rehta. Is liye expiry yahin dekhte hain.
// ─────────────────────────────────────────────────────────────
import { ENDPOINTS } from '../config/endpoints.js';

export const SESSION_EXPIRED_EVENT = 'weatherapex:session-expired';

// Yahan 401 ka matlab "ghalat password / ghalat OTP" hai, expire token nahi:
// na token bhejte hain, na refresh karte hain.
const PUBLIC_AUTH = [
  ENDPOINTS.auth.login,
  ENDPOINTS.auth.register,
  ENDPOINTS.auth.verifyOtp,
  ENDPOINTS.auth.resendOtp,
  ENDPOINTS.auth.emailStatus,
  ENDPOINTS.auth.refresh,
  ENDPOINTS.auth.forgotPassword,
  ENDPOINTS.auth.resetPassword,
  ENDPOINTS.auth.googleLogin,
];

export const isPublicAuthUrl = (url = '') => PUBLIC_AUTH.some((p) => url.includes(p));

/** JWT ki `exp` (ms). Parha na ja sake → null: faisla server kare. */
function jwtExpiry(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const exp = JSON.parse(atob(part)).exp;
    return Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/** 10 s pehle hi expire gino, taake raaste mein expire na ho. */
export function isJwtExpired(token, now = Date.now()) {
  const exp = token ? jwtExpiry(token) : null;
  return exp !== null && exp - 10000 <= now;
}

/** Access expire + refresh bhi nahi / expire = session mar chuka. */
export function isSessionDead(access, refresh, now = Date.now()) {
  if (!access || !isJwtExpired(access, now)) return false;
  return !refresh || isJwtExpired(refresh, now);
}

/** Tokens saaf + AuthContext ko khabar (navbar foran logged-out). */
export function clearStoredSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('username');
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
