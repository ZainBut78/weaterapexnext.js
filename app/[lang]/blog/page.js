// ─────────────────────────────────────────────────────────────
//  BLOG LIST  →  URL: /blog   (doosra page: /blog?page=2)
//
//  Purana src/pages/Blog.jsx — wahi design.
//  FARQ: pehle posts browser mein aati thin (useBlogList) — Google ko
//  khaali page milta tha. Ab SERVER par aati hain, HTML mein har post
//  ka asli <a href> link hota hai.
//  Previous/Next pehle state wale buttons the; ab dikhne mein wahi hain
//  magar asli links (?page=N), taake page 2 ki posts bhi Google dekh sake.
// ─────────────────────────────────────────────────────────────
import Link from '@/components/LocaleLink';
import { getT } from '@/i18n/server';
import { intlLocale } from '@/i18n/format';
import { notFound } from 'next/navigation';
import { ArrowRight, CalendarDays } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getBlogList } from '@/services/blogApi';
import { pageMetadata } from '@/utils/seo';

// /blog → canonical /blog; /blog?page=2 → apna canonical + apna title
// "Blog — Page 2" (warna Google do pages ko duplicate samajhta). Audit 2.2.
export async function generateMetadata({ params, searchParams }) {
  const { lang } = await params;
  const t = await getT(lang);
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam, 10) || 1);
  // Wahi fetch jo page karta hai (Next.js ek request mein mila deta hai)
  const data = await getBlogList(lang, page);
  return pageMetadata({
    title: page > 1 ? t('blog.titlePage', { page }) : t('blog.title'),
    description: page > 1 ? t('blog.descriptionPage', { page }) : t('blog.description'),
    path: page > 1 ? `/blog?page=${page}` : '/blog',
    imageTitle: t('blog.h1'),
    lang,
    // i18n Phase 4: kisi zaban mein abhi koi tarjuma nahi → khaali list noindex
    noindex: lang !== 'en' && !!data && !data.posts?.length,
    // hreflang sirf page 1 par — sirf woh zabanein jin mein kam se kam ek post (backend `languages`)
    hreflang: page > 1 ? false : (data?.languages || ['en']),
  });
}

// i18n Phase 4: doosri zaban mein sirf us zaban ke PUBLISHED tarjume (us
// zaban ke slug) — English post kabhi /de/blog par nahi. services/blogApi.js.

function BlogCard({ post, t, lang }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-gray-100 group"
    >
      <div className="h-56 w-full overflow-hidden relative bg-gray-100">
        {post.featured_image ? (
          <img
            loading="lazy" decoding="async" src={post.featured_image}
            {...(post.featured_image_srcset?.length > 1 ? { srcSet: post.featured_image_srcset.map((s) => `${s.url} ${s.width}w`).join(', '), sizes: '(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw' } : {})}
            alt={post.featured_image_alt || post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0077b6] to-[#00a8e8] flex items-center justify-center">
            <span className="text-white font-extrabold text-5xl">
              {post.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow justify-between">
        <div>
          {post.category && (
            <span className="text-xs font-extrabold text-[#0077b6] tracking-wider uppercase block mb-3">
              {post.category}
            </span>
          )}
          <h2 className="text-xl font-bold text-[#002244] leading-snug mb-3 group-hover:text-[#0077b6] transition-colors">
            {post.title}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6 line-clamp-3">
            {post.excerpt}
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-gray-50 text-xs font-semibold text-gray-500">
          <CalendarDays className="w-3.5 h-3.5" />
          {new Date(post.published_at).toLocaleDateString(intlLocale(lang), {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
          <span className="ml-auto inline-flex items-center gap-1 text-[#0077b6]">
            {t('blog.read')} <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

const PAGER_CLASS =
  'px-4 py-2 border rounded-lg text-sm font-semibold bg-white text-[#002244] hover:border-[#0077b6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

// Enabled → asli link. Disabled → purana jaisa disabled <button> (wahi shakal).
function PagerLink({ enabled, page, children }) {
  if (!enabled) {
    return <button disabled className={PAGER_CLASS}>{children}</button>;
  }
  return (
    <Link href={page === 1 ? '/blog' : `/blog?page=${page}`} className={PAGER_CLASS}>
      {children}
    </Link>
  );
}

export default async function BlogPage({ params, searchParams }) {
  const { lang } = await params;
  const t = await getT(lang);
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam, 10) || 1);

  const data = await getBlogList(lang, page);
  // /blog?page=99 jaisa page jo hai hi nahi → asli 404. Backend aise
  // page par chup-chaap AAKHRI page bhej deta hai (current_page badal
  // kar) — woh duplicate page Google ko nahi dikhana.
  if (page > 1 && (!data || data.current_page !== page)) notFound();

  return (
    <div className="min-h-screen bg-[#f3f7ff]">
      <Navbar />
      {/* Ek <main> landmark — Navbar/Footer bahar (a11y Task 7) */}
      <main>

      <div className="bg-gradient-to-b from-white to-blue-50 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#002244] mb-3">
            {t('blog.h1')}
          </h1>
          <p className="text-slate-500 text-lg">
            {t('blog.intro')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {data.posts.map((post) => (
                <BlogCard key={post.slug} post={post} t={t} lang={lang} />
              ))}
            </div>

            {data.posts.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <p className="text-lg font-semibold text-slate-500">{t('blog.noPosts')}</p>
                <p className="text-sm mt-1">{t('blog.checkBack')}</p>
              </div>
            )}

            {data.total_pages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <PagerLink enabled={data.has_previous} page={data.current_page - 1}>
                  {t('blog.previous')}
                </PagerLink>
                <span className="text-sm text-slate-600">
                  {t('blog.pageOf', { page: data.current_page, total: data.total_pages })}
                </span>
                <PagerLink enabled={data.has_next} page={data.current_page + 1}>
                  {t('blog.next')}
                </PagerLink>
              </div>
            )}
          </>
        )}
      </div>

      </main>
      <Footer />
    </div>
  );
}
