'use client';

// Landing page ka live demo (Nov 2026). iframe sirf browser mein banta hai (mount ke baad),
// taake server HTML mein /embed/ ka koi src na ho; jagah pehle se usi unchai ki (layout shift nahi).
import { useEffect, useState } from 'react';
import { MONTH_HEIGHT } from '@/utils/embedConst';

export default function WidgetDemo({ src, title }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(true), []);
  return (
    <div className="rounded-lg border border-slate-200 bg-white" style={{ maxWidth: 520, height: MONTH_HEIGHT }}>
      {on && <iframe src={src} title={title} width="100%" height={MONTH_HEIGHT} loading="lazy" className="block w-full rounded-lg" style={{ border: 0 }} />}
    </div>
  );
}
