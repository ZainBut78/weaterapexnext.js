// ─────────────────────────────────────────────────────────────
//  Blog data har zaban mein (i18n Phase 4, Oct 2026) — server only
//
//  English: wahi purani calls (koi `lang` param nahi → jawab bilkul pehle jaisa).
//  Doosri zaban: `?lang=de` — sirf us zaban ke PUBLISHED tarjume (slug us
//  zaban ka). Purana backend `lang` nahi samajhta aur English bhej deta hai —
//  jawab mein `lang` na ho / ghalat ho → "koi post nahi" (English post kabhi
//  /de/... par nahi).
// ─────────────────────────────────────────────────────────────
import { serverGet } from './serverApi';
import { ENDPOINTS } from '@/config/endpoints';
import { DEFAULT_LOCALE } from '@/i18n/config';

export const NO_POSTS = { posts: [], total_pages: 1, current_page: 1, has_previous: false, has_next: false, languages: [DEFAULT_LOCALE] };

const LIST_REVALIDATE = 600;
const POST_REVALIDATE = 300;

/** Blog list ka ek page. Backend down → null (purana rawaiya). */
export async function getBlogList(lang, page) {
  const en = lang === DEFAULT_LOCALE;
  const data = await serverGet(ENDPOINTS.blog.list, {
    params: en ? { page } : { page, lang },
    revalidate: LIST_REVALIDATE,
    tags: ['blog'],   // /api/revalidate (Django publish) se saaf
  });
  if (en || !data) return data;
  return data.lang === lang ? data : NO_POSTS;
}

/** Ek post — nahi mili / zaban ka tarjuma nahi → null. */
export async function getBlogPost(lang, slug) {
  const en = lang === DEFAULT_LOCALE;
  const data = await serverGet(ENDPOINTS.blog.detail(slug), {
    ...(en ? {} : { params: { lang } }),
    revalidate: POST_REVALIDATE,
    tags: en ? [`blog:${slug}`, 'blog'] : [`blog:${lang}:${slug}`, 'blog'],
  });
  if (!data || en) return data;
  return data.lang === lang ? data : null;
}

/** {en: '/blog/a', de: '/blog/b'} — pageMetadata({ hreflang }) ke liye (sirf live tarjume). */
export function postHreflang(data) {
  const map = data?.translations;
  if (!map || typeof map !== 'object') return [DEFAULT_LOCALE];
  return Object.fromEntries(Object.entries(map).map(([l, s]) => [l, `/blog/${s}`]));
}
