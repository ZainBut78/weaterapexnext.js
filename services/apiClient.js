import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '../config/endpoints';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
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

// In endpoints par 401 ka matlab "ghalat password / ghalat OTP" hai,
// expired token nahi — in par refresh nahi karna.
const NO_REFRESH = [
  ENDPOINTS.auth?.login,
  ENDPOINTS.auth?.register,
  ENDPOINTS.auth?.verifyOtp,
  ENDPOINTS.auth?.refresh,
  ENDPOINTS.auth?.forgotPassword,
  ENDPOINTS.auth?.resetPassword,
  ENDPOINTS.auth?.googleLogin,
].filter(Boolean);

const isAuthEndpoint = (url = '') => NO_REFRESH.some((p) => url.includes(p));

let refreshPromise = null;

const clearSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('username');
};

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

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status;
    const config = err.config || {};

    if (status === 429) {
      const data = err.response?.data || {};
      if (data.code === 'free_limit_reached') {
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

    if (
      status !== 401 ||
      config._retried ||
      isAuthEndpoint(config.url) ||
      !localStorage.getItem('refresh_token')
    ) {
      return Promise.reject(err);
    }

    config._retried = true;

    if (!refreshPromise) {
      refreshPromise = runRefresh().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const access = await refreshPromise;
      config.headers = { ...(config.headers || {}), Authorization: `Bearer ${access}` };
      return apiClient(config);
    } catch {
      clearSession();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
      return Promise.reject(err);
    }
  }
);

export default apiClient;
