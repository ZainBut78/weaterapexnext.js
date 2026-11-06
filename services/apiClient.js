import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '../config/endpoints.js';
import { clearStoredSession, isJwtExpired, isPublicAuthUrl } from '../utils/authSession.js';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  // Public auth (login, OTP, forgot password...) par token kabhi nahi: purana token
  // Django 401 kar deta tha aur "Could not send the code" aata tha
  if (isPublicAuthUrl(config.url)) {
    delete config.headers.Authorization;
    return config;
  }
  let token = localStorage.getItem('access_token');
  // Website endpoints expire token ko chupchap anonymous maante hain (401 nahi aata),
  // is liye yahin dekhte hain: naya lao, ya mara hua session saaf karo
  if (token && isJwtExpired(token)) token = await freshAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ──────────────────────────────────────────────────────────────────────
// JWT refresh
//
// BUG: backend ka access token sirf 1 GHANTA chalta hai (settings mein
// ACCESS_TOKEN_LIFETIME = 1 hour) aur refresh 7 din. Frontend refresh
// endpoint ko kabhi call hi nahi karta tha. Nateeja: 1 ghante baad
// username localStorage mein pada rehta (navbar mein user logged-in
// dikhta) magar har authenticated request 401 deti thi — aur 401 ko bhi
// koi handle nahi karta tha. User ko sirf "kuch kaam nahi kar raha"
// dikhta, logout kar ke dobara login karna parta tha.
//
// Ab: 401 aaye to EK BAAR refresh, phir wahi request dobara. Refresh bhi
// fail ho jaye (7 din guzar gaye ya token revoke) to storage saaf aur
// /login. Ek waqt mein sirf ek refresh call jati hai (refreshPromise),
// warna 5 parallel requests 5 refresh calls bhej deti hain aur
// ROTATE_REFRESH_TOKENS=True hone ki wajah se baqi 4 invalid ho jati.
// ──────────────────────────────────────────────────────────────────────

let refreshPromise = null;

const runRefresh = () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return Promise.reject(new Error('no refresh token'));

  // Naya axios instance — apiClient use karne se yeh interceptor
  // khud par lag jata aur loop ban jata.
  return axios
    .post(`${API_BASE_URL}${ENDPOINTS.auth.refresh}`, { refresh: refreshToken })
    .then(({ data }) => {
      // SimpleJWT `access` / `refresh` bhejta hai; login endpoint
      // `access_token` / `refresh_token`. Dono handle kar lete hain.
      const access = data.access || data.access_token;
      if (!access) throw new Error('refresh response mein access token nahi');
      localStorage.setItem('access_token', access);
      const newRefresh = data.refresh || data.refresh_token;
      if (newRefresh) localStorage.setItem('refresh_token', newRefresh);
      return access;
    });
};

const sharedRefresh = () => {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

// Expire access token ki jagah naya. Refresh bhi mar chuka / server ne mana kiya →
// session saaf, null. Network ghalti → tokens rehne do (kharab wifi logout na kare).
async function freshAccessToken() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh || isJwtExpired(refresh)) {
    clearStoredSession();
    return null;
  }
  try {
    return await sharedRefresh();
  } catch (err) {
    if (err?.response) clearStoredSession();
    return null;
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status;
    const config = err.config || {};

    if (status === 429) {
      const data = err.response?.data || {};
      if (data.code === 'free_limit_reached' || data.code === 'user_daily_limit') {
        // Yeh "site kharab hai" wali error NAHI hai — user ki aaj ki
        // free calls khatam hui hain. Pehle sirf ek laal box dikhta tha
        // ("Could not fetch data"), jis se user ko lagta tha kuch toot
        // gaya, aur hum apne hi signup ka mauqa zaya kar dete the.
        // Ab poori app mein kahin se bhi limit lage, signup wala popup
        // khud khul jata hai (FreeLimitModal us event ko sunta hai).
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('weatherapex:free-limit', { detail: data })
          );
        }
      } else {
        console.warn('Rate limited — try again later');
      }
    }

    if (status !== 401 || isPublicAuthUrl(config.url)) {
      return Promise.reject(err);
    }

    // Protected call par token rad, aur refresh ka raasta nahi: dead tokens saaf
    if (config._retried || !localStorage.getItem('refresh_token')) {
      clearStoredSession();
      return Promise.reject(err);
    }

    config._retried = true;

    try {
      const access = await sharedRefresh();
      config.headers = { ...(config.headers || {}), Authorization: `Bearer ${access}` };
      return apiClient(config);
    } catch (refreshErr) {
      if (!refreshErr?.response) return Promise.reject(err);   // network: session rehne do
      clearStoredSession();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
      return Promise.reject(err);
    }
  }
);

export default apiClient;
