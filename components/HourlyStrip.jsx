'use client';

// Hourly strip: pehle static items (foran, koi framer-motion nahi), phir
// HourlyStripMotion (animation + drag) import() se — alag chunk, sirf
// homepage par. Pehle framer-motion shared chunk mein ja kar har page par
// load hota tha (perf fixes, Oct 2026).
import { useEffect, useState } from 'react';
import { StripItems } from './HourlyStripItems';

export default function HourlyStrip(props) {
  const [Motion, setMotion] = useState(null);
  useEffect(() => {
    let alive = true;
    import('./HourlyStripMotion').then((m) => { if (alive) setMotion(() => m.default); });
    return () => { alive = false; };
  }, []);
  if (Motion) return <Motion {...props} />;
  return (
    <div className="overflow-hidden px-2">
      <div className="flex gap-5 w-max">
        <StripItems hours={[...props.hours, ...props.hours]} activeTab={props.activeTab} windUnit={props.windUnit} />
      </div>
    </div>
  );
}
