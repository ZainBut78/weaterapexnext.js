// ─────────────────────────────────────────────────────────────
//  Related articles — backend ka recommendation system (backend round B).
//
//  Pehle yahan poori blog list la kar title/slug mein shehar ka naam
//  dhoonda jata tha. Ab backend khud article ↔ shehar link karta hai
//  (text se, admin mein theek ho sakta hai) aur rank karta hai:
//    GET /blog/related/?city=&month=&exclude=&limit=
//    GET /blog/posts/{slug}/related/?limit=
//  Internal key ke saath (serverApi), cache 1 h. Fail / 404 / 429 → [] —
//  page kabhi nahi tootta, section bas nahi dikhta.
// ─────────────────────────────────────────────────────────────
import { serverGet } from './serverApi';
import { ENDPOINTS } from '../config/endpoints';

export const RELATED_REVALIDATE = 60 * 60;

/** Shehar (aur mahine) ke liye related articles */
export async function getRelatedForCity(city, { month, exclude, limit = 4 } = {}) {
  if (!city) return [];
  const params = { city, limit };
  if (month) params.month = month;
  if (exclude) params.exclude = exclude;
  try {
    const data = await serverGet(ENDPOINTS.blog.related, { params, revalidate: RELATED_REVALIDATE });
    return Array.isArray(data?.posts) ? data.posts : [];
  } catch {
    return [];
  }
}

/** Blog post ke neeche "You may also like" */
export async function getRelatedForPost(slug, { limit = 4 } = {}) {
  if (!slug) return [];
  try {
    const data = await serverGet(ENDPOINTS.blog.postRelated(slug), { params: { limit }, revalidate: RELATED_REVALIDATE });
    return Array.isArray(data?.posts) ? data.posts : [];
  } catch {
    return [];
  }
}
