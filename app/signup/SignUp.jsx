'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cloud, Mail, Lock, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';
import { registerUser, verifyOtp, googleLogin } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { GOOGLE_CLIENT_ID } from '@/config/googleAuth';

export default function SignUp() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState('register');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', company: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const inputRefs = useRef([]);

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
      setRegisteredEmail(res.email);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
      setError(err.response?.data?.error || 'Google sign-up failed. Please try again.');
    } finally {
      setLoading(false);
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
      setError('Please enter all 6 digits of the verification code.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp({
        email: registeredEmail,
        otp: otpValue,
      });
      login(registeredEmail, res.access_token, res.refresh_token);
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'register') {
    return (
      <div className="min-h-screen bg-[#f3f7ff] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10">
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#0077b6] flex items-center justify-center text-white">
                  <Cloud className="w-6 h-6 fill-current" />
                </div>
                <span className="text-2xl font-extrabold text-[#002244]">WeatherApex</span>
              </Link>
              <h1 className="text-2xl font-extrabold text-[#002244]">Create account</h1>
              <p className="text-sm text-gray-500 mt-1">Get started with WeatherApex</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
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
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Create a password (min 8 chars)"
                    autoComplete="new-password"
                    className="w-full pl-11 pr-11 py-3 bg-[#f0f5ff] text-gray-700 placeholder-gray-400 text-sm rounded-xl border border-[#d6e4ff] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company name (optional)</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Your company"
                    className="w-full pl-11 pr-4 py-3 bg-[#f0f5ff] text-gray-700 placeholder-gray-400 text-sm rounded-xl border border-[#d6e4ff] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0077b6] hover:bg-[#005a8d] disabled:bg-[#0077b6]/60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400 font-semibold">or continue with</span>
                  </div>
                </div>

                <GoogleSignInButton
                  text="signup_with"
                  disabled={loading}
                  onCredential={handleGoogleCredential}
                  onError={() =>
                    setError('Google sign-up could not load. Check your connection or ad-blocker.')
                  }
                />
              </>
            )}

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#0077b6] hover:text-[#005a8d]">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f7ff] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#0077b6] flex items-center justify-center text-white">
                <Cloud className="w-6 h-6 fill-current" />
              </div>
              <span className="text-2xl font-extrabold text-[#002244]">WeatherApex</span>
            </Link>
            <h1 className="text-2xl font-extrabold text-[#002244]">Verify your email</h1>
            <p className="text-sm text-gray-500 mt-1">
              Enter the code sent to <span className="font-semibold text-gray-700">{registeredEmail}</span>
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
                Verification code
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
                    aria-label={`Digit ${index + 1} of 6`}
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
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setStep('register')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0077b6] hover:text-[#005a8d] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
