# Sawal — Audit fixes round 1, Group 2 (SEO foundation)

Har sawal ke neeche `Jawab:` ke aage apna jawab likh dein (jaise `haan`, `nahi`, `option A`).
File save kar ke Claude ko bata dein. Kaam isi tarteeb se hoga: **2.1 pehle** (sitemap us par depend karta hai).

Group 1 (1.2–1.6) + "Aakhir mein" ke 4 points mukammal — tafseel `docs/PROGRESS.md` mein.
Home CLS: 390px **0.919 → 0**, 1440px **0.543 → 0** (1.5 s API delay ke saath).

---

## 2.1 — City whitelist (sab se pehle)

Masla: abhi `/weather/<kuch-bhi>` backend ko call karta hai. Koi bot ulta-seedha naam try kare (jaise `/weather/multan`) to backend naya shehar bana kar Open-Meteo se 20 saal ka data mangwa leta hai (~261 calls) — quota barbaad + kachre pages. Aur `/weather/London`, `/weather/LONDON`, `/weather/london` teeno 200 dete hain (duplicate content).

Kya karunga:
- `data/cities.js` banega — backend ki list (`fetch_all_cities.py`, **154 shehar, 51 mulk**) ki copy. Slug bilkul backend wale tareeqe se: `name.lower().replace(" ", "-").replace(",", "")` (check kiya: koi khaas harf nahi, koi duplicate nahi).
- List mein na ho → `notFound()` (asli 404) **backend call se pehle**.
- Bare harf wala URL (`/weather/London`) → `/weather/london` par permanent redirect (308).
- `generateStaticParams` `[]` hi rahega (pehli visit par page banega).

**Sawal 2.1-a — Singapore:** Singapore backend ki 154 wali list mein **nahi** hai, magar Climate Guides aur Popular Destinations par hai. Strict whitelist se `/weather/singapore` 404 ho jayega.
- **option A:** Singapore ko frontend whitelist mein extra daal dein (backend ke DB mein pehle se hai, is liye kaam karega) + "Backend request" likh dun ke backend list mein bhi add ho ← mera mashwara
- **option B:** Strict — sirf 154; Climate Guides se Singapore card hata dein
- **option C:** Strict — 404 hone dein, card rehne dein (link toota rahega — nahi karna chahiye)

Jawab: option A — Singapore frontend whitelist mein extra, aur backend list mein add karne ki 'Backend request' likh dein.

**Sawal 2.1-b — baqi sab upar jaisa theek hai?** (`haan` / `nahi`)

Jawab: haan. Test mein zaroor check karein: (1) `/weather/multan` jaisa URL 404 de aur Django log mein koi call na jaye, (2) Climate Guides aur Popular Destinations ke har shehar ka slug whitelist mein ho (koi link 404 na ho).

---

## 2.2 — Canonical + social tags

Kya karunga (screen par koi farq nahi):
- Root layout mein `metadataBase` = `NEXT_PUBLIC_SITE_URL` (https://weatherapex.com).
- Har indexable page par canonical: chhote harf, aakhir mein `/` nahi, query string nahi. Sirf `/blog?page=2` ka canonical `/blog?page=2` aur title **"Blog — Page 2"**.
- `og:url`, `og:type`, `og:site_name`, `twitter:card = summary_large_image`.
- Blog post ka `featured_image` us ki `og:image`.
- Trailing-slash redirect **nahi** lagaunga (woh abhi khula faisla hai).

**Sawal 2.2-a — baqi pages ki share image (1200×630) — jab koi link WhatsApp/Facebook/X par share kare to jo tasveer dikhti hai:**
- **option A:** Code se banwa dun (`app/opengraph-image.js`, koi nayi library nahi) — neela background, WeatherApex logo + page ka title ← mera mashwara (baad mein aap ki design se badal sakte hain)
- **option B:** Aap khud ek 1200×630 image denge — tab tak share image nahi
- **option C:** Abhi share image nahi

Jawab: option A — `next/og` (Next.js ke andar hai, nayi library nahi). Brand colors (#002244 / #0077b6), WeatherApex naam + page title. Pehle ek-do images ka preview dikha dein.

**Sawal 2.2-b — Blog title mein "| WeatherApex Blog" do dafa (purana bug, React site mein bhi tha):**
Maslan `/blog/tokyo-guide` ka title: "Tokyo Weather Guide | WeatherApex Blog **| WeatherApex Blog**". Backend ka `meta_title` pehle se yeh hissa rakhta hai aur code dobara jodta hai.
- **option A:** Code check kare — agar `meta_title` pehle se "WeatherApex" par khatam ho to dobara na jode ← mera mashwara
- **option B:** Jaisa hai waisa rehne dein

Jawab: option A.

**Sawal 2.2-c — baqi sab upar jaisa theek hai?** (`haan` / `nahi`)

Jawab: haan.

---

## 2.3 — `robots.txt` aur `sitemap.xml`

Kya karunga:
- robots: sab allow; `/api/`, `/login`, `/signup` disallow; sitemap ka link.
- sitemap: saare static public pages + saari blog posts (server par `/api/blog/posts/` ke saare pages, cache ke saath) + whitelist ke saare city pages. **History endpoint kabhi call nahi hoga.**

Note: backend (Django) ka apna ek sitemap view bhi hai (`views.py`). Naya sitemap Next.js ka hoga, `weatherapex.com/sitemap.xml` par — backend wale ko nahi chheda jayega.

Options: `haan` / `nahi`

Jawab: haan. Do baatein: (1) sitemap mein lastModified sirf wahan jahan asli tareekh ho (blog ka published_at) — cities ke liye jhooti tareekh na daalein; (2) `/pricing` abhi 'Coming Soon' patla page hai — is par `noindex` lagayein aur sitemap se bahar rakhein jab tak asli pricing na aa jaye.

---

## 2.4 — JSON-LD (Google ke liye structured data, screen par nazar nahi aata)

| Page | Kya |
|---|---|
| Home | `Organization` + `WebSite` |
| `/weather/<city>` | `BreadcrumbList` (Home › Climate Guides › City) |
| `/blog/<post>` | `Article` + `BreadcrumbList` |

FAQ schema **nahi** (Google ne 2023 mein band kar diya).

**Sawal 2.4-a — Organization ka logo:** Google ko logo ki tasveer chahiye (kam az kam 112×112, PNG behtar).
- **option A:** Abhi `favicon.svg` ka link de dun; final logo aane par badal denge ← mera mashwara
- **option B:** Aap PNG logo denge (`public/logo.png`), tab tak logo field khaali

Jawab: option A (abhi favicon.svg). Final PNG logo baad mein dunga.

**Sawal 2.4-b — Social profiles (`sameAs`):** WeatherApex ke koi social links hain (Facebook, X, Instagram, LinkedIn)? Hain to URLs likh dein, warna `nahi`.

Jawab: nahi (abhi koi social profile nahi). Footer ke social buttons wese hi rehne dein.

**Sawal 2.4-c — Blog `Article` ka author:** backend blog post ke saath author ka naam nahi bhejta.
- **option A:** Author = "WeatherApex" (organization) ← mera mashwara
- **option B:** Koi naam likh dein (jaise "Zain Butt")

Jawab: option A — Author = "WeatherApex" (Organization).

---

## 2.5 — Favicon

Masla: browser khud `/favicon.ico` maangta hai → abhi 404.

- **option A:** `app/icon.svg` (maujooda `favicon.svg` ki copy) + `/favicon.ico` ko wahi svg dikhane ka rewrite ← mera mashwara (koi nayi library nahi)
- **option B:** Aap asli `favicon.ico` file denge, main `app/` mein rakh dunga

Final brand favicon abhi bhi aap ki manzoori ka intezar kar raha hai — yeh sirf 404 band karne ke liye.

Jawab: option A.

---

## 2.6 — Internal links (yeh screen par NAZAR aayenge — har ek ka alag jawab)

**2.6-a — Popular Destinations cards par chhota link "Climate guide →"** jo `/weather/<city>` par jaye. Card dabane par shehar badalne wala kaam waisa hi rahega (link sirf link par click se chalega). Pehle/baad ke screenshots dikhaunga.
Options: `haan` / `nahi`

Jawab: haan — commit se pehle mobile (390px) aur desktop ka pehle/baad screenshot dikhana zaroori.

**2.6-b — City page par "More cities in {country}"** section (server par, whitelist se, Climate Guides wale card design mein). Maslan London page par Manchester, Birmingham, Edinburgh, Glasgow.
Options: `haan` / `nahi`

Jawab: haan — Climate Guides wale card design mein, zyada se zyada 6 shehar; agar mulk mein aur shehar na hon to section na dikhe.

**2.6-c — `/terms`, `/privacy`, `/api-docs`, `/pricing` par Navbar + Footer.** Abhi in par koi link nahi — user aur Google dono ke liye "band gali". (React site mein bhi aisa tha.)
Options: `haan` (charon par) / `nahi` / ya batayein kin par

Jawab: haan (charon par).

---

## Aakhir mein

Group 2 ke har item ke baad `npm run build` + route check + screenshots. Phir Group 3 (icons day/night, °F, mobile forecast table) ke sawal isi tarah `docs/QUESTIONS_ROUND3.md` mein.

Koi aur baat kehni ho to yahan likh dein:

1. Har item alag build + route check ke saath, aur har visible change (2.2-a preview, 2.6-a/b/c) ke screenshots commit se pehle.
2. `scripts/seo-check.mjs` (Group 4) isi round mein bana dein aur chala kar result dikhayein: har route ka status, ek `<h1>`, unique title/description, absolute canonical, JSON-LD valid, robots/sitemap 200, `/weather/London` → 308, `/weather/multan` → 404, affiliate links par `sponsored`.
3. Trailing slash wala faisla abhi bhi khula hai — us par redirect na lagayein.


