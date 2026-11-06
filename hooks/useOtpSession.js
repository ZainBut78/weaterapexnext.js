'use client';

// OTP screen ki state: email, resend countdown, code expiry, aur email chali ya nahi.
// scope = 'signup' | 'reset' (har screen ka apna timer). Waqt utils/otpTimer.js se.
import { useCallback, useEffect, useState } from 'react';
import { emailServiceStatus } from '@/services/authService';
import { loadSession, makeSession, saveSession, secondsLeft } from '@/utils/otpTimer';

// SMTP background mein chalta hai (timeout 15 s): itne second baad pooch lo ke chali ya nahi
const STATUS_CHECKS_MS = [3000, 8000, 18000];

export function useOtpSession(scope) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [deliveryFailed, setDeliveryFailed] = useState(false);

  // sessionStorage sirf browser mein — refresh ke baad wahi timer
  useEffect(() => {
    setSession(loadSession(scope));
    setNow(Date.now());
    setReady(true);
  }, [scope]);

  const resendIn = session ? secondsLeft(session.resendAt, now) : 0;
  const expiresIn = session ? secondsLeft(session.expiresAt, now) : 0;
  const running = resendIn > 0 || expiresIn > 0;

  // Ek hi interval; waqt hamesha Date.now() se, is liye background tab mein bhi drift nahi
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Sirf naye send ke baad; refresh par guzre hue checks dobara nahi
  const sentAt = session?.sentAt;
  useEffect(() => {
    if (!sentAt) return undefined;
    setDeliveryFailed(false);
    const timers = STATUS_CHECKS_MS
      .map((ms) => ms - (Date.now() - sentAt))
      .filter((ms) => ms > 0)
      .map((ms) => setTimeout(() => {
        emailServiceStatus()
          .then((res) => { if (res?.ok === false) setDeliveryFailed(true); })
          .catch(() => {});   // status na mile → kuch nahi dikhate
      }, ms));
    return () => timers.forEach(clearTimeout);
  }, [sentAt]);

  const start = useCallback((email, data) => {
    const next = saveSession(scope, makeSession(email, data));
    setSession(next);
    setNow(next.sentAt);
    return next;
  }, [scope]);

  // 429: server ne kaha abhi nahi → countdown server ke waqt se, code wahi purana
  const waitFor = useCallback((seconds) => {
    setSession((cur) => (cur ? saveSession(scope, { ...cur, resendAt: Date.now() + seconds * 1000 }) : cur));
    setNow(Date.now());
  }, [scope]);

  const clear = useCallback(() => {
    saveSession(scope, null);
    setSession(null);
    setDeliveryFailed(false);
  }, [scope]);

  return { session, ready, resendIn, expiresIn, deliveryFailed, start, waitFor, clear };
}
