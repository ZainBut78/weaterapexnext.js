'use client';

// ─────────────────────────────────────────────────────────────
//  "16 din" picker (UX fixes PART C, option b — koi library nahi).
//  Sirf forecast ke din chips hain: pehle din par tap = start, phir
//  aakhri din par tap = end. iOS Safari native date picker mein min/max
//  nahi maanta — yahan window se bahar ka din chuna hi nahi ja sakta.
//  `win` null (server / pehla render) → utne hi khaali chips (CLS nahi).
// ─────────────────────────────────────────────────────────────
import { fmtShort } from '@/utils/forecastWindow';
import { useLang, useT } from '@/i18n/client';
import { intlLocale } from '@/i18n/format';

const PLACEHOLDER = Array.from({ length: 16 }, (_, i) => i);

const dayParts = (iso, lang) => {
  const d = new Date(`${iso}T00:00:00Z`);
  const loc = intlLocale(lang);
  return {
    weekday: d.toLocaleDateString(loc, { weekday: 'short', timeZone: 'UTC' }),
    day: d.getUTCDate(),
    month: d.toLocaleDateString(loc, { month: 'short', timeZone: 'UTC' }),
    full: d.toLocaleDateString(loc, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }),
  };
};

export default function ForecastDayPicker({ win, start, end, onChange, invalid }) {
  const t = useT();
  const lang = useLang();
  const fs = (iso) => fmtShort(iso, lang);
  const pickDay = (iso) => {
    // Naya chunao: koi start nahi, ya dono pehle se chune hue → yeh start
    if (!start || end) return onChange(iso, '');
    // start se pehle ka din → wahi naya start
    if (iso < start) return onChange(iso, '');
    return onChange(start, iso); // same din dobara = 1 din ki trip
  };

  const chipBase =
    'flex flex-col items-center justify-center min-h-14 rounded-lg border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400';

  return (
    <div>
      <div
        role="group"
        aria-label={t('trip.tripDays')}
        className={`grid grid-cols-4 sm:grid-cols-8 gap-2 rounded-lg ${invalid ? 'ring-2 ring-red-300 p-1' : ''}`}
      >
        {!win
          ? PLACEHOLDER.map((i) => (
              <div key={i} className={`${chipBase} border-gray-100 bg-gray-50`} aria-hidden="true" />
            ))
          : win.days.map((iso, i) => {
              const p = dayParts(iso, lang);
              const isEdge = iso === start || iso === end;
              const inRange = start && end && iso > start && iso < end;
              const showMonth = i === 0 || p.day === 1;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => pickDay(iso)}
                  aria-pressed={isEdge || !!inRange}
                  aria-label={`${p.full}${iso === start ? t('trip.firstDaySuffix') : ''}${iso === end ? t('trip.lastDaySuffix') : ''}`}
                  className={`${chipBase} ${
                    isEdge
                      ? 'bg-[#0077b6] border-[#0077b6] text-white'
                      : inRange
                        ? 'bg-blue-50 border-blue-200 text-[#0077b6]'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-[#0077b6]'
                  }`}
                >
                  <span className={isEdge ? 'text-white/80' : 'text-gray-400'}>{p.weekday}</span>
                  <span className="text-base font-extrabold leading-tight">{p.day}</span>
                  {showMonth && <span className={isEdge ? 'text-white/80' : 'text-gray-400'}>{p.month}</span>}
                </button>
              );
            })}
      </div>
      <p className="text-xs text-gray-500 mt-2" aria-live="polite">
        {win ? (
          <>
            {t('trip.forecastAvailable', { count: win.days.length })}{' '}
            <strong className="text-gray-700">{fs(win.start)} – {fs(win.end)}</strong>
            {' · '}
            {!start ? t('trip.tapFirst') : !end ? t('trip.tapLast') : t('trip.selected', { range: `${fs(start)} – ${fs(end)}` })}
          </>
        ) : (
          <>&nbsp;</>
        )}
      </p>
    </div>
  );
}
