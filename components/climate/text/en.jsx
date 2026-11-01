// ─────────────────────────────────────────────────────────────
//  Climate pages ka ENGLISH text (i18n Phase 3) — pehle components mein
//  likha tha, ab yahan; har jumla bilkul wahi (English page nahi badla).
//  Doosri zabanein: ./de.jsx, ./it.jsx … — wahi API, apni grammar.
//  Month article ki kahani: ../MonthStory.jsx (English) — `story` mein.
// ─────────────────────────────────────────────────────────────
import Link from '@/components/LocaleLink';
import { UnitTemp } from '../UnitText';
import UnitTempShort from '../UnitTempShort';
import * as story from '../MonthStory';
import { MONTHS, mmToIn } from '@/utils/climateMath';

const monthOf = (n) => MONTHS[(((n - 1) % 12) + 12) % 12];

const en = {
  lang: 'en',
  story,
  place: (cityN, countryN) => (cityN === countryN ? cityN : `${cityN}, ${countryN}`),
  // Mahino / shehron ki list — English mein saada ", " (pehle jaisa)
  list: (items) => items.join(', '),
  month: (n) => monthOf(n).name,
  monthShort: (n) => monthOf(n).short,
  verdict: (label) => label,
  reasons: (v) => v.reasons.map((r) => r.text).join(', '),
  suitLabel: (s) => s.label,
  suitStatus: (s) => (s.key === 'indoor' ? 'a good choice' : s.ok ? 'a good fit' : 'less ideal'),
  packTitle: (p) => p.title,
  hm: null,                       // story khud hoursMinutes (English)
  locale: null,                   // daylight clock: purana "7:14 am"

  // ── City page ─────────────────────────────────────────────
  cityMeta: ({ cityN, countryN, x, best }) => ({
    title: `${cityN} Weather by Month: Climate, Rain & Best Time to Visit`,
    imageTitle: `${cityN} Weather by Month`,
    description: `${cityN === countryN ? cityN : `${cityN}, ${countryN}`} month by month: warmest in ${x.warmest?.month.name}, coolest in ${x.coolest?.month.name}, wettest in ${x.wettest?.month.name}. Best months to visit: ${best.join(', ')}. 20-year averages with charts.`,
  }),
  cityDataset: ({ cityN, place, years }) => ({
    name: `${cityN} weather by month: ${years.start}–${years.end} climate averages`,
    description: `Monthly climate normals for ${place}: average high and low temperature, total rainfall, rainy days, daily sunshine hours and humidity for every month, averaged over ${years.start}–${years.end} from historical weather data.`,
  }),
  variables: ['Average high temperature', 'Average low temperature', 'Total precipitation', 'Rainy days', 'Sunshine hours', 'Relative humidity'],
  skylineAlt: (place) => `${place} skyline`,
  cityH1: (cityN) => `${cityN} Weather by Month`,
  citySub: (place, years) => <>Twelve months of {place} weather — averages from {years.start}–{years.end}.</>,
  CityIntro: ({ x, cityN }) => (
    <>
      {x.warmest && <>{cityN}&apos;s warmest month is <strong className="text-gray-900">{x.warmest.month.name}</strong> (average high <UnitTemp c={x.warmest.row.avg_high} />)</>}
      {x.coolest && <> and the coolest is <strong className="text-gray-900">{x.coolest.month.name}</strong> (<UnitTemp c={x.coolest.row.avg_high} />)</>}.
      {x.wettest && <> The most rain falls in <strong className="text-gray-900">{x.wettest.month.name}</strong> (about {Math.round(x.wettest.row.avg_rainfall)} mm)</>}
      {x.driest && <>, and <strong className="text-gray-900">{x.driest.month.name}</strong> is the driest (about {Math.round(x.driest.row.avg_rainfall)} mm)</>}.
      {x.sunniest && <> <strong className="text-gray-900">{x.sunniest.month.name}</strong> is the sunniest, with about {x.sunniest.row.sunshine_hours} hours of sunshine a day.</>}
    </>
  ),
  bestTitle: (cityN) => `Best months to visit ${cityN}`,
  bestNote: (cityN) => <>Ranked within {cityN}&apos;s own year by temperature comfort, rainy days and sunshine — historical averages, not a forecast.</>,
  monthByMonth: (cityN) => `${cityN} month by month`,
  high: 'High',
  low: 'Low',
  srRainfall: 'Rainfall',
  srRainy: 'Rainy days',
  srSun: 'Sunshine',
  rainMmIn: (mm) => `${Math.round(mm)} mm (${mmToIn(mm)} in)`,
  rainyDaysN: (n) => `${n} rainy days`,
  sunPerDay: (h) => `${h} h sunshine / day`,
  guideTitle: (cityN) => `${cityN} Climate & Weather Guide`,
  guideSub: (years) => <>Temperature, rainfall and sunshine through the year — {years.start}–{years.end} averages.</>,
  tiles: { hottest: 'Hottest month avg high', coolest: 'Coolest month avg high', wettest: 'Wettest month avg', driest: 'Driest month avg' },
  tempByMonth: 'Temperature by Month',
  rainByMonth: 'Rainfall by Month',
  sunHours: 'Sunshine Hours',
  chartTemp: (cityN) => `${cityN} average high and low temperature by month`,
  chartRain: (cityN) => `${cityN} average rainfall by month`,
  chartSun: (cityN) => `${cityN} average daily sunshine hours by month`,
  monthlyAverages: 'Monthly Averages',
  whatToPack: 'What to Pack',
  packIntro: (cityN) => <>Suggested packing for {cityN}&apos;s climate.</>,
  cityPacking: {
    layers: { title: 'Versatile Layers', text: 'Light layers that work for both mild afternoons and cooler evenings.' },
    rain: { title: 'Rain Protection', text: 'A compact umbrella and a light rain jacket for the wettest months.' },
    sun: { title: 'Sun Protection', text: 'Sunscreen, a wide-brimmed hat and sunglasses for hot, sunny days.' },
    warm: { title: 'Warm Layers', text: 'A warm jacket or fleece for chilly mornings and evenings.' },
  },
  moreCities: (countryN) => `More ${countryN} cities by month`,
  weatherByMonth: 'Weather by month',
  ctaCityTitle: (cityN) => `Planning a trip to ${cityN}?`,
  ctaCityText: 'Get a day-by-day weather plan for your exact travel dates.',
  ctaCityButton: 'Use our Trip Planner',
  cityDataNote: (years) => <>Based on {years.end - years.start + 1} years of historical weather data ({years.start}–{years.end}) from Open-Meteo. Monthly averages, not a forecast.</>,

  // ── Month page ────────────────────────────────────────────
  monthMeta: ({ cityN, countryN, monthN, row, verdict }) => {
    const f = (c) => (c == null ? '—' : `${Math.round(c * 10) / 10}°C (${Math.round((c * 9 / 5 + 32) * 10) / 10}°F)`);
    return {
      title: `${cityN} Weather in ${monthN}: Temperature, Rain & Tips`,
      imageTitle: `${cityN} Weather in ${monthN}`,
      kicker: countryN,
      description: `${monthN} in ${cityN}: average high ${f(row?.avg_high)}, low ${f(row?.avg_low)}, ${row?.rainy_days ?? '—'} rainy days and ${row?.sunshine_hours ?? '—'} h of sunshine a day. ${verdict ? `${verdict.label} time to visit` : 'Climate guide'} — comparisons and packing tips.`,
    };
  },
  monthDataset: ({ cityN, place, monthN, years }) => ({
    name: `${cityN} weather in ${monthN}: ${years.start}–${years.end} climate averages`,
    description: `Monthly climate normals for ${place} in ${monthN}: average high and low temperature, total rainfall, rainy days, daily sunshine hours and humidity, averaged over ${years.start}–${years.end} from historical weather data.`,
  }),
  monthH1: (cityN, monthN) => `${cityN} Weather in ${monthN}`,
  stat: { avgHigh: 'Avg high', avgLow: 'Avg low', rainfall: 'Rainfall', rainyDays: 'Rainy days', sunshine: 'Sunshine', humidity: 'Humidity' },
  statDays: (n) => `${n} days`,
  statSun: (h) => `${h} h / day`,
  Latest: ({ monthN, latest, row, years }) => (
    <>
      <span className="font-semibold text-gray-700">Latest actual — {monthN} {latest.year}:</span>{' '}
      high <UnitTemp c={latest.avg_high} />, low <UnitTemp c={latest.avg_low} />
      {latest.avg_rainfall != null && <>, {Math.round(latest.avg_rainfall)} mm rain</>}
      {latest.rainy_days != null && <> on {latest.rainy_days} days</>}
      {' '}(the {years.start}–{years.end} average above is {latest.avg_high != null && row?.avg_high != null
        ? (latest.avg_high > row.avg_high + 0.4 ? 'cooler' : latest.avg_high < row.avg_high - 0.4 ? 'warmer' : 'about the same')
        : 'for comparison'}).
    </>
  ),
  vsYearTitle: (monthN) => `${monthN} vs the rest of the year`,
  tableFallback: (monthN, cityN) => <>{monthN} compared with every other month in {cityN}.</>,
  th: { month: 'Month', avgHigh: 'Avg high', vs: (monthN) => `vs ${monthN}`, rain: 'Rain', rainyDays: 'Rainy days' },
  rainMm: (mm) => `${Math.round(mm)} mm`,
  chipsLabel: (cityN) => `${cityN} weather by month`,
  chipAria: (cityN, mN) => `${cityN} weather in ${mN}`,
  feelTitle: (monthN, cityN) => `What ${monthN} feels like in ${cityN}`,
  rainTitle: (cityN, monthN) => `Rain in ${cityN} in ${monthN}`,
  daylightTitle: (monthN) => `Daylight and sunshine in ${monthN}`,
  compareTitle: (monthN) => `How ${monthN} compares to the rest of the year`,
  suitsTitle: (monthN) => `Who ${monthN} suits`,
  tipsTitle: (cityN, monthN) => `Tips for visiting ${cityN} in ${monthN}`,
  questionsTitle: 'Quick questions',
  verdictTitle: (monthN, cityN) => `Is ${monthN} a good time to visit ${cityN}?`,
  VerdictText: ({ verdict, relRank, cityN, monthN, reasons }) => (
    <>
      <strong>{verdict.label}</strong> — {reasons}.
      {relRank && (
        <> Within {cityN}&apos;s own year, {monthN} ranks <strong>#{relRank} of 12</strong>
          {relRank <= 3 ? <> — one of the 3 best months to visit.</> : relRank >= 10 ? <> — one of the least comfortable months.</> : '.'}</>
      )}
    </>
  ),
  notesTitle: (cityN, monthN) => `Travel notes: ${cityN} in ${monthN}`,
  othersTitle: (monthN, countryN) => `${monthN} in other ${countryN} cities`,
  OtherHigh: ({ row }) => <>High <UnitTempShort c={row.avg_high} /> · {Math.round(row.avg_rainfall ?? 0)} mm</>,
  otherGuide: (monthN) => `${monthN} guide`,
  elsewhereTitle: (kind, monthN) => `${kind === 'both' ? 'Warmer or drier' : kind === 'warmer' ? 'Warmer' : 'Drier'} places in ${monthN}`,
  ElsewhereHigh: ({ row }) => <>High <UnitTempShort c={row.avg_high} /></>,
  elsewhereRainy: (n) => `${n ?? '—'} rainy days`,
  warmer: 'Warmer',
  drier: 'Drier',
  ctaMonthTitle: (cityN) => `Plan a trip to ${cityN}`,
  ctaMonthText: 'Get a day-by-day weather score for your exact travel dates.',
  ctaMonthButton: 'Open the Trip Planner',
  MonthDataNote: ({ years, cityHref, cityN }) => (
    <>
      Monthly averages from {years.end - years.start + 1} years of Open-Meteo history ({years.start}–{years.end}), not a forecast — see all 12 months in{' '}
      <Link href={cityHref} className="text-[#0077b6] font-semibold hover:underline">{cityN} weather by month</Link>.
    </>
  ),

  // ── Country page ──────────────────────────────────────────
  countryMeta: ({ countryN, n }) => ({
    title: `${countryN} Weather by Month & City`,
    description: `Month-by-month climate for ${n} cities in ${countryN}: average highs and lows, rainfall and the best months to visit, from 20 years of weather data.`,
    kicker: 'Weather by month & city',
  }),
  countryH1: (countryN) => <>{countryN} Weather by City &amp; Month</>,
  countrySub: (n, countryN) => <>Month-by-month averages for {n} {n === 1 ? 'city' : 'cities'} in {countryN}, from 20 years of historical weather data.</>,
  climateAcross: (countryN) => `Climate across ${countryN}`,
  CountryIntro: ({ single, warmest, coolest, wettest, loaded }) => (
    <>
      {single && (
        <><strong className="text-gray-800">{single.name}</strong> has an average daytime high of <UnitTemp c={single.v} /> across the year</>
      )}
      {warmest && (
        <>Of the cities below, <strong className="text-gray-800">{warmest.name}</strong> is the warmest, with an average daytime high of <UnitTemp c={warmest.v} /> across the year</>
      )}
      {coolest && (
        <>, while <strong className="text-gray-800">{coolest.name}</strong> is the coolest at <UnitTemp c={coolest.v} /></>
      )}
      .{wettest && <> {loaded.length > 1 ? 'Across these cities' : `In ${loaded[0].name}`}, <strong className="text-gray-800">{wettest.name}</strong> is usually the wettest month (about {Math.round(wettest.v)} mm on average).</>}
    </>
  ),
  preparing: 'Climate data for these cities is being prepared.',
  citiesByMonth: (countryN) => `${countryN} cities by month`,
  avgHighByMonth: 'Average high by month',
  tapValue: <>Tap a value to open that city&apos;s month guide.</>,
  cityTh: 'City',
  cellAria: (cityN, mN) => `${cityN} in ${mN}`,
  bestMonthsTitle: (countryN) => `Best months to visit ${countryN}`,
  BestMonthsText: ({ across, best, worst }) => (
    <>
      Based on comfortable temperatures, rainy days and sunshine across {across ?? 'these cities'},
      the most pleasant months are usually <strong className="text-gray-800">{best}</strong>
      {worst && <>; <strong className="text-gray-800">{worst}</strong> is usually the least comfortable</>}.
      These are historical averages, not a forecast.
    </>
  ),
};

export default en;
