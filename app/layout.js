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
import 'leaflet/dist/leaflet.css';
import './globals.css';
import Providers from './providers';

// Default title/description — jo page apna `metadata` na de, us par yeh.
// `template`: page sirf "Blog" likhe to tab mein "Blog — WeatherApex".
export const metadata = {
  // Canonical / og:url / og:image ke relative paths ("/about") is se
  // poore pate bante hain: https://weatherapex.com/about (audit 2.2).
  // API ka domain NAHI — site ka apna domain.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://weatherapex.com'),
  title: {
    default: 'WeatherApex',
    template: '%s — WeatherApex',
  },
  description:
    'Plan trips and outdoor events with confidence. Day-by-day weather scoring, event risk analysis and 20 years of climate history for cities worldwide.',
  // Tab icon ab app/icon.svg (Next.js file convention — khud
  // <link rel="icon"> banata hai). /favicon.ico next.config.mjs ke
  // rewrite se wahi svg deta hai. (audit 2.5)
};

// Mobile par sahi zoom + browser bar ka rang — purane index.html ke
// <meta name="viewport"> aur <meta name="theme-color">.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0077b6',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning: browser extensions (jaise ColorZilla ka
          `cz-shortcut-listen`) React se pehle <body> par attribute laga
          dete hain → dev mein laal "Issue". Yeh SIRF <body> ke apne
          attributes ka farq chhupata hai; andar ke page ki jaanch waise hi
          hoti hai. (Owner ki manzoori, audit round 1.) */}
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
