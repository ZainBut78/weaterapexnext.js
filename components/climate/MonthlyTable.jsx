'use client';

// "Monthly Averages" table + "View Full Year" button.
//
// Purani site mein band table sirf 6 rows RENDER karti thi. Ab 12 ki 12
// rows HTML mein jati hain (Google poora saal parh sake), aur 6 ke baad
// wali rows `hidden` class se chhupi rehti hain — dikhne mein bilkul wahi.
import { useState } from 'react';
import { useUnits } from '@/context/UnitsContext';
import { useLang, useT } from '@/i18n/client';
import { monthName } from '@/i18n/format';

export default function MonthlyTable({ monthly }) {
  const [showAllMonths, setShowAllMonths] = useState(false);
  const units = useUnits(); // dono units, chuni hui pehle (round 4)
  const t = useT();
  const lang = useLang();

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-semibold">{t('climate.table.month')}</th>
              <th className="px-4 py-3 font-semibold">{t('climate.table.avgHigh')}</th>
              <th className="px-4 py-3 font-semibold">{t('climate.table.avgLow')}</th>
              <th className="px-4 py-3 font-semibold">{t('climate.table.rainfall')}</th>
              <th className="px-4 py-3 font-semibold">{t('climate.table.rainyDays')}</th>
              <th className="px-4 py-3 font-semibold">{t('climate.table.sunshine')}</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((m, i) => (
              <tr
                key={m.month}
                className={`border-t border-gray-100 hover:bg-blue-50/50 transition-colors${!showAllMonths && i >= 6 ? ' hidden' : ''}`}
              >
                <td className="px-4 py-3 font-semibold text-gray-700">{monthName(lang, m.month || 1, 'short')}</td>
                <td className="px-4 py-3">{units.tempDual1(m.avg_high) ?? '—'}</td>
                <td className="px-4 py-3">{units.tempDual1(m.avg_low) ?? '—'}</td>
                <td className="px-4 py-3">{m.avg_rainfall != null ? `${units.fmt(m.avg_rainfall)}mm` : '—'}</td>
                <td className="px-4 py-3">{m.rainy_days != null ? units.fmt(m.rainy_days) : '—'}</td>
                <td className="px-4 py-3">{m.sunshine_hours != null ? `${units.fmt(m.sunshine_hours)}h` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {monthly.length > 6 && (
        <button
          onClick={() => setShowAllMonths(!showAllMonths)}
          className="mx-auto flex items-center gap-2 text-[#0077b6] font-semibold text-sm hover:text-blue-700 mt-6 transition-colors"
        >
          {showAllMonths ? t('climate.showLess') : t('climate.fullYear')}
        </button>
      )}
    </>
  );
}
