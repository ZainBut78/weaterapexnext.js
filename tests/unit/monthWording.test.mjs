// Step 2: jumlon ke bands data se (utils/monthNarrative.js, utils/climateMath.js)
// Chalana:  node --test tests/unit/monthWording.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { dayLengthBand, relativeToYear, warmthPosition, wintryBand } from '../../utils/monthNarrative.js';
import { monthPacking, monthRanks, monthSuits, visitVerdict } from '../../utils/climateMath.js';

const year = (highs) => highs.map((avg_high, i) => ({ month: i + 1, avg_high, humidity: 70, sunshine_hours: 6 }));
const LONDON = year([7.4, 8, 10.7, 14.1, 17.5, 20.5, 22.3, 22, 19, 15.3, 10.8, 8]);

test('warmth position: peak, trough, near the peak, near the bottom, middle', () => {
  assert.equal(warmthPosition(LONDON, 7).key, 'peak');
  assert.equal(warmthPosition(LONDON, 1).key, 'trough');
  assert.equal(warmthPosition(LONDON, 8).key, 'nearPeak');
  assert.equal(warmthPosition(LONDON, 2).key, 'nearTrough');
  const march = warmthPosition(LONDON, 3);
  assert.equal(march.key, 'middle');
  assert.equal(march.peakNum, 7);
  assert.ok(Math.abs(march.delta - 11.6) < 0.01);
});

test('warmth position: a city with no real seasons is flat', () => {
  assert.equal(warmthPosition(year([28, 28.5, 29, 29.3, 29, 29, 28.9, 28.9, 29, 28.9, 28.5, 28]), 4).key, 'flat');
});

test('warmth position: missing months give nothing', () => {
  assert.equal(warmthPosition(LONDON.slice(0, 6), 3), null);
});

test('snow vs rain: only when it is really cold, and only with some wet days', () => {
  assert.equal(wintryBand({ avg_high: -5.4, avg_low: -10.3, rainy_days: 10 }), 'snow');
  assert.equal(wintryBand({ avg_high: 1.6, avg_low: -2.9, rainy_days: 19 }), 'snow');
  assert.equal(wintryBand({ avg_high: 5, avg_low: 0.5, rainy_days: 17 }), 'mixed');
  assert.equal(wintryBand({ avg_high: 6.1, avg_low: 0.8, rainy_days: 17 }), null);
  assert.equal(wintryBand({ avg_high: 10.7, avg_low: 3.1, rainy_days: 11 }), null);
  assert.equal(wintryBand({ avg_high: -5, avg_low: -10, rainy_days: 0 }), null);
});

test('relative to the city\'s own year', () => {
  const rows = year(new Array(12).fill(10)).map((r, i) => ({ ...r, humidity: i === 0 ? 90 : 70 }));
  assert.equal(relativeToYear(rows, 'humidity', 1, 5), 'above');
  assert.equal(relativeToYear(rows, 'humidity', 2, 5), 'same');
  const dry = rows.map((r, i) => ({ ...r, humidity: i === 0 ? 40 : 70 }));
  assert.equal(relativeToYear(dry, 'humidity', 1, 5), 'below');
});

test('day length bands', () => {
  assert.equal(dayLengthBand(500), 'short');
  assert.equal(dayLengthBand(720), 'normal');
  assert.equal(dayLengthBand(900), 'long');
  assert.equal(dayLengthBand(null), null);
});

test('Option B: 15+ rainy days means no Sunglasses tip and no "plenty of sunshine"', () => {
  const wet = { avg_high: 25.1, avg_low: 16.4, rainy_days: 28, avg_rainfall: 283, sunshine_hours: 8.6 };
  assert.equal(monthPacking(wet).some((p) => p.key === 'shades'), false);
  assert.equal(monthPacking(wet).some((p) => p.key === 'shoes'), true);
  assert.equal(visitVerdict(wet).reasons.some((r) => r.key === 'sunny'), false);
  const dry = { ...wet, rainy_days: 9, avg_rainfall: 40 };
  assert.equal(monthPacking(dry).some((p) => p.key === 'shades'), true);
  assert.equal(monthPacking(dry).some((p) => p.key === 'shoes'), false);
  assert.equal(monthPacking(wet).length, monthPacking({ ...dry, rainy_days: 14, avg_rainfall: 70 }).length);
  assert.equal(visitVerdict(dry).reasons.some((r) => r.key === 'sunny'), true);
});

test('Option B changes the reason text only, never the verdict score or label', () => {
  for (const sun of [7.9, 8, 12]) {
    const a = visitVerdict({ avg_high: 20, avg_low: 10, rainy_days: 15, avg_rainfall: 50, sunshine_hours: sun });
    const b = visitVerdict({ avg_high: 20, avg_low: 10, rainy_days: 15, avg_rainfall: 50, sunshine_hours: 5 });
    assert.equal(a.score, b.score);
    assert.equal(a.label, b.label);
  }
});

test('ties: a month level with the coolest is the coolest, not the 2nd coolest', () => {
  const rows = year([1.5, 2, 3, 5, 8, 11, 14, 13, 9, 6, 3, 1.5]).map((r) => ({ ...r, avg_rainfall: 0 }));
  assert.deepEqual(monthRanks(rows, 1).warmth, { kind: 'coolest', rank: 1 });
  assert.deepEqual(monthRanks(rows, 12).warmth, { kind: 'coolest', rank: 1 });
  assert.deepEqual(monthRanks(rows, 2).warmth, { kind: 'coolest', rank: 3 });
  assert.deepEqual(monthRanks(rows, 7).warmth, { kind: 'warmest', rank: 1 });
});

test('freezing month: verdict says snow or rain, score and label unchanged', () => {
  const cold = { avg_high: 1.5, avg_low: -2.9, rainy_days: 19, avg_rainfall: 147, sunshine_hours: 1.6 };
  const v = visitVerdict(cold);
  assert.ok(v.reasons.some((r) => r.key === 'snow-most' && /snow or rain/.test(r.text)));
  assert.equal(v.reasons.some((r) => r.key === 'rain-most'), false);
  // Same high band, same rain: sirf lafz badalte hain, score aur label nahi
  const wintry = { ...cold, avg_high: 4, avg_low: 1 };
  const plain = { ...cold, avg_high: 4, avg_low: 3 };
  assert.ok(visitVerdict(wintry).reasons.some((r) => r.key === 'snow-most'));
  assert.ok(visitVerdict(plain).reasons.some((r) => r.key === 'rain-most'));
  assert.equal(visitVerdict(wintry).score, visitVerdict(plain).score);
  assert.equal(visitVerdict(wintry).label, visitVerdict(plain).label);
});

test('rainy day grammar in the verdict', () => {
  const text = (n) => visitVerdict({ avg_high: 20, avg_low: 10, rainy_days: n }).reasons.find((r) => r.key === 'dry').text;
  assert.equal(text(0), 'almost no rain');
  assert.equal(text(1), 'mostly dry (about 1 rainy day)');
  assert.equal(text(3), 'mostly dry (about 3 rainy days)');
});

test('parks are "too warm" only in the hot band, not at 26–28°C', () => {
  const parks = (t) => monthSuits({ avg_high: t, rainy_days: 3 }, {}, 7).find((s) => s.key === 'parks');
  assert.equal(parks(26.5).ok, true);
  assert.equal(parks(28).ok, true);
  assert.equal(parks(28.1).whyKey, 'hot');
});
