'use client';

// Hourly strip ki chalti (marquee) animation + drag — framer-motion yahan.
// HourlyStrip.jsx isay data aane ke baad import() se mangwata hai (alag
// chunk); tab tak wahi items bina animation (perf fixes, Oct 2026).
import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { StripItems } from './HourlyStripItems';

export default function HourlyStrip({ hours, activeTab, windUnit }) {
  const controls = useAnimation();
  const trackRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  // Exact pixel width — ek complete "set" = pehle N cards + unka gap.
  // scrollWidth/2 gap ke hisaab se half-gap off hota hai, isliye
  // width+gap per card measure karte hain taake loop zero-jump ho.
  useEffect(() => {
    if (!trackRef.current || hours.length === 0) return;
    const track = trackRef.current;
    const cards = track.children;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    let setWidth = 0;
    for (let i = 0; i < hours.length; i++) {
      setWidth += cards[i].offsetWidth + gap;
    }
    setScrollDistance(setWidth);
  }, [hours]);

  const startScroll = () => {
    if (isPaused || scrollDistance === 0) return;
    controls.start({
      x: [0, -scrollDistance],
      transition: {
        duration: hours.length * 2.5,
        ease: 'linear',
        repeat: Infinity,
      },
    });
  };

  const pauseScroll = () => {
    setIsPaused(true);
    controls.stop();
  };

  const resumeScroll = () => {
    setIsPaused(false);
    startScroll();
  };

  useEffect(() => {
    startScroll();
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollDistance]);

  const displayHours = [...hours, ...hours];

  return (
    <div
      className="overflow-hidden px-2"
      onMouseEnter={pauseScroll}
      onMouseLeave={resumeScroll}
      onTouchStart={pauseScroll}
      onTouchEnd={resumeScroll}
    >
      <motion.div
        ref={trackRef}
        animate={controls}
        drag="x"
        dragConstraints={{ left: -scrollDistance, right: 0 }}
        onDragStart={pauseScroll}
        onDragEnd={resumeScroll}
        className="flex gap-5 cursor-grab active:cursor-grabbing w-max"
      >
        <StripItems hours={displayHours} activeTab={activeTab} windUnit={windUnit} />
      </motion.div>
    </div>
  );
}
