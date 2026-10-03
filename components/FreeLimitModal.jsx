'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, X, Check } from 'lucide-react';

/**
 * "Aaj ki free calls khatam — register karein" wala popup.
 *
 * MASLA JO YEH HAL KARTA HAI: backend anonymous visitor ko rozana
 * FREE_DAILY_LIMIT calls deta hai, uske baad 429. Magar frontend us 429
 * par sirf ek LAAL ERROR BOX dikhata tha — "Could not fetch data". User
 * ko yeh lagta tha ke site kharab hai, na ke yeh ke usay sirf account
 * banana hai. Yani hum apne hi signup ka mauqa zaya kar rahe the, aur
 * user ko lagta tha kuch toota hua hai.
 *
 * Yeh modal poori app mein kaam karta hai — kisi bhi feature se limit
 * lage, wahin dikh jata hai. apiClient window par ek event bhejta hai
 * aur yeh usay sunta hai, is liye har page mein alag alag code likhne
 * ki zaroorat nahi.
 */

export const FREE_LIMIT_EVENT = 'weatherapex:free-limit';

const FEATURE_LABEL = {
  trip_planner: 'Trip Planner',
  country_recommend: 'Trip Planner',
  event_risk: 'Event Risk Score',
  weather_new_city: 'new city lookups',
  history_new_city: 'climate history',
};

const FreeLimitModal = () => {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const onLimit = (e) => setInfo(e.detail || {});
    window.addEventListener(FREE_LIMIT_EVENT, onLimit);
    return () => window.removeEventListener(FREE_LIMIT_EVENT, onLimit);
  }, []);

  // Escape se band ho, aur khula ho to background scroll na ho
  useEffect(() => {
    if (!info) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setInfo(null); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [info]);

  if (!info) return null;

  const limit = info.limit ?? 3;
  const feature = FEATURE_LABEL[info.feature] || 'this feature';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="free-limit-title"
    >
      {/* Backdrop — click par band. Yeh pehle <button aria-label="Close">
          tha, magar phir do alag elements ka ek hi label ban jata tha
          (backdrop aur X) — screen reader par confusing. Ab yeh sirf
          dekhne ki cheez hai; asli close control X button hai, aur
          Escape bhi kaam karta hai. */}
      <div
        aria-hidden="true"
        onClick={() => setInfo(null)}
        className="absolute inset-0 bg-[#001528]/60 backdrop-blur-sm"
      />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in">
        <div className="bg-gradient-to-br from-[#0077b6] to-[#002244] px-6 pt-7 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/25 mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 id="free-limit-title" className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
            You've used your {limit} free {limit === 1 ? 'check' : 'checks'} today
          </h2>
          <p className="text-sm text-white/80 mt-2">
            Create a free account to keep using {feature} — it takes about a minute.
          </p>
        </div>

        <div className="px-6 py-6">
          <ul className="space-y-3 mb-6">
            {[
              'Unlimited trip plans and event risk checks',
              'Full 15-day forecasts for any city',
              '20 years of climate history',
              'A free API key for your own projects',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            onClick={() => setInfo(null)}
            className="flex items-center justify-center w-full min-h-12 rounded-full bg-[#00a8e8] hover:bg-[#0092cd] text-white text-sm font-bold transition-colors shadow-sm"
          >
            Create free account
          </Link>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have one?{' '}
            <Link
              href="/login"
              onClick={() => setInfo(null)}
              className="font-semibold text-[#0077b6] hover:text-[#005a8d]"
            >
              Sign in
            </Link>
          </p>

          <button
            type="button"
            onClick={() => setInfo(null)}
            className="block mx-auto mt-4 min-h-11 px-4 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Maybe later
          </button>
        </div>

        <button
          type="button"
          onClick={() => setInfo(null)}
          aria-label="Close"
          className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default FreeLimitModal;
