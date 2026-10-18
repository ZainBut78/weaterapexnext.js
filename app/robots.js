// ─────────────────────────────────────────────────────────────
//  ROBOTS  →  /robots.txt   (audit 2.3)
//  Sab allow; /api/ (backend proxy) aur RSC payloads (?_rsc=) disallow; sitemap ka link.
//
//  /login, /signup, /pricing yahan block NAHI — un par <meta noindex>
//  hai. robots.txt se block karein to Google page parh hi nahi sakta,
//  noindex tag dekh nahi pata, aur URL phir bhi (bina content) index ho
//  sakta hai. (Owner, round 4 fix 1.)
// ─────────────────────────────────────────────────────────────
import { SITE_URL } from '@/utils/seo';

// RSC payloads (`?_rsc=…`) — Next.js client navigation ki files, HTML nahi.
// Search Console crawl stats: Googlebot ki 84% requests inhi par (crawl
// budget zaya). Page ka HTML URL (bina _rsc) allow hi rehta hai; JS/CSS
// (/_next/static) block NAHI. (SEO fixes, Oct 2026)
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/*?_rsc=', '/*&_rsc='],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
