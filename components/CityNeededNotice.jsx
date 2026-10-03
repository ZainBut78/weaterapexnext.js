'use client';

import { MapPin, Globe, Info } from 'lucide-react';

/**
 * Jab user shehar ki jagah MULK ya SOOBA ka naam likh de.
 *
 * Pehle backend chup-chaap us mulk ke geographic markaz ka mausam nikal
 * kar ek score de deta tha — "Pakistan ka risk score 0" — jo bebunyaad
 * tha, kyunke Karachi, Murree aur Quetta ka mausam ek jaisa nahi hota.
 *
 * Ab backend saaf mana kar deta hai aur usi mulk ke woh shehar bhejta
 * hai jo hamare paas maujood hain. Yeh component unhein ek click mein
 * chunne ke qabil bana deta hai — user ko dobara type nahi karna parta.
 */
const CityNeededNotice = ({ data, onPickCity, onSwitchToCountryMode }) => {
  const suggestions = data?.suggestions || [];
  const place = data?.place || 'That';
  const isCountry = data?.kind === 'country';

  return (
    <div className="max-w-3xl mx-auto bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-start gap-3 bg-amber-50 px-5 py-4 sm:px-6">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-bold text-amber-900">
            {place} is {isCountry ? 'a country' : 'a region'} — we need a city
          </p>
          <p className="text-sm text-amber-800/90 mt-1">
            Weather is different in every city within {place}, so one score for
            the whole {isCountry ? 'country' : 'region'} would be misleading.
          </p>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        {suggestions.length > 0 ? (
          <>
            <p className="text-sm font-semibold text-slate-700 mb-3">
              Pick a city in {place}:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => onPickCity?.(s.name)}
                  className="inline-flex items-center gap-1.5 min-h-11 px-4 rounded-full border border-[#d6e4ff] bg-[#f0f5ff] text-sm font-semibold text-[#0077b6] hover:bg-[#e2edff] hover:border-[#b9d3ff] transition-colors"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  {s.name}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-600">
            Please enter a city name instead.
          </p>
        )}

        {onSwitchToCountryMode && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-sm text-slate-600 mb-3">
              Want the best cities across {place} instead?
            </p>
            <button
              type="button"
              onClick={onSwitchToCountryMode}
              className="inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-full bg-[#0077b6] hover:bg-[#005a8d] text-sm font-semibold text-white transition-colors"
            >
              <Globe className="w-4 h-4" />
              Search by country instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CityNeededNotice;
