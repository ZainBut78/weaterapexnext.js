// ─────────────────────────────────────────────────────────────
//  SIGN UP  →  URL: /signup
//  Form + OTP step browser mein chalte hain — SignUp.jsx ('use client').
//  Yeh file sirf title/noindex deti hai.
// ─────────────────────────────────────────────────────────────
import SignUp from './SignUp';
import { pageMetadata } from '@/utils/seo';
import { getT } from '@/i18n/server';
import ClientMessages from '@/i18n/ClientMessages';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  return pageMetadata({ title: t('auth.metaSignUpTitle'), description: t('auth.metaSignUpDescription'), path: '/signup', noindex: true, lang });
}

export default async function SignUpPage({ params }) {
  const { lang } = await params;
  return (
    <ClientMessages lang={lang} ns={['auth']}>
      <SignUp />
    </ClientMessages>
  );
}
