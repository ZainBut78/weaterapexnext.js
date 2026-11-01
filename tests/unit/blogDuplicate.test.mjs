// Purane duplicate blog slugs → base slug (utils/blogDuplicate.js)
// Chalana:  node --test tests/unit/blogDuplicate.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { duplicateBlogBase } from '../../utils/blogDuplicate.js';

test('numeric suffix → base slug', () => {
  assert.equal(duplicateBlogBase('/blog/best-time-to-visit-hawaii-2'), 'best-time-to-visit-hawaii');
  assert.equal(duplicateBlogBase('/blog/places-to-visit-in-april-usa-1'), 'places-to-visit-in-april-usa');
  assert.equal(duplicateBlogBase('/blog/good-places-to-visit-in-october-in-usa-0'), 'good-places-to-visit-in-october-in-usa');
});

test('no suffix / other paths → null', () => {
  for (const p of ['/blog/best-time-to-visit-hawaii', '/blog', '/blog/', '/blog/2', '/blog/-2',
    '/blog/a-2/related', '/weather/x-2', '/blog/Hawaii-2', '/blog/x-12345', null]) {
    assert.equal(duplicateBlogBase(p), null, String(p));
  }
});
