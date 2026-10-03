# Sawal — Round 3 (Group 2 ki manzoori + Group 3 + Group 4)

Har sawal ke neeche `Jawab:` ke aage apna jawab likh dein. File save kar ke Claude ko bata dein.

Group 2 mukammal — tafseel `docs/PROGRESS.md` mein. `scripts/seo-check.mjs`: **249 passed, 0 failed**.

---

## Hissa A — Group 2 ki nazar aane wali tabdeeliyon ki manzoori

Screenshots chat mein bheje ja chuke hain (pehle / baad, 390px aur 1440px). Har ek ke liye `haan` (rakh lo) ya `nahi` (wapas purana) ya jo badalna ho woh likh dein.

**A1 — 2.6-a:** Popular Destinations cards par "Climate guide →" link.

Jawab: haan.

**A2 — 2.6-b:** City page par "More cities in {country}" (max 6).

Jawab: haan.

**A3 — 2.6-c:** Terms, Privacy, API Docs, Pricing par Navbar + Footer.

Jawab: haan.

**A4 — Climate Guides cards par shehar ki photo** (aap ki farmaish, main ne dono jagah lagai).

Jawab: haan — pasand aaya. Isi andaz mein city page par bhi photo chahiye (neeche 'Naye kaam' N1, N2).

**A5 — Share image (1200×630):** baqi pages par neela design, city pages par shehar ki photo ke saath.
Ek choti baat: `next/og` mein sirf ek regular font hota hai, is liye title mota (bold) nahi.
- **option A:** Aise hi theek hai
- **option B:** Bold chahiye — Google Fonts ka free "Inter Bold" `.ttf` (~300 KB) project mein `app/og-image/` ke andar rakh dun (nayi library nahi, sirf font file)

Jawab: option B — Inter Bold .ttf sirf server par OG image ke liye (browser ko nahi jata). License (OFL) file bhi saath rakhein.

---

## Hissa B — Logo / favicon (ahem)

**B1 — `public/favicon.svg` asal mein Vite ka purple logo hai, WeatherApex ka nahi.** Yahi abhi browser tab icon, `/favicon.ico` aur Google ke Organization logo (JSON-LD) mein ja raha hai — kyunke 2.4-a/2.5 mein aap ne favicon.svg kaha tha.
- **option A:** Jab tak final logo na aaye, Navbar wala WeatherApex logo (neela gol + badal ✓) se ek `icon.svg` + 512×512 PNG logo code se bana dun, aur teeno jagah wahi lagaun ← mera mashwara
- **option B:** Aap final logo (SVG + PNG) denge, tab tak Vite logo hi rehne dein

Jawab: option A — Navbar wala WeatherApex logo se icon.svg + 512×512 PNG; teeno jagah wahi. Vite logo har jagah se hata dein.

---

## Hissa C — Group 3 (Accuracy aur UX)

### 3.1 — Din/raat ke icons
Abhi yeh halaat din aur raat dono mein ek hi icon dikhate hain, jabke Meteocons mein raat ke alag icon maujood hain (audit ne verify kiya):

| Mausam | WMO codes | Din | Raat |
|---|---|---|---|
| Barish ki bauchhar | 80–82 | partly-cloudy-day-rain | partly-cloudy-night-rain |
| Barf ki bauchhar | 85–86 | partly-cloudy-day-snow | partly-cloudy-night-snow |
| Dhund | 45, 48 | fog-day | fog-night |
| Toofan | 95–99 | thunderstorms-day | thunderstorms-night |

Kya karunga: `utils/meteoconsMap.js` mein yeh din/raat jodein, phir ek script har WMO code (0–99) × din/raat ka icon URL check kare ke 200 aata hai.

Options: `haan` / `nahi`

Jawab: haan.

### 3.2 — °F (US visitors)
Masla: weather card mein "°C °F" dono upar-neeche likha hai magar number sirf °C ka hai, aur koi toggle nahi — US user ke liye dhoka. Popular Destinations aur forecast sirf °C.
- **option A:** °C / °F toggle (card mein "°C °F" hi button ban jaye); pasand `localStorage` mein yaad rahe; poori site (card, forecast, Popular Destinations, city page) usi unit mein ← mera mashwara
- **option B:** Dono saath dikhayein, jaise "80°F (27°C)"
- **option C:** Sirf "°F" wala label hata dein (sirf °C, dhoka khatam)

Jawab: option A — toggle. Sath mein wind bhi: °F par mph, °C par km/h (Trip Planner aur Event Risk cards mein bhi). Unit ka faisla useEffect mein ho (hydration safe) aur text badalne se layout na hile (CLS 0 rahe).

**3.2-b — Default unit kya ho?**
- **option A:** Sab ke liye °C (user badal sake)
- **option B:** US visitors ke liye °F default — browser ki language/region (`en-US`) se andaza

Jawab: option B — browser language `en-US` ho to °F default, baqi sab ke liye °C. User ka apna chunav localStorage mein, woh hamesha upar.

### 3.3 — Mobile par Long-range Forecast table
Masla: 390px par 12-column table mein text kat jata hai ("Light rai…", "Rain li…").
Kya karunga: sirf mobile par har din ka ek stacked row (din/tareekh + icon + hi/lo upar, description + raat + barish neeche). Desktop table bilkul waisa hi. Pehle/baad screenshots dikhaunga.

Options: `haan` / `nahi`

Jawab: haan.

---

## Hissa D — Group 4 (tests)

**D1 — Playwright install karun?** (~150 MB browser download, sirf devDependency). Is se: CLS test (1.5 s delay, 390/1440), Popular Destinations fail wali halat (sirf "—", koi icon nahi — aap ka note), mobile menu, search, sign-in validation, OTP paste, free-limit modal (mock 429), blog list → post, 404, har page par console error nahi, 390/768/1440 par horizontal scroll nahi.
- **option A:** haan, install karo
- **option B:** nahi — main apne Chrome wale scratch tools (jo CLS ke liye use kiye) ko `scripts/` mein pakki shakal de dun (koi install nahi, magar kam features)

Jawab: option A — Playwright install karo (sirf devDependency).

**D2 — `package.json` mein shortcut:** `npm run seo-check` (aur Playwright ho to `npm run test:e2e`)?
Options: `haan` / `nahi`

Jawab: haan.

---

## Aakhir mein

Koi aur baat kehni ho to yahan likh dein:

## Naye kaam (Zain ki farmaish) — pehle options/screenshots, phir "haan" ke baad pakka

### N1 — City page (`/weather/<city>`) ka hero: neela background → shehar ki photo
- Wahi photo jo Climate Guides cards par hai (server par, 3 ghante cache, whitelist wale shehar hi). Photo na mile to maujooda neela gradient hi rahe.
- Photo ke upar gehra gradient overlay (Trip Planner hero jaisa, `#001528`) taake "London Climate & Weather Guide", mulk ka naam aur subtitle har photo par saaf parhe jayein (contrast kam az kam 4.5:1).
- Yeh photo page ka LCP banegi: `<img>` par `fetchPriority="high"`, lazy NAHI, `width`/`height` diye hon, mobile ke liye chhota size (Pexels URL `w=` / `srcset`). CLS 0 rahe, LCP dobara napein.
- `alt` = "{City}, {Country} skyline" jaisa.
- Pehle/baad screenshots 390px aur 1440px.

### N2 — City page ke neeche "Planning a trip to {city}?" CTA: neela → wahi photo
- Same photo + overlay, button saaf nazar aaye. Yeh neeche hai is liye `loading="lazy"`.
- Pehle/baad screenshots.

### N3 — Trip Planner ke result cards (DayCard) ka redesign — pehle ANALYSIS + 2 design options
Zain ko cards "khaas nahi" lag rahe, caption samajh nahi aate aur recommendation ajeeb lagti hai. Audit mein yeh mila:

**Samajh na aane wali baatein (UI):**
1. Score gol daire mein sirf number ("7.3") — na "/10", na koi lafz (Excellent/Good/Fair/Poor), na legend. Rang ka matlab bhi nahi pata (neela = 7–9 "acha" hai? confusing).
2. Temperature, barish, hawa ki rows mein sirf icon + value, koi label nahi ("40%" — kis cheez ka?). `justify-between` se icon aur value door door.
3. Recommendation ki line `text-[11px] italic text-gray-400` — bohat chhoti aur halki (contrast WCAG fail).
4. Mobile par 2 column mein bohat tang cards; card mein do bade gol (score + icon) upar neeche — nazar kahan jaye pata nahi.
5. "Best Day / Worst Day" pills mein kacchi tareekh "2026-10-02" (format nahi). "Worst Day" laal — manfi; "Least ideal" behtar.
6. Sirf °C aur km/h (3.2 ke baad unit toggle yahan bhi).

**Recommendation ajeeb kyun lagti hai (logic ka takraav):**
7. Activity backend se aati hai (`recommended_activity`: barish > 50 → Museum, hawa > 30 → Sheltered, ...) magar neeche wali italic line frontend alag hisaab (`getActivitySuggestion`: barish > 60 / > 30) se banata hai — dono aapas mein takrate hain. Misal: barish 25%, hawa 35 km/h, 22° → activity "Sheltered Indoor" magar line "Pleasant temps — great for exploring outdoors".
8. Frontend mein hawa ka check sirf tab chalta hai jab temp ≤ 15° ho — garam aur toofani din kabhi "windy" nahi kehlata.
9. Backend `day_parts` (subah / dopahar / shaam ka data) bhejta hai magar UI mein kahin istemal nahi — "Best time: morning" jaisi kaam ki baat zaya.
10. (Backend — sirf report, badalna nahi) Beach 18° par hi shuru ho jata hai (18–28° + coastal + barish < 20%) — 18° par "Beach / Water Sports" ajeeb hai; activity sirf `temp_max` dekhti hai, `weather_code` (barf/toofan) aur `temp_min` nahi. PROGRESS.md ki "Backend requests" mein likh dein.

**Kya chahiye:**
- Frontend-only fixes: recommendation ki line SIRF backend ki `recommended_activity` + ek hi threshold set se bane (koi takraav na ho), hawa har temperature par check ho, `day_parts` se "Best time of day" dikhe, tareekh formatted ho.
- **2 design options** banayein (asli component, sample data se — barish wala, garam, toofani hawa, thanda, coastal beach din) aur 390px + 1440px screenshots dikhayein. Dono options mein:
  - Score: "7.3 / 10" + lafz (Excellent ≥ 8.5, Good ≥ 7, Fair ≥ 5, Poor < 5) + rang ka chhota legend upar.
  - Har metric ka label: "High 22° · Low 14°", "Rain chance 40%", "Wind 12 km/h".
  - "Best for: Museum / Indoor" chip + ek saaf line wajah ki (kam az kam 13–14px, gray-600).
  - Mobile par parhne layak layout (Option 1: har din ek horizontal row/list; Option 2: bade 1-column cards, desktop par grid).
  - Site ke maujooda colors aur fonts; naya rang ya library nahi.
- Zain option chunega, phir implement + build + tests + CLS check.

Tarteeb: pehle Hissa A–D ke jawab wala kaam, phir N1 → N2 → N3 (N3 mein pehle sirf analysis + options, implement baad mein).


