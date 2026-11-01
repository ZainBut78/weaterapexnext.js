// ─────────────────────────────────────────────────────────────
//  FORGOT PASSWORD  →  URL: /forgot-password  (hardening, Oct 2026)
//  Form browser mein — ForgotPassword.jsx ('use client'). Yeh file sirf
//  title/noindex deti hai (login/signup jaisa — search mein nahi aana chahiye).
// ─────────────────────────────────────────────────────────────
import ForgotPassword from './ForgotPassword';
import { pageMetadata } from '@/utils/seo';
import { getT } from '@/i18n/server';
import ClientMessages from '@/i18n/ClientMessages';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  return pageMetadata({ title: t('auth.metaResetTitle'), description: t('auth.metaResetDescription'), path: '/forgot-password', noindex: true, lang });
}

export default async function ForgotPasswordPage({ params }) {
  const { lang } = await params;
  return (
    <ClientMessages lang={lang} ns={['auth']}>
      <ForgotPassword />
    </ClientMessages>
  );
}
