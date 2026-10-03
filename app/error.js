'use client';

// ─────────────────────────────────────────────────────────────
//  ERROR PAGE — purane ErrorBoundary.jsx ki jagah
//
//  Kisi page mein render ke waqt error aa jaye (misaal: backend se
//  null aaya aur .toFixed() chal gaya) to Next.js poori site ki jagah
//  yeh dikhata hai — khaali safed page nahi. Design purane jaisa.
//
//  `retry()` Next.js 16 deta hai: page ka data dobara la kar dobara
//  render karne ki koshish (purane `window.location.reload()` jaisa,
//  magar poora page reload kiye baghair).
// ─────────────────────────────────────────────────────────────
import { useEffect } from 'react';

export default function Error({ error, retry }) {
  useEffect(() => {
    console.error('Unhandled UI error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="max-w-md w-full text-center bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
        <h1 className="text-xl font-bold text-[#002244] mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          An unexpected error stopped this page from loading. Reloading
          usually fixes it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex items-center justify-center min-h-12 px-6 rounded-full text-sm font-semibold text-white bg-[#00a8e8] hover:bg-[#0092cd] transition-colors"
          >
            Reload page
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center min-h-12 px-6 rounded-full text-sm font-semibold text-slate-700 border border-[#d6e4ff] hover:bg-gray-50 transition-colors"
          >
            Go to home
          </a>
        </div>
      </div>
    </div>
  );
}
