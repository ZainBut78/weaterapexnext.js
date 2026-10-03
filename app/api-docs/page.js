// ─────────────────────────────────────────────────────────────
//  API DOCS  →  URL: /api-docs
//
//  Purana src/pages/ApiDocs.jsx — wahi design (purani site mein bhi
//  is page par Navbar/Footer nahi tha).
//  Poora page ApiDocs.jsx ('use client') mein hai — sidebar, tabs, copy
//  buttons, key generate sab state wale hain. Client component bhi
//  pehle SERVER par render hota hai, is liye saara docs text HTML mein
//  Google tak jata hai.
// ─────────────────────────────────────────────────────────────
import ApiDocs from './ApiDocs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { pageMetadata } from '@/utils/seo';

export const metadata = pageMetadata({
  title: 'API Documentation',
  description: 'Integrate WeatherApex trip scoring, event risk and current weather into your own application.',
  path: '/api-docs',
});

// Navbar + Footer: pehle (React site mein bhi) yeh page "band gali" tha —
// koi link nahi (audit 2.6-c, owner: haan).
export default function ApiDocsPage() {
  return (
    <>
      <Navbar />
      <ApiDocs />
      <Footer />
    </>
  );
}
