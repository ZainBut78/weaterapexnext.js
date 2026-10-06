// ─────────────────────────────────────────────────────────────
//  Local "Did you mean…?" — hamari 160 cities (data/cities.js) se,
//  ZERO API calls (UX fixes PART B).
//
//  • Capital letters aur accents ignore: "zürich" = "zurich".
//  • Damerau-Levenshtein (OSA): ek harf ghalat / kam / zyada / do
//    harf ulat ("pheonix" → phoenix, "new yrok" → new york) = 1 ghalti.
//  • Type karte hue adhoora naam bhi chale: query ko naam ke utne hi
//    harfon (prefix) se bhi milaya jata hai ("barcel" → Barcelona).
// ─────────────────────────────────────────────────────────────
import { CITIES } from '@/data/cities';

export const normalizeText = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

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

// Kitni ghaltiyan maaf: chhoti query par kam (warna "par" har cheez se mil jaye)
const allowedErrors = (len) => (len <= 3 ? 0 : len <= 5 ? 1 : len <= 8 ? 2 : 3);

const INDEX = CITIES.map((c) => ({ city: c, norm: normalizeText(c.name), slugNorm: normalizeText(c.slug) }));

const pick = ({ slug, name, country }) => ({ slug, name, country });

/**
 * Query se milte shehar, behtareen pehle.
 *   { exact, prefix, fuzzy } har result par `kind` mein.
 *   prefix = naam isi se shuru hota hai (type ho raha hai)
 *   fuzzy  = spelling ki ghalti (yahi "Did you mean")
 * `partial: false` → sirf poore naam se milao (Enter ke baad "not found").
 */
export function matchCities(query, { limit = 5, partial = true } = {}) {
  const q = normalizeText(query);
  if (q.length < 2) return [];
  const maxErr = allowedErrors(q.length);
  const scored = [];
  for (const { city, norm, slugNorm } of INDEX) {
    if (norm === q || slugNorm === q) {
      scored.push({ ...pick(city), kind: 'exact', rank: 0, dist: 0 });
      continue;
    }
    if (partial && norm.startsWith(q)) {
      scored.push({ ...pick(city), kind: 'prefix', rank: 1, dist: 0 });
      continue;
    }
    let dist = editDistance(q, norm);
    if (partial && q.length >= 4 && norm.length > q.length) {
      dist = Math.min(dist, editDistance(q, norm.slice(0, q.length)));
    }
    if (maxErr > 0 && dist <= maxErr) {
      scored.push({ ...pick(city), kind: 'fuzzy', rank: 2, dist });
    }
  }
  scored.sort((a, b) => a.rank - b.rank || a.dist - b.dist || a.name.length - b.name.length || a.name.localeCompare(b.name));
  // Bilkul sahi naam mil gaya to spelling wale andaze ("zurich" → Munich) nahi
  const hasExact = scored.some((s) => s.kind === 'exact');
  return (hasExact ? scored.filter((s) => s.kind !== 'fuzzy') : scored).slice(0, limit);
}

/** Bilkul isi naam/slug ka shehar hamari list mein (accent/case ignore) — warna null */
export function exactCity(query) {
  const q = normalizeText(query);
  const hit = INDEX.find((x) => x.norm === q || x.slugNorm === q);
  return hit ? pick(hit.city) : null;
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
