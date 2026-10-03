# WeatherApex — Next.js (seekhne wali guide)

Yeh WeatherApex ka naya frontend hai, Next.js mein. Purana Vite wala
project (`APEX_WEATER_FRONTED`) waisa hi chal raha hai — us ko is
project se koi farq nahi parta.

## Chalane ka tareeqa (apne computer par)

CMD kholein aur is folder mein jayein:

```
cd "D:\python projects\apexweather+nextjs"
```

Pehli dafa (sirf ek baar) — packages download karo:

```
npm install
```

Development server chalao:

```
npm run dev
```

Browser mein kholo: http://localhost:3000
Band karna ho to CMD mein `Ctrl + C`.

| Command | Kya karta hai |
|---|---|
| `npm install` | `package.json` mein likhe packages `node_modules` mein download karta hai |
| `npm run dev` | Development server — file save karo, page khud refresh |
| `npm run build` | Live (production) ke liye tayyar version banata hai |
| `npm start` | `build` ke baad production server chalata hai (Hostinger yehi karega) |

## Folder structure — kaunsi cheez kahan

```
apexweather+nextjs/
├── app/                      ← POORI WEBSITE. Har folder = ek URL
│   ├── layout.js             ← har page ka frame (<html>, providers)
│   ├── providers.jsx         ← React Query + Auth + City (purana main.jsx)
│   ├── page.js               ← "/" home page (purana LandingPage.jsx)
│   ├── error.js              ← kuch toot jaye to yeh (purana ErrorBoundary)
│   └── globals.css           ← poori site ki CSS (purana index.css)
├── components/               ← Navbar, Footer, WeatherCard... (Vite se)
│   ├── NavLink.jsx           ← NAYA: react-router ke NavLink jaisa
│   └── LiveSatelliteRadarLazy.jsx ← NAYA: map sirf browser mein load
├── context/                  ← AuthContext, CityContext
├── hooks/                    ← useWeather (React Query)
├── services/                 ← apiClient (axios), weatherService
├── config/endpoints.js       ← backend ka pata + endpoints
├── utils/                    ← icons, descriptions (bilkul waise)
├── public/                   ← images, favicon
├── .env.local                ← aap ki settings (GitHub par NAHI jati)
├── .env.example              ← settings ka namoona (GitHub par jata hai)
├── next.config.mjs           ← Next.js settings + local proxy
└── package.json              ← packages + commands
```

Aage judenge: `app/login/`, `app/signup/`, `app/trip-planner/`,
`app/blog/[slug]/`, `app/weather/...` (SEO pages), `app/sitemap.js`,
`app/robots.js`, `app/not-found.js`.

## Vite → Next.js: 5 bunyadi farq

1. **Routing:** Vite mein `App.jsx` ke andar `<Route path="/login">`.
   Next.js mein `app/login/page.js` file banao — URL ban gaya.

2. **Server Component (default):** `app/` ki har file pehle SERVER par
   chalti hai aur tayyar HTML browser ko jata hai — Google ko poora page
   milta hai. Test: `Ctrl + U`.

3. **Client Component (`'use client'`):** jis file mein `useState`,
   `useEffect`, `onClick`, `localStorage` ya `window` ho, us ki PEHLI
   line `'use client';` honi chahiye. Yaad rakhein: client component
   bhi pehle server par ek dafa banta hai — is liye `localStorage` /
   `window` sirf `useEffect` ya click ke andar istemal karein, render
   ke waqt nahi.

4. **Links:** `import { Link } from 'react-router-dom'` + `to="/x"` ki
   jagah `import Link from 'next/link'` + `href="/x"`.

5. **Title/meta:** `react-helmet-async` ki jagah page file mein
   `export const metadata = { title: '...' }`.

## Purani files mein kya badla (Step 2)

| File | Kya badla | Kyun |
|---|---|---|
| Sab client components | Pehli line `'use client';` | useState/onClick sirf browser mein |
| Navbar, Footer, Article, FeaturesSection, FreeLimitModal | `Link to=` → `Link href=` | Next.js ka Link |
| Navbar | `useLocation` → `usePathname` | Next.js ka tareeqa |
| CityContext | city shuru mein `null`, localStorage `useEffect` mein | Server par localStorage nahi hota — crash |
| WeatherCard, ForecastTable | `!city` par bhi "Loading" | upar wali tabdeeli ki wajah se |
| LiveSatelliteRadar | `LiveSatelliteRadarLazy` ke zariye load | Leaflet server par crash karta hai |
| config/endpoints.js | `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*`, paths seedhe likhe | Next.js ka env tareeqa |

**Design mein koi tabdeeli nahi** — har class, rang aur layout wahi.

## .env — backend kahan hai?

`npm run dev` par settings `.env.development` se aati hain: **Option A**
— live backend (`api.weatherapex.com`), Next.js ke proxy ke zariye.
Apna backend chalane ki zaroorat nahi.

Kuch badalna ho (masalan apna local backend) to `.env.local` mein
likhein — woh `.env.development` se upar chalti hai. Options
`.env.example` mein.

`.env` wali koi bhi file badalne ke baad `npm run dev` band (Ctrl+C)
kar ke dobara chalayein — Next.js env sirf start par parhta hai.
