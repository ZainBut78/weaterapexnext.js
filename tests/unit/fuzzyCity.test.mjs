// Shehar search — har zaban ke naam + spelling ki ghalti (utils/fuzzyCity.js)
// Chalana:  node --test tests/unit/fuzzyCity.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalCityName, exactCity, matchCities, normalizeText } from '../../utils/fuzzyCity.js';

const top = (q, opts) => matchCities(q, opts)[0]?.slug;

test('English names still work (exact, prefix, typo)', () => {
  assert.equal(exactCity('London').slug, 'london');
  assert.equal(top('barcel'), 'barcelona');
  assert.equal(top('pheonix'), 'phoenix');
  assert.equal(top('new yrok'), 'new-york');
  assert.equal(top('NEW YORK'), 'new-york');
});

test('localized names find the same city (de/it/fr/es)', () => {
  assert.equal(exactCity('Londra').slug, 'london');
  assert.equal(exactCity('Londres').slug, 'london');
  assert.equal(exactCity('München').slug, 'munich');
  assert.equal(exactCity('Munchen').slug, 'munich');       // bina umlaut
  assert.equal(exactCity('Köln').slug, 'cologne');
  assert.equal(exactCity('Roma').slug, 'rome');
  assert.equal(exactCity('Parigi').slug, 'paris');
  assert.equal(exactCity('lisboa').slug, 'lisbon');
  assert.equal(exactCity('Den Haag').slug, 'the-hague');
});

test('localized names with spelling mistakes', () => {
  assert.equal(top('Londrra'), 'london');
  assert.equal(top('Barcelone'), 'barcelona');
  assert.equal(top('Muenchen'), 'munich');
  assert.equal(top('Firenzee'), 'florence');
  assert.equal(top('Lisbonne'), 'lisbon');
});

test('Japanese: kanji, katakana, hiragana, full-width, middle dot', () => {
  assert.equal(exactCity('ロンドン').slug, 'london');
  assert.equal(exactCity('ﾛﾝﾄﾞﾝ').slug, 'london');           // half-width katakana
  assert.equal(exactCity('ろんどん').slug, 'london');         // hiragana
  assert.equal(top('ミュン'), 'munich');                      // adhoora
  assert.equal(top('ロソドン'), 'london');                    // ek harf ghalat
  assert.equal(exactCity('Ｌｏｎｄｏｎ').slug, 'london');      // full-width Latin
  assert.ok(normalizeText('東京').length === 2, 'kanji khaali na ho');
  assert.equal(exactCity('東京').slug, 'tokyo');
  assert.equal(exactCity('とうきょう').slug, 'tokyo');        // kanji ki kana reading
  assert.equal(exactCity('トウキョウ').slug, 'tokyo');
  assert.equal(exactCity('おおさか').slug, 'osaka');
  assert.equal(exactCity('にゅーよーく').slug, 'new-york');
});

test('result: name stays English, label follows the language', () => {
  const [r] = matchCities('Londra', { lang: 'it' });
  assert.equal(r.name, 'London');
  assert.equal(r.label, 'Londra');
  assert.equal(matchCities('London', { lang: 'ja' })[0].label, 'ロンドン');
  assert.equal(matchCities('London', { lang: 'en' })[0].label, 'London');
});

test('canonicalCityName → English for the backend, else unchanged', () => {
  assert.equal(canonicalCityName('ロンドン'), 'London');
  assert.equal(canonicalCityName('  Londra '), 'London');
  assert.equal(canonicalCityName('barcelna'), 'barcelna');    // ghalti khud theek nahi — "Did you mean" dikhata hai
  assert.equal(canonicalCityName('Monaco di Bav'), 'Munich');  // adhoora, sirf ek shehar
  assert.equal(canonicalCityName('san'), 'san');               // kai shehar (San Diego, San Juan…) → jaisa likha
  assert.equal(canonicalCityName('Tulum'), 'Tulum');           // list mein nahi → jaisa likha
  assert.equal(canonicalCityName('xyzzy'), 'xyzzy');
});

test('no junk: very short or unrelated queries', () => {
  assert.deepEqual(matchCities('a'), []);
  assert.deepEqual(matchCities('   '), []);
  assert.deepEqual(matchCities('qqqqqqqq'), []);
  // sahi naam mil gaya to spelling wale andaze nahi
  assert.ok(matchCities('Zurich').every((r) => r.kind !== 'fuzzy'));
});
