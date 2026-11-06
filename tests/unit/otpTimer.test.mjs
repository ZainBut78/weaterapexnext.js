// OTP timer helpers (utils/otpTimer.js)
// Chalana:  node --test tests/unit/otpTimer.test.mjs
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { formatClock, loadSession, makeSession, maskEmail, saveSession, secondsLeft } from '../../utils/otpTimer.js';

beforeEach(() => {
  const store = new Map();
  globalThis.sessionStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
});

test('maskEmail', () => {
  assert.equal(maskEmail('zain@gmail.com'), 'z***@gmail.com');
  assert.equal(maskEmail('a@b.co'), 'a***@b.co');
  assert.equal(maskEmail('not-an-email'), 'not-an-email');
  assert.equal(maskEmail(undefined), '');
});

test('formatClock', () => {
  assert.equal(formatClock(600), '10:00');
  assert.equal(formatClock(75), '01:15');
  assert.equal(formatClock(0), '00:00');
  assert.equal(formatClock(-3), '00:00');
});

test('first send: resend after 60 s, code for 10 min (server values win)', () => {
  const s = makeSession('a@b.co', { retry_after: 60, expires_in: 600 }, 1000);
  assert.equal(secondsLeft(s.resendAt, 1000), 60);
  assert.equal(secondsLeft(s.expiresAt, 1000), 600);
  const longer = makeSession('a@b.co', { retry_after: 1800, expires_in: 600 }, 1000);
  assert.equal(secondsLeft(longer.resendAt, 1000), 1800);
});

test('old backend without timers → defaults', () => {
  const s = makeSession('a@b.co', { message: 'OTP sent' }, 0);
  assert.equal(secondsLeft(s.resendAt, 0), 60);
  assert.equal(secondsLeft(s.expiresAt, 0), 600);
});

test('time left comes from the end timestamp: no drift, never negative', () => {
  const s = makeSession('a@b.co', {}, 0);
  assert.equal(secondsLeft(s.resendAt, 59_500), 1);
  assert.equal(secondsLeft(s.resendAt, 60_000), 0);
  assert.equal(secondsLeft(s.resendAt, 500_000), 0);
});

test('session survives a reload (timestamps stored), per scope', () => {
  const s = saveSession('signup', makeSession('a@b.co', {}, 5000));
  assert.deepEqual(loadSession('signup'), s);
  assert.equal(loadSession('reset'), null);
  saveSession('signup', null);
  assert.equal(loadSession('signup'), null);
});

test('broken storage → no session, no crash', () => {
  globalThis.sessionStorage.setItem('otp_session:signup', '{bad json');
  assert.equal(loadSession('signup'), null);
  delete globalThis.sessionStorage;
  assert.equal(loadSession('signup'), null);
});
