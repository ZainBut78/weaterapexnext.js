// Purane duplicate blog slugs (Nov 2026, Search Console 404):
//   /blog/best-time-to-visit-hawaii-2 → /blog/best-time-to-visit-hawaii (301)
// Sirf jab asal slug khud live NA ho aur bina number wala live ho (proxy.js
// backend se poochta hai) — "…-2026" jaisi asli post kabhi redirect nahi hoti.

const DUPLICATE = /^\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)-(\d{1,4})$/;

/** '/blog/<slug>-<digits>' → '<slug>', warna null */
export function duplicateBlogBase(path) {
  const m = DUPLICATE.exec(path || '');
  return m ? m[1] : null;
}
