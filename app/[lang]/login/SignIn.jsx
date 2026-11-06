'use client';

import { useState } from 'react';
import Link from '@/components/LocaleLink';
import { useLang, useLocaleRouter, useT } from '@/i18n/client';
import { Cloud, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginUser, googleLogin, resendOtp } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { GOOGLE_CLIENT_ID } from '@/config/googleAuth';
import { authErrorMessage } from '@/utils/authErrors';
import { makeSession, saveSession } from '@/utils/otpTimer';

export default function SignIn() {
  const router = useLocaleRouter();
  const t = useT();
  const lang = useLang();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(form);
      login(res.username, res.access_token, res.refresh_token);
      router.push('/');
    } catch (err) {
      // Password sahi, email verify nahi: naya code bhej kar sign-up ki code wali screen par
      if (err?.response?.data?.code === 'account_not_verified' && err.response.data.email) {
        if (await sendVerificationCode(err.response.data.email)) return;
      } else {
        setError(authErrorMessage(err, t('auth.loginFailed'), t, lang));
      }
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationCode = async (email) => {
    try {
      saveSession('signup', makeSession(email, await resendOtp(email)));
    } catch (err) {
      // Abhi hi code gaya tha (429) → wahi screen, server ke waqt se countdown
      const wait = Number(err?.response?.data?.retry_after);
      if (err?.response?.status !== 429 || !wait) {
        setError(authErrorMessage(err, t('auth.sendCodeFailed'), t, lang));
        return false;
      }
      saveSession('signup', makeSession(email, { retry_after: wait }));
    }
    router.push('/signup');
    return true;
  };

  // Google popup se id_token milne par — backend use verify karke hamare
  // apne JWT deta hai, aage ka raasta bilkul normal login jaisa hai.
  const handleGoogleCredential = async (idToken) => {
    setError('');
    setLoading(true);
    try {
      const res = await googleLogin(idToken);
      // `res.email` sirf fallback hai — agar backend kisi wajah se
      // `username` na bheje to navbar khaali/kharab na ho.
      login(res.username || res.email, res.access_token, res.refresh_token);
      router.push('/');
    } catch (err) {
      setError(lang === 'en' ? (err.response?.data?.error || t('auth.googleSignInFailed')) : authErrorMessage(err, t('auth.googleSignInFailed'), t, lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f7ff] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#0077b6] flex items-center justify-center text-white">
                <Cloud className="w-6 h-6 fill-current" />
              </div>
              <span className="text-2xl font-extrabold text-[#002244]">WeatherApex</span>
            </Link>
            <h1 className="text-2xl font-extrabold text-[#002244]">{t('auth.welcomeBack')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('auth.signInSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 bg-[#f0f5ff] text-gray-700 placeholder-gray-400 text-sm rounded-xl border border-[#d6e4ff] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="current-password"
                  className="w-full pl-11 pr-11 py-3 bg-[#f0f5ff] text-gray-700 placeholder-gray-400 text-sm rounded-xl border border-[#d6e4ff] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-right mt-1.5">
                <Link href="/forgot-password" className="text-xs font-semibold text-[#0077b6] hover:text-[#005a8d]">{t('auth.forgotPasswordQ')}</Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0077b6] hover:bg-[#005a8d] disabled:bg-[#0077b6]/60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
            <p className="text-xs text-gray-500 text-center">
              {t.rich('auth.googleHint', { link: <Link href="/forgot-password" className="font-semibold text-[#0077b6] hover:text-[#005a8d]">{t('auth.forgotPassword')}</Link> })}
            </p>
          </form>

          {GOOGLE_CLIENT_ID && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400 font-semibold">{t('auth.orContinueWith')}</span>
                </div>
              </div>

              <GoogleSignInButton
                text="signin_with"
                disabled={loading}
                onCredential={handleGoogleCredential}
                onError={() =>
                  setError(t('auth.googleSignInLoad'))
                }
              />
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.noAccount')}{' '}
            <Link href="/signup" className="font-semibold text-[#0077b6] hover:text-[#005a8d]">{t('auth.signUp')}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
