// Shehar/mulk ke naam user ki zaban mein — aur ulta (utils/placeLabel.js)
// Chalana:  node --test tests/unit/placeLabel.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalCountryName, cityDisplayName, countryLabel } from '../../utils/placeLabel.js';

test('country typed in any language → backend English name', () => {
  assert.equal(canonicalCountryName('日本'), 'Japan');
  assert.equal(canonicalCountryName('Giappone'), 'Japan');
  assert.equal(canonicalCountryName('Deutschland'), 'Germany');
  assert.equal(canonicalCountryName('  españa '), 'Spain');
  assert.equal(canonicalCountryName('アメリカ'), 'USA');
  assert.equal(canonicalCountryName('United States'), 'USA');
  assert.equal(canonicalCountryName('Royaume-Uni'), 'United Kingdom');
  assert.equal(canonicalCountryName('Atlantis'), 'Atlantis');     // pata nahi → jaisa likha
});

test('backend names shown in the user language', () => {
  assert.equal(countryLabel('Japan', 'ja'), '日本');
  assert.equal(countryLabel('United Kingdom', 'it'), 'Regno Unito');
  assert.equal(countryLabel('Japan', 'en'), 'Japan');
  assert.equal(countryLabel('USA', 'en'), 'USA');                   // English bilkul pehle jaisi
  assert.equal(cityDisplayName('London', 'ja'), 'ロンドン');
  assert.equal(cityDisplayName('London', 'en'), 'London');
  assert.equal(cityDisplayName('Sapporo', 'ja', '札幌'), '札幌');     // list se bahar, kanji mein likha
  assert.equal(cityDisplayName('Warsaw', 'it'), 'Varsavia');            // list mein
  assert.equal(cityDisplayName('Bydgoszcz', 'it', 'bydgoszcz'), 'Bydgoszcz'); // list se bahar, Latin → backend ka naam
  assert.equal(cityDisplayName('Sapporo', 'en', '札幌'), 'Sapporo');
});
