// ─────────────────────────────────────────────────────────────
//  FORGOT PASSWORD  →  URL: /forgot-password  (hardening, Oct 2026)
//  Form browser mein — ForgotPassword.jsx ('use client'). Yeh file sirf
//  title/noindex deti hai (login/signup jaisa — search mein nahi aana chahiye).
// ─────────────────────────────────────────────────────────────
import ForgotPassword from './ForgotPassword';
import { pageMetadata } from '@/utils/seo';

export const metadata = pageMetadata({
  title: 'Reset your password',
  description: 'Reset the password of your WeatherApex account.',
  path: '/forgot-password',
  noindex: true,
});

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
