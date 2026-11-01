// ─────────────────────────────────────────────────────────────
//  ROOT LAYOUT — poori website ka "frame"
//
//  Vite mein yeh kaam do files karti thin: index.html (<html>, <head>)
//  aur main.jsx (providers). Next.js mein dono ki jagah yeh ek file.
//  Har page isi ke andar `children` ban kar dikhta hai.
//
//  Navbar/Footer yahan NAHI lagaye — purani site mein har page khud
//  lagata tha (Sign In/Sign Up par Navbar hai hi nahi). Design wahi
//  rakhne ke liye wahi tareeqa.
// ─────────────────────────────────────────────────────────────
import { preconnect } from 'react-dom';
import '../globals.css';
import Providers from './providers';
import { notFound } from 'next/navigation';
import { LOCALES, isLocale } from '@/i18n/config';
import { enabledLocales, getDictionary, getT } from '@/i18n/server';
import { pickNamespaces } from '@/i18n/translate';
import { I18nProvider } from '@/i18n/client';
import { CLIENT_NAMESPACES } from '@/i18n/namespaces';

// i18n (Oct 2026): yeh ROOT layout hai, app/[lang] ke andar — `lang` root
// param. Sirf 6 zabanein; baqi koi bhi /xx yahan pohanchta hi nahi (proxy
// bina-prefix ko /en par rewrite karta hai: /xx/about → /en/xx/about → 404).
// `dynamicParams = false` yahan NAHI — layout ka segment config neeche ke
// saare routes par lagta (city/month pages on-demand bante hain → sab 404).
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// Default title/description — jo page apna `metadata` na de, us par yeh.
// `template`: page sirf "Blog" likhe to tab mein "Blog — WeatherApex".
export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  return {
    // Canonical / og:url / og:image ke relative paths ("/about") is se
    // poore pate bante hain: https://weatherapex.com/about (audit 2.2).
    // API ka domain NAHI — site ka apna domain.
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://weatherapex.com'),
    title: {
      default: 'WeatherApex',
      template: '%s — WeatherApex',
    },
    description: t('meta.siteDescription'),
    // Jo zaban ENABLED_LOCALES mein nahi — poori zaban noindex (page apna
    // robots de tab bhi proxy ka X-Robots-Tag lagta hai)
    ...(enabledLocales().includes(lang) ? {} : { robots: { index: false, follow: false } }),
    // og:locale har page ka pageMetadata() lagata hai (page ka openGraph
    // layout wale ko poora badal deta hai)
    // Tab icon ab app/icon.svg (Next.js file convention — khud
    // <link rel="icon"> banata hai). /favicon.ico next.config.mjs ke
    // rewrite se wahi svg deta hai. (audit 2.5)
  };
}

// Mobile par sahi zoom + browser bar ka rang — purane index.html ke
// <meta name="viewport"> aur <meta name="theme-color">.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0077b6',
};

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const messages = pickNamespaces(getDictionary(lang), CLIENT_NAMESPACES);
  // Bahar ki tasveerein jaldi: city/home photos (Pexels) aur blog images
  // (api.weatherapex.com/media) — DNS + TLS pehle se (perf fixes Oct 2026)
  preconnect('https://images.pexels.com');
  preconnect('https://api.weatherapex.com');
  return (
    // suppressHydrationWarning <html> par: neeche wala script React se pehle
    // `data-saved-city` lagata hai (sirf yahi attribute ka farq)
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* Homepage server HTML default shehar (London) ka card dikhata hai.
            User ka saved shehar koi aur ho to yeh 1-line script pehle paint
            se pehle bata deta hai, aur CSS (globals.css .ssr-default-city)
            London wala content chhupa deti hai — jagah wahi (CLS nahi), apne
            shehar ka data aate hi dikh jata hai. Perf fixes, Oct 2026. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var c=localStorage.getItem('weatherApex_city');if(c)document.documentElement.setAttribute('data-saved-city',c)}catch(e){}",
          }}
        />
      </head>
      {/* suppressHydrationWarning: browser extensions (jaise ColorZilla ka
          `cz-shortcut-listen`) React se pehle <body> par attribute laga
          dete hain → dev mein laal "Issue". Yeh SIRF <body> ke apne
          attributes ka farq chhupata hai; andar ke page ki jaanch waise hi
          hoti hai. (Owner ki manzoori, audit round 1.) */}
      <body suppressHydrationWarning>
        <I18nProvider lang={lang} messages={messages} enabled={enabledLocales()}>
          <Providers>{children}</Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
