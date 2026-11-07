// ─────────────────────────────────────────────────────────────
//  Month page ka article TEXT — ENGLISH phrases (Step 2, Nov 2026)
//
//  Logic ./text/story.jsx mein (saari zabanon ka ek engine). Facts:
//  utils/monthNarrative.js (sirf data). Yahan sirf English jumle: page ke apne
//  numbers ke saath, data ke bands se chune hue. Koi event / price / "fact"
//  data se bahar nahi. Headings aur FAQ ke sawal frozen hain.
// ─────────────────────────────────────────────────────────────
import { hoursMinutes } from '@/utils/solar';
import { MONTHS, mmToIn, ordinal } from '@/utils/climateMath';
import { makeStory } from './text/story';

const monthN = (n) => MONTHS[(((n - 1) % 12) + 12) % 12].name;
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const FEEL_WORD = {
  freezing: 'freezing', cold: 'cold', chilly: 'chilly', cool: 'cool',
  mild: 'mild', warm: 'warm', hot: 'hot', 'very-hot': 'very hot',
};
const days = (n) => `${n} rainy day${Number(n) === 1 ? '' : 's'}`;

const P = {
  month: monthN,
  list: (items) => (items.length === 1 ? items[0] : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`),
  n1: (v) => v,
  hm: hoursMinutes,
  verdict: (l) => l,
  packTitle: (p) => p.title.toLowerCase(),
  inCity: (city) => `in ${city.name}`,
  rank: (kind, r) => `the ${r === 1 ? '' : `${ordinal(r)} `}${kind} month`,
  rainyDays: days,
  sunHours: (n) => `${n} hours of sunshine`,
  mm: (n) => `${n} mm`,
  perDay: (v) => <>about {v} mm ({mmToIn(v)} in)</>,
  often: (o) => ({ most: 'on most days', everyOther: 'about every other day', never: 'almost never', oneIn: `about one day in ${o.k}` }[o.key]),

  hero: ({ monthN: m, place, y, feelK, rainK }) => {
    const rain = { dry: 'little rain', occasional: 'occasional rain', showery: 'regular showers', wet: 'rain on most days', wintry: 'rain or snow on many days' }[rainK];
    return `${place} in ${m}: ${FEEL_WORD[feelK] || 'typical'} afternoons and ${rain}, based on ${y} averages.`;
  },
  quick: ({ monthN: m, cityN, hi, lo, days: d, mm, sun, feelK, rainK, sunK }) => {
    const lead = { freezing: 'A freezing', cold: 'A cold', chilly: 'A chilly', cool: 'A cool', mild: 'A mild', warm: 'A warm', hot: 'A hot', 'very-hot': 'A very hot' }[feelK] || 'A typical';
    const rain = { dry: <>very little rain ({mm})</>, some: <>about {d} ({mm})</>, wet: <>about {d} ({mm} in total)</> }[rainK];
    const shine = { low: <>only {sun} a day</>, mid: <>{sun} a day</>, high: <>a generous {sun} a day</> }[sunK];
    return <>{lead} month in {cityN}, with {m} highs averaging {hi} and lows {lo}, plus {rain} and {shine}.</>;
  },
  tableExtreme: ({ monthN: m, cityN, warmest, rainTxt }) => <>{m} is the <strong>{warmest ? 'warmest' : 'coolest'} month</strong> in {cityN}{rainTxt && <>, and {rainTxt} for rain</>}.</>,
  tableNormal: ({ monthN: m, cityN, warmer, k, rainTxt, band }) => ({
    high: <>Only {k} {k === 1 ? 'month is' : 'months are'} warmer than {m} in {cityN}{rainTxt && <>; for rain it is {rainTxt}</>}.</>,
    mid: <>{m} is warmer than <strong>{warmer} of the other 11 months</strong>{rainTxt && <>, and {rainTxt} in {cityN}</>}.</>,
    low: <>{m} beats only <strong>{warmer} of 11</strong> other months on temperature{rainTxt && <>, and it ranks as {rainTxt} of the year</>}.</>,
  }[band]),
  season: {
    equator: ({ cityN, monthN: m }) => [
      `${cityN} sits close to the equator, so it has no real winter or summer — it is warm all year, and ${m} follows the same pattern.`,
      `Being almost on the equator, ${cityN} stays warm all year; ${m} is one more month of heat and humidity rather than a change of season.`,
      `There are no four seasons this close to the equator: ${cityN} is warm all year, and ${m} is no exception.`,
    ],
    tropical: ({ cityN, monthN: m }) => [
      `${cityN} lies in the tropics and stays warm all year, without a sharp split into seasons.`,
      `As a tropical city, ${cityN} is warm all year; ${m} is not part of a clear dry or wet season.`,
      `In the tropics the calendar matters less: ${cityN} is warm all year round.`,
    ],
    wet: ({ cityN, monthN: m }) => `${m} falls in ${cityN}'s wet season — the rainfall numbers rise clearly above the dry months.`,
    dry: ({ cityN, monthN: m }) => `${m} is part of ${cityN}'s dry season, when rain totals drop well below the wet months.`,
    between: ({ cityN, monthN: m }) => `${m} sits between ${cityN}'s dry and wet seasons.`,
    south: ({ cityN }) => ` (${cityN} is in the southern hemisphere, so the seasons run opposite to Europe and North America)`,
    peakSummer: ({ monthN: m, cityN, south }) => [`${m} is the height of summer in ${cityN} — the warmest month of the year${south}.`, `Summer peaks in ${m}: no month in ${cityN} is warmer${south}.`],
    troughWinter: ({ monthN: m, cityN, south }) => [`${m} is the coldest stretch of winter in ${cityN}${south}.`, `Winter bottoms out in ${m}, the coolest month of ${cityN}'s year${south}.`],
    warmWinter: ({ monthN: m, cityN, season, stage, south, feel }) => `${m} is ${stage === 'mid' ? `mid-${season}` : `${stage} ${season}`} in ${cityN}${south}, although winter here means ${feel} days rather than cold ones.`,
    normal: ({ monthN: m, cityN, season, stage, south }) => {
      const st = stage === 'mid' ? `mid-${season}` : `${stage} ${season}`;
      return [
        `${m} is ${st} in ${cityN}${south}.`,
        `In ${cityN}, ${m} brings ${st}${south}.`,
        `For ${cityN}, ${m} is ${stage === 'mid' ? `the heart of ${season}` : st}${stage === 'mid' ? '' : ' on the calendar'}${south}.`,
        `${cap(st)} arrives in ${cityN} with ${m}${south}.`,
      ];
    },
  },
  feelWord: FEEL_WORD,
  feelLine: ({ feelK, hi, pos, peakN, delta, wet }) => {
    const open = feelK === 'freezing' ? <>Afternoons struggle to get past {hi}</> : ['hot', 'very-hot'].includes(feelK) ? <>Afternoons hit {hi}</> : <>Afternoons reach about {hi}</>;
    const where = {
      peak: ', the warmest of the year',
      trough: ', the coolest of the year',
      nearPeak: <>, close to the {peakN} peak</>,
      nearTrough: ', close to the coolest of the year',
      flat: ', much as in every other month here',
      middle: <>, about {delta} below the {peakN} peak</>,
    }[pos] || '';
    const advice = {
      freezing: 'it feels properly wintry even at midday',
      cold: 'coat-and-scarf weather from morning to evening',
      chilly: 'fine for walking in a proper jacket',
      cool: 'pleasant for walking with a layer on',
      mild: 'comfortable in light layers',
      warm: 'warm enough for short sleeves',
      hot: 'sightseeing works best in the morning or evening',
      'very-hot': 'long stretches outdoors are draining, so plan around the afternoon',
    }[feelK];
    return <>{open}{where}: {advice}{wet ? ', between the showers' : ''}.</>;
  },
  nightLine: ({ night, swing, lo, delta }) => {
    const gap = {
      tiny: 'barely cooler than the afternoon',
      small: <>about {delta} below the afternoon</>,
      moderate: <>{delta} below the afternoon</>,
      clear: <>a clear {delta} below the afternoon</>,
      big: <>a wide {delta} drop from the afternoon</>,
    }[swing];
    const tail = {
      'hard-frost': ', well below freezing',
      frosty: ', so frost is common',
      cold: ', so mornings start cold',
      cool: ', so evenings call for a layer',
      mild: ', still comfortable outdoors',
      warm: ', still warm enough for short sleeves',
      sultry: ', so there is little relief from the heat',
    }[night];
    return <>Nights fall to about {lo}, {gap}{tail}.</>;
  },
  humLine: ({ caseK, h, rel }) => {
    const r = { above: ', more humid than usual here', below: ', drier than usual here' }[rel] || '';
    const t = {
      veryHumidHot: 'the air is muggy and feels hotter than the thermometer says',
      dampCold: 'damp air makes the cold feel rawer',
      dampCool: 'damp air makes a cool day feel cooler, especially in wind',
      humidHot: 'hot spells feel a little sticky',
      humidMild: 'the air is moist, though it rarely feels heavy at these temperatures',
      dryHot: 'the heat is dry, so drink more than you think you need',
      dry: 'skin and lips may notice the dry air',
      comfortCold: 'the air is neither damp nor dry, so the cold stays crisp',
      comfortMild: 'the air feels neither sticky nor dry',
      comfortHot: 'the heat rarely feels sticky',
    }[caseK];
    return `Humidity averages ${h}%${r}: ${t}.`;
  },
  rainLine: ({ freq, never, days: d, n, cityN, top }) => {
    const base = never ? 'Rain almost never falls' : {
      dry: `Rain is rare, about ${d} wet ${Number(d) === 1 ? 'day' : 'days'} in ${n}`,
      occasional: `Rain turns up on about ${d} of ${n} days`,
      showery: `Expect rain on about ${d} of ${n} days, with dry spells in between`,
      wet: `Rain falls on about ${d} of ${n} days`,
    }[freq];
    const t = !top ? '' : top.first ? `, making this ${cityN}'s ${top.kind} month` : `, among the three ${top.kind} months of the year`;
    return `${base}${t}`;
  },
  rainJoin: '; ',
  stop: '.',
  rainSizeLine: ({ per, sizeK, vs, year }) => {
    const kind = {
      lightCool: 'mostly cold drizzle',
      lightWarm: 'usually a short shower',
      moderateCool: 'steady rain rather than a passing shower',
      moderateWarm: 'enough to soak you without an umbrella',
      heavyCool: 'a proper soaking',
      heavyWarm: 'often as strong downpours',
    }[sizeK];
    const cmp = { heavier: `, heavier than the city's usual ${year} mm`, lighter: `, lighter than the city's usual ${year} mm`, typical: `, close to the city's usual ${year} mm` }[vs] || '';
    return <>wet days bring {per}, {kind}{cmp}.</>;
  },
  snowNote: { snow: 'With temperatures this low, much of it likely falls as snow.', mixed: 'Some of it may fall as sleet or snow.' },
  polar: {
    day: ({ monthN: m, cityN }) => `In mid-${m} the sun does not set in ${cityN}.`,
    night: ({ monthN: m, cityN }) => `In mid-${m} the sun does not rise above the horizon in ${cityN}.`,
  },
  dayLine: ({ monthN: m, cityN, rise, set, len, band, dir, amt, pm }) => {
    const lead = { long: 'Long days: in', short: 'Short days: in', normal: 'In' }[band] || 'In';
    const chg = { barely: `, about the same as in mid-${pm}`, shorter: `, ${amt} less than in mid-${pm}`, longer: `, ${amt} more than in mid-${pm}` }[dir];
    return `${lead} mid-${m}, ${cityN} gets ${len} of daylight, from sunrise near ${rise} to sunset near ${set}${chg}.`;
  },
  equatorDay: 'Close to the equator, sunrise and sunset times move very little through the year.',
  sunLine: ({ share, skyK, rel }) => {
    const r = { above: ', on the sunnier side of the year here', below: ', on the duller side of the year here' }[rel] || '';
    const sky = { cloudy: 'skies are often cloudy', mixed: 'sun and cloud share the day', bright: 'there are plenty of bright spells', clear: 'skies are mostly clear', showery: 'expect bright spells between the showers', clearDry: 'skies are mostly clear and rain is rare', clearSome: 'skies are mostly clear between the wet days', brightSome: 'expect bright spells between the wet days' }[skyK];
    return `Model estimates put sunshine at about ${share}% of daylight${r}, so ${sky}.`;
  },
  cmpRain: (rain) => (rain === 0 ? ', with about the same rain' : `, with ${Math.abs(rain)} mm ${rain > 0 ? 'more' : 'less'} rain`),
  cmpLine: ({ monthN: m, rankTxt, prevN, delta, warmer, mag, same, rainTxt }) => {
    const first = rankTxt ? `${m} is ${rankTxt} of the year` : m;
    if (same) return <>{first}, and about as warm as {prevN}{rainTxt}.</>;
    const size = { slight: 'only ', big: 'a full ', plain: '' }[mag];
    return <>{first}; afternoons are {size}{delta} {warmer ? 'warmer' : 'cooler'} than in {prevN}{rainTxt}.</>;
  },
  nextLine: ({ trendK, nextN, temp, rainDir }) => {
    const base = {
      peak: <>After this the year turns: {nextN} is already cooler, with highs near {temp}</>,
      trough: <>This is the low point: {nextN} warms up to about {temp}</>,
      warming: <>Temperatures keep climbing into {nextN}, to about {temp}</>,
      cooling: <>Temperatures keep falling into {nextN}, to about {temp}</>,
      flat: <>Temperatures barely move into {nextN}, staying near {temp}</>,
    }[trendK];
    const r = { wetter: ', and it gets wetter', drier: ', and it gets drier' }[rainDir] || '';
    return <>{base}{r}.</>;
  },
  suitWhy: {
    sightseeing: {
      ok: 'daytime temperatures are fine for walking around', okCool: 'comfortable on foot with a jacket', okWarm: 'warm but manageable for a city walk',
      rainSnow: 'rain or snow falls on more than half the days', rainMostSnow: 'rain or snow falls on most days', rain: 'rain falls on more than half the days', rainMost: 'rain falls on most days', hot: 'midday heat makes long walks hard', cold: 'it is cold for long walks', coldHard: 'too cold for long walks',
    },
    parks: {
      ok: 'comfortable for long walks and picnics', okCool: 'pleasant with a light layer on',
      hot: 'afternoons are too warm to linger outside', hotHard: 'afternoons are far too hot to sit outside',
      cold: 'too cold to sit outside for long', coldHard: 'much too cold to sit outside', coldMild: 'a little too cool to sit outside for long',
      rain: 'rain interrupts outdoor plans', rainMost: 'rain interrupts most outdoor plans',
    },
    beach: { ok: 'warm and mostly dry on the coast', hot: 'hot coastal weather', cold: 'the sea air is too cool', coldHard: 'far too cold for the beach', rain: 'too many rainy days', rainMost: 'rain on most days' },
    hiking: { ok: 'mild temperatures for trails', cold: 'trails are cool', coldHard: 'trails are cold, so dress for it', hot: 'too hot for long hikes', rain: 'wet trails', rainMost: 'trails stay wet' },
    indoor: { rainSnow: 'with rain or snow on most days, galleries and museums make easy plans', rain: 'with rain on most days, galleries and museums make easy plans', hot: 'a cool break during the hottest hours', cold: 'warm places to spend the cold hours' },
  },
  tips: {
    layers: {
      big: 'Afternoons and nights are far apart, so pack pieces you can take off by noon and put back on at dusk.',
      cold: 'Mornings and evenings are cold compared with midday, so dress in layers.',
      mild: 'Days are noticeably warmer than nights, so bring layers you can add or remove.',
    },
    rain: {
      showeryLight: 'Showers are usually light, so a compact umbrella is enough.',
      showeryModerate: 'Keep a small umbrella in your bag for the wet days.',
      showeryHeavy: 'Rain can be heavy when it comes, so carry a light waterproof jacket.',
      wetLight: 'Drizzle is frequent, so a packable rain jacket earns its place.',
      wetModerate: 'Rain is frequent, so bring a waterproof jacket and shoes that cope with puddles.',
      wetHeavy: 'Rain is frequent and heavy: a proper waterproof and quick-drying shoes.',
      wintry: 'Rain or snow is frequent, so bring a waterproof jacket and boots with grip.',
    },
    sun: {
      extreme: 'Extreme heat: a hat, sunscreen, loose clothes and plenty of water.',
      humid: 'Loose, breathable clothing plus sunscreen and a wide-brimmed hat.',
      dry: 'Protect yourself from strong sun and dry air: hat, sunscreen and plenty of water.',
      clear: 'Sunscreen, a hat and sunglasses; light breathable clothes.',
    },
    jacket: {
      cold: 'A jacket for the cold start to the day, light enough to carry later.',
      cool: 'A light jacket or knit layer is enough for most of the day.',
      mild: 'Bring a sweater or light coat for cool afternoons.',
    },
    warm: {
      freezing: 'A proper winter coat, with gloves and a hat, plus warm shoes for icy pavements.',
      cold: 'A proper winter coat, with gloves and a hat for early starts.',
      frost: 'A warm jacket, a hat and gloves for frosty mornings.',
      chilly: 'A warm jacket and a hat for cold mornings and evenings.',
    },
    shades: {
      clear: 'Clear skies are common, so sunglasses and a light hat are worth packing.',
      bright: 'Bright spells are common, so bring sunglasses and a cap.',
      mixed: 'Sun comes and goes, but sunglasses are still worth a place in your bag.',
    },
    light: { any: 'Comfortable clothes with a light layer for the evening.' },
    shoes: { any: 'Frequent wet days call for shoes that cope with puddles and dry quickly.', heavy: 'Heavy rain on many days: waterproof shoes and a spare pair of socks.', snow: 'Waterproof boots with good grip for wet or icy pavements.' },
  },
  packPhrase: { shoes: 'waterproof shoes', layers: 'versatile layers', rain: 'rain protection', sun: 'sun protection', jacket: 'a light jacket', warm: 'warm layers', shades: 'sunglasses', light: 'light layers' },
  wear: {
    title: ({ monthN: m, cityN }) => `What to wear in ${cityN} in ${m}`,
    basis: 'These are estimates from monthly averages, so read each temperature as "around".',
    h3: { time: 'By time of day', pack: 'Packing for 7 days', year: { normal: 'Cold year or warm year', winter: 'Cold year or mild year', cooler: 'Cooler year or hotter year', hot: 'Cool year or hot year' } },
    at: { morning: (t) => <>Morning, around {t}:</>, afternoon: (t) => <>Afternoon, around {t}:</>, evening: (t) => <>Evening, around {t}:</> },
    morning: { winter: 'a proper winter coat, gloves and a hat.', cold: 'a warm jacket and a hat, with a layer underneath.', mild: 'a light jacket or sweater.', warm: 'light clothes with a thin layer to start.', hot: 'light, loose clothes from the start of the day.' },
    afternoon: { winter: 'the coat stays on, even at midday.', cold: 'keep the jacket for walking; you can drop the extra layer.', mild: 'a light top is enough, with the jacket to hand.', warm: 'light, breathable clothes are enough.', warmSun: 'light clothes, a hat and sunscreen.', hot: 'a hat, sunscreen and loose clothes, with plenty of water.' },
    evening: { ice: 'back near freezing, so keep every layer on and watch for icy pavements.', winter: 'keep every layer on.', cold: 'put the layer back on.', mild: 'bring the jacket back.', warm: 'add the thin layer again.', warmNight: 'the same light clothes; no extra layer is needed.', same: 'the same clothes work, as the temperature barely changes.' },
    year: {
      normal: ({ monthN: m, coldY, warmY, cold, warm }) => <>In a cold year like {coldY}, {m} highs averaged only {cold}, so one extra warm layer is worth packing. In a warm year like {warmY} they reached {warm}, and a lighter layer would do.</>,
      winter: ({ monthN: m, coldY, warmY, cold, warm }) => <>In a cold year like {coldY}, {m} highs averaged only {cold}, so one extra warm layer is worth packing. Even in a mild year like {warmY} they reached just {warm}, so the winter coat still comes.</>,
      cooler: ({ monthN: m, coldY, warmY, cold, warm }) => <>In a cooler year like {coldY}, {m} highs averaged {cold}, so a light extra layer is worth packing. In a hotter year like {warmY} they reached {warm}, so keep your clothes light.</>,
      hot: ({ monthN: m, coldY, warmY, cold, warm, y1, y2 }) => <>Even the coolest {m} of {y1}–{y2}, in {coldY}, averaged {cold}, and the hottest, in {warmY}, reached {warm}. Either way, there is nothing warmer to pack.</>,
    },
    wet: {
      none: 'Expect no wet days in a typical week, so you can leave rain gear at home.',
      some: ({ n, wintry, size, per }) => {
        const each = n === 1 ? 'that day' : 'each';
        const tail = !per ? '' : wintry ? <>, as rain or snow, with {per} on {each}</> : size === 'light' ? <>, mostly light rain of {per} a day</> : size === 'heavy' ? <>, often heavy, with {per} on {each}</> : <>, with {per} on {each}</>;
        return <>Expect about {n} wet {n === 1 ? 'day' : 'days'} in a week{tail}.</>;
      },
    },
    items: { coat: 'A winter coat', coatWet: 'A winter coat with a waterproof outer layer', midThermal: '2 warm mid-layers and a thermal base layer', glovesHat: 'Gloves and a hat', jacketHat: 'A warm jacket and a hat', mid2: '2 warm mid-layers', lightJacket: 'A light jacket or sweater', lightLayers: '2 or 3 light layers', lightClothes: 'Light, breathable clothes', thinLayer: 'A thin layer for the morning and evening', looseClothes: 'Loose, breathable clothes', rainJacket: 'A packable rain jacket', sunKit: 'A hat, sunscreen and sunglasses', shades: 'Sunglasses and a light hat', bottle: 'A water bottle', boots: 'Warm boots with grip', wpShoes: 'Waterproof shoes that dry quickly', lightShoes: 'Light, breathable shoes', walkShoes: 'Comfortable walking shoes' },
    trip: { lead: 'Travelling on specific dates?', link: 'Check your exact dates in the Trip Planner.' },
  },
  hist: {
    title: ({ monthN: m, cityN, n }) => `${m} in ${cityN}: what ${n} years show`,
    basis: ({ y1, y2 }) => `Based on monthly averages from ${y1}–${y2}, not daily records.`,
    h3: { range: 'Usual range', records: 'Records', odds: 'Odds across years' },
    to: 'to',
    range: ({ monthN: m, temps, rainLo, rainHi, wintry }) => <>In most years {m} averages {temps} in the afternoon, with {rainLo}–{rainHi} mm of {wintry ? 'rain or snow' : 'rain'}.</>,
    chance: ({ monthN: m, often, wintry, never }) => (never ? `Rain almost never falls in an average ${m}.` : `${wintry ? 'Rain or snow falls' : 'Rain falls'} ${often} in an average ${m}.`),
    caption: ({ monthN: m, y1, y2 }) => `${m} records, ${y1}–${y2} (monthly averages)`,
    th: { record: 'Record', year: 'Year', high: 'Avg high', rain: 'Rain', days: 'Rainy days' },
    record: {
      warm: ({ monthN: m }) => `Warmest ${m}`, cold: ({ monthN: m }) => `Coldest ${m}`, cool: ({ monthN: m }) => `Coolest ${m}`,
      wet: ({ monthN: m }) => `Wettest ${m}`, dry: ({ monthN: m }) => `Driest ${m}`,
    },
    ties: ({ count, n }) => `${count} of ${n} years`,
    odds: {
      rainy: ({ monthN: m, count, n, t, wintry }) => `In ${count} of ${n} years, ${m} had ${t} or more ${wintry ? 'wet' : 'rainy'} days.`,
      anyrain: ({ monthN: m, count, n, wintry }) => `In ${count} of ${n} years, ${m} had at least one ${wintry ? 'wet' : 'rainy'} day.`,
      dry: ({ count, n, t, wintry }) => `In ${count} of ${n} years, it had under ${t} mm of ${wintry ? 'rain or snow' : 'rain'}.`,
      warm: ({ count, n, temp }) => <>In {count} of {n} years, the average high reached {temp} or more.</>,
      cool: ({ count, n, temp }) => <>In {count} of {n} years, it stayed below {temp}.</>,
    },
    latest: ({ monthN: m, year, dir, rank, total, y1, high, mm, days, wintry }) => <>{m} {year} was the {rank === 1 ? '' : `${ordinal(rank)} `}{dir === 'warm' ? 'warmest' : 'coldest'} {m} since {y1}, out of {total} years ({high}{mm ? `, ${mm}` : ''}{days != null ? `, ${days} ${wintry ? 'wet' : 'rainy'} ${days === 1 ? 'day' : 'days'}` : ''}).</>,
    broke: {
      warm: { beat: ({ monthN: m, year, y1, y2, value }) => <>{m} {year} was warmer than any {m} in {y1}–{y2} ({value}).</>, match: ({ monthN: m, year, y1, y2, value }) => <>{m} {year} matched the warmest {m} of {y1}–{y2} ({value}).</> },
      cold: { beat: ({ monthN: m, year, y1, y2, value }) => <>{m} {year} was colder than any {m} in {y1}–{y2} ({value}).</>, match: ({ monthN: m, year, y1, y2, value }) => <>{m} {year} matched the coldest {m} of {y1}–{y2} ({value}).</> },
      wet: { beat: ({ monthN: m, year, y1, y2, value }) => <>{m} {year} was wetter than any {m} in {y1}–{y2} ({value}).</>, match: ({ monthN: m, year, y1, y2, value }) => <>{m} {year} matched the wettest {m} of {y1}–{y2} ({value}).</> },
      dry: { beat: ({ monthN: m, year, y1, y2, value }) => <>{m} {year} was drier than any {m} in {y1}–{y2} ({value}).</>, match: ({ monthN: m, year, y1, y2, value }) => <>{m} {year} matched the driest {m} of {y1}–{y2} ({value}).</> },
    },
  },
  q1: ({ monthN: m, cityN }) => `How warm is ${cityN} in ${m}?`,
  a1: ({ hi, lo, feel, warmRank }) => <>Afternoons average {hi} and nights about {lo}, {feel} by most people&apos;s standards{warmRank && <>; it is {warmRank} of the year</>}.</>,
  q2: ({ monthN: m, cityN }) => `Does it rain a lot in ${cityN} in ${m}?`,
  a2: {
    never: ({ monthN: m, none }) => <>Almost never: {m} is essentially rainless, with {none ? 'no rainy days' : 'about one rainy day'} in a typical year.</>,
    dry: ({ daysTxt, mm }) => <>No: only about {daysTxt} and {mm} mm for the whole month.</>,
    yes: ({ mm, often, sizeK }) => <>Yes: rain falls {often} and totals about {mm} mm{{ light: ', mostly light', moderate: ', so an umbrella is worth carrying', heavy: ', often heavily, so plan some indoor options' }[sizeK]}.</>,
    some: ({ daysTxt, mm, light }) => <>Not especially: about {daysTxt} ({mm} mm), mostly {light ? 'light' : 'moderate'} rain.</>,
  },
  q3: ({ monthN: m, cityN }) => `What should I wear in ${cityN} in ${m}?`,
  a3: ({ list, eve, cold }) => ({
    cool: <>Pack {list}, plus a layer for {cold ? 'cold' : 'cool'} mornings and evenings.</>,
    same: <>Pack {list}; evenings feel much like the day, so the same clothes work.</>,
    warm: <>Pack {list}; it stays warm after dark, so no extra layer is needed.</>,
  }[eve]),
  q4: ({ monthN: m, nextN, cityN }) => `Is ${m} or ${nextN} better for visiting ${cityN}?`,
  nextWhy: ({ nextN, why }) => {
    const words = why.map((w) => ({ warmer: `${nextN} is warmer`, cooler: `${nextN} is cooler`, fewerRain: 'has fewer rainy days', moreRain: 'has more rainy days' }[w]));
    const parts = why[0] === 'warmer' || why[0] === 'cooler' ? words : [`${nextN} ${words[0]}`, ...words.slice(1)];
    return `${parts.join(' and ')}.`;
  },
  a4: ({ win, ranks, labels, whyTxt, narrow }) => <>{win} scores {narrow ? 'slightly' : 'clearly'} better on our climate ranking (#{ranks.a} of 12 vs #{ranks.b}){labels ? `, rated ${labels[0]} against ${labels[1]}` : ''}.{whyTxt}</>,
};

export const {
  heroLine, QuickAnswer, tableIntro, FeelSection, RainSection, DaylightSection, CompareSection, HistorySection, WearSection, quickQuestions, suitWhy, tipText,
} = makeStory(P);
