// ─────────────────────────────────────────────────────────────
//  Month page ka article TEXT (content round A1, A3, B1–B4)
//
//  Facts: utils/monthNarrative.js (sirf data). Yahan jumle:
//   • numbers dohraye nahi jate (woh quick answer + stat cards mein) —
//     yahan unka MATLAB: kaisa lagta hai, din-raat ka farq, humidity,
//     barish ka andaz, daylight.
//   • har jumle ke 3–4 roop; kaunsa — page ke apne numbers ka hash
//     (`pick`), Math.random nahi. Wahi page → hamesha wahi text.
//   • koi event / price / "fact" data se bahar nahi.
// ─────────────────────────────────────────────────────────────
import { UnitTemp, UnitDelta } from './UnitText';
import { pick } from '@/utils/monthNarrative';
import { hoursMinutes } from '@/utils/solar';
import { mmToIn, ordinal } from '@/utils/climateMath';

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

/** "one day in 3" / "most days" — rainy days → aam zabaan */
function howOften(days, monthNum) {
  if (days == null) return null;
  const n = DAYS[monthNum - 1];
  if (days >= n * 0.6) return 'most days';
  if (days >= n * 0.45) return 'about every other day';
  if (days < 0.5) return 'almost never';
  const k = Math.round(n / days);
  return k <= 1 ? 'most days' : `about one day in ${k}`;
}

const FEEL_WORD = {
  freezing: 'freezing', cold: 'cold', chilly: 'chilly', cool: 'cool',
  mild: 'mild', warm: 'warm', hot: 'hot', 'very-hot': 'very hot',
};
const rankWords = (r) => (r ? `${r.rank === 1 ? 'the' : `the ${ordinal(r.rank)}`} ${r.kind}` : null);

/** Hero ke neeche ki line */
export function heroLine(f, month, place, years) {
  const y = `${years.start}–${years.end}`;
  return pick(f.seed, 'hero', [
    `What ${month.name} is usually like in ${place} — from ${y} averages.`,
    `Typical ${month.name} weather in ${place}, based on ${y} climate averages.`,
    `${place} in ${month.name}: how the month usually turns out, from ${y} averages.`,
    `The usual ${month.name} conditions in ${place}, drawn from ${y} records.`,
  ]);
}

/** Quick answer (numbers yahin — aur stat cards mein) */
export function QuickAnswer({ f, city, month }) {
  const r = f.row;
  const hi = <strong className="text-gray-900"><UnitTemp c={r?.avg_high} /></strong>;
  const lo = <strong className="text-gray-900"><UnitTemp c={r?.avg_low} /></strong>;
  const days = <strong className="text-gray-900">{r?.rainy_days ?? '—'} rainy days</strong>;
  const mm = `${Math.round(r?.avg_rainfall ?? 0)} mm`;
  const sun = <strong className="text-gray-900">{r?.sunshine_hours ?? '—'} hours of sunshine</strong>;
  return pick(f.seed, 'quick', [
    <>In {month.name}, {city.name} averages a high of {hi} and a low of {lo}, with about {days} ({mm} of rain) and {sun} a day.</>,
    <>A typical {month.name} day in {city.name} peaks at {hi} and drops to {lo} overnight; expect about {days} ({mm} in total) and {sun} daily.</>,
    <>{city.name} in {month.name}: highs near {hi}, lows near {lo}, roughly {days} adding up to {mm}, and {sun} on an average day.</>,
    <>Expect {city.name} to reach about {hi} by day and {lo} at night in {month.name}, with {days} bringing {mm} and around {sun} each day.</>,
  ]);
}

/** Table ke upar ki line */
export function tableIntro(f, month, city, warmer) {
  if (warmer == null) return null;
  const rainTxt = rankWords(f.ranks.rain);
  const k = 11 - warmer;
  if (warmer === 11 || warmer === 0) {
    const w = warmer === 11 ? 'warmest' : 'coolest';
    return pick(f.seed, 'table', [
      <>{month.name} is the <strong>{w} month</strong> in {city.name}{rainTxt && <>, and {rainTxt} for rain</>}.</>,
      <>No month in {city.name} is {warmer === 11 ? 'warmer' : 'cooler'} than {month.name}{rainTxt && <>; for rain it is {rainTxt} month</>}.</>,
    ]);
  }
  return pick(f.seed, 'table', [
    <>{month.name} is warmer than <strong>{warmer} of the other 11 months</strong>{rainTxt && <>, and {rainTxt} month in {city.name}</>}.</>,
    <>{k <= 3 ? `Only ${k} ${k === 1 ? 'month is' : 'months are'}` : `${k} of the other 11 months are`} warmer than {month.name} in {city.name}{rainTxt && <>; for rain it is {rainTxt} month</>}.</>,
    <>On temperature, {month.name} beats <strong>{warmer} of 11</strong> other months{rainTxt && <>, and it ranks as {rainTxt} month of the year</>}.</>,
    <>Here is how every month in {city.name} stacks up against {month.name}{rainTxt && <> — {rainTxt} month for rain</>}.</>,
  ]);
}

// ── Season (B2) ──────────────────────────────────────────────
function seasonSentence(f, city, month) {
  const s = f.season;
  const v = (arr) => pick(f.seed, 'season', arr);
  if (s.kind === 'tropical-even') {
    return s.hemisphere === 'equator'
      ? v([
        `${city.name} sits close to the equator, so it has no real winter or summer — it is warm all year, and ${month.name} follows the same pattern.`,
        `Being almost on the equator, ${city.name} stays warm all year; ${month.name} is one more month of heat and humidity rather than a change of season.`,
        `There are no four seasons this close to the equator: ${city.name} is warm all year, and ${month.name} is no exception.`,
      ])
      : v([
        `${city.name} lies in the tropics and stays warm all year, without a sharp split into seasons.`,
        `As a tropical city, ${city.name} is warm all year; ${month.name} is not part of a clear dry or wet season.`,
        `In the tropics the calendar matters less: ${city.name} is warm all year round.`,
      ]);
  }
  if (s.kind === 'tropical-seasonal') {
    if (s.name === 'wet season') return `${month.name} falls in ${city.name}'s wet season — the rainfall numbers rise clearly above the dry months.`;
    if (s.name === 'dry season') return `${month.name} is part of ${city.name}'s dry season, when rain totals drop well below the wet months.`;
    return `${month.name} sits between ${city.name}'s dry and wet seasons.`;
  }
  const season = s.name;
  const south = s.hemisphere === 'south' ? ` (${city.name} is in the southern hemisphere, so the seasons run opposite to Europe and North America)` : '';
  if (f.trend === 'peak' && season === 'summer') return v([`${month.name} is the height of summer in ${city.name} — the warmest month of the year${south}.`, `Summer peaks in ${month.name}: no month in ${city.name} is warmer${south}.`]);
  if (f.trend === 'trough' && season === 'winter') return v([`${month.name} is the coldest stretch of winter in ${city.name}${south}.`, `Winter bottoms out in ${month.name}, the coolest month of ${city.name}'s year${south}.`]);
  const warmWinter = season === 'winter' && ['mild', 'warm', 'hot', 'very-hot'].includes(f.feel);
  const stage = s.stage === 'mid' ? `mid-${season}` : `${s.stage} ${season}`;
  if (warmWinter) return `${month.name} is ${stage} in ${city.name}${south}, although winter here means ${FEEL_WORD[f.feel]} days rather than cold ones.`;
  return v([
    `${month.name} is ${stage} in ${city.name}${south}.`,
    `In ${city.name}, ${month.name} brings ${stage}${south}.`,
    `For ${city.name}, ${month.name} is ${s.stage === 'mid' ? `the heart of ${season}` : stage}${s.stage === 'mid' ? '' : ' on the calendar'}${south}.`,
    `${cap(stage)} arrives in ${city.name} with ${month.name}${south}.`,
  ]);
}

// ── Feel, nights, humidity (A1) ──────────────────────────────
const FEEL = {
  freezing: ['Days barely climb above freezing, so it feels properly wintry outdoors even at midday.', 'Afternoons stay around freezing — the sort of cold that makes long outdoor stretches hard work.', 'Even the warmest hour of the day stays near freezing.'],
  cold: ['Daytime temperatures stay cold, and a warm coat is needed even in the middle of the day.', 'It is cold outside for most of the day; indoor breaks come as a relief.', 'Midday brings little warmth — expect coat-and-scarf weather from morning to evening.'],
  chilly: ['Days are chilly rather than freezing, and walking is comfortable with a proper jacket.', 'Afternoons feel chilly — fine for exploring on foot if you are dressed for it.', 'The daytime air has a chill to it, though it is rarely bitter.'],
  cool: ['Afternoons are cool, pleasant for walking as long as you keep a layer on.', 'Daytime feels cool and fresh rather than cold.', 'Expect cool, jacket-on afternoons — comfortable for a long walk.', 'Days are on the cool side, the kind of weather that suits brisk sightseeing.'],
  mild: ['Afternoons are mild and comfortable for most people in light layers.', 'Daytime temperatures are mild — neither cold nor hot for walking around.', 'The middle of the day is pleasantly mild.', 'Mild afternoons make it easy to spend hours outdoors.'],
  warm: ['Days are warm enough for short sleeves, and time outdoors is easy.', 'Afternoons are warm and pleasant, good for long days out.', 'Warm daytime weather invites long lunches outside and evening strolls.'],
  hot: ['Afternoons are hot, so sightseeing works best in the morning or evening.', 'The midday hours are hot; shade and water matter on long walks.', 'Expect proper heat in the afternoon — slow down between noon and four.'],
  'very-hot': ['Midday heat is intense, and most people keep to shade or air-conditioning in the afternoon.', 'Afternoons are very hot — outdoor plans work best early in the day or after sunset.', 'The heat peaks hard in the afternoon, when being outside for long is draining.'],
};
function nightSentence(f) {
  const nightTxt = {
    'hard-frost': 'nights drop well below freezing',
    frosty: 'nights hover around freezing, so frost is common',
    cold: 'nights are cold',
    cool: 'nights are cool',
    mild: 'nights stay mild',
    warm: 'nights stay warm',
    sultry: 'nights are sultry and barely cool down',
  }[f.night];
  if (!nightTxt || !f.swing) return null;
  const v = (arr) => pick(f.seed, 'night', arr);
  // Garam raatein: "clear drop" likhna ghalat lagta — alag jumla
  if (f.night === 'sultry') {
    return v(['Nights bring little relief: even the coolest hour of the night stays very warm.', 'Even after dark it stays hot and sultry.', 'Evenings ease the heat only slightly, and nights remain very warm.']);
  }
  if (f.swing === 'tiny' || f.swing === 'small') {
    return v([
      `There is little difference between day and night: ${nightTxt}, and evenings feel much like the afternoon.`,
      `The gap between afternoon and night is small, so ${nightTxt} and the temperature hardly changes after dark.`,
      `Little changes after sunset — ${nightTxt}, only slightly below the daytime level.`,
    ]);
  }
  if (f.swing === 'moderate') {
    return v([
      `After sunset it cools off noticeably — ${nightTxt}.`,
      `Evenings bring a clear drop in temperature, and ${nightTxt}.`,
      `Once the sun goes down the air changes: ${nightTxt}.`,
      `After dark the temperature drops clearly: ${nightTxt}.`,
    ]);
  }
  return v([
    <>The day–night swing is wide (about <UnitDelta c={f.swingC} />): {nightTxt}, so mornings and evenings feel very different from midday.</>,
    <>Temperatures fall sharply after dark — a swing of roughly <UnitDelta c={f.swingC} /> — and {nightTxt}.</>,
    <>{cap(nightTxt)}; with a gap of about <UnitDelta c={f.swingC} /> between afternoon and night, early mornings can surprise you.</>,
  ]);
}
function humiditySentence(f) {
  const h = f.humidity;
  const hot = ['warm', 'hot', 'very-hot'].includes(f.feel);
  const cold = ['freezing', 'cold', 'chilly', 'cool'].includes(f.feel);
  const v = (arr) => pick(f.seed, 'hum', arr);
  if (h === 'very-humid' && hot) return v(['The air is muggy, so it feels hotter than the thermometer suggests.', 'High humidity makes the heat feel heavier and sticky, especially on still afternoons.', 'Thick, humid air means clothes cling and the heat feels stronger than the number.']);
  if ((h === 'very-humid' || h === 'humid') && cold) return v(['Damp air makes the cold feel rawer than the numbers alone suggest.', 'The air is damp, which makes cool temperatures feel colder, particularly in wind.', 'Moisture in the air gives the cold a damp edge.']);
  if (h === 'humid' && hot) return v(['Some humidity hangs in the air, noticeable when the sun is strong.', 'The air carries some moisture, so hot spells feel a little sticky.']);
  if (h === 'very-humid' || h === 'humid') return v(['The air is fairly humid, though at these temperatures it rarely feels oppressive.', 'Humidity is on the high side, but mild temperatures keep it comfortable.', 'Moist air is typical, yet it seldom feels heavy at this time of year.']);
  if (h === 'dry' && hot) return v(['Dry air means sweat evaporates quickly — it feels less sticky, but you lose water fast.', 'The heat is dry rather than muggy, so drink more than you think you need.']);
  if (h === 'dry') return 'The air is dry, so skin and lips may feel it more than the temperature.';
  if (h === 'comfortable') return v(['Humidity is moderate, so the air feels neither sticky nor dry.', 'The air is comfortable — neither muggy nor dry.', 'Moderate humidity keeps the air pleasant.']);
  return null;
}

export function FeelSection({ f, city, month }) {
  return (
    <p>
      {seasonSentence(f, city, month)}{' '}
      {f.feel && pick(f.seed, 'feel', FEEL[f.feel])}{' '}
      {nightSentence(f)}{' '}
      {humiditySentence(f)}
    </p>
  );
}

// ── Rain character (B3) ──────────────────────────────────────
export function RainSection({ f, city, month }) {
  const r = f.rain;
  if (!r) return null;
  const often = howOften(r.days, month.num);
  const v = (salt, arr) => pick(f.seed, salt, arr);
  const freq = {
    dry: v('rfreq', [`Rain is rare in ${month.name} — most weeks pass without a wet day.`, often === 'almost never' ? `${month.name} is a dry month in ${city.name}; rain almost never falls.` : `${month.name} is a dry month in ${city.name}; rain falls ${often}.`, `Dry weather dominates, and an umbrella can mostly stay packed.`]),
    occasional: v('rfreq', [`Rain turns up now and then — ${often}.`, `Wet days are occasional rather than regular, ${often}.`, `Most days stay dry; rain arrives ${often}.`]),
    showery: v('rfreq', [`Showers are a regular feature, arriving ${often}.`, `Expect a mix of dry and wet days, with rain ${often}.`, `It is a changeable month: rain comes ${often}, with dry spells in between.`]),
    wet: v('rfreq', [`Rain is part of normal life this month, falling on ${often}.`, `${month.name} is persistently wet here: some rain falls on ${often}.`, `Dry days are the exception, with rain on ${often}.`]),
  }[r.freq];
  const per = r.perDay != null ? <>about {r.perDay} mm ({mmToIn(r.perDay)} in)</> : null;
  const size = !per ? null : {
    light: v('rsize', [<>Most wet days bring only light rain — {per} on a typical rainy day — the kind of drizzle or short shower that rarely stops plans for long.</>, <>When it rains, it is usually light: {per} per rainy day, more drizzle than downpour.</>, <>Rainfall per wet day is small, {per}, so showers tend to pass quickly.</>]),
    moderate: v('rsize', [<>A rainy day brings {per} on average — steady rain rather than a passing shower.</>, <>Wet days average {per}, enough to soak you without an umbrella.</>, <>Each rainy day adds {per}, a proper wetting rather than a sprinkle.</>]),
    heavy: v('rsize', [<>Rain tends to come in heavy bursts: {per} on an average rainy day.</>, <>Rainy days are intense, averaging {per} — downpours rather than drizzle.</>, <>When rain comes it is heavy, {per} per wet day, often in short, strong bursts.</>]),
  }[r.size];
  const vs = !per || r.yearPerDay == null ? null : {
    heavier: <>That is heavier than {city.name}&apos;s usual {r.yearPerDay} mm per rainy day across the year.</>,
    lighter: <>That is lighter than the city&apos;s yearly norm of about {r.yearPerDay} mm per rainy day.</>,
    typical: v('rvs', [<>That is close to {city.name}&apos;s typical rain per wet day for the whole year (about {r.yearPerDay} mm).</>, <>Across the year {city.name} averages about {r.yearPerDay} mm per rainy day, so {month.name} is typical.</>, <>The yearly figure is similar, around {r.yearPerDay} mm per wet day.</>]),
  }[r.vsYear];
  const rk = f.ranks.rain;
  const rank = !rk ? null : rk.rank === 1
    ? `${month.name} is ${city.name}'s ${rk.kind} month of the year.`
    : rk.rank <= 3 ? `It is among the three ${rk.kind} months of the year.` : null;
  return <p>{freq} {size} {vs} {rank}</p>;
}

// ── Daylight (B1) ────────────────────────────────────────────
export function DaylightSection({ f, city, month }) {
  const d = f.daylight;
  if (!d) return null;
  if (d.polar) {
    return <p>{d.polar === 'day' ? `In mid-${month.name} the sun does not set in ${city.name}.` : `In mid-${month.name} the sun does not rise above the horizon in ${city.name}.`}</p>;
  }
  const len = hoursMinutes(d.dayMinutes);
  const v = (salt, arr) => pick(f.seed, salt, arr);
  const main = v('day', [
    `On 15 ${month.name} the sun rises at about ${d.sunrise} and sets around ${d.sunset} local time, giving ${len} of daylight.`,
    `In mid-${month.name}, sunrise is at about ${d.sunrise} and sunset at about ${d.sunset} (local time) — ${len} of daylight.`,
    `Mid-month, ${city.name} gets ${len} of daylight, from sunrise near ${d.sunrise} to sunset near ${d.sunset}.`,
  ]);
  const pm = f.prev.name;
  const ch = Math.abs(d.change) < 10
    ? (d.change === 0 ? `Day length is essentially the same as in mid-${pm}.` : `Day length barely changes from mid-${pm} (${hoursMinutes(d.change)} ${d.change > 0 ? 'longer' : 'shorter'}).`)
    : d.change < 0
      ? v('dch', [`Days are getting shorter: ${hoursMinutes(d.change)} less daylight than in mid-${pm}.`, `Evenings are drawing in — ${hoursMinutes(d.change)} less daylight than mid-${pm}.`, `Compared with mid-${pm}, the day has lost ${hoursMinutes(d.change)}.`])
      : v('dch', [`Days are getting longer: ${hoursMinutes(d.change)} more daylight than in mid-${pm}.`, `The days are stretching out — ${hoursMinutes(d.change)} more daylight than mid-${pm}.`, `Since mid-${pm} the day has gained ${hoursMinutes(d.change)}.`]);
  const share = f.sunShare;
  const sky = share == null ? null : share < 40 ? 'skies are often cloudy' : share < 60 ? 'sun and cloud share the day' : share < 80 ? 'there are plenty of bright spells' : 'skies are mostly clear';
  const sun = share == null ? null : v('sun', [
    `The sun is out for roughly ${share}% of those daylight hours, so ${sky}.`,
    `Measured sunshine covers about ${share}% of the daylight — ${sky}.`,
    `About ${share}% of daylight hours are sunny; in short, ${sky}.`,
  ]);
  const eq = Math.abs(city.lat) < 15 ? ' Close to the equator, sunrise and sunset times move very little through the year.' : '';
  return <p>{main} {ch}{eq} {sun}</p>;
}

// ── Compare (A1 + A3) ────────────────────────────────────────
export function CompareSection({ f, city, month }) {
  const row = f.row;
  const prev = f.prev.row;
  const next = f.next.row;
  const v = (salt, arr) => pick(f.seed, salt, arr);
  const rankTxt = rankWords(f.ranks.warmth);
  const first = rankTxt && v('cmp1', [
    `${month.name} is ${rankTxt} month of the year in ${city.name}.`,
    `Ranked by average high, ${month.name} comes out as ${rankTxt} month in ${city.name}.`,
    `In ${city.name}'s temperature order, ${month.name} sits as ${rankTxt} month.`,
  ]);
  let vsPrev = null;
  if (prev?.avg_high != null && row?.avg_high != null) {
    const d = row.avg_high - prev.avg_high;
    const rain = prev.avg_rainfall != null && row.avg_rainfall != null ? Math.round(row.avg_rainfall - prev.avg_rainfall) : null;
    const rainTxt = rain == null ? '' : rain === 0 ? ', with about the same rain' : `, with ${Math.abs(rain)} mm ${rain > 0 ? 'more' : 'less'} rain`;
    const dir = d > 0 ? 'warmer' : 'cooler';
    vsPrev = Math.abs(d) < 0.3
      ? <>It is about as warm as {f.prev.name}{rainTxt}.</>
      : v('cmp2', [
        <>Compared with {f.prev.name}, afternoons are <UnitDelta c={d} /> {dir}{rainTxt}.</>,
        <>Afternoons run <UnitDelta c={d} /> {dir} than in {f.prev.name}{rainTxt}.</>,
        <>Against {f.prev.name}, the average high is <UnitDelta c={d} /> {d > 0 ? 'higher' : 'lower'}{rainTxt}.</>,
      ]);
  }
  const trend = {
    peak: v('trend', [`After this the year turns: ${f.next.name} is already cooler.`, `From here temperatures start to ease, beginning in ${f.next.name}.`]),
    trough: v('trend', [`This is the low point, and ${f.next.name} starts to warm up.`, `From here it only gets warmer, starting with ${f.next.name}.`]),
    warming: v('trend', [`The warm-up continues into ${f.next.name}.`, `Temperatures keep climbing into ${f.next.name}.`, `${f.next.name} continues the upward trend.`]),
    cooling: v('trend', [`Temperatures keep falling into ${f.next.name}.`, `The cooling trend carries on into ${f.next.name}.`, `${f.next.name} is cooler again.`]),
    flat: `Temperatures barely move from one month to the next here.`,
  }[f.trend];
  const nextHi = next?.avg_high == null ? null : v('cmp3', [
    <> {f.next.name} averages a high of <UnitTemp c={next.avg_high} />.</>,
    <> By {f.next.name}, typical highs are <UnitTemp c={next.avg_high} />.</>,
    <> The next month&apos;s average high: <UnitTemp c={next.avg_high} />.</>,
  ]);
  return <p>{first} {vsPrev} {trend}{nextHi}</p>;
}

// ── "Who suits" ki wajah + tips ke roop (A3) ─────────────────
const SUIT_WHY = {
  'daytime temperatures are fine for walking around': ['daytime temperatures are fine for walking around', 'comfortable enough to explore on foot all day', 'the weather rarely gets in the way of a city walk'],
  'comfortable for long walks and picnics': ['comfortable for long walks and picnics', 'good conditions for sitting outside', 'pleasant for gardens, parks and riversides'],
};
export function suitWhy(f, s) {
  const alts = SUIT_WHY[s.why];
  return alts ? pick(f.seed, `suit-${s.key}`, alts) : s.why;
}
const TIP_TEXT = {
  layers: ['Days are noticeably warmer than nights — layers you can add or remove.', 'Mornings and evenings are cooler than midday, so dress in layers.', 'Pack pieces you can take off by noon and put back on at dusk.'],
  rain: ['A compact umbrella and a light waterproof jacket.', 'Keep a small umbrella in your bag and wear shoes that cope with puddles.', 'A packable rain jacket saves the day on showery afternoons.'],
  sun: ['Sunscreen, a hat and sunglasses; light breathable clothes.', 'Loose, breathable clothing plus sunscreen and a wide-brimmed hat.', 'Protect yourself from strong sun: hat, SPF and plenty of water.'],
  jacket: ['Cool days — a light jacket or sweater for walking around.', 'A light jacket or knit layer is enough for most of the day.', 'Bring a sweater or light coat for cool afternoons.'],
  warm: ['A warm jacket, a hat and gloves for cold mornings and evenings.', 'A proper winter coat, with gloves and a hat for early starts.', 'Insulated layers and warm shoes for the cold hours.'],
  shades: ['Frequent sunshine — sunglasses and a light hat.', 'Bright days make sunglasses worth packing.', 'Plenty of sun, so bring sunglasses and a cap.'],
  light: ['Comfortable clothes with a light layer for the evening.', 'Everyday clothes, plus one light layer for later in the day.', 'Light, comfortable clothing is all most visitors need.'],
};
export const tipText = (f, p) => (TIP_TEXT[p.key] ? pick(f.seed, `tip-${p.key}`, TIP_TEXT[p.key]) : p.text);

// ── Quick questions (B4) — plain HTML, FAQ schema NAHI ──────────
export function quickQuestions(f, city, month, packing, warmer) {
  const r = f.row;
  if (!r) return [];
  const v = (salt, arr) => pick(f.seed, salt, arr);
  const out = [];
  const warmRank = rankWords(f.ranks.warmth);
  out.push({
    q: `How warm is ${city.name} in ${month.name}?`,
    a: v('q1', [
      <>Afternoons average <UnitTemp c={r.avg_high} /> and nights about <UnitTemp c={r.avg_low} /> — {FEEL_WORD[f.feel]} by most people&apos;s standards.{warmRank && <> It is {warmRank} month of the year.</>}</>,
      <>Expect around <UnitTemp c={r.avg_high} /> in the afternoon and <UnitTemp c={r.avg_low} /> at night, which most visitors would call {FEEL_WORD[f.feel]}.</>,
      <>It feels {FEEL_WORD[f.feel]}: typical highs are <UnitTemp c={r.avg_high} />, with lows near <UnitTemp c={r.avg_low} />.</>,
    ]),
  });
  const rf = f.rain;
  if (rf) {
    const yes = rf.freq === 'wet' || (rf.freq === 'showery' && rf.size !== 'light');
    const mm = Math.round(r.avg_rainfall ?? 0);
    const a = (r.rainy_days ?? 0) < 1
      ? <>Almost never — {month.name} is essentially rainless, with {r.rainy_days < 0.5 ? 'no rainy days' : 'about one rainy day'} in a typical year.</>
      : rf.freq === 'dry'
      ? v('q2', [<>No — {month.name} is one of the drier times, with about {r.rainy_days} rainy days and {mm} mm in total.</>, <>Hardly — only about {r.rainy_days} rainy days and {mm} mm for the whole month.</>])
      : yes
        ? v('q2', [<>Yes, fairly — rain falls {howOften(rf.days, month.num)} and totals about {mm} mm, so an umbrella is worth carrying.</>, <>It does: about {r.rainy_days} rainy days bring roughly {mm} mm, so plan some indoor options.</>, <>Quite a lot — {mm} mm spread over about {r.rainy_days} days.</>])
        : v('q2', [<>Not especially. There are about {r.rainy_days} rainy days ({mm} mm), mostly {rf.size === 'light' ? 'light' : 'moderate'} rain.</>, <>Only moderately: roughly {r.rainy_days} wet days and {mm} mm, usually {rf.size === 'light' ? 'light showers' : 'moderate rain'}.</>]);
    out.push({ q: `Does it rain a lot in ${city.name} in ${month.name}?`, a });
  }
  if (packing.length) {
    const PHRASE = { layers: 'versatile layers', rain: 'rain protection', sun: 'sun protection', jacket: 'a light jacket', warm: 'warm layers', shades: 'sunglasses', light: 'light layers' };
    const items = packing.map((p) => PHRASE[p.key] || p.title.toLowerCase());
    const list = items.length === 1 ? items[0] : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
    const eve = (f.swing === 'big' || f.swing === 'moderate') && (r.avg_low ?? 99) < 18
      ? v('q3b', ['Bring something extra for the cooler evenings.', 'Add a layer for after dark.'])
      : v('q3b', ['Evenings feel similar to the day, so the same clothes work from morning to night.', 'There is little need to change for the evening.']);
    out.push({
      q: `What should I wear in ${city.name} in ${month.name}?`,
      a: v('q3', [<>Based on the averages: {list}. {eve}</>, <>Pack {list}. {eve}</>, <>The numbers point to {list}. {eve}</>]),
    });
  }
  if (f.relRank && f.next.relRank) {
    const better = f.relRank < f.next.relRank;
    const nv = f.next.verdict;
    const nr = f.next.row;
    const why = [];
    if (nr && r.avg_high != null && nr.avg_high != null && Math.abs(nr.avg_high - r.avg_high) >= 1) why.push(nr.avg_high > r.avg_high ? `${f.next.name} is warmer` : `${f.next.name} is cooler`);
    if (nr && r.rainy_days != null && nr.rainy_days != null && Math.abs(nr.rainy_days - r.rainy_days) >= 1) why.push(`${why.length ? '' : `${f.next.name} `}${nr.rainy_days < r.rainy_days ? 'has fewer rainy days' : 'has more rainy days'}`);
    const win = better ? month.name : f.next.name;
    const ranks = `#${better ? f.relRank : f.next.relRank} of 12 vs #${better ? f.next.relRank : f.relRank}`;
    const labels = nv && f.verdict ? (better ? [f.verdict.label, nv.label] : [nv.label, f.verdict.label]) : null;
    const whyTxt = why.length ? ` ${cap(why.join(' and '))}.` : '';
    out.push({
      q: `Is ${month.name} or ${f.next.name} better for visiting ${city.name}?`,
      a: v('q4', [
        <>{win} scores better on our climate ranking ({ranks}){labels ? `, rated ${labels[0]} against ${labels[1]}` : ''}.{whyTxt}</>,
        <>On our 12-month climate ranking, {win} comes out ahead ({ranks}).{whyTxt}</>,
        <>{win}, {Math.abs(f.relRank - f.next.relRank) <= 2 ? 'narrowly' : 'clearly'}: it ranks #{better ? f.relRank : f.next.relRank} of 12 among {city.name}&apos;s months, against #{better ? f.next.relRank : f.relRank} for the other.{whyTxt}</>,
      ]),
    });
  }
  return out.slice(0, 4);
}
