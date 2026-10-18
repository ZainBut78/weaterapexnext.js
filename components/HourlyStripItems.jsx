'use client';

// Hourly strip ke cards — static (pehla paint) aur animated dono yahi use
// karte hain, is liye markup ek → animation aane par layout nahi hilta.
import MeteoconIcon from './MeteoconIcon';
import { isNightHour } from '../utils/isNightHour';

export function StripItems({ hours, activeTab, windUnit }) {
  return (
    <>
      {hours.map((point, index) => {
          return (
            <div key={index} className="flex flex-col items-center gap-2 w-20 shrink-0">
              <span>{point.time}</span>
              <MeteoconIcon weatherCode={point.weatherCode} isNight={isNightHour(point.time, point.isDay)} sizeClass="w-14 h-14" />
              <p className="text-sm font-bold text-gray-900">
                {activeTab === 'Precipitation' ? `${point.precip}%` :
                 activeTab === 'Wind' ? `${point.windSpeed}${windUnit}` :
                 `${point.temp}°`}
              </p>
            </div>
          );
        })}
    </>
  );
}
