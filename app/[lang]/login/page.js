// ─────────────────────────────────────────────────────────────
//  SIGN IN  →  URL: /login
//  Form browser mein chalta hai (state, clicks) — woh SignIn.jsx mein
//  hai ('use client'). Yeh file sirf title/noindex deti hai.
//  noindex: login page Google search mein nahi aana chahiye.
// ─────────────────────────────────────────────────────────────
import SignIn from './SignIn';
import { pageMetadata } from '@/utils/seo';
import { getT } from '@/i18n/server';
import ClientMessages from '@/i18n/ClientMessages';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  return pageMetadata({ title: t('auth.metaSignInTitle'), description: t('auth.metaSignInDescription'), path: '/login', noindex: true, lang });
}

export default async function LoginPage({ params }) {
  const { lang } = await params;
  return (
    <ClientMessages lang={lang} ns={['auth']}>
      <SignIn />
    </ClientMessages>
  );
}
