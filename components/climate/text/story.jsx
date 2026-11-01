// ─────────────────────────────────────────────────────────────
//  Month page ki kahani — doosri zabanon ke liye mushtarak ENGINE
//
//  Logic bilkul ../MonthStory.jsx (English) jaisa: kaunsa jumla kab, kaunsa
//  roop (`pick` — page ke apne numbers ka hash, Math.random nahi). Har zaban
//  sirf phrases deti hai (P = ./de.jsx waghera ka `phrases`). English isi
//  engine se NAHI chalti — MonthStory.jsx wahi purani file hai.
// ─────────────────────────────────────────────────────────────
import { UnitTemp, UnitDelta } from '../UnitText';
import { pick } from '@/utils/monthNarrative';

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const S = ({ children }) => <strong className="text-gray-900">{children}</strong>;

/** Rainy days → "jitni dafa" ka andaz (key + number); zaban P.often mein */
function oftenOf(days, monthNum) {
  if (days == null) return null;
  const n = DAYS[monthNum - 1];
  if (days >= n * 0.6) return { key: 'most' };
  if (days >= n * 0.45) return { key: 'everyOther' };
  if (days < 0.5) return { key: 'never' };
  const k = Math.round(n / days);
  return k <= 1 ? { key: 'most' } : { key: 'oneIn', k };
}

export function makeStory(P) {
  const often = (days, monthNum) => {
    const o = oftenOf(days, monthNum);
    return o ? P.often(o) : null;
  };
  const rank = (r) => (r ? P.rank(r.kind, r.rank) : null);

  function heroLine(f, month, place, years) {
    return pick(f.seed, 'hero', P.hero({ monthN: month.name, place, y: `${years.start}–${years.end}` }));
  }

  function QuickAnswer({ f, city, month }) {
    const r = f.row;
    const hi = <S><UnitTemp c={r?.avg_high} /></S>;
    const lo = <S><UnitTemp c={r?.avg_low} /></S>;
    const days = <S>{P.rainyDays(r?.rainy_days ?? '—')}</S>;
    const mm = P.mm(Math.round(r?.avg_rainfall ?? 0));
    const sun = <S>{P.sunHours(r?.sunshine_hours ?? '—')}</S>;
    return pick(f.seed, 'quick', P.quick({ cityN: city.name, inCity: P.inCity(city), monthN: month.name, hi, lo, days, mm, sun }));
  }

  function tableIntro(f, month, city, warmer) {
    if (warmer == null) return null;
    const rainTxt = rank(f.ranks.rain);
    const c = { monthN: month.name, cityN: city.name, inCity: P.inCity(city), rainTxt, warmer, k: 11 - warmer };
    if (warmer === 11 || warmer === 0) return pick(f.seed, 'table', P.tableExtreme({ ...c, warmest: warmer === 11 }));
    return pick(f.seed, 'table', P.tableNormal(c));
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

  function nightSentence(f) {
    const nightTxt = P.nightTxt[f.night];
    if (!nightTxt || !f.swing) return null;
    const v = (arr) => pick(f.seed, 'night', arr);
    if (f.night === 'sultry') return v(P.night.sultry());
    if (f.swing === 'tiny' || f.swing === 'small') return v(P.night.small({ nightTxt }));
    if (f.swing === 'moderate') return v(P.night.moderate({ nightTxt }));
    return v(P.night.big({ nightTxt, delta: <UnitDelta c={f.swingC} /> }));
  }

  function humiditySentence(f) {
    const h = f.humidity;
    const hot = ['warm', 'hot', 'very-hot'].includes(f.feel);
    const cold = ['freezing', 'cold', 'chilly', 'cool'].includes(f.feel);
    const v = (arr) => pick(f.seed, 'hum', arr);
    if (h === 'very-humid' && hot) return v(P.humidity.veryHumidHot);
    if ((h === 'very-humid' || h === 'humid') && cold) return v(P.humidity.dampCold);
    if (h === 'humid' && hot) return v(P.humidity.humidHot);
    if (h === 'very-humid' || h === 'humid') return v(P.humidity.humidMild);
    if (h === 'dry' && hot) return v(P.humidity.dryHot);
    if (h === 'dry') return v(P.humidity.dry);
    if (h === 'comfortable') return v(P.humidity.comfortable);
    return null;
  }

  function FeelSection({ f, city, month }) {
    return (
      <p>
        {seasonSentence(f, city, month)}{' '}
        {f.feel && pick(f.seed, 'feel', P.feel[f.feel])}{' '}
        {nightSentence(f)}{' '}
        {humiditySentence(f)}
      </p>
    );
  }

  function RainSection({ f, city, month }) {
    const r = f.rain;
    if (!r) return null;
    const o = oftenOf(r.days, month.num);
    const c = { monthN: month.name, cityN: city.name, inCity: P.inCity(city), often: o ? P.often(o) : null, never: o?.key === 'never' };
    const v = (salt, arr) => pick(f.seed, salt, arr);
    const freq = v('rfreq', P.rainFreq[r.freq](c));
    const per = r.perDay != null ? P.perDay(r.perDay) : null;
    const size = !per ? null : v('rsize', P.rainSize[r.size]({ ...c, per }));
    const vs = !per || r.yearPerDay == null ? null
      : r.vsYear === 'typical' ? v('rvs', P.rainVs.typical({ ...c, year: P.n1(r.yearPerDay) }))
        : P.rainVs[r.vsYear]({ ...c, year: P.n1(r.yearPerDay) });
    const rk = f.ranks.rain;
    const rankS = !rk ? null : rk.rank === 1 ? P.rainRank1({ ...c, kind: rk.kind }) : rk.rank <= 3 ? P.rainRankTop3({ kind: rk.kind }) : null;
    return <p>{freq} {size} {vs} {rankS}</p>;
  }

  function DaylightSection({ f, city, month }) {
    const d = f.daylight;
    if (!d) return null;
    const c = { monthN: month.name, cityN: city.name, inCity: P.inCity(city) };
    if (d.polar) return <p>{P.polar[d.polar](c)}</p>;
    const len = P.hm(d.dayMinutes);
    const v = (salt, arr) => pick(f.seed, salt, arr);
    const main = v('day', P.dayMain({ ...c, rise: d.sunrise, set: d.sunset, len }));
    const pm = P.month(f.prev.num);
    const amt = P.hm(d.change);
    const ch = Math.abs(d.change) < 10
      ? (d.change === 0 ? P.dayChange.same({ pm }) : P.dayChange.barely({ pm, amt, longer: d.change > 0 }))
      : v('dch', d.change < 0 ? P.dayChange.shorter({ pm, amt }) : P.dayChange.longer({ pm, amt }));
    const share = f.sunShare;
    const sky = share == null ? null : share < 40 ? P.sky.cloudy : share < 60 ? P.sky.mixed : share < 80 ? P.sky.bright : P.sky.clear;
    const sun = share == null ? null : v('sun', P.sunShare({ share, sky }));
    const eq = Math.abs(city.lat) < 15 ? ` ${P.equatorDay}` : '';
    return <p>{main} {ch}{eq} {sun}</p>;
  }

  function CompareSection({ f, city, month }) {
    const row = f.row;
    const prev = f.prev.row;
    const next = f.next.row;
    const v = (salt, arr) => pick(f.seed, salt, arr);
    const c = { monthN: month.name, cityN: city.name, inCity: P.inCity(city), prevN: P.month(f.prev.num), nextN: P.month(f.next.num) };
    const rankTxt = rank(f.ranks.warmth);
    const first = rankTxt && v('cmp1', P.cmpFirst({ ...c, rankTxt }));
    let vsPrev = null;
    if (prev?.avg_high != null && row?.avg_high != null) {
      const d = row.avg_high - prev.avg_high;
      const rain = prev.avg_rainfall != null && row.avg_rainfall != null ? Math.round(row.avg_rainfall - prev.avg_rainfall) : null;
      const rainTxt = rain == null ? '' : P.cmpRain(rain);
      vsPrev = Math.abs(d) < 0.3
        ? P.cmpSame({ ...c, rainTxt })
        : v('cmp2', P.cmpPrev({ ...c, rainTxt, delta: <UnitDelta c={d} />, warmer: d > 0 }));
    }
    const trend = f.trend ? (f.trend === 'flat' ? P.trend.flat(c) : v('trend', P.trend[f.trend](c))) : null;
    const nextHi = next?.avg_high == null ? null : v('cmp3', P.nextHi({ ...c, temp: <UnitTemp c={next.avg_high} /> }));
    return <p>{first} {vsPrev} {trend}{nextHi}</p>;
  }

  function suitWhy(f, s) {
    const alts = P.suitWhy[s.key]?.[s.whyKey];
    return alts ? pick(f.seed, `suit-${s.key}`, alts) : '';
  }

  const tipText = (f, p) => pick(f.seed, `tip-${p.key}`, P.tips[p.key]);

  function quickQuestions(f, city, month, packing) {
    const r = f.row;
    if (!r) return [];
    const v = (salt, arr) => pick(f.seed, salt, arr);
    const c = { monthN: month.name, cityN: city.name, inCity: P.inCity(city), nextN: P.month(f.next.num) };
    const out = [];
    const warmRank = rank(f.ranks.warmth);
    out.push({
      q: P.q1(c),
      a: v('q1', P.a1({ ...c, hi: <UnitTemp c={r.avg_high} />, lo: <UnitTemp c={r.avg_low} />, feel: P.feelWord[f.feel], warmRank })),
    });
    const rf = f.rain;
    if (rf) {
      const yes = rf.freq === 'wet' || (rf.freq === 'showery' && rf.size !== 'light');
      const cc = { ...c, days: r.rainy_days, mm: Math.round(r.avg_rainfall ?? 0), light: rf.size === 'light', often: often(rf.days, month.num) };
      const a = (r.rainy_days ?? 0) < 1
        ? P.a2.never({ ...cc, none: r.rainy_days < 0.5 })
        : rf.freq === 'dry' ? v('q2', P.a2.dry(cc)) : yes ? v('q2', P.a2.yes(cc)) : v('q2', P.a2.some(cc));
      out.push({ q: P.q2(c), a });
    }
    if (packing.length) {
      const list = P.list(packing.map((p) => P.packPhrase[p.key] || P.packTitle(p)));
      const eve = (f.swing === 'big' || f.swing === 'moderate') && (r.avg_low ?? 99) < 18
        ? v('q3b', P.eveCool) : v('q3b', P.eveSame);
      out.push({ q: P.q3(c), a: v('q3', P.a3({ list, eve })) });
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
      const labels = nv && f.verdict ? (better ? [f.verdict.label, nv.label] : [nv.label, f.verdict.label]).map(P.verdict) : null;
      const whyTxt = why.length ? ` ${P.nextWhy({ ...c, why })}` : '';
      out.push({
        q: P.q4(c),
        a: v('q4', P.a4({ ...c, win, ranks, labels, whyTxt, narrow: Math.abs(f.relRank - f.next.relRank) <= 2 })),
      });
    }
    return out.slice(0, 4);
  }

  return { heroLine, QuickAnswer, tableIntro, FeelSection, RainSection, DaylightSection, CompareSection, quickQuestions, suitWhy, tipText };
}
