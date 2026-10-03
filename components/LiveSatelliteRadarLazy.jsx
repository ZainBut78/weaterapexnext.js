'use client';

// ─────────────────────────────────────────────────────────────
//  Weather Map ko sirf BROWSER mein load karna
//
//  Leaflet (map library) load hote hi `window` istemal karti hai.
//  Server par `window` nahi hota — seedha import karte to poora page
//  server par crash ho jata. `dynamic(..., { ssr: false })` Next.js ko
//  kehta hai: "yeh component server par mat banao, browser mein aa kar
//  load karo". Tab tak skeleton dikhta hai — asli map section jitna
//  bara (heading + 420px map), taake load par page na khiske (CLS).
//
//  (Map ka SEO par koi kaam nahi, is liye server par na banna nuqsan
//  nahi — faida yeh ke page ka baqi HTML jaldi aata hai.)
// ─────────────────────────────────────────────────────────────
import dynamic from 'next/dynamic';
import { RadarSkeleton } from './HomeSkeletons';

const LiveSatelliteRadar = dynamic(() => import('./LiveSatelliteRadar'), {
  ssr: false,
  loading: () => <RadarSkeleton />,
});

export default LiveSatelliteRadar;
