// ─────────────────────────────────────────────────────────────
//  RESET PASSWORD  →  URL: /reset-password?token=...  (email ka link, Nov 2026)
//  Form browser mein — ResetPassword.jsx. Yeh file sirf title/noindex + token.
// ─────────────────────────────────────────────────────────────
import ResetPassword from './ResetPassword';
import { pageMetadata } from '@/utils/seo';
import { getT } from '@/i18n/server';
import ClientMessages from '@/i18n/ClientMessages';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  return pageMetadata({ title: t('auth.metaResetTitle'), description: t('auth.metaResetDescription'), path: '/reset-password', noindex: true, lang });
}

export default async function ResetPasswordPage({ params, searchParams }) {
  const { lang } = await params;
  const { token } = await searchParams;
  return (
    <ClientMessages lang={lang} ns={['auth']}>
      <ResetPassword token={/^[0-9a-f]{64}$/.test(token || '') ? token : ''} />
    </ClientMessages>
  );
}
