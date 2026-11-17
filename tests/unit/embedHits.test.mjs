// Widget Referer ginti (utils/embedHits.js). Koi network nahi.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHitCollector, MAX_DOMAINS_PER_DAY, refererDomain } from '../../utils/embedHits.js';

test('refererDomain keeps the domain only', () => {
  assert.equal(refererDomain('https://www.Blog.Example.com/2026/11/post?x=1'), 'blog.example.com');
  assert.equal(refererDomain('http://travel.io:8080/a'), 'travel.io');
  assert.equal(refererDomain(''), null);
  assert.equal(refererDomain(null), null);
  assert.equal(refererDomain('not a url'), null);
  assert.equal(refererDomain('http://localhost:3000/'), null);
});

test('one payload per day, counts summed per domain, own site and empty ignored', () => {
  let t = Date.UTC(2026, 10, 17, 10);
  const c = createHitCollector({ ownDomains: ['weatherapex.com'], now: () => t });
  assert.equal(c.note('https://blog.example/a'), null);
  assert.equal(c.note('https://blog.example/b'), null);
  assert.equal(c.note('https://www.weatherapex.com/ja/weather'), null);
  assert.equal(c.note(''), null);
  assert.equal(c.note('https://travel.io/'), null);
  t = Date.UTC(2026, 10, 17, 23, 59);
  assert.equal(c.due(), null);                          // abhi wahi din: kuch nahi
  t = Date.UTC(2026, 10, 18, 0, 1);
  const out = c.note('https://blog.example/c');
  assert.deepEqual(out, { day: '2026-11-17', hits: [{ domain: 'blog.example', count: 2 }, { domain: 'travel.io', count: 1 }] });
  assert.equal(c.due(), null);                          // dobara nahi
  t = Date.UTC(2026, 10, 19, 8);
  assert.deepEqual(c.due(), { day: '2026-11-18', hits: [{ domain: 'blog.example', count: 1 }] });
});

test('a day with no outside hits sends nothing', () => {
  let t = Date.UTC(2026, 10, 17);
  const c = createHitCollector({ ownDomains: ['weatherapex.com'], now: () => t });
  c.note('https://weatherapex.com/');
  t = Date.UTC(2026, 10, 18);
  assert.equal(c.due(), null);
});

test('memory stays bounded', () => {
  const c = createHitCollector({ now: () => 0 });
  for (let i = 0; i < MAX_DOMAINS_PER_DAY + 50; i++) c.note(`https://site${i}.example/`);
  assert.equal(c.peek().counts.size, MAX_DOMAINS_PER_DAY);
  c.note('https://site1.example/');                     // jo pehle se hai woh ginti mein
  assert.equal(c.peek().counts.get('site1.example'), 2);
});
