// Din-raat ka farq aur FAQ ka shaam wala mashwara ek hi sach (utils/monthNarrative.js)
// Chalana:  node --test tests/unit/monthSwing.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { eveningAdvice, swingBand } from '../../utils/monthNarrative.js';
import { monthPacking } from '../../utils/climateMath.js';

test('cold city with a real swing is not called small (London March 10.7 / 3.1)', () => {
  assert.equal(swingBand(10.7, 3.1), 'moderate');
  assert.equal(eveningAdvice('moderate', 3.1), 'cool');
});

test('modest swing in a cold or mild city (Reykjavik October, Sydney January)', () => {
  assert.equal(swingBand(6.4, 2.3), 'small');
  assert.equal(eveningAdvice('small', 2.3), 'cool');
  assert.equal(swingBand(26.1, 19.6), 'moderate');
  assert.equal(eveningAdvice('moderate', 19.6), 'cool');
});

test('really small swing keeps "evenings feel similar" (Singapore 29.3 / 25.6)', () => {
  assert.equal(swingBand(29.3, 25.6), 'tiny');
  assert.equal(eveningAdvice('tiny', 25.6), 'same');
});

test('hot city with a wide swing: warm after dark, never "evenings feel similar" (Dubai July, Cairo July)', () => {
  assert.equal(swingBand(42.8, 29.6), 'big');
  assert.equal(eveningAdvice('big', 29.6), 'warm');
  assert.equal(swingBand(37.6, 22.4), 'big');
  assert.equal(eveningAdvice('big', 22.4), 'warm');
});

test('band edges', () => {
  assert.equal(swingBand(13.9, 10), 'tiny');
  assert.equal(swingBand(14, 10), 'small');
  assert.equal(swingBand(16.4, 10), 'small');
  assert.equal(swingBand(16.5, 10), 'moderate');
  assert.equal(swingBand(21.9, 10), 'moderate');
  assert.equal(swingBand(22, 10), 'big');
  assert.equal(swingBand(null, 10), null);
});

test('FAQ never says "no change for the evening" while Tips suggest layers', () => {
  // Cairo October (31.1 / 18.7), Bangkok January (31.0 / 21.8): pehle takrate the
  for (const [hi, lo] of [[31.1, 18.7], [31, 21.8], [24.2, 13.7], [25.7, 15.9], [33, 21.9]]) {
    const layers = monthPacking({ avg_high: hi, avg_low: lo }).some((p) => p.key === 'layers');
    assert.equal(layers, true, `${hi}/${lo}`);
    assert.equal(eveningAdvice(swingBand(hi, lo), lo), 'cool', `${hi}/${lo}`);
  }
});

test('every number combination gets a consistent answer', () => {
  for (let lo = -20; lo <= 32; lo += 1) {
    for (let d = 0; d <= 22; d += 1) {
      const band = swingBand(lo + d, lo);
      const advice = eveningAdvice(band, lo);
      if (advice === 'same') assert.ok(d < 4, `same at swing ${d}`);
      if (advice === 'warm') assert.ok(lo >= 22, `warm at low ${lo}`);
      const layers = monthPacking({ avg_high: lo + d, avg_low: lo }).some((p) => p.key === 'layers');
      if (layers) assert.equal(advice, 'cool', `layers tip at ${lo + d}/${lo}`);
    }
  }
});
