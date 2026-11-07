// ─────────────────────────────────────────────────────────────
//  Backend band ya dheema (Step 2, Nov 2026). Sirf local, stub ke saath:
//    node tests/fixtures/backend-stub.mjs     (127.0.0.1:8100 → local Django 8000)
//    OUTAGE_GATE=1 OUTAGE_SELF_ORIGIN=http://127.0.0.1:3100 BACKEND_TIMEOUT_MS=2000 \
//      API_INTERNAL_URL=http://127.0.0.1:8100/api next start -p 3100
//    OUTAGE_STUB_URL=http://127.0.0.1:8100 PW_BASE_URL=http://localhost:3100 \
//      npx playwright test tests/e2e/outage.spec.mjs
//  Stub na ho to skip.
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';

const STUB = process.env.OUTAGE_STUB_URL;
const WARM = '/weather/germany/berlin/may';
// Har run par naya page, taake sach mein kabhi cache na hua ho
const coldPage = () => `/weather/japan/tokyo/${['january', 'february', 'june', 'july', 'august', 'september', 'december'][Math.floor(Math.random() * 7)]}`;

const setStub = (request, body) => request.post(`${STUB}/__set`, { data: body });
const probeNotices = async (request) => {       // proxy ka probe 10 s mein ek dafa
  await new Promise((r) => setTimeout(r, 10_500));
  await request.get('/about');
  await new Promise((r) => setTimeout(r, 2_500));
};

test.describe.configure({ mode: 'serial' });
test.skip(!STUB, 'OUTAGE_STUB_URL set nahi');

test.afterAll(async ({ request }) => {
  if (STUB) await setStub(request, { mode: 'ok', failMatch: null });
});

const urlCount = async (request, path) => ((await (await request.get(path)).text()).match(/<loc>/g) || []).length;

// Pehla test: naye server par (saaf fetch cache) yahan asal 503 milta hai. Data cache ho to 200 poori list.
test('sitemap during an outage: 503 + Retry-After or the full last good list, never a partial one', async ({ request }) => {
  test.setTimeout(240_000);
  await setStub(request, { mode: 'down', failMatch: null });
  const down = {};
  for (const path of ['/sitemap.xml', '/sitemap/places.xml', '/sitemap/months-1.xml', '/sitemap/blog.xml']) {
    const r = await request.get(path);
    down[path] = { status: r.status(), urls: (await r.text()).match(/<loc>/g)?.length || 0 };
    if (r.status() !== 200) {
      expect(r.status(), path).toBe(503);
      expect(r.headers()['retry-after'], path).toBe('300');
      expect(r.headers()['cache-control'], path).toBe('no-store');
    }
  }
  await setStub(request, { mode: 'ok', failMatch: null });
  expect((await request.get('/sitemap.xml')).status()).toBe(200);      // 503 cache nahi hua
  for (const [path, seen] of Object.entries(down)) {
    if (seen.status === 200) expect(seen.urls, `${path}: adhoori list`).toBe(await urlCount(request, path));
  }
  expect(await urlCount(request, '/sitemap/places.xml')).toBeGreaterThan(50);
});

for (const mode of ['down', 'slow']) {
  test(`backend ${mode}: cached page 200, new page 503 + Retry-After, nothing bad cached`, async ({ request }) => {
    test.setTimeout(120_000);
    await setStub(request, { mode: 'ok', failMatch: null });
    await probeNotices(request);
    expect((await request.get(WARM)).status()).toBe(200);

    await setStub(request, { mode, delayMs: 4000 });
    await probeNotices(request);

    const warm = await request.get(WARM);
    expect(warm.status()).toBe(200);
    expect(await warm.text()).toContain('Berlin Weather in May');

    // Isi run mein pehle cache ho chuka page chhor kar pehla sach mein thanda page
    let cold;
    let path;
    for (let i = 0; i < 7; i += 1) {
      path = coldPage();
      cold = await request.get(path);
      if (cold.status() !== 200) break;
    }
    expect(cold.status()).toBe(503);
    expect(cold.headers()['retry-after']).toBe('120');
    expect(cold.headers()['cache-control']).toBe('no-store');

    const planner = await request.get('/trip-planner?city=london');
    expect(planner.status()).toBe(200);

    await setStub(request, { mode: 'ok' });
    await probeNotices(request);
    const back = await request.get(path);       // 503 cache nahi hua
    expect(back.status()).toBe(200);
    expect(back.headers()['retry-after']).toBeUndefined();
  });
}

test('database city during an outage is 503, never a cached 404', async ({ request }) => {
  test.setTimeout(120_000);
  await setStub(request, { mode: 'down' });
  await probeNotices(request);
  const path = '/weather/japan/sapporo/october';
  await request.post('/api/revalidate', { data: { tags: ['cities'] }, headers: { Authorization: `Bearer ${process.env.REVALIDATE_SECRET}` } });
  expect((await request.get(path)).status()).toBe(503);
  await setStub(request, { mode: 'ok' });
  await probeNotices(request);
  expect((await request.get(path)).status()).toBe(200);
});

test('secret header: backend up, cached 200, new page 503, wrong header no effect', async ({ request }) => {
  test.setTimeout(60_000);
  test.skip(!process.env.REVALIDATE_SECRET, 'REVALIDATE_SECRET set nahi');
  await setStub(request, { mode: 'ok', failMatch: null });
  const headers = { 'x-outage-test': process.env.REVALIDATE_SECRET };
  expect((await request.get(WARM)).status()).toBe(200);

  const warm = await request.get(WARM, { headers });
  expect(warm.status()).toBe(200);
  expect(warm.headers()['x-outage-test']).toBe('simulated');
  expect(warm.headers()['cache-control']).toBe('no-store');

  // Test page ko cache kar deta hai: is liye har run par ek naya thanda mahina dhoondo
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  let cold;
  for (const m of months.sort(() => Math.random() - 0.5)) {
    cold = await request.get(`/weather/spain/valencia/${m}`, { headers });
    if (cold.status() === 503) break;
  }
  expect(cold.status(), 'sab mahine warm hain: server ka route cache saaf karein').toBe(503);
  expect(cold.headers()['retry-after']).toBe('120');
  expect(cold.headers()['x-outage-test']).toBe('simulated');

  const wrongPath = `/weather/spain/seville/${months[0]}`;
  const wrong = await request.get(wrongPath, { headers: { 'x-outage-test': 'wrong-secret' } });
  expect(wrong.status()).toBe(200);
  expect(wrong.headers()['x-outage-test']).toBeUndefined();
  expect(wrong.headers()['cache-control']).not.toBe('no-store');
});

test('partial failure: a page without the year block is not cached', async ({ request }) => {
  test.setTimeout(60_000);
  const path = `/weather/italy/rome/${['january', 'february', 'march'][Math.floor(Math.random() * 3)]}`;
  await setStub(request, { mode: 'ok', failMatch: 'climate/years' });
  const broken = await request.get(path);
  await setStub(request, { mode: 'ok', failMatch: null });
  const page = await request.get(path);
  expect(page.status()).toBe(200);
  // Rome ka data pehle se cache ho to pehli request bhi poori hoti hai; dono haal mein aakhri page poora
  expect([200, 500]).toContain(broken.status());
  expect(await page.text()).toMatch(/20 years/i);
});
