// Step 5: mahana rows se facts (utils/monthHistory.js)
// Chalana:  node --test tests/unit/monthHistory.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseOdds, latestBreaks, middle80, monthHistoryFacts, whole } from '../../utils/monthHistory.js';
import { oftenOf } from '../../utils/monthNarrative.js';

const HIGH = [5.9, 7.8, 8.8, 9.2, 9.6, 9.6, 10, 10.5, 10.7, 10.8, 10.9, 11.1, 11.3, 12, 12, 12.2, 12.5, 12.7, 12.7, 12.9];
const RAIN = [10, 13, 21, 24, 29, 33, 34, 41, 41, 42, 45, 45, 46, 49, 58, 64, 81, 83, 98, 99];
const DAYS = [5, 6, 10, 12, 12, 13, 13, 13, 14, 14, 15, 15, 15, 15, 16, 17, 22, 24, 25, 28];
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const rows = (h = HIGH, r = RAIN, d = DAYS, month = 3) => h.map((v, i) => [2006 + i, month, v, r[i], d[i]]);
const headlineOf = (h = HIGH, r = RAIN, d = DAYS) => ({ avg_high: avg(h), avg_rainfall: avg(r), rainy_days: avg(d) });
const facts = (extra = {}) => monthHistoryFacts({ rows: rows(), monthNum: 3, headline: headlineOf(), ...extra });

test('thin data: fewer than 15 years hides the block', () => {
  const short = rows().slice(0, 14);
  const h = { avg_high: avg(HIGH.slice(0, 14)), avg_rainfall: avg(RAIN.slice(0, 14)), rainy_days: avg(DAYS.slice(0, 14)) };
  assert.equal(monthHistoryFacts({ rows: short, monthNum: 3, headline: h }), null);
  const ok = rows().slice(0, 15);
  const h15 = { avg_high: avg(HIGH.slice(0, 15)), avg_rainfall: avg(RAIN.slice(0, 15)), rainy_days: avg(DAYS.slice(0, 15)) };
  assert.equal(monthHistoryFacts({ rows: ok, monthNum: 3, headline: h15 }).n, 15);
  assert.equal(monthHistoryFacts({ rows: null, monthNum: 3, headline: h }), null);
});

test('consistency: the rows must average to the page headline, or there is no block', () => {
  assert.ok(facts());
  // Rounded headline jaisa page dikhata hai: chalta hai
  assert.ok(monthHistoryFacts({ rows: rows(), monthNum: 3, headline: { avg_high: Math.round(avg(HIGH) * 10) / 10, avg_rainfall: Math.round(avg(RAIN)), rainy_days: Math.round(avg(DAYS)) } }));
  // Purani definition wale rainy days (28 vs 11): do sach ek page par nahi
  assert.equal(facts({ headline: { ...headlineOf(), rainy_days: avg(DAYS) - 4 } }), null);
  assert.equal(facts({ headline: { ...headlineOf(), avg_high: avg(HIGH) + 1 } }), null);
  assert.equal(facts({ headline: { ...headlineOf(), avg_rainfall: avg(RAIN) + 10 } }), null);
});

test('"1 day in N" uses the same function and the same headline number as the Rain section', () => {
  // Block aur Rain section/FAQ dono f.rain.days + oftenOf: yahan ek hi jawab
  assert.deepEqual(oftenOf(15, 3), { key: 'everyOther' });
  assert.deepEqual(oftenOf(10, 3), { key: 'oneIn', k: 3 });
  assert.deepEqual(oftenOf(25, 3), { key: 'most' });
  assert.deepEqual(oftenOf(0, 8), { key: 'never' });
});

test('a range never prints "-0"', () => {
  assert.equal(Object.is(whole(-0.3), -0), false);
  assert.equal(String(new Intl.NumberFormat('en').format(whole(-0.3))), '0');
  assert.equal(whole(-0.6), -1);
  assert.equal(whole(12.7), 13);
});

test('a rainy-day gap beyond rounding hides the block', () => {
  assert.ok(facts({ headline: { ...headlineOf(), rainy_days: avg(DAYS) - 0.5 } }));
  assert.equal(facts({ headline: { ...headlineOf(), rainy_days: avg(DAYS) - 0.7 } }), null);
});

test('usual range is the middle 80% of years', () => {
  assert.deepEqual(middle80(HIGH), [8.8, 12.7]);
  const f = facts();
  assert.equal(f.range.rainLo, 21);
  assert.equal(f.range.rainHi, 83);
});

test('records come with their year: 4 only, sunshine is gone', () => {
  const f = facts();
  assert.deepEqual(f.records.map((r) => [r.key, r.value, r.year]), [['warm', 12.9, 2025], ['cold', 5.9, 2006], ['wet', 99, 2025], ['dry', 10, 2006]]);
  assert.equal(f.records.some((r) => /sun|dull/i.test(r.key)), false);
});

test('ties: no single "record year" when several years share the value', () => {
  const dry = new Array(20).fill(0).map((_, i) => (i < 14 ? 0 : i - 12));
  const f = monthHistoryFacts({ rows: rows(HIGH, dry), monthNum: 3, headline: headlineOf(HIGH, dry) });
  const rec = f.records.find((r) => r.key === 'dry');
  assert.equal(rec.ties, 14);
  assert.equal(rec.year, null);
  assert.equal(rec.value, 0);
});

test('odds are informative: never 0/20 or 20/20, 3 or 4 of them', () => {
  const f = facts();
  assert.deepEqual(f.odds.map((o) => [o.kind, o.t, o.count]), [['rainy', 16, 6], ['dry', 30, 5], ['warm', 12, 7], ['cool', 10, 6]]);
  for (const o of f.odds) assert.ok(o.count > 0 && o.count < 20);
});

test('odds in a dry month: no "under N mm", rain becomes "any rainy day"', () => {
  const rain = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 5, 6];
  const days = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3];
  const high = [39.2, 40.1, 40.1, 40.4, 40.8, 41.1, 41.5, 41.5, 41.5, 41.6, 41.7, 41.9, 42, 42.3, 42.3, 42.4, 42.7, 42.8, 43.2, 43.4];
  const list = high.map((h, i) => ({ year: 2006 + i, high: h, rain: rain[i], days: days[i] }));
  const odds = chooseOdds(list);
  assert.equal(odds.some((o) => o.kind === 'dry'), false);
  assert.ok(odds.some((o) => o.kind === 'anyrain' && o.count === 6));
  assert.ok(odds.length >= 3);
});

test('latest year: within the records gets a rank and no break', () => {
  const late = facts({ latest: { year: 2026, avg_high: 12.6, avg_rainfall: 26, rainy_days: 7 } }).latest;
  assert.deepEqual(late.breaks, []);
  assert.deepEqual(late.rank, { dir: 'warm', rank: 4 }); // 12.7, 12.7, 12.9 upar
  assert.equal(late.total, 21);
});

test('latest year beats a record: it says so (Reykjavik: January 2026 drier than any January)', () => {
  const late = facts({ latest: { year: 2026, avg_high: 11, avg_rainfall: 8, rainy_days: 3 } }).latest;
  assert.deepEqual(late.breaks, [{ key: 'dry', type: 'beat', value: 8 }]);
});

test('latest year beats the warmth record: no contradicting rank sentence', () => {
  const late = facts({ latest: { year: 2026, avg_high: 14, avg_rainfall: 40, rainy_days: 10 } }).latest;
  assert.deepEqual(late.breaks, [{ key: 'warm', type: 'beat', value: 14 }]);
  assert.equal(late.rank, null);
});

test('latest year equals a record: "matched", on rounded values', () => {
  const late = facts({ latest: { year: 2026, avg_high: 5.94, avg_rainfall: 99.4, rainy_days: 20 } }).latest;
  assert.deepEqual(late.breaks, [{ key: 'cold', type: 'match', value: 5.9 }, { key: 'wet', type: 'match', value: 99 }]);
  assert.equal(late.rank, null);
});

test('latestBreaks skips a missing rain value', () => {
  const recs = facts().records;
  assert.deepEqual(latestBreaks(recs, { high: 11, rain: null }), []);
});

test('a latest row that is not after the range is ignored', () => {
  assert.equal(facts({ latest: { year: 2020, avg_high: 11, avg_rainfall: 40, rainy_days: 9 } }).latest, null);
});

test('other months in the rows are not mixed in', () => {
  const mix = [...rows(), ...rows(HIGH.map((h) => h + 10), RAIN, DAYS, 7)];
  assert.equal(monthHistoryFacts({ rows: mix, monthNum: 3, headline: headlineOf() }).n, 20);
});
