// ─────────────────────────────────────────────────────────────
//  RelatedArticles — EK dynamic component (backend round B5)
//
//  Server component. Backend ka recommendation system (article ↔ shehar
//  khud link hote hain, admin mein theek ho sakte hain):
//    • city (+ month, exclude) → /blog/related/
//    • post                     → /blog/posts/{slug}/related/
//  Internal key ke saath (serverApi), revalidate 1 h.
//  Khaali list, 404, 429, 5xx → KUCH render nahi (page kabhi nahi tootta).
//
//  Design: /blog ke cards jaisa (rounded, photo ya neela gradient +
//  pehla harf, category, title, excerpt, date · Read →), chhota size.
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';
import { ArrowRight, CalendarDays, Newspaper } from 'lucide-react';
import { getRelatedForCity, getRelatedForPost } from '@/services/blogPosts';

function Card({ post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group"
    >
      <div className="h-36 w-full overflow-hidden relative bg-gray-100">
        {post.featured_image ? (
          <img
            loading="lazy" decoding="async" src={post.featured_image} alt={post.title}
            width={400} height={144}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0077b6] to-[#00a8e8] flex items-center justify-center">
            <span className="text-white font-extrabold text-4xl">{post.title.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          {post.category && (
            <span className="text-[11px] font-extrabold text-[#0077b6] tracking-wider uppercase block mb-2">{post.category}</span>
          )}
          <h3 className="text-base font-bold text-[#002244] leading-snug mb-2 group-hover:text-[#0077b6] transition-colors">{post.title}</h3>
          {post.excerpt && <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">{post.excerpt}</p>}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-gray-50 text-xs font-semibold text-gray-500">
          {post.published_at && (
            <>
              <CalendarDays className="w-3.5 h-3.5" />
              {new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
            </>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-[#0077b6]">
            Read <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * @param p.city    shehar ka slug (city mode)
 * @param p.month   1–12 (optional — us mahine ke articles upar)
 * @param p.exclude post slug jo na dikhana ho
 * @param p.post    post slug (article → article mode)
 * @param p.limit   kitne (default 3)
 * @param p.title   heading
 */
export default async function RelatedArticles({ city, month, exclude, post, limit = 3, title = 'Related articles' }) {
  const posts = post
    ? await getRelatedForPost(post, { limit })
    : await getRelatedForCity(city, { month, exclude, limit });
  if (!posts.length) return null;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8" aria-labelledby="related-articles-heading">
      <div className="flex items-center gap-2 mb-5">
        <Newspaper className="w-5 h-5 text-[#0077b6]" />
        <h2 id="related-articles-heading" className="text-xl font-bold text-[#002244]">{title}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => <Card key={p.slug} post={p} />)}
      </div>
    </section>
  );
}
