// ─────────────────────────────────────────────────────────────
//  ROBOTS  →  /robots.txt   (audit 2.3)
//  Sab allow; sirf /api/ (backend proxy) disallow; sitemap ka link.
//
//  /login, /signup, /pricing yahan block NAHI — un par <meta noindex>
//  hai. robots.txt se block karein to Google page parh hi nahi sakta,
//  noindex tag dekh nahi pata, aur URL phir bhi (bina content) index ho
//  sakta hai. (Owner, round 4 fix 1.)
// ─────────────────────────────────────────────────────────────
import { SITE_URL } from '@/utils/seo';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
