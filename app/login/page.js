// ─────────────────────────────────────────────────────────────
//  SIGN IN  →  URL: /login
//  Form browser mein chalta hai (state, clicks) — woh SignIn.jsx mein
//  hai ('use client'). Yeh file sirf title/noindex deti hai.
//  noindex: login page Google search mein nahi aana chahiye.
// ─────────────────────────────────────────────────────────────
import SignIn from './SignIn';
import { pageMetadata } from '@/utils/seo';

export const metadata = pageMetadata({
  title: 'Sign in',
  description: 'Sign in to your WeatherApex account.',
  path: '/login',
  noindex: true,
});

export default function LoginPage() {
  return <SignIn />;
}
