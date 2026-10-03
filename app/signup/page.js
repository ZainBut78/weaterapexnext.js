// ─────────────────────────────────────────────────────────────
//  SIGN UP  →  URL: /signup
//  Form + OTP step browser mein chalte hain — SignUp.jsx ('use client').
//  Yeh file sirf title/noindex deti hai.
// ─────────────────────────────────────────────────────────────
import SignUp from './SignUp';
import { pageMetadata } from '@/utils/seo';

export const metadata = pageMetadata({
  title: 'Create an account',
  description: 'Create a free WeatherApex account to plan trips and generate an API key.',
  path: '/signup',
  noindex: true,
});

export default function SignUpPage() {
  return <SignUp />;
}
