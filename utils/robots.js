// ─────────────────────────────────────────────────────────────
//  Adhoore climate pages → noindex, follow (owner, Oct 2026)
//
//  City page: saare 12 mahine mukammal nahi; month page: woh mahina mukammal
//  nahi (backend history ka `months_complete`) → Google index na kare, links
//  follow kare. Mukammal → kuch nahi (pehle jaisa indexable). Purana backend
//  (field nahi) → kuch nahi. Sitemap ke qaide alag (services/sitemap.js).
// ─────────────────────────────────────────────────────────────
const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** @returns {{} | {robots: {index: false, follow: true}}} — metadata mein spread karo */
export function incompleteRobots(data, month = null) {
  const done = data?.months_complete;
  if (!Array.isArray(done)) return {};
  const complete = month ? done.includes(month) : ALL_MONTHS.every((m) => done.includes(m));
  return complete ? {} : { robots: { index: false, follow: true } };
}
