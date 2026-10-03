// ─────────────────────────────────────────────────────────────
//  SERVER se backend ko call — sirf Server Components ke liye
//
//  Browser wala apiClient.js relative "/api" use karta hai (proxy).
//  Server par relative URL kaam nahi karta, is liye yahan POORA pata:
//  API_INTERNAL_URL (local: http://127.0.0.1:8000/api, live:
//  https://api.weatherapex.com/api). Yeh value browser tak nahi jati.
//
//  `revalidate`: jawab itne second tak cache mein rehta hai — Google ya
//  1000 visitors aayein, backend ko phir bhi ek hi call jati hai.
//  (Open-Meteo ki limit bachane ke liye zaroori.)
//
//  Is file ko kisi 'use client' file mein import NA karein.
// ─────────────────────────────────────────────────────────────

const API_INTERNAL_URL = (process.env.API_INTERNAL_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');

// Backend request #8: Next.js server ki calls `X-Internal-Key` ke saath —
// backend anon burst guard (600/min per IP) nahi lagata, taake Googlebot
// crawl par 429 na aaye. SERVER-ONLY env (NEXT_PUBLIC_ nahi) — browser
// bundle mein kabhi nahi jati. Khaali ho to header nahi bheja jata.
const INTERNAL_KEY = process.env.BACKEND_INTERNAL_KEY || '';

// 404 → null (page `notFound()` dikhaye). Baqi har ghalti → throw
// (error.js dikhta hai; ghalat 200 "not found" page kabhi nahi).
export async function serverGet(path, { params, revalidate = 3600 } = {}) {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  const res = await fetch(`${API_INTERNAL_URL}${path}${qs}`, {
    next: { revalidate },
    headers: INTERNAL_KEY ? { Accept: 'application/json', 'X-Internal-Key': INTERNAL_KEY } : { Accept: 'application/json' },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = new Error(`Backend ${res.status} for ${path}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
