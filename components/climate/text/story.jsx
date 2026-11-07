// ─────────────────────────────────────────────────────────────
//  Month page ki kahani — saari 6 zabanon ka mushtarak ENGINE (Step 2, Nov 2026)
//
//  Har jumla page ke APNE numbers se banta hai: kaunsa roop chalega yeh data
//  ke bands batate hain (utils/monthNarrative.js), random synonyms nahi. Har
//  zaban sirf phrases deti hai (P = ./de.jsx waghera, English: ../MonthStory.jsx).
//  `pick` sirf season ke jumlon mein bacha hai (wahan koi number nahi).
// ─────────────────────────────────────────────────────────────
import Link from '@/components/LocaleLink';
import { UnitTemp, UnitDelta, UnitTempRange, UnitTempWhole } from '../UnitText';
import { eveningAdvice, oftenOf, pick, wintryBand } from '@/utils/monthNarrative';

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const S = ({ children }) => <strong className="text-gray-900">{children}</strong>;

/** Humidity jumla: band + is mahine ka temperature */
function humidityCase(f) {
  const h = f.humidity;
  const hot = ['warm', 'hot', 'very-hot'].includes(f.feel);
  const cold = ['freezing', 'cold', 'chilly', 'cool'].includes(f.feel);
  if (h === 'very-humid' && hot) return 'veryHumidHot';
  if ((h === 'very-humid' || h === 'humid') && cold) return ['freezing', 'cold'].includes(f.feel) ? 'dampCold' : 'dampCool';
  if (h === 'humid' && hot) return 'humidHot';
  if (h === 'very-humid' || h === 'humid') return 'humidMild';
  if (h === 'dry' && hot) return 'dryHot';
  if (h === 'dry') return 'dry';
  if (h === 'comfortable') return cold ? 'comfortCold' : hot ? 'comfortHot' : 'comfortMild';
  return null;
}

/** "Who suits" ki wajah: temperature / barish kitni, us ke hisab se */
export function suitBand(s, row, monthNum) {
  const t = row?.avg_high;
  const rain = row?.rainy_days != null ? (row.rainy_days / DAYS[monthNum - 1]) * 100 : 0;
  const key = s.whyKey;
  if (key === 'rain') {
    const band = s.key !== 'indoor' && rain >= 70 ? 'rainMost' : 'rain';
    return wintryBand(row) ? `${band}Snow` : band;
  }
  if (s.key === 'sightseeing') {
    if (key === 'ok') return t < 18 ? 'okCool' : t <= 26 ? 'ok' : 'okWarm';
    if (key === 'cold') return t < 3 ? 'coldHard' : 'cold';
  }
  if (s.key === 'parks') {
    if (key === 'ok') return t < 20 ? 'okCool' : 'ok';
    if (key === 'hot') return t > 32 ? 'hotHard' : 'hot';
    if (key === 'cold') return t < 5 ? 'coldHard' : t < 10 ? 'cold' : 'coldMild';
  }
  if (s.key === 'beach' && key === 'cold') return t < 10 ? 'coldHard' : 'cold';
  if (s.key === 'hiking' && key === 'cold') return t < 8 ? 'coldHard' : 'cold';
  return key;
}

/** Tips ka matn: isi mahine ke numbers ke hisab se (H3 title wahi rehta hai) */
export function tipBand(p, f) {
  const r = f.row || {};
  if (p.key === 'layers') return f.swing === 'big' ? 'big' : r.avg_low < 10 ? 'cold' : 'mild';
  if (p.key === 'shoes') return f.wintry ? 'snow' : f.rain?.size === 'heavy' ? 'heavy' : 'any';
  if (p.key === 'rain') {
    if (f.wintry) return 'wintry';
    const size = f.rain?.size || 'moderate';
    return `${f.rain?.freq === 'wet' ? 'wet' : 'showery'}${size[0].toUpperCase()}${size.slice(1)}`;
  }
  if (p.key === 'sun') return r.avg_high > 36 ? 'extreme' : ['humid', 'very-humid'].includes(f.humidity) ? 'humid' : f.humidity === 'dry' ? 'dry' : 'clear';
  if (p.key === 'jacket') return r.avg_low < 8 ? 'cold' : r.avg_low < 13 ? 'cool' : 'mild';
  if (p.key === 'warm') return r.avg_high < 3 ? 'freezing' : r.avg_high < 8 ? 'cold' : r.avg_low < 0 ? 'frost' : 'chilly';
  if (p.key === 'shades') return (f.sunShare ?? 0) >= 80 ? 'clear' : (f.sunShare ?? 0) >= 60 ? 'bright' : 'mixed';
  return 'any';
}

export function makeStory(P) {
  const often = (days, monthNum) => {
    const o = oftenOf(days, monthNum);
    return o ? P.often(o) : null;
  };
  const rank = (r) => (r ? P.rank(r.kind, r.rank) : null);
  // "Most days" sirf jab sach mein 60%+ din (London March 15/31 "most days" nahi)
  const heroRain = (f) => {
    if (f.wintry) return 'wintry';
    const days = f.row?.rainy_days ?? 0;
    const share = days / DAYS[f.monthNum - 1];
    return share >= 0.6 ? 'wet' : share >= 0.3 ? 'showery' : days <= 3 ? 'dry' : 'occasional';
  };

  function heroLine(f, month, place, years) {
    return P.hero({ monthN: month.name, place, y: `${years.start}–${years.end}`, feelK: f.feel, rainK: heroRain(f) });
  }

  function QuickAnswer({ f, city, month }) {
    const r = f.row;
    const hi = <S><UnitTemp c={r?.avg_high} /></S>;
    const lo = <S><UnitTemp c={r?.avg_low} /></S>;
    const days = <S>{P.rainyDays(r?.rainy_days ?? '—')}</S>;
    const mm = P.mm(Math.round(r?.avg_rainfall ?? 0));
    const sun = <S>{P.sunHours(r?.sunshine_hours ?? '—')}</S>;
    const rainK = (r?.rainy_days ?? 0) <= 3 ? 'dry' : (r?.rainy_days ?? 0) <= 12 ? 'some' : 'wet';
    const sunK = (r?.sunshine_hours ?? 5) < 4 ? 'low' : (r?.sunshine_hours ?? 5) >= 9 && (r?.rainy_days ?? 0) < 15 ? 'high' : 'mid';
    return P.quick({ cityN: city.name, inCity: P.inCity(city), monthN: month.name, hi, lo, days, mm, sun, feelK: f.feel, rainK, sunK });
  }

  function tableIntro(f, month, city, warmer) {
    if (warmer == null) return null;
    const rainTxt = rank(f.ranks.rain);
    const c = { monthN: month.name, cityN: city.name, inCity: P.inCity(city), rainTxt, warmer, k: 11 - warmer };
    if (warmer === 11 || warmer === 0) return P.tableExtreme({ ...c, warmest: warmer === 11 });
    return P.tableNormal({ ...c, band: warmer >= 8 ? 'high' : warmer <= 3 ? 'low' : 'mid' });
  }

  function seasonSentence(f, city, month) {
    const s = f.season;
    const v = (arr) => pick(f.seed, 'season', arr);
    const c = { cityN: city.name, inCity: P.inCity(city), monthN: month.name };
    if (s.kind === 'tropical-even') return v(s.hemisphere === 'equator' ? P.season.equator(c) : P.season.tropical(c));
    if (s.kind === 'tropical-seasonal') {
      if (s.name === 'wet season') return P.season.wet(c);
      if (s.name === 'dry season') return P.season.dry(c);
      return P.season.between(c);
    }
    const south = s.hemisphere === 'south' ? P.season.south(c) : '';
    const cc = { ...c, season: s.name, stage: s.stage, south };
    if (f.trend === 'peak' && s.name === 'summer') return v(P.season.peakSummer(cc));
    if (f.trend === 'trough' && s.name === 'winter') return v(P.season.troughWinter(cc));
    const warmWinter = s.name === 'winter' && ['mild', 'warm', 'hot', 'very-hot'].includes(f.feel);
    if (warmWinter) return P.season.warmWinter({ ...cc, feel: P.feelWord[f.feel] });
    return v(P.season.normal(cc));
  }

  function feelSentence(f) {
    if (!f.feel) return null;
    return P.feelLine({
      feelK: f.feel,
      hi: <UnitTemp c={f.row?.avg_high} />,
      pos: f.pos?.key,
      peakN: f.pos?.peakNum ? P.month(f.pos.peakNum) : null,
      delta: f.pos?.delta != null ? <UnitDelta c={f.pos.delta} /> : null,
      wet: f.rain?.freq === 'wet' && ['cool', 'mild', 'warm'].includes(f.feel),
    });
  }

  function nightSentence(f) {
    if (!f.night || !f.swing) return null;
    const swing = f.swing === 'moderate' && f.swingC >= 9 ? 'clear' : f.swing;
    return P.nightLine({ night: f.night, swing, lo: <UnitTemp c={f.row?.avg_low} />, delta: <UnitDelta c={f.swingC} /> });
  }

  function humiditySentence(f) {
    const caseK = humidityCase(f);
    return caseK ? P.humLine({ caseK, h: f.row?.humidity, rel: f.humRel }) : null;
  }

  function FeelSection({ f, city, month }) {
    return (
      <p>
        {seasonSentence(f, city, month)}{' '}
        {feelSentence(f)}{' '}
        {nightSentence(f)}{' '}
        {humiditySentence(f)}
      </p>
    );
  }

  function RainSection({ f, city, month }) {
    const r = f.rain;
    if (!r) return null;
    const o = oftenOf(r.days, month.num);
    const rk = f.ranks.rain;
    const c = { monthN: month.name, cityN: city.name, inCity: P.inCity(city) };
    const freq = P.rainLine({
      ...c,
      freq: r.freq,
      never: o?.key === 'never',
      days: P.n1(r.days),
      n: DAYS[month.num - 1],
      top: rk && rk.rank <= 3 ? { kind: rk.kind, first: rk.rank === 1 } : null,
    });
    const per = r.perDay != null ? P.perDay(r.perDay) : null;
    const size = !per ? null : P.rainSizeLine({
      ...c,
      per,
      sizeK: `${r.size}${(f.row?.avg_high ?? 20) < 18 ? 'Cool' : 'Warm'}`,
      vs: r.yearPerDay == null ? null : r.vsYear,
      year: P.n1(r.yearPerDay),
    });
    return <p>{freq}{size ? P.rainJoin : P.stop}{size}{f.wintry ? ` ${P.snowNote[f.wintry]}` : ''}</p>;
  }

  function DaylightSection({ f, city, month }) {
    const d = f.daylight;
    if (!d) return null;
    const c = { monthN: month.name, cityN: city.name, inCity: P.inCity(city) };
    if (d.polar) return <p>{P.polar[d.polar](c)}</p>;
    const main = P.dayLine({
      ...c,
      rise: d.sunrise,
      set: d.sunset,
      len: P.hm(d.dayMinutes),
      band: f.dayLen,
      dir: Math.abs(d.change) < 10 ? 'barely' : d.change < 0 ? 'shorter' : 'longer',
      amt: P.hm(d.change),
      pm: P.month(f.prev.num),
    });
    const share = f.sunShare;
    const rainy = f.row?.rainy_days ?? 0;
    let skyK = null;
    if (share != null) {
      if (share < 40) skyK = 'cloudy';
      else if (share < 60) skyK = 'mixed';
      else if (rainy >= 15) skyK = 'showery';
      else if (share < 80) skyK = rainy > 8 ? 'brightSome' : 'bright';
      else skyK = rainy <= 3 ? 'clearDry' : rainy <= 8 ? 'clear' : 'clearSome';
    }
    const sun = share == null ? null : P.sunLine({ share, skyK, rel: f.sunRel });
    const eq = Math.abs(city.lat) < 15 ? ` ${P.equatorDay}` : '';
    return <p>{main}{eq} {sun}</p>;
  }

  function CompareSection({ f, city, month }) {
    const row = f.row;
    const prev = f.prev.row;
    const next = f.next.row;
    const c = { monthN: month.name, cityN: city.name, inCity: P.inCity(city), prevN: P.month(f.prev.num), nextN: P.month(f.next.num) };
    const rankTxt = rank(f.ranks.warmth);
    let first = null;
    if (prev?.avg_high != null && row?.avg_high != null) {
      const d = row.avg_high - prev.avg_high;
      const rawRain = prev.avg_rainfall != null && row.avg_rainfall != null ? Math.round(row.avg_rainfall - prev.avg_rainfall) : null;
      const rainTxt = rawRain == null ? '' : P.cmpRain(Math.abs(rawRain) < 5 ? 0 : rawRain);
      const abs = Math.abs(d);
      first = P.cmpLine({
        ...c,
        rankTxt,
        rainTxt,
        same: abs < 0.3,
        warmer: d > 0,
        mag: abs < 1.5 ? 'slight' : abs >= 5 ? 'big' : 'plain',
        delta: <UnitDelta c={d} />,
      });
    }
    const nextS = next?.avg_high == null || !f.trend ? null
      : P.nextLine({ ...c, trendK: f.pos?.key === 'peak' ? 'peak' : f.pos?.key === 'trough' ? 'trough' : f.trend, temp: <UnitTemp c={next.avg_high} />, rainDir: f.nextRain });
    return <p>{first} {nextS}</p>;
  }

  /** "<Month> in <City>: what 20 years show" (Step 5): sirf mahana rows, koi daily data nahi */
  function HistorySection({ f, city, month, facts }) {
    const H = P.hist;
    const c = { monthN: month.name, cityN: city.name, inCity: P.inCity(city), y1: facts.from, y2: facts.to, n: facts.n, wintry: Boolean(f.wintry) };
    const { range, records, odds, latest } = facts;
    const often = oftenOf(f.rain?.days, month.num);
    const temp = (v) => <UnitTemp c={v} />;
    const recLabel = (rec) => H.record[rec.key === 'cold' && rec.value >= 15 ? 'cool' : rec.key](c);
    return (
      <section>
        <h2 className="text-xl font-bold text-[#002244] mb-2">{H.title(c)}</h2>
        <p className="text-sm text-gray-500 mb-3">{H.basis(c)}</p>
        <h3 className="font-bold text-[#002244] mb-1">{H.h3.range}</h3>
        <p className="mb-3">
          {H.range({ ...c, temps: <UnitTempRange lo={range.highLo} hi={range.highHi} to={H.to} />, rainLo: range.rainLo, rainHi: range.rainHi })}
          {often && <> {H.chance({ ...c, often: P.often(often), never: often.key === 'never' })}</>}
        </p>
        <h3 className="font-bold text-[#002244] mb-1">{H.h3.records}</h3>
        <div className="overflow-x-auto mb-3">
          <table className="w-full text-sm text-left">
            <caption className="text-xs text-gray-500 text-left mb-1">{H.caption(c)}</caption>
            <thead>
              <tr className="text-gray-600">
                <th scope="col" className="py-1.5 pr-3 font-semibold">{H.th.record}</th>
                <th scope="col" className="py-1.5 pr-3 font-semibold">{H.th.year}</th>
                <th scope="col" className="py-1.5 pr-3 font-semibold whitespace-nowrap">{H.th.high}</th>
                <th scope="col" className="py-1.5 pr-3 font-semibold">{H.th.rain}</th>
                <th scope="col" className="py-1.5 font-semibold">{H.th.days}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.key} className="border-t border-gray-100">
                  <th scope="row" className="py-1.5 pr-3 font-semibold text-gray-800">{recLabel(rec)}</th>
                  {rec.year != null ? (
                    <>
                      <td className="py-1.5 pr-3">{rec.year}</td>
                      <td className="py-1.5 pr-3 whitespace-nowrap">{temp(rec.high)}</td>
                      <td className="py-1.5 pr-3 whitespace-nowrap">{P.mm(Math.round(rec.rain))}</td>
                      <td className="py-1.5">{P.n1(rec.days)}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-1.5 pr-3">{H.ties({ ...c, count: rec.ties })}</td>
                      <td className="py-1.5 pr-3 whitespace-nowrap">{rec.field === 'high' ? temp(rec.value) : '—'}</td>
                      <td className="py-1.5 pr-3 whitespace-nowrap">{rec.field === 'rain' ? P.mm(rec.value) : '—'}</td>
                      <td className="py-1.5">—</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {latest && latest.breaks.length > 0 && (
          <p className="mb-3">
            {latest.breaks.map((b) => (
              <span key={b.key}>{H.broke[b.key][b.type]({ ...c, year: latest.year, value: b.key === 'warm' || b.key === 'cold' ? temp(b.value) : P.mm(b.value) })} </span>
            ))}
          </p>
        )}
        {odds.length > 0 && (
          <>
            <h3 className="font-bold text-[#002244] mb-1">{H.h3.odds}</h3>
            <p className="mb-3">
              {odds.map((o) => (
                <span key={o.kind}>{H.odds[o.kind]({ ...c, count: o.count, t: o.t, temp: temp(o.t) })} </span>
              ))}
            </p>
          </>
        )}
        {latest?.rank && (
          <p>{H.latest({ ...c, year: latest.year, dir: latest.rank.dir, rank: latest.rank.rank, total: latest.total, high: temp(latest.high), mm: latest.rain != null ? P.mm(Math.round(latest.rain)) : null, days: latest.days })}</p>
        )}
      </section>
    );
  }

  /** "What to wear" (Step 6): mahana numbers se, Tips aur FAQ wale hi rules */
  function WearSection({ city, month, wear, plannerHref }) {
    const W = P.wear;
    const c = { monthN: month.name, cityN: city.name, inCity: P.inCity(city) };
    const { temps, keys, year } = wear;
    const line = (k) => (
      <li key={k}>
        <span className="font-semibold">{W.at[k](<UnitTempWhole c={temps[k]} />)}</span> {W[k][keys[k]]}
      </li>
    );
    return (
      <section>
        <h2 className="text-xl font-bold text-[#002244] mb-2">{W.title(c)}</h2>
        <p className="text-sm text-gray-500 mb-3">{W.basis}</p>
        <h3 className="font-bold text-[#002244] mb-1">{W.h3.time}</h3>
        <ul className="list-disc pl-5 space-y-1 mb-3">{['morning', 'afternoon', 'evening'].map(line)}</ul>
        {year && (
          <>
            <h3 className="font-bold text-[#002244] mb-1">{W.h3.year[year.kind]}</h3>
            <p className="mb-3">{W.year[year.kind]({ ...c, coldY: year.coldYear, warmY: year.warmYear, cold: <UnitTemp c={year.coldHigh} />, warm: <UnitTemp c={year.warmHigh} />, y1: year.from, y2: year.to })}</p>
          </>
        )}
        <h3 className="font-bold text-[#002244] mb-1">{W.h3.pack}</h3>
        <p className="mb-1">{wear.wetWeek === 0 ? W.wet.none : W.wet.some({ n: wear.wetWeek, wintry: wear.wintry, size: wear.size, per: wear.perDay != null ? P.perDay(wear.perDay) : null })}</p>
        <ul className="list-disc pl-5 space-y-1 mb-3">{wear.items.map((k) => <li key={k}>{W.items[k]}</li>)}</ul>
        <p>{W.trip.lead} <Link href={plannerHref} className="text-[#0077b6] font-semibold hover:underline">{W.trip.link}</Link></p>
      </section>
    );
  }

  function suitWhy(f, s) {
    const whys = P.suitWhy[s.key];
    return whys?.[suitBand(s, f.row, f.monthNum)] || whys?.[s.whyKey] || '';
  }

  const tipText = (f, p) => P.tips[p.key]?.[tipBand(p, f)] || '';

  function quickQuestions(f, city, month, packing) {
    const r = f.row;
    if (!r) return [];
    const c = { monthN: month.name, cityN: city.name, inCity: P.inCity(city), nextN: P.month(f.next.num) };
    const out = [];
    out.push({
      q: P.q1(c),
      a: P.a1({ ...c, hi: <UnitTemp c={r.avg_high} />, lo: <UnitTemp c={r.avg_low} />, feel: P.feelWord[f.feel], warmRank: rank(f.ranks.warmth) }),
    });
    const rf = f.rain;
    if (rf) {
      const yes = rf.freq === 'wet' || (rf.freq === 'showery' && rf.size !== 'light');
      const cc = { ...c, days: r.rainy_days, daysTxt: P.rainyDays(r.rainy_days), mm: Math.round(r.avg_rainfall ?? 0), light: rf.size === 'light', sizeK: rf.size, often: often(rf.days, month.num) };
      const a = (r.rainy_days ?? 0) < 1
        ? P.a2.never({ ...cc, none: r.rainy_days < 0.5 })
        : rf.freq === 'dry' ? P.a2.dry(cc) : yes ? P.a2.yes(cc) : P.a2.some(cc);
      out.push({ q: P.q2(c), a: f.wintry ? <>{a} {P.snowNote[f.wintry]}</> : a });
    }
    if (packing.length) {
      const list = P.list(packing.map((p) => P.packPhrase[p.key] || P.packTitle(p)));
      out.push({ q: P.q3(c), a: P.a3({ list, eve: eveningAdvice(f.swing, r.avg_low), cold: r.avg_low < 12 }) });
    }
    if (f.relRank && f.next.relRank) {
      const better = f.relRank < f.next.relRank;
      const nv = f.next.verdict;
      const nr = f.next.row;
      const why = [];
      if (nr && r.avg_high != null && nr.avg_high != null && Math.abs(nr.avg_high - r.avg_high) >= 1) why.push(nr.avg_high > r.avg_high ? 'warmer' : 'cooler');
      if (nr && r.rainy_days != null && nr.rainy_days != null && Math.abs(nr.rainy_days - r.rainy_days) >= 1) why.push(nr.rainy_days < r.rainy_days ? 'fewerRain' : 'moreRain');
      const win = better ? month.name : c.nextN;
      const ranks = { a: better ? f.relRank : f.next.relRank, b: better ? f.next.relRank : f.relRank };
      // "Poor against Poor" kuch nahi batata
      const labels = nv && f.verdict && nv.label !== f.verdict.label ? (better ? [f.verdict.label, nv.label] : [nv.label, f.verdict.label]).map(P.verdict) : null;
      const whyTxt = why.length ? ` ${P.nextWhy({ ...c, why })}` : '';
      out.push({ q: P.q4(c), a: P.a4({ ...c, win, ranks, labels, whyTxt, narrow: Math.abs(f.relRank - f.next.relRank) <= 2 }) });
    }
    return out.slice(0, 4);
  }

  return { heroLine, QuickAnswer, tableIntro, FeelSection, RainSection, DaylightSection, CompareSection, HistorySection, WearSection, quickQuestions, suitWhy, tipText };
}
