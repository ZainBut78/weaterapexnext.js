// Embed widget ka HTML (utils/embedWidget.js). Koi network nahi.
import test from 'node:test';
import assert from 'node:assert/strict';
import { esc, monthModel, renderMonth, renderYear, yearModel } from '../../utils/embedWidget.js';

const monthly = Array.from({ length: 12 }, (_, i) => ({
  month: i + 1, avg_high: 8 + i * 1.5, avg_low: 2 + i, avg_rainfall: 40 + i * 3, rainy_days: 12 - (i % 6), sunshine_hours: 4 + i * 0.4, humidity: 75,
}));
const links = { page: 'https://weatherapex.com/ja/weather/x/y/march', trip: 'https://weatherapex.com/ja/trip-planner', events: 'https://weatherapex.com/ja/events' };

test('month widget: numbers, footer links in a new tab, noindex, theme', () => {
  const model = monthModel({ monthly, monthNum: 3, yearData: null });
  const html = renderMonth({ lang: 'en', theme: 'dark', cityName: 'Test <City>', monthNum: 3, model, period: '2006–2025 averages', links });
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /<body class="dark">/);
  assert.ok(html.includes('11 °C'));                     // avg_high 11
  assert.ok(html.includes('Test &lt;City&gt;'));         // naam escape
  for (const href of [links.page, links.trip, links.events, 'https://open-meteo.com/']) {
    assert.ok(html.includes(`href="${href}" target="_blank" rel="noopener"`), href);
  }
  assert.ok(html.includes('Weather data by Open-Meteo.com'));
  assert.ok(!/<script/i.test(html));
  assert.ok(Buffer.byteLength(html) < 50 * 1024);
});

test('month widget: records and odds only when the year rows pass the guard', () => {
  const rows = [];
  for (let y = 2006; y <= 2025; y++) rows.push([y, 3, 11 + ((y % 5) - 2) * 0.1, 46 + ((y % 3) - 1), 10 + ((y % 3) - 1)]);
  const ok = monthModel({ monthly, monthNum: 3, yearData: { rows, flagged: [] } });
  assert.equal(ok.records.length, 4);
  const flagged = monthModel({ monthly, monthNum: 3, yearData: { rows, flagged: [3] } });
  assert.equal(flagged.records.length, 0);
});

test('year widget: 12 months, best and least pleasant, light theme default', () => {
  const model = yearModel({ monthly });
  assert.equal(model.rows.length, 12);
  assert.equal(model.best.length, 3);
  assert.equal(model.avoid.length, 2);
  const html = renderYear({ lang: 'ja', theme: 'light', cityName: '東京', model, period: '2006〜2025年の平均', links });
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /<body class="light">/);
  assert.ok(html.includes('東京の月別の天気 — WeatherApex'));
  assert.ok(Buffer.byteLength(html) < 50 * 1024);
});

test('missing month data gives no model', () => {
  assert.equal(monthModel({ monthly: [], monthNum: 3 }), null);
  assert.equal(yearModel({ monthly: monthly.slice(0, 11) }), null);
});

test('esc escapes html', () => {
  assert.equal(esc(`<a href="x">'&`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
});
