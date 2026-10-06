// ─────────────────────────────────────────────────────────────
//  BLOG POST  →  URL: /blog/<slug>
//
//  Purana src/pages/BlogPost.jsx — wahi design.
//  FARQ:
//   • Post SERVER par aati hai — poora article HTML mein Google tak.
//   • Title/description `generateMetadata` se (purana Helmet).
//   • Post na mile → notFound() = asli HTTP 404 (pehle 200 ke sath
//     "Post not found" dikhta tha).
//   • Pehli dafa khulne par page banta hai, phir 10 min cache (ISR).
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, CloudSun } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RelatedArticles from '@/components/RelatedArticles';
import { serverGet } from '@/services/serverApi';
import { ENDPOINTS } from '@/config/endpoints';
import { isKnownCity } from '@/data/cities';
import { cityPath } from '@/data/countries';
import ProductImage from './ProductImage';
import { pageMetadata, ogImageUrl, SITE_URL } from '@/utils/seo';
import JsonLd, { AUTHOR, ORGANIZATION, breadcrumbs } from '@/components/JsonLd';

const BLOG_REVALIDATE = 600;
export const revalidate = 600;

// Build ke waqt koi post pehle se nahi banti — har post pehli visit par
// banti hai aur cache hoti hai (on-demand ISR).
export async function generateStaticParams() {
  return [];
}

// generateMetadata aur page dono yahi call karte hain — Next.js ek hi
// URL ki fetch ko ek request mein mila deta hai (backend ko 1 call).
const getPost = (slug) =>
  serverGet(ENDPOINTS.blog.detail(slug), { revalidate: BLOG_REVALIDATE });

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) return { title: 'Post not found' };

  const description = data.meta_description || data.excerpt || '';
  return {
    ...pageMetadata({
      absoluteTitle: blogTitle(data),
      imageTitle: data.title,
      kicker: data.category || 'WeatherApex Blog',
      description,
      path: `/blog/${slug}`,
      type: 'article',
      // Post ki apni tasveer ho to wahi share image, warna generated
      image: data.featured_image || undefined,
      openGraph: { publishedTime: data.published_at },
    }),
    ...(data.meta_keywords ? { keywords: data.meta_keywords } : {}),
  };
}

// "<meta_title> | WeatherApex Blog". Backend ke kuch meta_title pehle se
// "| WeatherApex Blog" par khatam hote hain — pehle yeh do dafa lag jata
// tha (React site ka purana bug). Ab pehle se ho to dobara nahi (owner,
// round 2, 2.2-b option A).
function blogTitle(data) {
  const base = (data.meta_title || data.title || '').trim();
  return /weatherapex(\s+blog)?\s*$/i.test(base) ? base : `${base} | WeatherApex Blog`;
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) notFound();

  const { title, category, excerpt, content, featured_image, affiliate_products, published_at } = data;
  // Backend round B4: article ke linked shehar — sirf whitelist wale (unke
  // apne pages hain). Purana backend `cities` na bheje → [] (box nahi).
  const weatherCities = (data.cities || []).filter((c) => isKnownCity(c.slug));

  // Article + Breadcrumb structured data (audit 2.4). Author = Person
  // "Zain Butt" (owner, Oct 2026 — backend abhi author nahi bhejta);
  // publisher = WeatherApex Organization + logo (ImageObject).
  const postUrl = `${SITE_URL}/blog/${slug}`;
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: data.meta_description || excerpt || undefined,
    datePublished: published_at,
    ...(data.updated_at ? { dateModified: data.updated_at } : {}),
    image: [featured_image || `${SITE_URL}${ogImageUrl(title, category || 'WeatherApex Blog')}`],
    author: AUTHOR,                 // Person (owner, Oct 2026)
    publisher: ORGANIZATION,
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    ...(category ? { articleSection: category } : {}),
  };

  return (
    <div className="min-h-screen bg-[#f3f7ff]">
      <JsonLd data={articleLd} />
      <JsonLd
        data={breadcrumbs([
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: title, path: `/blog/${slug}` },
        ])}
      />
      <Navbar />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0077b6] hover:text-[#005a8d] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {featured_image && (
          <div className="rounded-3xl overflow-hidden mb-8 shadow-sm">
            <img src={featured_image} alt={title} className="w-full max-h-96 object-cover" />
          </div>
        )}

        <header className="mb-8">
          {category && (
            <span className="text-xs font-extrabold text-[#0077b6] tracking-wider uppercase mb-3 inline-block">
              {category}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#002244] leading-tight mb-4">
            {title}
          </h1>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <CalendarDays className="w-3.5 h-3.5" />
            {new Date(published_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <p className="mt-4 text-lg text-gray-600">{excerpt}</p>
        </header>

        {/* NOTE: dangerouslySetInnerHTML zaroori hai kyunki content CKEditor se
            RICH HTML mein aata hai (bold, links, images). Yeh safe hai kyunki
            content sirf TRUSTED admin se aata hai, public users se nahi. */}
        <div className="blog-content" dangerouslySetInnerHTML={{ __html: content }} />

        {affiliate_products.length > 0 && (
          <div className="mt-10 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#002244] mb-4">Recommended Gear</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {affiliate_products.map((p) => (
                <a
                  key={p.name}
                  href={p.affiliate_url}
                  target="_blank"
                  // Affiliate (paid) link — Google ka rule: rel="sponsored" (audit 1.5)
                  rel="sponsored nofollow noopener noreferrer"
                  className="bg-[#f3f7ff] rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow border border-transparent hover:border-[#0077b6] group"
                >
                  <div className="h-36 bg-white p-3 flex items-center justify-center">
                    {p.image_url ? (
                      <ProductImage src={p.image_url} alt={p.name} />
                    ) : (
                      <span className="text-[#0077b6] font-extrabold text-3xl">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <span className="font-semibold text-slate-800 text-sm mb-1">{p.name}</span>
                    <span className="text-sm font-extrabold text-[#0077b6] mb-2">
                      {p.price_display || ''}
                    </span>
                    <span className="mt-auto text-xs font-bold text-[#0077b6] group-hover:underline">
                      View on Amazon →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Backend round B4: "Weather in {City}" — article → shehar ke pages
            (internal linking dono taraf). Sirf linked whitelist shehar. */}
        {weatherCities.length > 0 && (
          <aside className="mt-10 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#002244] mb-4">
              <CloudSun className="w-5 h-5 text-[#0077b6]" />
              Weather in {weatherCities.map((c) => c.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {weatherCities.map((c) => (
                <li key={c.slug} className="rounded-2xl bg-[#f3f7ff] p-4">
                  <p className="font-bold text-[#002244] mb-2">{c.name}</p>
                  <Link href={`/weather/${c.slug}`} className="flex items-center gap-1.5 text-sm font-semibold text-[#0077b6] hover:underline">
                    {c.name} climate & 20-year averages <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link href={cityPath(c.slug)} className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#0077b6] hover:underline">
                    {c.name} weather by month <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </article>

      {/* Backend round B3: "You may also like" — article → article (khaali ho to kuch nahi) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <RelatedArticles post={slug} limit={3} title="You may also like" />
      </div>

      <Footer />
    </div>
  );
}
