// Backend band: 503 + Retry-After ya cached page (utils/outageGate.js). Koi network nahi.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createProbe, GATE_HEADER, healthUrl, isOutageTest, serveDuringOutage, shouldGate, TEST_HEADER, unavailable } from '../../utils/outageGate.js';

const req = (url = 'https://weatherapex.com/weather/x/y?a=1', { method = 'GET', headers = {} } = {}) => new Request(url, { method, headers });
const respond = (status, body = 'page', headers = {}) => async () => new Response(status === 304 ? null : body, { status, headers });
const options = (fetchImpl) => ({ selfOrigin: 'http://127.0.0.1:3000', fetchImpl });

test('healthUrl drops /api and checks the database', () => {
  assert.equal(healthUrl('https://api.weatherapex.com/api'), 'https://api.weatherapex.com/health/db/');
  assert.equal(healthUrl('http://127.0.0.1:8000/api/'), 'http://127.0.0.1:8000/health/db/');
});

test('test header: only the exact secret counts', () => {
  const withHeader = (value) => req(undefined, { headers: { [TEST_HEADER]: value } });
  assert.equal(isOutageTest(withHeader('s3cret'), 's3cret'), true);
  assert.equal(isOutageTest(withHeader('wrong!'), 's3cret'), false);
  assert.equal(isOutageTest(withHeader('s3cret-longer'), 's3cret'), false);
  assert.equal(isOutageTest(req(), 's3cret'), false);
  assert.equal(isOutageTest(withHeader('anything'), ''), false);
  assert.equal(isOutageTest(withHeader('anything'), undefined), false);
});

test('simulate: a page that had to be built is 503, a cached one is 200, neither is cacheable', async () => {
  const simulate = (cache) => serveDuringOutage(req(), {
    ...options(respond(200, 'page', { 'x-nextjs-cache': cache, 'cache-control': 's-maxage=3600' })), simulate: true,
  });
  const cold = await simulate('MISS');
  assert.equal(cold.status, 503);
  assert.equal(cold.headers.get('retry-after'), '120');
  assert.equal(cold.headers.get(TEST_HEADER), 'simulated');
  for (const cache of ['HIT', 'STALE']) {
    const warm = await simulate(cache);
    assert.equal(warm.status, 200);
    assert.equal(warm.headers.get('cache-control'), 'no-store');
    assert.equal(warm.headers.get(TEST_HEADER), 'simulated');
  }
});

test('simulate: the secret is never sent on the inner request', async () => {
  let seen;
  await serveDuringOutage(req(undefined, { headers: { [TEST_HEADER]: 's3cret' } }), {
    ...options(async (_url, init) => { seen = init.headers; return new Response('x'); }), simulate: true,
  });
  assert.equal(seen[TEST_HEADER], undefined);
  assert.equal(seen[GATE_HEADER], '1');
});

test('without simulate a MISS passes through as it is', async () => {
  const r = await serveDuringOutage(req(), options(respond(200, 'page', { 'x-nextjs-cache': 'MISS' })));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get(TEST_HEADER), null);
});

test('503 carries Retry-After and is never cacheable', async () => {
  const r = unavailable();
  assert.equal(r.status, 503);
  assert.equal(r.headers.get('retry-after'), '120');
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.ok((await r.text()).length > 0);
});

test('a cached page passes through untouched', async () => {
  const r = await serveDuringOutage(req(), options(respond(200, '<html>old</html>', { 'x-nextjs-cache': 'STALE', 'content-encoding': 'gzip' })));
  assert.equal(r.status, 200);
  assert.equal(await r.text(), '<html>old</html>');
  assert.equal(r.headers.get('x-nextjs-cache'), 'STALE');
  assert.equal(r.headers.get('content-encoding'), null);
});

test("the inner request's proxy headers never go back to Next", async () => {
  const r = await serveDuringOutage(req(), options(respond(200, 'x', { 'x-middleware-rewrite': '/en/about', 'x-middleware-next': '1', vary: 'rsc' })));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-middleware-rewrite'), null);
  assert.equal(r.headers.get('x-middleware-next'), null);
  assert.equal(r.headers.get('vary'), 'rsc');
});

test('a real 404 and a redirect stay as they are', async () => {
  assert.equal((await serveDuringOutage(req(), options(respond(404)))).status, 404);
  const r = await serveDuringOutage(req(), options(respond(308, '', { location: '/weather' })));
  assert.equal(r.status, 308);
  assert.equal(r.headers.get('location'), '/weather');
});

test('a never cached page (500) becomes 503', async () => {
  const r = await serveDuringOutage(req(), options(respond(500)));
  assert.equal(r.status, 503);
  assert.equal(r.headers.get('retry-after'), '120');
});

test('the server not answering becomes 503', async () => {
  const r = await serveDuringOutage(req(), options(async () => { throw new Error('refused'); }));
  assert.equal(r.status, 503);
});

test('the inner request goes to our own server, marked, keeping path and query', async () => {
  let seen;
  await serveDuringOutage(req(undefined, { headers: { 'user-agent': 'Googlebot' } }), options(async (url, init) => {
    seen = { url, init };
    return new Response('x');
  }));
  assert.equal(seen.url, 'http://127.0.0.1:3000/weather/x/y?a=1');
  assert.equal(seen.init.headers[GATE_HEADER], '1');
  assert.equal(seen.init.headers['user-agent'], 'Googlebot');
  assert.equal(seen.init.redirect, 'manual');
});

test('shouldGate: page loads only, never the inner request', () => {
  assert.equal(shouldGate(req()), true);
  assert.equal(shouldGate(req(undefined, { method: 'HEAD' })), true);
  assert.equal(shouldGate(req(undefined, { method: 'POST' })), false);
  assert.equal(shouldGate(req(undefined, { headers: { [GATE_HEADER]: '1' } })), false);
  assert.equal(shouldGate(req(undefined, { headers: { rsc: '1' } })), false);
  assert.equal(shouldGate(req(undefined, { headers: { 'next-router-prefetch': '1' } })), false);
});

test('probe: starts up, never blocks, flips on failure and recovers', async () => {
  let t = 0;
  let status = 200;
  let calls = 0;
  const probe = createProbe({
    url: 'x', now: () => t, everyMs: 10,
    fetchImpl: async () => { calls += 1; if (status === 0) throw new Error('down'); return new Response('', { status }); },
  });
  assert.equal(probe.isUp(), true);     // pehli request intezar nahi karti
  await new Promise((r) => setImmediate(r));
  assert.equal(calls, 1);
  assert.equal(probe.isUp(), true);     // 10 ms nahi guzre: dobara probe nahi
  assert.equal(calls, 1);
  status = 0;
  await probe.run();
  assert.equal(probe.isUp(), false);
  status = 503;
  await probe.run();
  assert.equal(probe.isUp(), false);
  status = 200;
  await probe.run();
  assert.equal(probe.isUp(), true);
});

test('probe: only one at a time', async () => {
  let t = 100;
  let calls = 0;
  let release;
  const probe = createProbe({ url: 'x', now: () => t, everyMs: 1, fetchImpl: () => { calls += 1; return new Promise((r) => { release = r; }); } });
  probe.isUp();
  t += 50;
  probe.isUp();
  assert.equal(calls, 1);
  release(new Response(''));
});
