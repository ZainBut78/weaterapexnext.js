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
import { notFound } from 'next/navigation';
import { pageMetadata } from '@/utils/seo';
import { LOCALES, localePath } from '@/i18n/config';
import { I18nProvider } from '@/i18n/client';

// Switcher: doosri zaban mein yeh page nahi (/de/api-docs = 404) → us zaban ka home
const ALTERNATES = Object.fromEntries(LOCALES.map((l) => [l, l === 'en' ? '/api-docs' : localePath(l, '/')]));

export const metadata = pageMetadata({
  title: 'API Documentation',
  description: 'Integrate WeatherApex trip scoring, event risk and current weather into your own application.',
  path: '/api-docs',
  hreflang: false,   // sirf English
});

// i18n (Oct 2026, owner ki manzoori): developers ka page — SIRF English.
// /de/api-docs waghera 404 (English body kisi prefix ke neeche nahi), nav ka
// "API Docs" link har zaban se seedha /api-docs par jata hai.
// Navbar + Footer: pehle (React site mein bhi) yeh page "band gali" tha —
// koi link nahi (audit 2.6-c, owner: haan).
export default async function ApiDocsPage({ params }) {
  const { lang } = await params;
  if (lang !== 'en') notFound();
  return (
    <I18nProvider alternates={ALTERNATES}>
      <Navbar />
      {/* Ek <main> landmark — Navbar/Footer bahar (a11y Task 7) */}
      <main>
      <ApiDocs />
      </main>
      <Footer />
    </I18nProvider>
  );
}
