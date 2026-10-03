// ─────────────────────────────────────────────────────────────
//  Next.js ki settings
// ─────────────────────────────────────────────────────────────

// ── Beta par Google index na kare (SITE_NOINDEX=1) ──
// Har response par `X-Robots-Tag: noindex, nofollow`. robots.txt JAAN BOOJH
// kar crawling allow karta rehta hai — warna Google yeh header dekh hi na
// sake. Khaali / 0 → bilkul aaj jaisa. Server-side env (Hostinger par build
// aur runtime dono par milti hai) — NEXT_PUBLIC_ ki zaroorat nahi.
const NOINDEX = process.env.SITE_NOINDEX === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Standalone (Hostinger khud `output: 'standalone'` lagata hai) ──
  // Local test ke liye sirf env switch: NEXT_OUTPUT=standalone npm run build.
  // Hamesha nahi — standalone ke saath local `next start` (aur hamare
  // seo-check / e2e workflow) theek nahi chalta.
  ...(process.env.NEXT_OUTPUT === 'standalone' ? { output: 'standalone' } : {}),

  // Standalone mein sirf woh files copy hoti hain jo Next ka tracer dhoondh
  // sake. Yeh do runtime par dynamic path se parhi jati hain — warna live
  // par 120 travel notes chupchap gaib, aur OG image ka font missing:
  //   services/guides.js      → content/guides/<city>/<month>.md
  //   app/og-image/route.js   → app/og-image/Inter-Bold-latin.woff
  // '/**' = saare routes (files chhoti hain: notes + 31 KB font).
  outputFileTracingIncludes: {
    '/**': ['./content/guides/**/*', './app/og-image/*.woff'],
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
    if (!NOINDEX) return [];
    return [
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
    // Browser khud /favicon.ico maangta hai (pehle 404). Wahi brand icon
    // dikhao jo app/icon.svg hai — WeatherApex nishan (audit 2.5, round 3 B1). Yeh rule
    // HAMESHA rehta hai — live par bhi (proxy wale rules ke bar-aks).
    const favicon = { source: '/favicon.ico', destination: '/favicon.svg' };

    const target = process.env.API_PROXY_TARGET;
    if (!target) return [favicon];
    const base = target.replace(/\/+$/, '');
    return [
      favicon,
      // PEHLA rule: jo URL "/" par khatam ho, us ka "/" aage bhi jaye.
      // BUG JO ISNE THEEK KIYA: sirf doosra rule tha, aur `:path*`
      // aakhri "/" ko nigal jata hai — backend ko
      // `/api/weather/current?city=x` (bina "/") milta tha. Django
      // (APPEND_SLASH) "/" laga kar wapas redirect karta, browser phir
      // yahin aata, proxy phir "/" hata deta... → ERR_TOO_MANY_REDIRECTS.
      {
        source: '/api/:path*/',
        destination: `${base}/api/:path*/`,
      },
      {
        source: '/api/:path*',
        destination: `${base}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
