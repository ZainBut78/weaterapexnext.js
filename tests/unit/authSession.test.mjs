// Asli apiClient interceptor: public auth par token nahi, dead session saaf (services/apiClient.js)
// Chalana:  node --test tests/unit/authSession.test.mjs
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import apiClient from '../../services/apiClient.js';
import { ENDPOINTS, SITE_API_BASE } from '../../config/endpoints.js';
import { isJwtExpired, isPublicAuthUrl, isSessionDead, SESSION_EXPIRED_EVENT } from '../../utils/authSession.js';

const jwt = (expSeconds) => `h.${Buffer.from(JSON.stringify({ exp: expSeconds })).toString('base64url')}.s`;
const nowS = () => Math.floor(Date.now() / 1000);
const VALID = jwt(nowS() + 3600);
const EXPIRED = jwt(nowS() - 3600);

let store;
let seen;
let events;
let refreshResult;
let respond;

const ok = (config) => ({ data: {}, status: 200, statusText: 'OK', headers: {}, config });

beforeEach(() => {
  store = new Map();
  seen = [];
  events = 0;
  respond = (config) => ok(config);
  refreshResult = () => { throw new Error('refresh not expected'); };
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
  globalThis.window = {
    dispatchEvent: (e) => { if (e.type === SESSION_EXPIRED_EVENT) events += 1; },
    location: { pathname: '/login', assign() {} },
  };
  apiClient.defaults.adapter = async (config) => {
    seen.push(config);
    return respond(config);
  };
  axios.defaults.adapter = async (config) => refreshResult(config);
});

const authHeader = (i = 0) => seen[i].headers.Authorization;
const httpError = (config, status, data) => {
  const err = new Error(`HTTP ${status}`);
  err.config = config;
  err.response = { status, data, headers: {}, config };
  throw err;
};

const PUBLIC = [
  ENDPOINTS.auth.login, ENDPOINTS.auth.register, ENDPOINTS.auth.verifyOtp, ENDPOINTS.auth.resendOtp,
  ENDPOINTS.auth.emailStatus, ENDPOINTS.auth.forgotPassword, ENDPOINTS.auth.resetPassword,
  ENDPOINTS.auth.googleLogin, ENDPOINTS.auth.refresh,
];

test('public auth endpoints never get Authorization (expired or valid token)', async () => {
  for (const token of [EXPIRED, VALID]) {
    store.set('access_token', token);
    for (const url of PUBLIC) {
      seen = [];
      await apiClient.post(url, {});
      assert.equal(authHeader(), undefined, url);
    }
  }
  assert.equal(events, 0);   // forgot password user ka session nahi chhedta
  assert.equal(store.get('access_token'), VALID);
});

test('protected calls and BFF features still send a valid token', async () => {
  store.set('access_token', VALID);
  await apiClient.get(ENDPOINTS.apiKeys.list);
  await apiClient.get(ENDPOINTS.trips.plan, { baseURL: SITE_API_BASE });
  assert.equal(authHeader(0), `Bearer ${VALID}`);
  assert.equal(authHeader(1), `Bearer ${VALID}`);
});

test('no token, no header', async () => {
  await apiClient.get(ENDPOINTS.apiKeys.list);
  assert.equal(authHeader(), undefined);
});

test('API keys are not on the public list', () => {
  assert.equal(isPublicAuthUrl(ENDPOINTS.apiKeys.list), false);
  assert.equal(isPublicAuthUrl(ENDPOINTS.apiKeys.generate), false);
  assert.equal(isPublicAuthUrl(ENDPOINTS.apiKeys.revoke(3)), false);
});

test('expired access + valid refresh: refreshed first, new token sent, one refresh for parallel calls', async () => {
  const fresh = jwt(nowS() + 3600);
  store.set('access_token', EXPIRED);
  store.set('refresh_token', VALID);
  let refreshes = 0;
  refreshResult = (config) => { refreshes += 1; return { ...ok(config), data: { access: fresh } }; };
  await Promise.all([apiClient.get(ENDPOINTS.apiKeys.list), apiClient.get(ENDPOINTS.trips.plan, { baseURL: SITE_API_BASE })]);
  assert.equal(refreshes, 1);
  assert.equal(authHeader(0), `Bearer ${fresh}`);
  assert.equal(authHeader(1), `Bearer ${fresh}`);
  assert.equal(store.get('access_token'), fresh);
  assert.equal(events, 0);
});

test('expired access + rejected refresh: tokens cleared, call goes without a token', async () => {
  store.set('access_token', EXPIRED);
  store.set('refresh_token', VALID);
  store.set('username', 'zain');
  refreshResult = (config) => httpError(config, 401, { code: 'token_not_valid' });
  await apiClient.get(ENDPOINTS.trips.plan, { baseURL: SITE_API_BASE });
  assert.equal(authHeader(), undefined);
  assert.deepEqual([...store.keys()], []);
  assert.equal(events, 1);
});

test('expired access + expired or missing refresh: cleared without calling refresh', async () => {
  for (const refresh of [EXPIRED, null]) {
    store.set('access_token', EXPIRED);
    if (refresh) store.set('refresh_token', refresh);
    store.set('username', 'zain');
    await apiClient.get(ENDPOINTS.trips.plan, { baseURL: SITE_API_BASE });
    assert.deepEqual([...store.keys()], []);
  }
  assert.equal(events, 2);
});

test('refresh network failure: tokens kept (user is not logged out by bad wifi)', async () => {
  store.set('access_token', EXPIRED);
  store.set('refresh_token', VALID);
  refreshResult = () => { throw new Error('Network Error'); };
  await apiClient.get(ENDPOINTS.trips.plan, { baseURL: SITE_API_BASE });
  assert.equal(authHeader(), undefined);
  assert.equal(store.get('refresh_token'), VALID);
  assert.equal(events, 0);
});

test('token_not_valid on a protected call without refresh token: cleared', async () => {
  store.set('access_token', 'not-a-jwt');
  store.set('username', 'zain');
  respond = (config) => httpError(config, 401, { code: 'token_not_valid' });
  await assert.rejects(apiClient.get(ENDPOINTS.apiKeys.list));
  assert.deepEqual([...store.keys()], []);
  assert.equal(events, 1);
});

test('token_not_valid, refresh also rejected: cleared', async () => {
  store.set('access_token', 'not-a-jwt');
  store.set('refresh_token', 'also-not-a-jwt');
  respond = (config) => httpError(config, 401, { code: 'token_not_valid' });
  refreshResult = (config) => httpError(config, 401, { code: 'token_not_valid' });
  await assert.rejects(apiClient.get(ENDPOINTS.apiKeys.list));
  assert.deepEqual([...store.keys()], []);
});

test('wrong password 401 does not touch the session', async () => {
  store.set('access_token', VALID);
  store.set('refresh_token', VALID);
  respond = (config) => httpError(config, 401, { code: 'invalid_credentials' });
  await assert.rejects(apiClient.post(ENDPOINTS.auth.login, {}));
  assert.equal(store.get('access_token'), VALID);
  assert.equal(events, 0);
});

test('expiry helpers', () => {
  assert.equal(isJwtExpired(EXPIRED), true);
  assert.equal(isJwtExpired(VALID), false);
  assert.equal(isJwtExpired('not-a-jwt'), false);   // parha nahi gaya → faisla server ka
  assert.equal(isSessionDead(EXPIRED, null), true);
  assert.equal(isSessionDead(EXPIRED, EXPIRED), true);
  assert.equal(isSessionDead(EXPIRED, VALID), false);
  assert.equal(isSessionDead(VALID, null), false);
  assert.equal(isSessionDead(null, null), false);
});
