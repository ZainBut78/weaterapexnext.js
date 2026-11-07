// Step 6: "What to wear" (utils/monthWear.js) aur guard (utils/monthHistory.js)
// Chalana:  node --test tests/unit/monthWear.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { eveningTemp, morningTemp, wearBand, wearFacts } from '../../utils/monthWear.js';
import { monthHistoryFacts } from '../../utils/monthHistory.js';

const rec = (key, value, year) => ({ key, value, year });
const history = (coldV, coldY, warmV, warmY) => ({
  from: 2006, to: 2025,
  records: [rec('warm', warmV, warmY), rec('cold', coldV, coldY), rec('wet', 99, 2023), rec('dry', 10, 2011)],
});
const LONDON = {
  row: { avg_high: 10.66, avg_low: 3.31, rainy_days: 15 },
  f: { swing: 'moderate', wintry: null, rain: { days: 15, size: 'light', perDay: 3.2 } },
  packing: [{ key: 'rain' }, { key: 'warm' }, { key: 'shoes' }],
  history: history(5.9, 2013, 12.9, 2017), monthNum: 3,
};
const DUBAI = {
  row: { avg_high: 41.625, avg_low: 30.055, rainy_days: 0 },
  f: { swing: 'moderate', wintry: null, rain: { days: 0, size: null, perDay: null } },
  packing: [{ key: 'sun' }],
  history: history(39.2, 2018, 43.4, 2016), monthNum: 8,
};
const REYKJAVIK = {
  row: { avg_high: 1.55, avg_low: -2.945, rainy_days: 19 },
  f: { swing: 'small', wintry: 'snow', rain: { days: 19, size: 'moderate', perDay: 7.7 } },
  packing: [{ key: 'rain' }, { key: 'warm' }],
  history: history(-0.8, 2007, 3.5, 2006), monthNum: 1,
};

test('morning = low + 20% of the swing, evening = low + 50% (owner)', () => {
  assert.equal(Math.round(morningTemp(10.66, 3.31)), 5);
  assert.equal(Math.round(eveningTemp(10.66, 3.31)), 7);
  assert.equal(morningTemp(20, 10), 12);
  assert.equal(eveningTemp(20, 10), 15);
});

test('London March follows the approved draft', () => {
  const w = wearFacts(LONDON);
  assert.equal(w.band, 'cold');
  assert.deepEqual(w.keys, { morning: 'cold', afternoon: 'cold', evening: 'cold' });
  assert.equal(w.wetWeek, 3);
  assert.deepEqual(w.items, ['jacketHat', 'mid2', 'rainJacket', 'wpShoes']);
  assert.equal(w.year.kind, 'normal');
  assert.equal(w.year.coldYear, 2013);
});

test('Dubai August follows the approved draft: no rain gear, nothing warmer', () => {
  const w = wearFacts(DUBAI);
  assert.equal(w.band, 'hot');
  assert.deepEqual(w.keys, { morning: 'hot', afternoon: 'hot', evening: 'warmNight' });
  assert.equal(w.wetWeek, 0);
  assert.deepEqual(w.items, ['looseClothes', 'sunKit', 'bottle', 'lightShoes']);
  assert.equal(w.year.kind, 'hot');
});

test('Reykjavik January follows the approved draft: rain or snow, grip', () => {
  const w = wearFacts(REYKJAVIK);
  assert.equal(w.band, 'winter');
  assert.equal(w.keys.evening, 'ice');
  assert.equal(w.wetWeek, 4);
  assert.deepEqual(w.items, ['coatWet', 'midThermal', 'glovesHat', 'boots']);
  assert.equal(w.year.kind, 'winter');
  assert.equal(w.wintry, true);
});

test('agrees with Tips: sunglasses never appear when Tips swapped them for shoes', () => {
  assert.equal(wearFacts(LONDON).items.includes('shades'), false);
  const sunny = { ...LONDON, packing: [{ key: 'warm' }, { key: 'shades' }], f: { ...LONDON.f, rain: { days: 6, size: 'light', perDay: 2 } } };
  assert.ok(wearFacts(sunny).items.includes('shades'));
  assert.equal(wearFacts(sunny).items.includes('rainJacket'), false);
});

test('agrees with the rain tip: never "no wet days" when Tips ask for rain protection', () => {
  const w = wearFacts({ ...DUBAI, packing: [{ key: 'rain' }, { key: 'sun' }], f: { ...DUBAI.f, rain: { days: 1, size: 'heavy', perDay: 70 } } });
  assert.equal(w.wetWeek, 1);
  assert.ok(w.items.includes('rainJacket'));
});

test('bands use the Tips thresholds', () => {
  assert.equal(wearBand(4, -1, null), 'winter');
  assert.equal(wearBand(8, 2, 'snow'), 'winter');
  assert.equal(wearBand(11, 6, null), 'cold');
  assert.equal(wearBand(16, 4, null), 'cold');
  assert.equal(wearBand(16, 8, null), 'mild');
  assert.equal(wearBand(26, 15, null), 'warm');
  assert.equal(wearBand(38, 18, null), 'warm');
  assert.equal(wearBand(31, 25, null), 'hot');
});

test('year wording fits the city: no "cold year" where even the coolest is warm', () => {
  const y = (cold) => wearFacts({ ...LONDON, row: { avg_high: 30, avg_low: 18, rainy_days: 3 }, history: history(cold, 2010, 33, 2020) }).year.kind;
  assert.equal(y(14), 'normal');
  assert.equal(y(20), 'cooler');
  assert.equal(y(29), 'hot');
});

test('a tied record year drops the year sentence, not the block', () => {
  const w = wearFacts({ ...LONDON, history: history(5.9, null, 12.9, 2017) });
  assert.equal(w.year, null);
  assert.ok(w.items.length > 0);
});

test('no history facts (thin or flagged data): no wear block', () => {
  assert.equal(wearFacts({ ...LONDON, history: null }), null);
});

// ── Guard: flagged shehar-mahina par dono blocks nahi ───
const rows = Array.from({ length: 20 }, (_, i) => [2006 + i, 3, 10, 50, 10]);
const headline = { avg_high: 10, avg_rainfall: 50, rainy_days: 10 };

test('guard: a flagged month hides the block, others in the same city stay', () => {
  assert.ok(monthHistoryFacts({ rows, monthNum: 3, headline, flagged: [] }));
  assert.ok(monthHistoryFacts({ rows, monthNum: 3, headline, flagged: [1, 7] }));
  assert.equal(monthHistoryFacts({ rows, monthNum: 3, headline, flagged: [3] }), null);
});
