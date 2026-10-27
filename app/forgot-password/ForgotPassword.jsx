'use client';

// Password bhool gaye (hardening, Oct 2026) — 2 qadam, login/signup jaisa design:
//  1) email → backend 6-digit code bhejta hai (email ho ya na ho, jawab ek jaisa)
//  2) code + naya password → "Sign in" par wapas
// 429 (cooldown / rate limit) → "Too many attempts, try again in X minutes".
import { useState } from 'react';
import Link from 'next/link';
import { Cloud, Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import { requestPasswordReset, resetPassword } from '@/services/authService';
import { authErrorMessage } from '@/utils/authErrors';

const INPUT = 'w-full pl-11 pr-4 py-3 bg-[#f0f5ff] text-gray-700 placeholder-gray-400 text-sm rounded-xl border border-[#d6e4ff] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all';
const BUTTON = 'w-full py-3 bg-[#0077b6] hover:bg-[#005a8d] disabled:bg-[#0077b6]/60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm';

export default function ForgotPassword() {
  const [step, setStep] = useState('email');   // email | reset | done
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setStep('reset');
    } catch (err) {
      setError(authErrorMessage(err, 'Could not send the code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Please enter all 6 digits of the code.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email: email.trim(), otp: code, new_password: password });
      setStep('done');
    } catch (err) {
      setError(authErrorMessage(err, 'Password reset failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const errorBox = error && (
    <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-xl">
      {error}
    </div>
  );

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
            <h1 className="text-2xl font-extrabold text-[#002244]">
              {step === 'done' ? 'Password updated' : 'Reset your password'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'email' && 'Enter your email and we will send you a 6-digit code.'}
              {step === 'reset' && (
                <>If an account exists for <span className="font-semibold text-gray-700">{email.trim()}</span>, we sent a code. It expires in 10 minutes.</>
              )}
              {step === 'done' && 'You can now sign in with your new password.'}
            </p>
          </div>

          {step === 'email' && (
            <form onSubmit={handleEmail} className="space-y-5">
              {errorBox}
              <div>
                <label htmlFor="fp-email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={INPUT}
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className={BUTTON}>
                {loading ? 'Sending code...' : 'Send code'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-5">
              {errorBox}
              <div>
                <label htmlFor="fp-code" className="block text-sm font-semibold text-gray-700 mb-1.5">6-digit code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="fp-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    autoComplete="one-time-code"
                    className={INPUT}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="fp-password" className="block text-sm font-semibold text-gray-700 mb-1.5">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="fp-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min 8 chars)"
                    autoComplete="new-password"
                    className={`${INPUT} pr-11`}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className={BUTTON}>
                {loading ? 'Saving...' : 'Set new password'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(''); setCode(''); }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0077b6] hover:text-[#005a8d] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Use a different email or resend
                </button>
              </div>
            </form>
          )}

          {step === 'done' && (
            <Link href="/login" className={`${BUTTON} block text-center`}>Sign In</Link>
          )}

          {step !== 'done' && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Remembered it?{' '}
              <Link href="/login" className="font-semibold text-[#0077b6] hover:text-[#005a8d]">Sign In</Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
