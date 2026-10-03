'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

function isRainyCondition(code) {
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 99);
}

export default function WeatherBackground({ weatherCode }) {
  const isRainy = isRainyCondition(weatherCode);

  if (!isRainy) {
    return <div className="absolute inset-0 bg-white" />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none bg-slate-50">
      <RainDrops />
    </div>
  );
}

function RainDrops() {
  const dropCount = 25;
  // Boondein sirf EK dafa banti hain (pehle har render par nayi random
  // jagah). useState ka initializer sirf browser mein chalta hai — yeh
  // component data aane ke baad hi render hota hai, server par nahi.
  const [drops] = useState(() => Array.from({ length: dropCount }, () => ({
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 2,
    duration: 0.6 + Math.random() * 0.4,
    height: 15 + Math.random() * 15,
  })));

  // CLS FIX: pehle boond ka `top` -5% se 105% tak animate hota tha — har
  // frame par browser use "layout shift" ginta tha (3 second mein 227
  // dafa). Ab transform (`y`) animate hota hai, jo layout ko nahi hilata.
  //
  // `y: '110%'` element ki APNI height ka % hota hai. Is liye har boond
  // ek `inset-0` wrapper (container jitna bara) ke andar hai, aur wrapper
  // 0% se 110% neeche jata hai = container height ka 110% — yani boond
  // bilkul pehle ki tarah -5% se 105% tak, wahi raftaar aur delay.
  return (
    <>
      {drops.map((drop, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          initial={{ y: '0%' }}
          animate={{ y: ['0%', '110%'] }}
          transition={{
            duration: drop.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: drop.delay,
          }}
        >
          <div
            className="absolute w-[1.5px] bg-blue-400/40 rounded-full"
            style={{ left: drop.left, height: drop.height, top: '-5%' }}
          />
        </motion.div>
      ))}
    </>
  );
}
