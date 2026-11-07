// ─────────────────────────────────────────────────────────────
//  Month page text numbers se takraye nahi (Step 1, Nov 2026): din-raat ka jumla aur FAQ
//  "What should I wear". Asli local Django data, server HTML (JS band).
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';

const OLD_LITTLE = /little difference between day and night|gap between afternoon and night is small|Little changes after sunset/;
const OLD_SIMILAR = /Evenings feel similar to the day|little need to change for the evening/;

async function pageText(browser, baseURL, path) {
  const context = await browser.newContext({ javaScriptEnabled: false, locale: 'en-GB' });
  const page = await context.newPage();
  await page.goto(`${baseURL}${path}`);
  const text = await page.locator('main').innerText();
  await context.close();
  return text;
}

test('London March (7.6°C swing): no "little change", FAQ says add a layer', async ({ browser, baseURL }) => {
  const text = await pageText(browser, baseURL, '/weather/united-kingdom/london/march');
  expect(text).not.toMatch(OLD_LITTLE);
  expect(text).not.toMatch(OLD_SIMILAR);
  expect(text).toMatch(/Nights fall to about [\d.]+°C \([\d.]+°F\), [\d.]+°C \([\d.]+°F\) below the afternoon/);
  expect(text).toMatch(/plus a layer for (cold|cool) mornings and evenings/);
});

test('Dubai August (hot, wide swing): warm after dark, FAQ does not say evenings feel the same', async ({ browser, baseURL }) => {
  const text = await pageText(browser, baseURL, '/weather/united-arab-emirates/dubai/august');
  expect(text).not.toMatch(OLD_LITTLE);
  expect(text).not.toMatch(OLD_SIMILAR);
  expect(text).toMatch(/stays warm after dark/);
});

test('freezing month: verdict and "who suits" say rain or snow, in all 6 languages', async ({ browser, baseURL }) => {
  const words = { '': /snow or rain|rain or snow/, '/de': /Schnee oder Regen|Regen oder Schnee/, '/fr': /neige ou pluie|pleut ou il neige/,
    '/es': /nieve o lluvia|llueve o nieva/, '/it': /neve o pioggia|piove o nevica/, '/ja': /雨か雪/ };
  for (const [prefix, rx] of Object.entries(words)) {
    const text = await pageText(browser, baseURL, `${prefix}/weather/iceland/reykjavik/january`);
    expect(text, prefix || 'en').toMatch(rx);
  }
  const en = await pageText(browser, baseURL, '/weather/iceland/reykjavik/january');
  expect(en).toMatch(/snow or rain on most days \(about \d+\)/);
  expect(en).toMatch(/Sightseeing: less ideal — rain or snow falls/);
  expect(en).not.toMatch(/— rain on most days|Sightseeing: less ideal — rain falls/);
});

test('other languages use the same rule', async ({ browser, baseURL }) => {
  const de = await pageText(browser, baseURL, '/de/weather/united-kingdom/london/march');
  expect(de).not.toMatch(/kaum Unterschied|ändert sich wenig|fühlen sich ähnlich an/);
  const fr = await pageText(browser, baseURL, '/fr/weather/united-kingdom/london/march');
  expect(fr).not.toMatch(/Peu de changement|ressemblent à la journée/);
  const ja = await pageText(browser, baseURL, '/ja/weather/united-kingdom/london/march');
  expect(ja).not.toMatch(/ほとんど変わらず|昼とあまり変わらない/);
});
