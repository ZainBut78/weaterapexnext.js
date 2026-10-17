'use client';

// ─────────────────────────────────────────────────────────────
//  Climate chart — sirf jab screen ke qareeb aaye tab load (SEO fixes,
//  Oct 2026). recharts (~100 KB) pehle har city page ke initial JS mein
//  tha; ab alag chunk, scroll par. Jagah pehle se utni hi (h-72 / h-64)
//  → CLS nahi. Data table server HTML mein hai — Google wahi parhta hai.
// ─────────────────────────────────────────────────────────────
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const CHARTS = {
  temperature: dynamic(() => import('./ClimateCharts').then((m) => m.TemperatureChart), { ssr: false }),
  rainfall: dynamic(() => import('./ClimateCharts').then((m) => m.RainfallChart), { ssr: false }),
  sunshine: dynamic(() => import('./ClimateCharts').then((m) => m.SunshineChart), { ssr: false }),
};

export default function LazyClimateChart({ kind, chartData, label }) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) {
      setShow(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShow(true);
        io.disconnect();
      }
    }, { rootMargin: '300px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Chart = CHARTS[kind];
  return (
    <div ref={ref} className={kind === 'temperature' ? 'h-72' : 'h-64'} role="img" aria-label={label}>
      {show && <Chart chartData={chartData} />}
    </div>
  );
}
