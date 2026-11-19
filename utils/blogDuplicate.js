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

// Kabhi na bane / hata diye gaye posts jo Google ko 404 dete the (GSC, Nov 2026, owner):
// sab se qareeb maujood page par 301. Har zaban mein usi zaban ka page (proxy.js localePath).
// Sirf jab is slug ka post live NA ho — baad mein asli post likha jaye to wahi khulega.
export const MOVED_POSTS = {
  'best-time-to-visit-philippines': '/weather/philippines',   // Manila + Cebu, month by month
  'best-time-to-visit-montreal': '/weather/canada/montreal',
};

/** '/blog/<slug>' (moved) → naya path, warna null */
export function movedBlogTarget(path) {
  const m = /^\/blog\/([a-z0-9-]+)$/.exec(path || '');
  return (m && MOVED_POSTS[m[1]]) || null;
}
