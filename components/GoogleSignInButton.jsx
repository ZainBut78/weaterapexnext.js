'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '../config/googleAuth';

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

// Do pages (SignIn + SignUp) hain, magar script sirf EK dafa load honi
// chahiye. Promise module-level rakhi hai taake dono pages usi ka intezar
// karein.
let gisPromise = null;

function loadGoogleIdentityServices() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window nahi hai'));
  }
  // Pehle se load ho chuki hai.
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }
  if (gisPromise) return gisPromise;

  gisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    const script = existing || document.createElement('script');

    const onLoad = () => resolve(window.google);
    const onFail = () => {
      // Promise reset — warna ek nakaam koshish ke baad dobara try karne
      // ka koi raasta nahi bachta (ad-blocker band karne ke baad bhi).
      gisPromise = null;
      reject(new Error('Google Identity Services script load nahi hui'));
    };

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onFail, { once: true });

    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return gisPromise;
}

/**
 * Google ka OFFICIAL "Sign in with Google" button.
 *
 * Yeh Google ka apna banaya hua button hai (`renderButton`), custom nahi.
 * Wajah: Google ki docs saaf kehti hain ke apni marzi ke button se seedha
 * ID-token popup kholne ka koi supported tareeqa nahi hai — sirf
 * `renderButton()` ya One Tap `prompt()`. One Tap chupchap suppress ho
 * sakti hai (cooldown, browser settings), yani button dabane par kabhi
 * kuch na ho — is liye official button hi sahi faisla hai.
 *
 * Button ek iframe mein aata hai, to uska border-radius bahar se badla
 * nahi ja sakta. Is liye wrapper par `rounded-xl overflow-hidden` hai —
 * kone card ke baqi buttons jaise gol dikhte hain.
 *
 * Props:
 *   onCredential(idToken)  — Google ka JWT (backend isi ko verify karta hai)
 *   onError(error)         — script load na ho to
 *   text                   — 'signin_with' | 'signup_with' | 'continue_with'
 */
export default function GoogleSignInButton({
  onCredential,
  onError,
  text = 'continue_with',
  disabled = false,
}) {
  const wrapRef = useRef(null);
  const hostRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [failed, setFailed] = useState(false);

  // Callbacks ko ref mein rakho — warna parent ke har render par button
  // dobara render hota hai (Google ka button phir se banta, jhilmilata).
  const credentialRef = useRef(onCredential);
  const errorRef = useRef(onError);
  credentialRef.current = onCredential;
  errorRef.current = onError;

  // Google ka button pixel width leta hai (max 400) — CSS se full-width
  // nahi hota. To container naapte hain aur resize par update karte hain.
  const measure = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const next = Math.round(Math.min(Math.max(el.clientWidth, 200), 400));
    setWidth((prev) => (Math.abs(prev - next) > 2 ? next : prev));
  }, []);

  useEffect(() => {
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !width) return undefined;

    let cancelled = false;

    loadGoogleIdentityServices()
      .then((google) => {
        if (cancelled || !hostRef.current) return;

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) credentialRef.current?.(response.credential);
          },
          // Silently "pehle wale account se" login na kare — user khud
          // account chune.
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Dobara render se pehle safai, warna do button lag jate hain.
        hostRef.current.innerHTML = '';
        google.accounts.id.renderButton(hostRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          logo_alignment: 'left',
          width,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setFailed(true);
        errorRef.current?.(err);
      });

    return () => {
      cancelled = true;
    };
  }, [width, text]);

  // Client ID set na ho to kuch bhi na dikhao — mara hua button dikhane
  // se behtar hai ke button hi na ho.
  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div ref={wrapRef} className="w-full">
      <div
        className={`flex justify-center ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      >
        <div ref={hostRef} className="rounded-xl overflow-hidden" />
      </div>
      {failed && (
        <p className="mt-2 text-center text-xs font-semibold text-gray-500">
          Google sign-in load nahi ho saki. Ad-blocker band karke dobara koshish karein.
        </p>
      )}
    </div>
  );
}
