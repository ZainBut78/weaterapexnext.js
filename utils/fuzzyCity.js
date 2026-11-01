// ─────────────────────────────────────────────────────────────
//  Local "Did you mean…?" — hamari 160 cities (data/cities.js) se,
//  ZERO API calls (UX fixes PART B).
//
//  • Har zaban ka naam: English + data/placeNames (de/it/fr/es/ja) —
//    "Londra", "Londres", "ロンドン", "München", "東京" sab → wahi shehar.
//    Result ka `name` hamesha English (backend / URL isi se chalte hain),
//    `label` user ki zaban mein (dikhane ke liye).
//  • Capital letters, accents, full-width/half-width, hiragana/katakana,
//    "・" aur spaces ignore: "zürich" = "zurich", "とうきょう"… "サン・パウロ" = "サンパウロ".
//  • Damerau-Levenshtein (OSA): ek harf ghalat / kam / zyada / do
//    harf ulat ("pheonix" → phoenix, "new yrok" → new york, "ロソドン" → ロンドン) = 1 ghalti.
//  • Type karte hue adhoora naam bhi chale: query ko naam ke utne hi
//    harfon (prefix) se bhi milaya jata hai ("barcel" → Barcelona, "ミュン" → ミュンヘン).
// ─────────────────────────────────────────────────────────────
// Relative imports — node --test (tests/unit/fuzzyCity.test.mjs) bhi chala sake
import { CITIES } from '../data/cities.js';
import { CITY_NAMES } from '../data/placeNames.js';

// NFD se toot-te nahi — alag se
const LATIN_FOLD = { ß: 'ss', ø: 'o', æ: 'ae', œ: 'oe', ł: 'l', đ: 'd', ı: 'i', þ: 'th' };

export const normalizeText = (s) =>
  String(s || '')
    .normalize('NFKC')                                    // ｔｏｋｙｏ → tokyo, ｶﾀｶﾅ → カタカナ
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')                    // sirf Latin accents (dakuten ゛ bacha rahe)
    .normalize('NFC')
    .toLowerCase()
    .replace(/[ßøæœłđıþ]/g, (ch) => LATIN_FOLD[ch])
    .replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60))   // hiragana → katakana
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

// Moqable ki chabi — spaces bhi nahi ("new york" = "newyork", "サン パウロ" = "サンパウロ")
const compact = (s) => normalizeText(s).replace(/ /g, '');

// Optimal String Alignment distance (Damerau-Levenshtein ki aam qisam)
export function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev2 = null;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur.push(v);
    }
    prev2 = prev;
    prev = cur;
  }
  return prev[n];
}

// Kitni ghaltiyan maaf: chhoti query par kam (warna "par" har cheez se mil jaye).
// Kanji ek harf mein poora lafz → aadhi chhoot.
const KANJI = /[一-鿿]/;
const allowedErrors = (q) => {
  const len = KANJI.test(q) ? q.length * 2 : q.length;
  return len <= 3 ? 0 : len <= 5 ? 1 : len <= 8 ? 2 : 3;
};

// Kanji naam wale shehar ki kana reading — log "とうきょう" / "トウキョウ" bhi likhte hain
// (hiragana khud katakana ban jata hai, is liye sirf katakana)
const KANA_READINGS = {
  tokyo: ['トウキョウ'], osaka: ['オオサカ'], kyoto: ['キョウト'], beijing: ['ペキン'],
  shanghai: ['シャンハイ'], guangzhou: ['コウシュウ'], chengdu: ['セイト', 'チェンドゥ'],
  shenzhen: ['シンセン'], 'hong-kong': ['ホンコン'], busan: ['プサン'], bali: ['バリ'],
};

// Har shehar ke saare naam (English, slug, har zaban, kana reading) — ek baar
const INDEX = CITIES.map((c) => {
  const keys = new Set([compact(c.name), compact(c.slug)]);
  for (const n of [...Object.values(CITY_NAMES[c.slug] || {}), ...(KANA_READINGS[c.slug] || [])]) keys.add(compact(n));
  keys.delete('');
  return { city: c, keys: [...keys] };
});

/** Shehar ka naam user ki zaban mein (dikhane ke liye); English / anjaan → asal naam */
export const cityLabel = (slug, name, lang) => (lang && lang !== 'en' && CITY_NAMES[slug]?.[lang]) || name;

const pick = ({ slug, name, country }, lang) => ({ slug, name, country, label: cityLabel(slug, name, lang) });

// Ek naam (key) se query ka rishta: 0 exact · 1 prefix · 2 fuzzy · null
function score(q, key, partial, maxErr) {
  if (key === q) return { rank: 0, dist: 0 };
  if (partial && key.startsWith(q)) return { rank: 1, dist: 0 };
  if (!maxErr) return null;
  let dist = editDistance(q, key);
  if (partial && q.length >= 4 && key.length > q.length) {
    dist = Math.min(dist, editDistance(q, key.slice(0, q.length)));
  }
  return dist <= maxErr ? { rank: 2, dist } : null;
}

const KINDS = ['exact', 'prefix', 'fuzzy'];

/**
 * Query se milte shehar, behtareen pehle (har shehar ek baar, us ke behtareen naam se).
 *   `kind`: exact | prefix (type ho raha hai) | fuzzy (spelling ki ghalti — "Did you mean")
 * `partial: false` → sirf poore naam se milao (Enter ke baad "not found").
 * `lang` → `label` us zaban mein.
 */
export function matchCities(query, { limit = 5, partial = true, lang } = {}) {
  const q = compact(query);
  if (q.length < 2) return [];
  const maxErr = allowedErrors(q);
  const scored = [];
  for (const { city, keys } of INDEX) {
    let best = null;
    for (const key of keys) {
      const s = score(q, key, partial, maxErr);
      if (s && (!best || s.rank < best.rank || (s.rank === best.rank && s.dist < best.dist))) best = s;
      if (best?.rank === 0) break;
    }
    if (best) scored.push({ ...pick(city, lang), kind: KINDS[best.rank], ...best });
  }
  scored.sort((a, b) => a.rank - b.rank || a.dist - b.dist || a.name.length - b.name.length || a.name.localeCompare(b.name));
  // Bilkul sahi naam mil gaya to spelling wale andaze ("zurich" → Munich) nahi
  const hasExact = scored.some((s) => s.kind === 'exact');
  return (hasExact ? scored.filter((s) => s.kind !== 'fuzzy') : scored)
    .slice(0, limit)
    .map(({ rank, dist, ...rest }) => rest);
}

/** Bilkul isi naam (kisi bhi zaban mein) / slug ka shehar — warna null */
export function exactCity(query, lang) {
  const q = compact(query);
  if (!q) return null;
  const hit = INDEX.find((x) => x.keys.includes(q));
  return hit ? pick(hit.city, lang) : null;
}

/**
 * Backend ko bhejne wala naam: hamari list ka shehar kisi bhi zaban / spelling
 * mein likha ho ("東京", "Londra", "Munchen") → English naam; warna jo likha.
 * Adhoora naam ("Monaco di Bav", "ばるせ") sirf tab jab sirf EK shehar us se
 * shuru hota ho. Spelling ki ghalti ("barcelna") yahan khud theek NAHI hoti —
 * user ne jo likha wahi search hota hai, aur list / "Did you mean" sahi naam
 * dikhati hai (UX fixes B: koi option chuna nahi → jaisa likha waisa search).
 */
export function canonicalCityName(query) {
  const text = String(query || '').trim();
  const exact = exactCity(text);
  if (exact) return exact.name;
  const close = matchCities(text, { limit: 2 }).filter((m) => m.kind !== 'fuzzy');
  return close.length === 1 ? close[0].name : text;
}

/** Local + API suggestions mila kar — local pehle, duplicate (slug ya naam) nahi */
export function mergeSuggestions(local, remote, limit = 8) {
  const seen = new Set();
  const out = [];
  for (const s of [...local, ...(remote || [])]) {
    const key = normalizeText(s.name) + '|' + normalizeText(s.country);
    if (seen.has(s.slug) || seen.has(key)) continue;
    seen.add(s.slug);
    seen.add(key);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}
