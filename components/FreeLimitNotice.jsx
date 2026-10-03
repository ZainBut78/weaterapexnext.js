import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

/**
 * Wahi "free limit khatam" ki baat, magar page ke andar (modal ke bajaye).
 *
 * Modal to khul hi jata hai, magar user usay band kar sakta hai — aur us
 * ke baad page par purana LAAL error box reh jata tha, jis se lagta tha
 * site kharab hai. Ab yahan bhi wahi dawat rehti hai.
 */
const FreeLimitNotice = ({ data }) => {
  const limit = data?.limit ?? 3;

  return (
    <div className="max-w-3xl mx-auto bg-white border border-[#d6e4ff] rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-start gap-3 bg-gradient-to-r from-[#f0f5ff] to-white px-5 py-4 sm:px-6">
        <span className="shrink-0 w-10 h-10 rounded-xl bg-[#0077b6] flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </span>
        <div className="min-w-0">
          <p className="font-bold text-[#002244]">
            You've used your {limit} free {limit === 1 ? 'check' : 'checks'} today
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Create a free account to keep going — unlimited trip plans, event
            risk checks and 20 years of climate history.
          </p>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6 flex flex-col sm:flex-row gap-3">
        <Link
          href="/signup"
          className="flex-1 inline-flex items-center justify-center gap-2 min-h-12 rounded-full bg-[#00a8e8] hover:bg-[#0092cd] text-white text-sm font-bold transition-colors"
        >
          Create free account <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/login"
          className="flex-1 inline-flex items-center justify-center min-h-12 rounded-full border border-[#d6e4ff] text-sm font-semibold text-slate-700 hover:bg-gray-50 transition-colors"
        >
          I already have an account
        </Link>
      </div>
    </div>
  );
};

export default FreeLimitNotice;
