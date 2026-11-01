// DB ke naye shehron ke naam doosri zabanon mein (backend `names`, Nov 2026)
// Chalana:  node --test tests/unit/cityNames.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cityName, inCity } from '../../i18n/places.js';
import { buildRegistry } from '../../utils/cityRegistryCore.js';

const row = { slug: 'sapporo', name: 'Sapporo', country: 'Japan', lat: 43.06, lon: 141.35,
  history_complete: true, names: { ja: '札幌', de: 'Sapporo' } };

test('registry keeps backend names; cityName(lang, city) uses them', () => {
  const reg = buildRegistry([row]);
  const city = reg.get('sapporo');
  assert.deepEqual(city.names, { ja: '札幌', de: 'Sapporo' });
  assert.equal(cityName('ja', city), '札幌');
  assert.equal(cityName('it', city), 'Sapporo');     // zaban nahi → English
  assert.equal(cityName('en', city), 'Sapporo');
  assert.equal(inCity('de', city), 'in Sapporo');
});

test('curated names still win; old 3-argument form unchanged', () => {
  assert.equal(cityName('ja', { slug: 'london', name: 'London', names: { ja: 'X' } }), 'ロンドン');
  assert.equal(cityName('ja', 'london', 'London'), 'ロンドン');
  assert.equal(cityName('en', 'london', 'London'), 'London');
  const reg = buildRegistry([{ ...row, names: undefined }]);
  assert.equal(cityName('ja', reg.get('sapporo')), 'Sapporo');
});
