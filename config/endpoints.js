// ─────────────────────────────────────────────────────────────
//  Backend ka pata + saare endpoints
//
//  VITE SE FARQ:
//  • Vite mein `import.meta.env.VITE_...` hota tha; Next.js mein
//    `process.env.NEXT_PUBLIC_...`. `NEXT_PUBLIC_` wali value browser
//    tak jati hai (secret kabhi is naam se na rakhein).
//  • Purane project mein har endpoint (/weather/current/ wagera) bhi
//    .env mein tha — 20 lines. Yeh raaste kabhi nahi badalte (local ho
//    ya live, backend wahi paths deta hai), is liye yahan seedhe likh
//    diye. .env mein ab sirf woh cheez hai jo sach mein badalti hai:
//    backend ka BASE URL.
// ─────────────────────────────────────────────────────────────

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

const BLOG_LIST = '/blog/posts/';
const API_KEYS_REVOKE = '/auth/keys/';

export const ENDPOINTS = {
  weather: {
    current: '/weather/current/',
    history: '/weather/history/',
    // Backend round (A4/A5): DB-only, Open-Meteo ko call nahi
    cities: '/weather/cities/',
    climateSummary: '/weather/climate/summary/',
  },
  trips: {
    plan: '/trips/plan/',
    recommend: '/trips/plan/recommend/',
    citySearch: '/trips/plan/cities/search/',
  },
  events: {
    risk: '/events/risk/',
  },
  blog: {
    list: BLOG_LIST,
    detail: (slug) => `${BLOG_LIST}${slug}/`,
    // Backend round B: recommendation system
    related: '/blog/related/',
    postRelated: (slug) => `${BLOG_LIST}${slug}/related/`,
  },
  auth: {
    register: '/auth/register/',
    verifyOtp: '/auth/verify-otp/',
    login: '/auth/login/',
    forgotPassword: '/auth/forgot-password/',
    resetPassword: '/auth/reset-password/',
    googleLogin: '/auth/google-login/',
    refresh: '/auth/refresh/',
  },
  apiKeys: {
    generate: '/auth/keys/generate/',
    list: '/auth/keys/',
    revoke: (id) => `${API_KEYS_REVOKE}${id}/revoke/`,
  },
};
