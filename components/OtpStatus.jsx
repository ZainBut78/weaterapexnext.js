'use client';

// OTP screens ke neeche: "Code expires in mm:ss" + Resend (countdown, phir button).
import { useRef } from 'react';
import { useT } from '@/i18n/client';
import { formatClock } from '@/utils/otpTimer';

export default function OtpStatus({ resendIn, expiresIn, resending, deliveryFailed, onResend }) {
  const t = useT();
  // State update se pehle doosra click bhi aa sakta hai — ref foran rokta hai
  const busy = useRef(false);
  const handleClick = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      await onResend();
    } finally {
      busy.current = false;
    }
  };
  return (
    <div className="text-center space-y-2" aria-live="polite">
      {deliveryFailed && (
        <p role="alert" className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-xl">
          {t('auth.emailSendFailed')}
        </p>
      )}
      {expiresIn > 0 ? (
        <p className="text-sm text-gray-500">{t('auth.codeExpiresIn', { time: formatClock(expiresIn) })}</p>
      ) : (
        <p className="text-sm font-semibold text-red-600">{t('auth.codeExpired')}</p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={resendIn > 0 || resending}
        className="text-sm font-semibold text-[#0077b6] hover:text-[#005a8d] disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {resending ? t('auth.resending') : resendIn > 0 ? t('auth.resendIn', { time: formatClock(resendIn) }) : t('auth.resendCode')}
      </button>
    </div>
  );
}
