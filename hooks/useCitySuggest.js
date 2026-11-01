'use client';

// ─────────────────────────────────────────────────────────────
//  Shehar ki suggestions — navbar search + trip planner (UX fixes B).
//
//  1) LOCAL pehle: 160 cities se fuzzy match (utils/fuzzyCity) — foran,
//     zero API calls, spelling ki ghalti bhi pakar leta hai.
//  2) Phir API (/trips/plan/cities/search/ — DB-only, Open-Meteo nahi):
//     • 2 harf se kam → call nahi
//     • 300 ms debounce (har keystroke par call nahi)
//     • AbortController — purani request cancel
//     • memory cache per query (wahi query dobara → call nahi)
//  Dono mila kar, local pehle, duplicate nahi.
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchCitySuggestions } from '@/services/weatherService';
import { cityLabel, matchCities, mergeSuggestions, normalizeText } from '@/utils/fuzzyCity';
import { useLang } from '@/i18n/client';
import { countryLabel } from '@/utils/placeLabel';

const DEBOUNCE_MS = 300;
const remoteCache = new Map(); // normalized query → results (tab band hone tak)

export default function useCitySuggest(query, { enabled = true, limit = 8 } = {}) {
  const lang = useLang();
  const q = normalizeText(query);
  const active = enabled && q.replace(/ /g, '').length >= 2;
  const local = useMemo(() => (active ? matchCities(query, { limit: 5, lang }) : []), [active, query, lang]);
  const [remote, setRemote] = useState({ q: '', results: [] });
  const abortRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    if (remoteCache.has(q)) {
      setRemote({ q, results: remoteCache.get(q) });
      return undefined;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetchCitySuggestions(query.trim(), { signal: ctrl.signal });
        const results = res?.results || [];
        remoteCache.set(q, results);
        if (!ctrl.signal.aborted) setRemote({ q, results });
      } catch {
        // cancel / network — local suggestions kaafi hain
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [active, q, query]);

  // Component hatne par chalti request cancel
  useEffect(() => () => abortRef.current?.abort(), []);

  const items = useMemo(() => {
    if (!active) return [];
    const remoteNow = (remote.q === q ? remote.results : [])
      .map((s) => ({ ...s, label: cityLabel(s.slug, s.name, lang) }));
    // `country` dedupe ke liye English hi; dikhane ke liye `countryLabel`
    return mergeSuggestions(local, remoteNow, limit)
      .map((s) => ({ ...s, countryLabel: countryLabel(s.country, lang) }));
  }, [active, local, remote, q, limit, lang]);

  // "Did you mean" — sirf jab koi sahi/shuru-wala match na ho, sirf spelling wale
  const didYouMean = local.length > 0 && local.every((s) => s.kind === 'fuzzy')
    && !items.some((s) => !s.kind && (normalizeText(s.name).startsWith(q) || normalizeText(s.label).startsWith(q)));

  return { items, didYouMean };
}
