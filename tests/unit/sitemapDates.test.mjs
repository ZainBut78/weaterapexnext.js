// Sitemap lastmod: sirf date, kabhi future nahi (utils/sitemapDates.js)
// Chalana:  node --test tests/unit/sitemapDates.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { dayOnly, newestDay } from '../../utils/sitemapDates.js';

const NOW = Date.UTC(2026, 10, 6, 12);

test('only the date, never a time', () => {
  assert.equal(dayOnly('2026-04-01T08:25:20.957Z', NOW), '2026-04-01');
  assert.equal(dayOnly('2026-04-01', NOW), '2026-04-01');
});

test('never in the future: later dates become today', () => {
  assert.equal(dayOnly('2026-11-07', NOW), '2026-11-06');
  assert.equal(dayOnly('2030-01-01T00:00:00Z', NOW), '2026-11-06');
  assert.equal(dayOnly('2026-11-06', NOW), '2026-11-06');
});

test('bad values', () => {
  assert.equal(dayOnly('not a date', NOW), null);
  assert.equal(newestDay([null, undefined, 'nope'], NOW), null);
});

test('newest of several, skipping empties', () => {
  assert.equal(newestDay(['2026-04-01', null, '2026-10-28T10:00:00Z', '2026-01-01'], NOW), '2026-10-28');
  assert.equal(newestDay(['2026-04-01', '2031-01-01'], NOW), '2026-11-06');
});

test('the same inputs give the same date on every request', () => {
  const a = newestDay(['2026-04-01', '2026-11-01'], NOW);
  const b = newestDay(['2026-04-01', '2026-11-01'], NOW + 86400000 * 30);
  assert.equal(a, b);
});
