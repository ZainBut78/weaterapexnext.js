// Bloggers ka copy code (utils/embedCode.js). Koi network nahi.
import test from 'node:test';
import assert from 'node:assert/strict';
import { embedCode, embedPaths } from '../../utils/embedCode.js';
import { MONTH_HEIGHT, YEAR_HEIGHT } from '../../utils/embedWidget.js';
import { embedText } from '../../utils/embedText.js';
import { codeText } from '../../utils/embedCodeText/index.js';

const base = { countrySlug: 'japan', citySlug: 'tokyo' };

test('month code: iframe plus one plain link outside it, brand + page name only', () => {
  const code = embedCode({ ...base, lang: 'en', text: codeText('en'), cityName: 'Tokyo', monthNum: 12 });
  const [iframe, link, ...rest] = code.split('\n');
  assert.equal(rest.length, 0);
  assert.equal(iframe, `<iframe src="https://weatherapex.com/embed/japan/tokyo/december" width="100%" height="${MONTH_HEIGHT}" style="border:0" loading="lazy" title="Tokyo weather in December"></iframe>`);
  assert.equal(link, '<p style="font-size:13px">Weather data: <a href="https://weatherapex.com/weather/japan/tokyo/december">WeatherApex — Tokyo weather in December</a></p>');
  assert.ok(!/rel=|nofollow|target=/.test(link));            // saada, follow wala link
});

test('year code, language, dark theme and the optional Trip Planner line', () => {
  const code = embedCode({ ...base, lang: 'ja', text: codeText('ja'), cityName: '東京', monthNum: null, theme: 'dark', trip: true });
  const lines = code.split('\n');
  assert.equal(lines.length, 3);
  assert.ok(lines[0].includes('src="https://weatherapex.com/ja/embed/japan/tokyo?theme=dark"'));
  assert.ok(lines[0].includes(`height="${YEAR_HEIGHT}"`));
  assert.ok(lines[1].includes('href="https://weatherapex.com/ja/weather/japan/tokyo">WeatherApex — 東京の月別の天気</a>'));
  assert.equal(lines[2], '<p style="font-size:13px"><a href="https://weatherapex.com/ja/trip-planner">WeatherApexの旅行プランナー</a>で日程を計画</p>');
});

test('names are escaped', () => {
  const code = embedCode({ ...base, lang: 'en', text: codeText('en'), cityName: 'A "B" <C>', monthNum: 1 });
  assert.ok(!code.includes('<C>'));
  assert.ok(code.includes('A &quot;B&quot; &lt;C&gt;'));
});

test('paths', () => {
  assert.deepEqual(embedPaths({ lang: 'de', ...base, monthNum: 3 }), { widget: '/de/embed/japan/tokyo/march', page: '/de/weather/japan/tokyo/march' });
  assert.deepEqual(embedPaths({ lang: 'en', ...base, monthNum: null }), { widget: '/embed/japan/tokyo', page: '/weather/japan/tokyo' });
});

test('widget title and copy-code title are the same text in every language', async () => {
  const { monthName } = await import('../../utils/embedCode.js');
  for (const lang of ['en', 'de', 'fr', 'it', 'es', 'ja']) {
    const code = embedCode({ ...base, lang, text: codeText(lang), cityName: 'X', monthNum: 7 });
    assert.ok(code.includes(`title="${embedText(lang).titleMonth('X', monthName(lang, 7))}"`), lang);
    assert.ok(embedText(lang).titleYear('X').includes('X'), lang);
  }
});
