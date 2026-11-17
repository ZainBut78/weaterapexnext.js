// ─────────────────────────────────────────────────────────────
//  Widget kin sites par laga (Nov 2026): proxy.js har /embed/* request ka Referer yahan ginta hai.
//  Sirf domain + din + ginti, memory mein. Har domain ke liye din mein ek hi POST: din badalne
//  par pichle din ki saari ginti ek request mein backend ko (/api/weather/embed-hits/).
//  Apna domain, khaali / ghalat Referer → kuch nahi. Process restart par us din ki ginti chali
//  jati hai (qubool: yeh sirf andaza hai). Pure: waqt bahar se (tests/unit/embedHits.test.mjs).
// ─────────────────────────────────────────────────────────────
export const MAX_DOMAINS_PER_DAY = 500;
const DOMAIN = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63})+$/;

/** "https://www.Blog.example/post" → "blog.example"; na bane → null */
export function refererDomain(referer) {
  if (!referer) return null;
  let host;
  try {
    host = new URL(referer).hostname.toLowerCase();
  } catch {
    return null;
  }
  host = host.replace(/^www\./, '');
  return DOMAIN.test(host) ? host : null;
}

export function createHitCollector({ ownDomains = [], now = Date.now } = {}) {
  const own = new Set(ownDomains.map((d) => d.toLowerCase().replace(/^www\./, '')));
  let day = null;
  let counts = new Map();
  const today = () => new Date(now()).toISOString().slice(0, 10);

  /** Din badla aur ginti hai → bhejne wala payload (aur memory saaf); warna null. */
  function due() {
    const d = today();
    if (d === day) return null;
    const out = day && counts.size ? { day, hits: [...counts].map(([domain, count]) => ({ domain, count })) } : null;
    day = d;
    counts = new Map();
    return out;
  }

  /** Ek embed request. Returns due() ka nateeja (pichle din ka payload ya null). */
  function note(referer) {
    const out = due();
    const domain = refererDomain(referer);
    if (domain && !own.has(domain) && (counts.has(domain) || counts.size < MAX_DOMAINS_PER_DAY)) {
      counts.set(domain, (counts.get(domain) || 0) + 1);
    }
    return out;
  }

  return { note, due, peek: () => ({ day, counts: new Map(counts) }) };
}
