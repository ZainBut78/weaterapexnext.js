// BFF whitelist, params, per-IP hadd (utils/siteBff.js)
// Chalana:  node --test tests/unit/siteBff.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter, matchSiteRoute, perMinuteFromEnv, pickParams, SITE_ROUTES } from '../../utils/siteBff.js';

const params = (s) => new URLSearchParams(s);

test('whitelisted paths match', () => {
  assert.equal(matchSiteRoute(['weather', 'current']).backend, '/weather/current/');
  assert.equal(matchSiteRoute(['trips', 'plan']).backend, '/trips/plan/');
  assert.equal(matchSiteRoute(['trips', 'plan', 'recommend']).backend, '/trips/plan/recommend/');
  assert.equal(matchSiteRoute(['trips', 'plan', 'cities', 'search']).backend, '/trips/plan/cities/search/');
  assert.equal(matchSiteRoute(['events', 'risk']).backend, '/events/risk/');
});

test('everything else is refused: no open proxy', () => {
  for (const segs of [[], ['auth', 'login'], ['auth', 'keys'], ['weather'], ['weather', 'cities'], ['weather', 'history'],
    ['weather', 'places', 'open'], ['blog', 'posts'], ['v1', 'trips', 'plan'], ['admin'], ['..', 'admin'],
    ['weather', 'current', '..', '..', 'auth'], ['constructor'], ['__proto__'], ['toString'], null]) {
    assert.equal(matchSiteRoute(segs), null, JSON.stringify(segs));
  }
});

test('backend targets are fixed strings, none comes from the request', () => {
  for (const r of Object.values(SITE_ROUTES)) assert.match(r.backend, /^\/[a-z/]+\/$/);
});

test('user-specific routes are never cached; cached routes never get the token', () => {
  for (const [name, r] of Object.entries(SITE_ROUTES)) {
    assert.ok(!(r.cacheSeconds && r.forwardAuth), name);
  }
  for (const name of ['trips/plan', 'trips/plan/recommend', 'events/risk']) {
    assert.equal(SITE_ROUTES[name].cacheSeconds, undefined, name);
    assert.equal(SITE_ROUTES[name].forwardAuth, true, name);
  }
});

test('only allowed params go through', () => {
  const qs = pickParams(SITE_ROUTES['trips/plan'], params('city=Paris&start=2030-01-01&end=2030-01-05&api_key=x&format=csv'));
  assert.equal(qs, 'city=Paris&start=2030-01-01&end=2030-01-05');
});

test('values are trimmed, capped and cleaned', () => {
  const r = SITE_ROUTES['events/risk'];
  assert.equal(new URLSearchParams(pickParams(r, params(`city=${'x'.repeat(500)}`))).get('city').length, 100);
  assert.equal(new URLSearchParams(pickParams(r, params('city=%20Par%0Ais%00%20'))).get('city'), 'Paris');
});

test('cached routes normalise case so one key serves everyone', () => {
  assert.equal(pickParams(SITE_ROUTES['weather/current'], params('city=LonDon')), 'city=london');
  assert.equal(pickParams(SITE_ROUTES['trips/plan'], params('city=LonDon')), 'city=LonDon');
});

test('non-Latin city names survive', () => {
  assert.equal(new URLSearchParams(pickParams(SITE_ROUTES['weather/current'], params('city=東京'))).get('city'), '東京');
});

test('rate limit: per IP, resets after a minute, says how long to wait', () => {
  let t = 1000;
  const lim = createRateLimiter(2, () => t);
  assert.equal(lim.hit('a'), 0);
  assert.equal(lim.hit('a'), 0);
  t += 15000;
  assert.equal(lim.hit('a'), 45);
  assert.equal(lim.hit('b'), 0);
  t += 45000;
  assert.equal(lim.hit('a'), 0);
});

test('rate limit: old entries are dropped, memory stays bounded', () => {
  let t = 0;
  const lim = createRateLimiter(1, () => t);
  for (let i = 0; i < 10001; i += 1) lim.hit(`ip${i}`);
  t = 61000;
  assert.equal(lim.hit('fresh'), 0);
  assert.equal(lim.hit('fresh') > 0, true);
});

test('env values: bad ones use the default', () => {
  assert.equal(perMinuteFromEnv('50', 120), 50);
  for (const v of [undefined, '', 'abc', '0', '-5', '1.5']) assert.equal(perMinuteFromEnv(v, 120), 120, String(v));
});
