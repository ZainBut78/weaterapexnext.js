'use client';

// Email ke link se naya password (Nov 2026): /reset-password?token=...
// Token single use hai, backend par hash. Jawab aane tak yahin; ghalat / expire → naya link maango.
import { useEffect, useState } from 'react';
import Link from '@/components/LocaleLink';
import { useLang, useT } from '@/i18n/client';
import { Cloud, Lock, Eye, EyeOff } from 'lucide-react';
import { resetPassword } from '@/services/authService';
import { authErrorMessage } from '@/utils/authErrors';

const BUTTON = 'w-full py-3 bg-[#0077b6] hover:bg-[#005a8d] disabled:bg-[#0077b6]/60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm';

export default function ResetPassword({ token }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(!token);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = useT();
  const lang = useLang();

  // Token address bar / history mein na rahe
  useEffect(() => {
    window.history.replaceState(window.history.state, '', window.location.pathname);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword({ token, new_password: password });
      setDone(true);
    } catch (err) {
      if (err?.response?.data?.code === 'reset_link_invalid') setInvalid(true);
      else setError(authErrorMessage(err, t('auth.resetFailed'), t, lang));
    } finally {
      setLoading(false);
    }
  };

  const title = done ? t('auth.passwordUpdated') : invalid ? t('auth.linkInvalidTitle') : t('auth.newPasswordTitle');
  const subtitle = done ? t('auth.resetDone') : invalid ? t('auth.linkInvalid') : t('auth.newPasswordIntro');

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
            <h1 className="text-2xl font-extrabold text-[#002244]">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>

          {done && <Link href="/login" className={`${BUTTON} block text-center`}>{t('auth.signIn')}</Link>}
          {invalid && !done && <Link href="/forgot-password" className={`${BUTTON} block text-center`}>{t('auth.requestNewLink')}</Link>}

          {!done && !invalid && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="rp-password" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.newPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="rp-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.newPasswordPlaceholder')}
                    autoComplete="new-password"
                    autoFocus
                    className="w-full pl-11 pr-11 py-3 bg-[#f0f5ff] text-gray-700 placeholder-gray-400 text-sm rounded-xl border border-[#d6e4ff] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                    required
                    minLength={8}
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
              </div>
              <button type="submit" disabled={loading} className={BUTTON}>
                {loading ? t('auth.saving') : t('auth.setNewPassword')}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
