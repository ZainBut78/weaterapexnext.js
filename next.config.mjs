// ─────────────────────────────────────────────────────────────
//  Next.js ki settings
// ─────────────────────────────────────────────────────────────

import bundleAnalyzer from '@next/bundle-analyzer';

// Bundle report: ANALYZE=true npm run build → .next/analyze/client.html
// (sirf jab maanga jaye; aam build par koi asar nahi)
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true', openAnalyzer: false });

// ── Beta par Google index na kare (SITE_NOINDEX=1) ──
// Har response par `X-Robots-Tag: noindex, nofollow`. robots.txt JAAN BOOJH
// kar crawling allow karta rehta hai — warna Google yeh header dekh hi na
// sake. Khaali / 0 → bilkul aaj jaisa. Server-side env (Hostinger par build
// aur runtime dono par milti hai) — NEXT_PUBLIC_ ki zaroorat nahi.
const NOINDEX = process.env.SITE_NOINDEX === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ISR pages ki stale-while-revalidate 1 saal ki jagah 30 din (Step 2, Nov 2026; pehle 2 din).
  // Is se purana page Next ke liye "expired": agli request stale nahi leti, wahin ruk kar
  // banati hai. Backend band ho to 500, aur crawl par dheema. Kam crawl hone wale pages 2 din
  // mein aksar expire ho jate the. Data badle to tags se foran naya (weather/indexnow_pages.py).
  expireTime: 2592000,
  // Metadata (title, canonical, hreflang) HAMESHA pehle HTML ke <head> mein (Nov 2026).
  // Default mein Next aam browsers / curl / SEO tools ke liye metadata "stream" karta
  // hai: data der se aaye (naye tarjume ki pehli, bina cache request) to tags shell
  // ke baad <body> mein jate hain — live par naye /de/blog/... ki pehli request bina
  // hreflang dikhi. /.*/ = har user agent ke liye blocking. Hamare pages ka metadata
  // wahi data hai jis ka page khud intezar karta hai — TTFB par asar nahi.
  htmlLimitedBots: /.*/,
  // `X-Powered-By: Next.js` header band — framework ka naam na bataye (security report #11)
  poweredByHeader: false,
  // inlineCss NAAPA aur BAND rakha (Oct 2026): CSS <style> mein HTML + RSC
  // payload dono mein aati hai (+13 KB gz har page). Lighthouse (local, 2 runs):
  // home LCP 2.3 → 1.9 s behtar, magar city/month 3.0 → 3.6 s KHARAB (bara RSC
  // payload). Site ke zyada pages city/month hain → band.
  // ── Standalone (Hostinger khud `output: 'standalone'` lagata hai) ──
  // Local test ke liye sirf env switch: NEXT_OUTPUT=standalone npm run build.
  // Hamesha nahi — standalone ke saath local `next start` (aur hamare
  // seo-check / e2e workflow) theek nahi chalta.
  ...(process.env.NEXT_OUTPUT === 'standalone' ? { output: 'standalone' } : {}),

  // Standalone mein sirf woh files copy hoti hain jo Next ka tracer dhoondh
  // sake. Yeh do runtime par dynamic path se parhi jati hain — warna live
  // par 120 travel notes chupchap gaib, aur OG image ka font missing:
  //   services/guides.js      → content/guides/<city>/<month>.md
  //   app/og-image/route.js   → app/og-image/Inter-Bold-latin.woff, logo-mark.png
  // '/**' = saare routes (files chhoti hain: notes + 31 KB font + logo).
  outputFileTracingIncludes: {
    '/**': ['./content/guides/**/*', './app/og-image/*.woff', './app/og-image/*.png'],
  },

  // ── www → weatherapex.com (EK permanent redirect, 308) ──
  // Google par purana "Powered by CapRover" result `http://www…` ka tha.
  // Sab kuch https://weatherapex.com par ikattha ho. Sirf Host
  // `www.weatherapex.com` par — localhost, Hostinger ka temporary domain aur
  // api.weatherapex.com par koi asar nahi. proxy.js mein NAHI: us ka matcher
  // /sitemap.xml aur /robots.txt jaisi files chhod deta hai. Query string
  // Next.js khud saath le jata hai.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.weatherapex.com' }],
        destination: 'https://weatherapex.com/:path*',
        permanent: true,
      },
    ];
  },

  async headers() {
    // Mausam ke icons (public/icons/meteocons) — har page par dobara na
    // aayein. Naam hash nahi, is liye 1 hafta (icon badle to hafte mein pohnch jaye).
    const icons = {
      source: '/icons/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
    };
    // Security headers (security report #11, owner ki tajweez, Oct 2026) — har route.
    // CSP yahan NAHI: Hostinger pehle se `Content-Security-Policy:
    // upgrade-insecure-requests` lagata hai (do CSP headers dono lagte, takra sakte).
    //  • X-Frame-Options SAMEORIGIN — clickjacking; Google login popup alag window, asar nahi
    //  • Referrer-Policy — Google Sign-In ko origin chahiye, yeh deta hai
    //  • Permissions-Policy — geolocation=(self): "Use my location" chalta rahe
    //  • HSTS 1 saal, preload NAHI. includeSubDomains abhi NAHI — owner pehle
    //    api./www./captain sab ka HTTPS pakka karega.
    //  • COOP jaan boojh kar nahi (same-origin Google login popup tod deta)
    const security = {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
      ],
    };
    if (!NOINDEX) return [icons, security];
    return [
      icons,
      security,
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },

  // Django ke saare endpoints "/" par khatam hote hain
  // (/api/weather/current/). Next.js by default aakhri "/" hata kar
  // redirect kar deta hai — phir neeche wala proxy Django tak ghalat
  // URL bhejta. Is liye Next ka apna redirect band hai.
  // Faisla (Phase C2): site ke pages par aakhri "/" NAHI — /about/ → 308
  // → /about. Yeh proxy.js karta hai, /api/* ko chhoe baghair.
  skipTrailingSlashRedirect: true,

  // ── Local testing ka "dakiya" (proxy) ──
  // Browser `localhost:3000` se seedha api.weatherapex.com ko call kare
  // to backend CORS ki wajah se rok deta hai (woh sirf weatherapex.com
  // ko maanta hai). Is liye browser `/api/...` ko call karta hai — yani
  // apne hi localhost:3000 ko — aur Next.js request aage backend tak
  // pohncha deta hai. Backend mein koi change nahi chahiye.
  //
  // Sirf tab chalta hai jab .env.local mein API_PROXY_TARGET likha ho.
  // Live (Hostinger) par yeh khaali hoga aur browser seedha
  // api.weatherapex.com ko call karega.
  async rewrites() {
    // IndexNow key file: /<INDEXNOW_KEY>.txt → app/api/indexnow-key (Oct 2026).
    // Env build ke waqt parha jata hai — Hostinger par key daal kar redeploy.
    const indexNowKey = (process.env.INDEXNOW_KEY || '').trim();
    const indexNow = /^[A-Za-z0-9-]{8,128}$/.test(indexNowKey)
      ? [{ source: `/${indexNowKey}.txt`, destination: '/api/indexnow-key' }]
      : [];

    const target = process.env.API_PROXY_TARGET;
    if (!target) return indexNow;
    const base = target.replace(/\/+$/, '');
    // /api/site/* (BFF) yahin chalta hai: rewrites dynamic routes se pehle lagte hain
    return [
      ...indexNow,
      // PEHLA rule: jo URL "/" par khatam ho, us ka "/" aage bhi jaye.
      // BUG JO ISNE THEEK KIYA: sirf doosra rule tha, aur `:path*`
      // aakhri "/" ko nigal jata hai — backend ko
      // `/api/weather/current?city=x` (bina "/") milta tha. Django
      // (APPEND_SLASH) "/" laga kar wapas redirect karta, browser phir
      // yahin aata, proxy phir "/" hata deta... → ERR_TOO_MANY_REDIRECTS.
      {
        source: '/api/:path((?!site/).*)/',
        destination: `${base}/api/:path/`,
      },
      {
        source: '/api/:path((?!site/).*)',
        destination: `${base}/api/:path`,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
