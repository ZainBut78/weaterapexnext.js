# Sawal — Audit fixes round 1, Group 1 (1.2 se 1.6)

Har sawal ke neeche `Jawab:` ke aage apna jawab likh dein (jaise `haan`, `nahi`, `option 1`).
File save kar ke Claude ko bata dein — woh yeh file parh kar kaam karega.

Item 1.1 (Popular Destinations) mukammal ho chuka hai — us ka koi sawal nahi.

---

## 1.2 — Home page load par "hilna" (CLS)

Masla: page load hote waqt cheezein neeche khisakti hain. Google ka score 0.92 hai, "acha" hone ke liye 0.1 se kam chahiye.

Kya karunga:
- **a)** Baarish ki boondein `top` ki jagah `y` (transform) se giregi — dikhne mein bilkul wahi. Boondon ki jagah sirf ek dafa banegi, har render par nahi.
- **b)** "Loading weather data..." aur "Loading forecast..." ke chhote dabbon ki jagah grey skeleton, jo asli card jitna bara hoga. Data aane ke baad ka design bilkul nahi badlega.

Options: `haan` / `nahi`

Jawab: haan (a aur b dono). Acceptance: 1.5 s API delay ke saath home CLS < 0.1 — 390px aur 1440px dono par napein, aur skeleton wali haalat ka screenshot bhi dikhayein.

---

## 1.3 — Home page par do `<h1>`

Masla: weather card mein temperature ("20°") `<h1>` hai, aur "Engineered for Accuracy" bhi `<h1>` hai. Google ko ek page par ek hi `<h1>` chahiye.

Kya karunga: temperature ko `<p>` bana dunga, same classes ke saath — dikhne mein koi farq nahi.

Phir akela `<h1>` "Engineered for Accuracy" bachega, jo SEO ke liye kamzor hai. Is ki jagah kya likha jaye? (styling wahi rahegi)

- **option 1:** Weather Forecasts, Trip Planning & Climate Guides  ← mera mashwara (sab se zyada search keywords)
- **option 2:** Plan Trips & Outdoor Events with Accurate Weather
- **option 3:** Weather Intelligence for Travel & Outdoor Events
- **option 4:** "Engineered for Accuracy" hi rehne dein
- ya apna text likh dein

Jawab: option 1 — "Weather Forecasts, Trip Planning & Climate Guides". Styling wahi, sirf text badle. Temperature wala <h1> → <p> same classes ke saath.

---

## 1.4 — Forecast mein "TODAY" ghalat din par

Masla: "aaj" visitor ke computer ki ghari se nikalta hai. US se Sydney dekhein to Sydney ka "aaj" US ka "kal" hota hai — ghalat row highlight hoti hai.

Kya karunga: shehar ki apni tareekh (`current.time`) se compare karunga. Dikhne mein design wahi.

Options: `haan` / `nahi`

Jawab: haan. Tareekh ko browser timezone se parse na karein (YYYY-MM-DD ko khud todein ya timeZone: 'UTC' se format karein), warna din/tareekh ek din aage-peeche ho sakti hai.

---

## 1.5 — Blog ke Amazon (affiliate) links

Masla: Google ka rule hai ke paid/affiliate links par `rel="sponsored"` hona chahiye.

Kya karunga: `rel="sponsored nofollow noopener noreferrer"` lagaunga. Screen par koi farq nahi.

Options: `haan` / `nahi`

Jawab: haan.

---

## 1.6 — City page par "10+ years" ya "20 years"

Masla: city page ka subtitle kehta hai "based on 10+ years of historical data", jabke description aur data 20 saal ka hai. (Yeh ghalti purani React site mein bhi thi.)

Kya karunga: subtitle mein "20 years" likh dunga.

Options: `haan` / `nahi`

Jawab: haan — subtitle aur meta description dono mein ek hi baat: "20 years". Pehle backend ki setting HISTORICAL_YEARS check kar lein ke 20 hi hai.

---

## Aakhir mein

Group 1 ke baad `npm run build` aur tests chalaunga, phir Group 2 (SEO: canonical, sitemap, robots, JSON-LD, city whitelist) ke sawal isi tarah file mein bana dunga.

Koi aur baat kehni ho to yahan likh dein:

1. ColorZilla wala hydration warning (`cz-shortcut-listen`): app/layout.js mein `<body suppressHydrationWarning>` laga dein — haan. Sirf <body> ke attributes ka farq ignore hoga, baqi page ki jaanch waise hi.
2. 1.1 ka note mil gaya — shukriya. Group 4 ke Playwright tests mein `isError` wali haalat (failed query → sirf "—", koi icon nahi) zaroor cover karein.
3. PROGRESS.md mein "Backend requests #1" ko theek kar dein: history endpoint par 3-per-din wali limit nahi, sirf per-minute burst guard (WEATHER_ANON_PER_MINUTE, default 600/min) lagta hai. Production ke liye internal header/key baad mein.
4. Group 1 ke baad `npm run build` + tests, phir Group 2 ke sawal isi tarah file mein. Group 2 mein pehle 2.1 (city whitelist) karein, kyunki sitemap us par depend karta hai.


