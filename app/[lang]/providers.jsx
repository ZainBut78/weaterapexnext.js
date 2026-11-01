'use client';

// ─────────────────────────────────────────────────────────────
//  PROVIDERS — poori app ke "global" dabbe
//
//  Purane project ke main.jsx mein yeh sab tha:
//    QueryClientProvider → AuthProvider → CityProvider → FreeLimitModal
//  Yahan wahi, usi tarteeb mein.
//
//  Alag file kyun? layout.js SERVER component hai, aur yeh providers
//  React state/context use karte hain — jo sirf CLIENT par chalta hai.
//  Is liye in ko 'use client' wali file mein rakh kar layout mein
//  laga diya.
//
//  Jo main.jsx mein tha magar yahan nahi:
//    • BrowserRouter  — Next.js ka routing khud hai (app/ folder)
//    • HelmetProvider — title/meta ab `export const metadata` se
//    • ErrorBoundary  — Next.js ka apna tareeqa: app/error.js
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { CityProvider } from '@/context/CityContext';
import { UnitsProvider } from '@/context/UnitsContext';
import FreeLimitModal from '@/components/FreeLimitModal';

export default function Providers({ children }) {
  // useState ke andar — taake har visitor ka apna QueryClient ho aur
  // re-render par naya na bane. (main.jsx mein file ke upar ek hi
  // banta tha; Next.js mein server par woh sab visitors mein share ho
  // jata, is liye yeh tareeqa.) Settings bilkul purani.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CityProvider>
          {/* °C/°F + km/h/mph — poori site (audit 3.2) */}
          <UnitsProvider>
            {children}
            {/* Free limit lagne par signup ka popup — har page par */}
            <FreeLimitModal />
          </UnitsProvider>
        </CityProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
