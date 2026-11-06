'use client';

import { useEffect, useState, useRef } from 'react';
import Link from '@/components/LocaleLink';
import BrandLogo from '@/components/BrandLogo';
import { useLang, useLocaleRouter, useT } from '@/i18n/client';
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';
import { registerUser, resendOtp, verifyOtp, googleLogin } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { GOOGLE_CLIENT_ID } from '@/config/googleAuth';
import { authErrorMessage } from '@/utils/authErrors';
import OtpStatus from '@/components/OtpStatus';
import { useOtpSession } from '@/hooks/useOtpSession';
import { maskEmail } from '@/utils/otpTimer';

export default function SignUp() {
  const router = useLocaleRouter();
  const t = useT();
  const lang = useLang();
  const { login } = useAuth();
  const [step, setStep] = useState('register');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', company: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const otpSession = useOtpSession('signup');
  const { session, ready } = otpSession;
  const registeredEmail = session?.email || '';
  const inputRefs = useRef([]);

  // Refresh ke baad (ya login se unverified account aaya) wapas code wali screen par, wahi timer
  useEffect(() => {
    if (ready && session) setStep('otp');
  }, [ready, session]);

  useEffect(() => {
    if (step === 'otp') inputRefs.current[0]?.focus();
  }, [step]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const username = form.email.split('@')[0];
      const res = await registerUser({
        username,
        email: form.email,
        password: form.password,
        company_name: form.company,
      });
      otpSession.start(res.email || form.email.trim().toLowerCase(), res);
      setStep('otp');
    } catch (err) {
      setError(authErrorMessage(err, t('auth.registrationFailed'), t, lang));
    } finally {
      setLoading(false);
    }
  };

  // Google se sign-up mein OTP ki zaroorat nahi — Google khud email ki
  // tasdeeq kar chuka hota hai. Is liye seedha login ho kar home par.
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
      setError(lang === 'en' ? (err.response?.data?.error || t('auth.googleSignUpFailed')) : authErrorMessage(err, t('auth.googleSignUpFailed'), t, lang));
    } finally {
      setLoading(false);
    }
  };

  const backToRegister = () => {
    otpSession.clear();
    setOtp(['', '', '', '', '', '']);
    setError('');
    setStep('register');
  };

  const handleResend = async () => {
    // Pehli email hi nahi gayi → backend ne naya account wapas le liya; form se dobara
    if (otpSession.deliveryFailed) {
      backToRegister();
      setError(t('auth.emailSendFailed'));
      return;
    }
    setError('');
    setResending(true);
    try {
      const res = await resendOtp(registeredEmail);
      otpSession.start(registeredEmail, res);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const wait = Number(err?.response?.data?.retry_after);
      if (err?.response?.status === 429 && wait) otpSession.waitFor(wait);
      setError(authErrorMessage(err, t('auth.sendCodeFailed'), t, lang));
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // 6-digit code paste karna aam hai (email se copy) — pehle sirf pehla
  // digit hi pehle box mein jata tha.
  const handleOtpPaste = (index, e) => {
    const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
    if (!digits) return;
    e.preventDefault();
    const next = [...otp];
    for (let i = 0; i < digits.length && index + i < 6; i += 1) {
      next[index + i] = digits[i];
    }
    setOtp(next);
    inputRefs.current[Math.min(index + digits.length, 5)]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otpValue = otp.join('');
  const otpComplete = /^\d{6}$/.test(otpValue);

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Pehle adhoora code (misaal "34") bhi submit ho jata tha aur backend
    // se generic error aata tha. Ab pehle yahin check.
    if (!otpComplete) {
      setError(t('auth.enterAllDigitsVerification'));
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp({
        email: registeredEmail,
        otp: otpValue,
      });
      otpSession.clear();
      login(registeredEmail, res.access_token, res.refresh_token);
      router.push('/');
    } catch (err) {
      setError(authErrorMessage(err, t('auth.verificationFailed'), t, lang));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'register') {
    return (
      <main className="min-h-screen bg-[#f3f7ff] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10">
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex mb-6">
                <BrandLogo className="h-24 w-auto" />
              </Link>
              <h1 className="text-2xl font-extrabold text-[#002244]">{t('auth.createAccountTitle')}</h1>
              <p className="text-sm text-gray-500 mt-1">{t('auth.getStarted')}</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
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
                    placeholder={t('auth.newPasswordPlaceholder')}
                    autoComplete="new-password"
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.companyOptional')}</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder={t('auth.companyPlaceholder')}
                    className="w-full pl-11 pr-4 py-3 bg-[#f0f5ff] text-gray-700 placeholder-gray-400 text-sm rounded-xl border border-[#d6e4ff] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0077b6] hover:bg-[#005a8d] disabled:bg-[#0077b6]/60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
              >
                {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
              </button>
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
                  text="signup_with"
                  disabled={loading}
                  onCredential={handleGoogleCredential}
                  onError={() =>
                    setError(t('auth.googleSignUpLoad'))
                  }
                />
              </>
            )}

            <p className="text-center text-sm text-gray-500 mt-6">
              {t('auth.haveAccount')}{' '}
              <Link href="/login" className="font-semibold text-[#0077b6] hover:text-[#005a8d]">{t('auth.signIn')}</Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f7ff] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex mb-6">
                <BrandLogo className="h-24 w-auto" />
              </Link>
            <h1 className="text-2xl font-extrabold text-[#002244]">{t('auth.verifyEmailTitle')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t.rich('auth.codeSentTo', { email: <span className="font-semibold text-gray-700">{maskEmail(registeredEmail)}</span> })}
            </p>
          </div>

          <form onSubmit={handleOtpSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-xl text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                {t('auth.verificationCode')}
              </label>
              <div className="flex gap-2 sm:gap-2.5 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={(e) => handleOtpPaste(index, e)}
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    aria-label={t('auth.digitOf', { n: index + 1 })}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold text-[#002244] bg-[#f0f5ff] rounded-xl border border-[#d6e4ff] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !otpComplete}
              className="w-full py-3 bg-[#0077b6] hover:bg-[#005a8d] disabled:bg-[#0077b6]/60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              {loading ? t('auth.verifying') : t('auth.verifyEmail')}
            </button>
          </form>

          <div className="mt-6">
            <OtpStatus
              resendIn={otpSession.resendIn}
              expiresIn={otpSession.expiresIn}
              resending={resending}
              deliveryFailed={otpSession.deliveryFailed}
              onResend={handleResend}
            />
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={backToRegister}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0077b6] hover:text-[#005a8d] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {t('auth.backToSignUp')}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
