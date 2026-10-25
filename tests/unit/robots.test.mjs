// Adhoore climate pages → noindex, follow (utils/robots.js)
// Chalana:  node --test tests/unit/robots.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { incompleteRobots } from '../../utils/robots.js';

const NOINDEX = { robots: { index: false, follow: true } };
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

test('complete city page stays indexable', () => {
  assert.deepEqual(incompleteRobots({ months_complete: ALL }), {});
});

test('city page with some months missing → noindex, follow', () => {
  assert.deepEqual(incompleteRobots({ months_complete: [7] }), NOINDEX);
  assert.deepEqual(incompleteRobots({ months_complete: [] }), NOINDEX);
});

test('month page: indexable only when that month is complete', () => {
  assert.deepEqual(incompleteRobots({ months_complete: [7] }, 7), {});
  assert.deepEqual(incompleteRobots({ months_complete: [7] }, 8), NOINDEX);
  assert.deepEqual(incompleteRobots({ months_complete: ALL }, 1), {});
});

test('old backend (no months_complete) → unchanged (indexable)', () => {
  assert.deepEqual(incompleteRobots({ monthly_data: [] }), {});
  assert.deepEqual(incompleteRobots(null, 3), {});
});
