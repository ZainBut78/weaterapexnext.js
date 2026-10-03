'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cloud, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginUser, googleLogin } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { GOOGLE_CLIENT_ID } from '@/config/googleAuth';

export default function SignIn() {
  const router = useRouter();
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
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
      setError(err.response?.data?.error || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl font-extrabold text-[#002244]">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-11 py-3 bg-[#f0f5ff] text-gray-700 placeholder-gray-400 text-sm rounded-xl border border-[#d6e4ff] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                  required
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
              <div className="text-right mt-1.5">
                <a href="#" className="text-xs font-semibold text-[#0077b6] hover:text-[#005a8d]">Forgot password?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0077b6] hover:bg-[#005a8d] disabled:bg-[#0077b6]/60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              {loading ? 'Signing in...' : 'Sign In'}
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
                text="signin_with"
                disabled={loading}
                onCredential={handleGoogleCredential}
                onError={() =>
                  setError('Google sign-in could not load. Check your connection or ad-blocker.')
                }
              />
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold text-[#0077b6] hover:text-[#005a8d]">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
