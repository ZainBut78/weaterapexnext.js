// Asal client IP (utils/clientIp.js) — security fix round 3
// Chalana:  node --test tests/unit/clientIp.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { clientIp, ipCandidates, isPrivateIp, maskIp } from '../../utils/clientIp.js';

const H = (obj) => new Headers(obj);

test('client ki likhi bayen values nazar-andaz — daayen se pehli public IP', () => {
  // client ne "6.6.6.6" likha; proxy ne asal 203.0.113.7 joda; Hostinger ke andar private hop
  const h = H({ 'x-forwarded-for': '6.6.6.6, 203.0.113.7, 10.0.0.5' });
  assert.equal(clientIp(h, 'xff-right-public'), '203.0.113.7');
  // Har request mein jhooti bayen value badlo — IP wahi rehti hai (hadd bypass nahi)
  for (const fake of ['1.1.1.1', '9.9.9.9', '8.8.4.4']) {
    assert.equal(clientIp(H({ 'x-forwarded-for': `${fake}, 203.0.113.7, 10.0.0.5` })), '203.0.113.7');
  }
});

test('default env khaali ho to xff-right-public', () => {
  delete process.env.CLIENT_IP_SOURCE;
  assert.equal(clientIp(H({ 'x-forwarded-for': '6.6.6.6, 198.51.100.4' })), '198.51.100.4');
});

test('CLIENT_IP_SOURCE: xff-right:N aur header:<naam>', () => {
  const h = H({ 'x-forwarded-for': '6.6.6.6, 203.0.113.7, 198.51.100.9', 'x-real-ip': '192.0.2.44' });
  assert.equal(clientIp(h, 'xff-right:1'), '198.51.100.9');
  assert.equal(clientIp(h, 'xff-right:2'), '203.0.113.7');
  assert.equal(clientIp(h, 'header:x-real-ip'), '192.0.2.44');
});

test('kuch na mile → unknown (ek bucket, bypass nahi)', () => {
  assert.equal(clientIp(H({})), 'unknown');
  assert.equal(clientIp(H({}), 'header:x-real-ip'), 'unknown');
});

test('ports aur IPv6 brackets saaf', () => {
  assert.equal(clientIp(H({ 'x-forwarded-for': '203.0.113.7:51234' })), '203.0.113.7');
  assert.equal(clientIp(H({ 'x-forwarded-for': '[2001:db8::1]:443' })), '2001:db8::1');
});

test('private ranges', () => {
  for (const ip of ['10.1.2.3', '127.0.0.1', '192.168.1.1', '172.20.0.1', '100.64.0.1', '::1', 'fd12:3456::1', 'fe80::1']) {
    assert.equal(isPrivateIp(ip), true, ip);
  }
  for (const ip of ['203.0.113.7', '8.8.8.8', '172.32.0.1', '100.128.0.1', '2001:db8::1']) {
    assert.equal(isPrivateIp(ip), false, ip);
  }
});

test('mask: poori IP kabhi nahi', () => {
  assert.equal(maskIp('203.0.113.7'), '203.0.x.x');
  assert.equal(maskIp('2001:db8::1'), '2001:db8:…');
  assert.equal(maskIp(null), null);
  const c = ipCandidates(H({ 'x-forwarded-for': '6.6.6.6, 203.0.113.7' }));
  assert.equal(c['xff-right-public'], '203.0.113.7');
  assert.equal(c['xff-first (purana, ghalat)'], '6.6.6.6');
});
