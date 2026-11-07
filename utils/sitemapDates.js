// ─────────────────────────────────────────────────────────────
//  Sitemap ki tareekhein (Step 9, Nov 2026) — pure, unit tests inhi par
//
//  Google <lastmod> par tabhi bharosa karta hai jab woh sach ho. Is liye:
//   • sirf date (YYYY-MM-DD), kabhi future nahi
//   • month page ki date tabhi badle jab us page ke numbers ya text sach mein badlen
// ─────────────────────────────────────────────────────────────

const today = (now) => new Date(now).toISOString().slice(0, 10);

/** Koi bhi tareekh → YYYY-MM-DD; ghalat → null; aaj se aage → aaj. */
export function dayOnly(value, now = Date.now()) {
  const t = new Date(value);
  if (Number.isNaN(t.getTime())) return null;
  const day = t.toISOString().slice(0, 10);
  const max = today(now);
  return day > max ? max : day;
}

/** Sab se nayi tareekh (null chhor kar), sirf date, future nahi. */
export function newestDay(values, now = Date.now()) {
  return values.map((v) => (v ? dayOnly(v, now) : null)).filter(Boolean).sort().pop() || null;
}
