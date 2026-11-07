// ─────────────────────────────────────────────────────────────
//  Step 6: "What to wear" + data-quality guard + Latest grammar. Asli local data, server HTML.
//  London July local par saaf hai; London March aur New York January flagged hain.
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';

async function open(browser, baseURL, path) {
  const context = await browser.newContext({ javaScriptEnabled: false, locale: 'en-GB' });
  const page = await context.newPage();
  await page.goto(`${baseURL}${path}`);
  return { page, close: () => context.close() };
}

const JULY = '/weather/united-kingdom/london/july';

test('placement: right after Tips, right before Quick questions', async ({ browser, baseURL }) => {
  const { page, close } = await open(browser, baseURL, JULY);
  const h2 = await page.locator('main h2').allInnerTexts();
  const at = h2.indexOf('What to wear in London in July');
  expect(at).toBeGreaterThan(0);
  expect(h2[at - 1]).toBe('Tips for visiting London in July');
  expect(h2[at + 1]).toBe('Quick questions');
  await close();
});

test('time of day uses the owner formula, from the page numbers', async ({ browser, baseURL }) => {
  const { page, close } = await open(browser, baseURL, '/weather/iceland/reykjavik/january');
  const main = await page.locator('main').innerText();
  const hi = Number(/Avg high\s+(-?[\d.]+)°C/.exec(main)[1]);
  const lo = Number(/Avg low\s+(-?[\d.]+)°C/.exec(main)[1]);
  const block = page.locator('section', { has: page.getByRole('heading', { name: 'What to wear in Reykjavik in January' }) });
  const text = await block.innerText();
  const near = (label, want) => {
    const got = Number(new RegExp(`${label}, around (-?\\d+)°C`).exec(text)[1]);
    expect(Math.abs(got - want)).toBeLessThanOrEqual(0.6);
  };
  near('Morning', lo + 0.2 * (hi - lo));
  near('Afternoon', hi);
  near('Evening', lo + 0.5 * (hi - lo));
  expect(text).toMatch(/monthly averages/);
  expect(text).toMatch(/as rain or snow/);
  expect(text).toMatch(/boots with grip/i);
  await expect(block.locator('h3')).toHaveText(['By time of day', 'Cold year or mild year', 'Packing for 7 days']);
  await close();
});

test('the Trip Planner line reuses the old href, and no other link is added', async ({ browser, baseURL }) => {
  const { page, close } = await open(browser, baseURL, JULY);
  const block = page.locator('section', { has: page.getByRole('heading', { name: 'What to wear in London in July' }) });
  await expect(block.locator('a')).toHaveCount(1);
  await expect(block.locator('a')).toHaveAttribute('href', '/trip-planner?city=london');
  await expect(block.locator('a')).toHaveText('Check your exact dates in the Trip Planner.');
  await close();
});

test('FAQ wording: layer for mornings and evenings, no fixed evening number', async ({ browser, baseURL }) => {
  const { page, close } = await open(browser, baseURL, '/weather/iceland/reykjavik/january');
  const text = await page.locator('main').innerText();
  expect(text).toMatch(/plus a layer for cold mornings and evenings\./);
  expect(text).not.toMatch(/evenings near/);
  await close();
});

test('all 6 languages show the wear block', async ({ browser, baseURL }) => {
  const want = {
    '': 'What to wear in London in July',
    '/de': 'Was man im Juli in London anziehen sollte',
    '/fr': 'Que porter à Londres en juillet',
    '/it': 'Cosa indossare a Londra a luglio',
    '/es': 'Qué ropa llevar a Londres en julio',
    '/ja': '7月のロンドンの服装',
  };
  for (const [prefix, h2] of Object.entries(want)) {
    const { page, close } = await open(browser, baseURL, `${prefix}${JULY}`);
    await expect(page.getByRole('heading', { level: 2, name: h2, exact: true })).toHaveCount(1);
    await close();
  }
});

for (const [path, cityMonth, tips] of [
  ['/weather/united-kingdom/london/march', ['March in London: what 20 years show', 'What to wear in London in March'], 'Tips for visiting London in March'],
  ['/weather/united-states/new-york/january', ['January in New York: what 20 years show', 'What to wear in New York in January'], 'Tips for visiting New York in January'],
]) {
  test(`guard: flagged data hides both blocks, the rest stays: ${path}`, async ({ browser, baseURL }) => {
    const { page, close } = await open(browser, baseURL, path);
    const h2 = await page.locator('main h2').allInnerTexts();
    for (const hidden of cityMonth) expect(h2).not.toContain(hidden);
    expect(h2).toContain(tips);
    expect(h2).toContain('Quick questions');
    await close();
  });
}

test('Latest actual line: "1 day", never "1 days"', async ({ browser, baseURL }) => {
  const { page, close } = await open(browser, baseURL, JULY);
  const text = await page.locator('main').innerText();
  expect(text).toMatch(/Latest actual — July 2026:.* mm rain on 1 day \(/);
  expect(text).not.toMatch(/\b1 days\b/);
  await close();
});

test('Latest actual line in the other languages: singular', async ({ browser, baseURL }) => {
  const want = { '/de': /an 1 Tag\b/, '/fr': /sur 1 jour\b/, '/it': /in 1 giorno\b/, '/es': /en 1 día\b/ };
  for (const [prefix, re] of Object.entries(want)) {
    const { page, close } = await open(browser, baseURL, `${prefix}${JULY}`);
    expect(await page.locator('main').innerText()).toMatch(re);
    await close();
  }
});
