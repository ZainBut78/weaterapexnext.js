'use client';

import { useState } from 'react';
import { getWeatherIcon } from '../utils/weatherIconMap';
import { getMeteoconIcon } from '../utils/meteoconsMap';
import { useT } from '@/i18n/client';

// Meteocons CDN icon render karta hai; load fail hone par
// lucide-react ke getWeatherIcon fallback par degrade (graceful).
// priority: above-the-fold (homepage ki badi icon) → lazy nahi, fetchpriority high
export default function MeteoconIcon({ weatherCode, isNight, sizeClass, priority = false }) {
  const [failed, setFailed] = useState(false);
  const t = useT();

  if (failed) {
    const { icon: FallbackIcon, color } = getWeatherIcon(weatherCode, isNight);
    return <FallbackIcon className={`${sizeClass} ${color}`} strokeWidth={1.5} />;
  }

  return (
    <img
      src={getMeteoconIcon(weatherCode, isNight)}
      alt={t('weather.iconAlt')}
      loading={priority ? undefined : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      width={96}
      height={96}
      decoding="async"
      className={sizeClass}
      onError={() => setFailed(true)}
    />
  );
}

