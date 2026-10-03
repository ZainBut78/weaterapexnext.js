# Sawal — Phase C (1.1 country list, 1.2 report, 1.3 options)

Har sawal ke neeche `Jawab:` ke aage likh dein. File save kar ke Claude ko bata dein.
Is ke baad section 2 ka PREVIEW banega (noindex, sitemap/links ke baghair).

---

## 1.1 — Mulkon ki list (display naam → URL slug)

Brief mein 51 likha tha; asal mein **52** hain — backend ke 51 + **Singapore** (jo aap ne round 2 mein whitelist mein extra rakhwaya tha). Kul **155 shehar**.

Backend ke "region" sirf 3 hain (`europe`, `usa`, `other`). `/weather` hub ke liye "other" (Asia + Africa + Latin America ek saath) bohat mota hai, is liye maine **6 regions** tajweez kiye hain (aakhri column). Jo badalna ho, likh dein.

| # | `cities.js` mein | Page par naam | URL slug | ISO2 | Shehar | Region (tajweez) |
|---|---|---|---|---|---|---|
| 1 | Austria | Austria | `austria` | AT | 2 | Europe |
| 2 | Belgium | Belgium | `belgium` | BE | 2 | Europe |
| 3 | Czech Republic | Czech Republic | `czech-republic` | CZ | 2 | Europe |
| 4 | Denmark | Denmark | `denmark` | DK | 2 | Europe |
| 5 | Finland | Finland | `finland` | FI | 2 | Europe |
| 6 | France | France | `france` | FR | 5 | Europe |
| 7 | Germany | Germany | `germany` | DE | 5 | Europe |
| 8 | Greece | Greece | `greece` | GR | 2 | Europe |
| 9 | Hungary | Hungary | `hungary` | HU | 1 | Europe |
| 10 | Ireland | Ireland | `ireland` | IE | 2 | Europe |
| 11 | Italy | Italy | `italy` | IT | 5 | Europe |
| 12 | Netherlands | Netherlands | `netherlands` | NL | 3 | Europe |
| 13 | Norway | Norway | `norway` | NO | 3 | Europe |
| 14 | Poland | Poland | `poland` | PL | 3 | Europe |
| 15 | Portugal | Portugal | `portugal` | PT | 2 | Europe |
| 16 | Russia | Russia | `russia` | RU | 4 | Europe (Moscow, St Petersburg, Kazan, Sochi — sab European Russia) |
| 17 | Spain | Spain | `spain` | ES | 5 | Europe |
| 18 | Sweden | Sweden | `sweden` | SE | 2 | Europe |
| 19 | Switzerland | Switzerland | `switzerland` | CH | 2 | Europe |
| 20 | United Kingdom | United Kingdom | `united-kingdom` | GB | 5 | Europe |
| 21 | **USA** | **United States** | `united-states` | US | 27 | North America |
| 22 | Canada | Canada | `canada` | CA | 4 | North America |
| 23 | Mexico | Mexico | `mexico` | MX | 2 | North America |
| 24 | Argentina | Argentina | `argentina` | AR | 1 | Latin America |
| 25 | Brazil | Brazil | `brazil` | BR | 2 | Latin America |
| 26 | Colombia | Colombia | `colombia` | CO | 2 | Latin America |
| 27 | Costa Rica | Costa Rica | `costa-rica` | CR | 1 | Latin America |
| 28 | Ecuador | Ecuador | `ecuador` | EC | 1 | Latin America |
| 29 | **UAE** | **United Arab Emirates** | `united-arab-emirates` | AE | 2 | Middle East & Africa |
| 30 | Turkey | Turkey | `turkey` | TR | 3 | Middle East & Africa |
| 31 | Iran | Iran | `iran` | IR | 3 | Middle East & Africa |
| 32 | Egypt | Egypt | `egypt` | EG | 1 | Middle East & Africa |
| 33 | Nigeria | Nigeria | `nigeria` | NG | 1 | Middle East & Africa |
| 34 | South Africa | South Africa | `south-africa` | ZA | 2 | Middle East & Africa |
| 35 | Azerbaijan | Azerbaijan | `azerbaijan` | AZ | 1 | Asia |
| 36 | Bangladesh | Bangladesh | `bangladesh` | BD | 2 | Asia |
| 37 | China | China | `china` | CN | 6 | Asia |
| 38 | India | India | `india` | IN | 5 | Asia |
| 39 | Indonesia | Indonesia | `indonesia` | ID | 2 | Asia |
| 40 | Japan | Japan | `japan` | JP | 3 | Asia |
| 41 | Malaysia | Malaysia | `malaysia` | MY | 1 | Asia |
| 42 | Myanmar | Myanmar | `myanmar` | MM | 1 | Asia |
| 43 | Nepal | Nepal | `nepal` | NP | 2 | Asia |
| 44 | Pakistan | Pakistan | `pakistan` | PK | 5 | Asia |
| 45 | Philippines | Philippines | `philippines` | PH | 2 | Asia |
| 46 | Singapore | Singapore | `singapore` | SG | 1 | Asia |
| 47 | South Korea | South Korea | `south-korea` | KR | 2 | Asia |
| 48 | Sri Lanka | Sri Lanka | `sri-lanka` | LK | 1 | Asia |
| 49 | Thailand | Thailand | `thailand` | TH | 2 | Asia |
| 50 | Vietnam | Vietnam | `vietnam` | VN | 2 | Asia |
| 51 | Australia | Australia | `australia` | AU | 4 | Oceania |
| 52 | New Zealand | New Zealand | `new-zealand` | NZ | 2 | Oceania |

Regions ka khulasa: Europe 20 · North America 3 · Latin America 5 · Middle East & Africa 6 · Asia 16 · Oceania 2.

Kuch cheezein jo aap dekh lein:
- **Hong Kong** backend mein `China` ke andar hai → URL `/weather/china/hong-kong`. Aise hi theek hai?
- **Bali** shehar nahi, jazeera hai (Indonesia) → `/weather/indonesia/bali`. Naam aise hi rakhein?
- **Turkey**: official naam ab "Türkiye" hai, magar log "Turkey" search karte hain — maine `Turkey` / `turkey` rakha hai.
- **Singapore**: mulk aur shehar ek hi naam → `/weather/singapore/singapore` (1.3 ke faisle se asar padega).

Jawab (list theek hai / ya jo badalna ho): list theek hai, 6 regions bhi theek. Badlao sirf ek: **Hong Kong ko alag territory** banayein — naam "Hong Kong", slug `hong-kong`, ISO2 `HK`, region Asia → URL `/weather/hong-kong/hong-kong` (log "hong kong weather" search karte hain, "china" nahi; timeanddate bhi alag rakhta hai). Is se China 5 shehar reh jayega aur Hong Kong 1.3 wale ek-shehar rule mein aa jayega. Bali, Turkey, Russia (Europe) — jaise aap ne likha waise hi theek.

---

## 1.2 — Duplicate shehar (sirf report)

- Kisi mulk ke andar do shehron ka ek slug **nahi** — koi takraav nahi.
- US ke 27 shehron mein aisa naam jo kai states mein hota hai: **Portland** (Oregon aur Maine). Backend wala Portland **Oregon** hai (lat 45.5, lon −122.7) aur list mein sirf ek Portland hai, is liye `united-states/portland` akela hai. Brief ke mutabiq naam nahi badla; aage agar Maine wala bhi aaye to `portland-oregon` / `portland-maine` rule.
- **San Jose** Costa Rica wala hai (California wala list mein nahi) → `/weather/costa-rica/san-jose`, koi takraav nahi.
- **Birmingham** UK wala hai (Alabama list mein nahi).

Koi jawab zaroori nahi — sirf aap ki ittila ke liye.

---

## 1.3 — Sirf EK shehar wale mulk (11)

Hungary (Budapest), Argentina (Buenos Aires), Costa Rica (San Jose), Ecuador (Quito), Egypt (Cairo), Nigeria (Lagos), Azerbaijan (Baku), Malaysia (Kuala Lumpur), Myanmar (Yangon), Singapore (Singapore), Sri Lanka (Colombo).

Ek shehar wala country page "patla" (thin) content hai — Google ise kam-qadar samajhta hai.

- **option A (brief ka mashwara):** Country page sirf 2+ shehar wale mulk ka (41 mulk). 1 shehar wale mulk ka `/weather/{country}` → 308 seedha us ke akele shehar ke page par; sitemap mein nahi. Hub par us mulk ka link seedha shehar page par.
- **option B:** Har mulk ka page, magar 1 shehar wale `noindex`.
- **option C:** Har mulk ka page indexable.

Jawab: option A.

---

## Preview ke liye (section 2) — ek chhota sawal

**Country page ki month × city table:** har cell (jaise London × October) apne month page ka link ho, ya sirf month ka header (pehle shehar ke month page ka) link ho? Main dono bana kar preview mein **cell-link** wala dikhaunga (zyada saaf aur har page tak seedha rasta); pasand na aaye to badal dunga.

Jawab (optional): cell-link theek hai. Mobile (390px) par table apne dabbe ke andar horizontal scroll ho (page nahi), pehla column (shehar ka naam) sticky ho. Preview mein **United States (27 shehar)** ka country page bhi screenshot karein taake bari table ka pata chale.

---

## Note — backend ke 20-saal ke data ka risk (section 4)

Month aur country pages bhi history endpoint use karte hain. Jin shehron ka 20-saal ka data database mein **abhi poora nahi**, un ke pehle page-open par backend Open-Meteo se data laata hai. Deploy se pehle VPS par `tail -n 20 /root/seed.log` se confirm karein ke seeding loop sab shehron ke liye mukammal ho chuka hai. Preview main apne local backend par banaunga (5 pages, sirf 3 shehar + 1 mulk ki calls).


---

## Zain ka note — LOCAL vs DEPLOYED backend (zaroori)

Preview **local backend** (127.0.0.1:8000) par ban raha hai, jabke 20-saal ka data seeding **deployed backend (VPS)** par ho raha hai. Yani local database mein bohat se shehron ka poora 20-saal data shayad nahi hai — un ka history call local se Open-Meteo ko jayega (limit: 5,000/ghanta, ek shehar ≈ 261 weighted calls → ~19 shehar/ghanta).

Is liye preview se pehle:
1. **Read-only check** (sirf parhna, koi write/migration nahi): local DB mein whitelist ke kaunse shehron ka 20-saal data mukammal hai — ginti aur list mujhe dikhayein. Preview sirf mukammal data wale shehron se banayein; London / New York mukammal na hon to pehle batayein.
2. **Fan-out ki hadd:** aap ne likha "sirf 3 shehar + 1 mulk ki calls", magar New York month page ka "July in other US cities" section 26 aur shehron ki history maangega, aur US country page 27 ki. Preview mein har page par **zyada se zyada 6 history calls** — baqi shehron ko chhor dein ya sirf un ko lein jin ka data local mein mukammal hai. Har preview ke backend calls ki ginti report karein.
3. **Asal hal (Backend request, banana nahi — PROGRESS.md mein likhein):** ek read-only endpoint jo sirf DATABASE se (kabhi Open-Meteo nahi) kai shehron ki mahana averages ek hi call mein de, jaise `GET /api/weather/climate-summary/?cities=london,paris,...` ya `?country=US`. Is se country page aur "other cities" sections 27 calls ki jagah 1 call mein banenge aur bot bhi Open-Meteo nahi chala sakega. Jab tak yeh nahi banta, production mein bhi month/country pages ki fan-out capped aur cached rahe.
4. Preview ke numbers local data ke hain — live par deployed backend ke numbers aayenge. Design aur logic ke liye yeh kaafi hai.
