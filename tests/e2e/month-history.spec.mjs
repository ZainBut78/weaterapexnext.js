// ─────────────────────────────────────────────────────────────
//  Step 5: "<Month> in <City>: what 20 years show". Asli local data, server HTML (JS band).
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';
import { oftenOf } from '../../utils/monthNarrative.js';

async function open(browser, baseURL, path) {
  const context = await browser.newContext({ javaScriptEnabled: false, locale: 'en-GB' });
  const page = await context.newPage();
  await page.goto(`${baseURL}${path}`);
  return { page, close: () => context.close() };
}

// London July local par saaf hai; March guard se chhupa hai (month-wear.spec.mjs)
const LONDON = '/weather/united-kingdom/london/july';

test('placement: right after "How July compares", right before "Who July suits"', async ({ browser, baseURL }) => {
  const { page, close } = await open(browser, baseURL, LONDON);
  const h2 = await page.locator('main h2').allInnerTexts();
  const at = h2.indexOf('July in London: what 20 years show');
  expect(at).toBeGreaterThan(0);
  expect(h2[at - 1]).toBe('How July compares to the rest of the year');
  expect(h2[at + 1]).toBe('Who July suits');
  await close();
});

test('wording: monthly averages, warmest July, no daily records, no sunshine records', async ({ browser, baseURL }) => {
  const { page, close } = await open(browser, baseURL, LONDON);
  const block = page.locator('section', { has: page.getByRole('heading', { name: 'July in London: what 20 years show' }) });
  const text = await block.innerText();
  expect(text).toMatch(/Based on monthly averages from 2006–2025, not daily records/);
  expect(text).toMatch(/Warmest July/);
  expect(text).not.toMatch(/warmest day|coldest night|wettest day/i);
  expect(text).not.toMatch(/Sunniest|Dullest/);
  await expect(block.locator('h3')).toHaveText(['Usual range', 'Records', 'Odds across years']);
  await close();
});

test('table: caption, th scope, 4 records', async ({ browser, baseURL }) => {
  const { page, close } = await open(browser, baseURL, LONDON);
  const table = page.locator('section', { has: page.getByRole('heading', { name: 'July in London: what 20 years show' }) }).locator('table');
  await expect(table.locator('caption')).toContainText('2006–2025');
  await expect(table.locator('thead th[scope="col"]')).toHaveCount(5);
  await expect(table.locator('tbody th[scope="row"]')).toHaveCount(4);
  await close();
});

// Rain section number likhta hai ("about 15.7 of 31 days"). Usi number se oftenOf = block ka jumla.
const PHRASE = { most: () => 'on most days', everyOther: () => 'about every other day', oneIn: (o) => `about one day in ${o.k}` };
const CHANCE_PAGES = [
  ['/weather/united-kingdom/london/july', 7, 'July'],
  ['/weather/germany/berlin/may', 5, 'May'],
  ['/weather/iceland/reykjavik/january', 1, 'January'],
  ['/weather/france/paris/march', 3, 'March'],
  ['/weather/japan/tokyo/june', 6, 'June'],
];
for (const [path, num, name] of CHANCE_PAGES) {
  test(`chance sentence agrees with the Rain section number: ${path}`, async ({ browser, baseURL }) => {
    const { page, close } = await open(browser, baseURL, path);
    const text = await page.locator('main').innerText();
    const rain = /about ([\d.]+)(?: wet days?)? (?:of|in) (\d+)(?: days)?/.exec(text);
    expect(rain, 'Rain section number').not.toBeNull();
    const o = oftenOf(Number(rain[1]), num);
    expect(o.key).not.toBe('never');
    const want = PHRASE[o.key](o);
    expect(text).toContain(`falls ${want} in an average ${name}.`);
    // FAQ jab yeh lafz likhe to wahi lafz; doosra kabhi nahi
    for (const other of [/rain falls (about every other day|on most days|about one day in \d+)/gi]) {
      for (const hit of text.matchAll(other)) expect(hit[1]).toBe(want);
    }
    await close();
  });
}

test('latest year beating a record is stated: Reykjavik January 2026', async ({ browser, baseURL }) => {
  const { page, close } = await open(browser, baseURL, '/weather/iceland/reykjavik/january');
  const text = await page.locator('main').innerText();
  expect(text).toMatch(/January 2026 was drier than any January in 2006–2025/);
  expect(text).toMatch(/rain or snow/);
  await close();
});

test('all 6 languages show the block with their own heading', async ({ browser, baseURL }) => {
  const want = {
    '': 'July in London: what 20 years show',
    '/de': 'Juli in London: Was 20 Jahre zeigen',
    '/fr': 'Juillet à Londres : ce que montrent 20 ans de données',
    '/it': 'Luglio a Londra: cosa mostrano 20 anni',
    '/es': 'Julio en Londres: lo que muestran 20 años',
    '/ja': 'ロンドンの7月：20年分のデータからわかること',
  };
  for (const [prefix, h2] of Object.entries(want)) {
    const { page, close } = await open(browser, baseURL, `${prefix}${LONDON}`);
    await expect(page.getByRole('heading', { level: 2, name: h2, exact: true })).toHaveCount(1);
    await close();
  }
});

test('Japanese sub-headings use the approved wording', async ({ browser, baseURL }) => {
  const { page, close } = await open(browser, baseURL, `/ja${LONDON}`);
  const block = page.locator('section', { has: page.getByRole('heading', { level: 2, name: 'ロンドンの7月：20年分のデータからわかること' }) });
  await expect(block.locator('h3')).toHaveText(['例年の範囲', '記録', '年ごとの頻度']);
  await close();
});
