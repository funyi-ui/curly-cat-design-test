import { test } from 'node:test';
import assert from 'node:assert/strict';
import session from 'express-session';
import { randomUUID } from 'node:crypto';
import { createApp } from '../app.mjs';
import { readConfig } from '../config.mjs';

// Test double ONLY. Application entry point never provides this provider or MemoryStore.
function testProvider() {
  const users = new Map();
  const tokens = new Map();
  let calls = 0;
  function issue(user) {
    const access_token = randomUUID(), refresh_token = randomUUID();
    tokens.set(access_token, user); tokens.set(refresh_token, user);
    return { user, access_token, refresh_token, expires_at: Math.floor(Date.now()/1000) + 3600 };
  }
  return {
    get calls() { return calls; },
    async signup({email, password}) { calls++; users.set(email, { id: randomUUID(), email, password }); return { data: { session: null }, error: null }; },
    async login({email, password}) {
      calls++; const user = users.get(email);
      if (!user || user.password !== password) return { error: { status: 400, code: 'invalid_credentials' } };
      return { data: { session: issue({ id: user.id, email: user.email }) }, error: null };
    },
    async getUser(token) { calls++; return tokens.has(token) ? { data: { user: tokens.get(token) } } : { error: { status: 401 } }; },
    async refresh(token) { calls++; return tokens.has(token) ? { data: { session: issue(tokens.get(token)) } } : { error: { status: 401 } }; },
    async logout(pair) { calls++; tokens.delete(pair.access_token); tokens.delete(pair.refresh_token); return { error: null }; },
    async confirm() { return { error: null }; }
  };
}
async function fixture(t, options = {}) {
  const provider = options.provider || testProvider();
  const store = new session.MemoryStore();
  const config = { configured: true, production: false, sessionSecret: 'test-only-secret-'.repeat(5), origin: 'http://127.0.0.1:5173', ...options.config };
  const app = createApp({ config, store, provider, limits: options.limits });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  function browser() {
    let cookie = '', csrf = '';
    return {
      get cookie() { return cookie; }, get csrf() { return csrf; },
      async request(path, body, headers = {}) {
        const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST',
          headers: { ...(cookie ? { cookie } : {}), ...(body === undefined ? {} : { origin: config.origin, 'content-type': 'application/json', 'x-csrf-token': csrf }), ...headers },
          body: body === undefined ? undefined : JSON.stringify(body) });
        const set = response.headers.get('set-cookie');
        if (set) cookie = set.split(';')[0];
        const result = await response.json();
        if (result.csrfToken) csrf = result.csrfToken;
        return { status: response.status, result, headers: response.headers };
      }
    };
  }
  return { provider, store, browser, base };
}
const a = { email: 'a@example.test', password: 'TestOnlyPassword123' };
const b = { email: 'b@example.test', password: 'DifferentTest123' };

test('two isolated accounts: signup, login, wrong password, reload, ID stability, logout and replay', async t => {
  const f = await fixture(t); const A = f.browser(), B = f.browser();
  await A.request('/api/auth/state'); await B.request('/api/auth/state');
  assert.equal((await A.request('/api/auth/signup', a)).status, 202);
  assert.equal((await B.request('/api/auth/signup', b)).status, 202);
  assert.equal((await A.request('/api/auth/state')).result.user, null, 'signup does not auto-login');
  assert.equal((await A.request('/api/auth/login', { ...a, password: 'wrong' })).result.error, 'invalidCredentials');
  const anon = A.cookie;
  const loggedA = await A.request('/api/auth/login', a), loggedB = await B.request('/api/auth/login', b);
  assert.equal(loggedA.status, 200); assert.equal(loggedB.status, 200);
  assert.notEqual(anon, A.cookie, 'login rotates session ID');
  assert.notEqual(loggedA.result.user.id, loggedB.result.user.id);
  assert.match(loggedA.headers.get('set-cookie'), /HttpOnly/); assert.match(loggedA.headers.get('set-cookie'), /SameSite=Lax/);
  assert.equal(loggedA.headers.get('cache-control'), 'no-store');
  assert(!JSON.stringify(loggedA.result).includes('access_token'));
  const reloaded = await fetch(f.base + '/api/auth/state', { headers: { cookie: A.cookie } }).then(r => r.json());
  assert.equal(reloaded.user.id, loggedA.result.user.id, 'new request with cookie retains identity');
  assert.equal((await A.request('/api/member/notebook')).result.ownerId, loggedA.result.user.id);
  assert.equal((await B.request('/api/member/notebook')).result.ownerId, loggedB.result.user.id);
  const attack = await A.request('/api/member/notebook?userId=' + loggedB.result.user.id);
  assert.equal(attack.status, 400); assert(!JSON.stringify(attack.result).includes(b.email));
  assert.equal((await A.request('/api/members/' + loggedB.result.user.id)).status, 404);
  const oldCookie = A.cookie;
  assert.equal((await A.request('/api/auth/logout', {})).status, 200);
  assert.equal((await A.request('/api/member/notebook')).status, 401);
  const replay = await fetch(f.base + '/api/auth/state', { headers: { cookie: oldCookie } }).then(r => r.json());
  assert.equal(replay.user, null, 'destroyed server session cannot be replayed');
  await A.request('/api/auth/state');
  assert.equal((await A.request('/api/auth/login', a)).result.user.id, loggedA.result.user.id, 'ID unchanged after relogin');
  assert.equal((await B.request('/api/auth/state')).result.user.id, loggedB.result.user.id, 'A logout does not affect B');
});

test('CSRF, Origin, validation, body limits and cookie tampering fail closed', async t => {
  const f = await fixture(t); const A = f.browser(); await A.request('/api/auth/state');
  assert.equal((await A.request('/api/auth/login', a, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await A.request('/api/auth/login', a, { 'x-csrf-token': '' })).status, 403);
  assert.equal((await A.request('/api/auth/login', a, { 'x-csrf-token': 'é'.repeat(64) })).status, 403);
  assert.equal((await A.request('/api/auth/signup', { ...a, password: 'short' })).status, 400);
  assert.equal((await A.request('/api/auth/login', { ...a, memberId: 'other' })).status, 400);
  assert.equal((await A.request('/api/auth/login', { email: 'bad', password: 'x' })).status, 400);
  assert.equal((await A.request('/api/auth/login', { ...a, password: 'x'.repeat(5000) })).status, 400);
  assert.equal(f.provider.calls, 0);
  const malformed = await fetch(f.base + '/api/auth/login', { method: 'POST', headers: { cookie: A.cookie, origin: 'http://127.0.0.1:5173', 'x-csrf-token': A.csrf, 'content-type': 'application/json' }, body: '{bad' });
  assert.equal(malformed.status, 400);
  const forged = await fetch(f.base + '/api/member/notebook', { headers: { cookie: 'cat-session=s%3Aforged.invalid' } });
  assert.equal(forged.status, 401);
  assert.equal((await fetch(f.base + '/.env')).status, 404);
  assert.equal((await fetch(f.base + '/backend/schema.sql')).status, 404);
});

test('signup and login IP limits stop attempts before provider', async t => {
  const f = await fixture(t, { limits: { login: 2, signup: 1 } }); const A = f.browser(); await A.request('/api/auth/state');
  assert.equal((await A.request('/api/auth/signup', a)).status, 202);
  assert.equal((await A.request('/api/auth/signup', b)).status, 429);
  await A.request('/api/auth/login', { ...a, password: 'wrong' }); await A.request('/api/auth/login', { ...a, password: 'wrong' });
  const blocked = await A.request('/api/auth/login', a);
  assert.equal(blocked.status, 429); assert(blocked.headers.get('retry-after')); assert.equal(f.provider.calls, 3);
});

test('email attempt limit applies across different anonymous sessions', async t => {
  const f = await fixture(t, { limits: { email: 1 } }); const A = f.browser(), B = f.browser();
  await A.request('/api/auth/state'); await B.request('/api/auth/state');
  await A.request('/api/auth/login', a);
  assert.equal((await B.request('/api/auth/login', { ...a, email: 'A@EXAMPLE.TEST' })).status, 429);
});

test('refresh keeps identity; provider rejects invalid tokens; logout stays local on outage', async t => {
  const f = await fixture(t); const A = f.browser(); await A.request('/api/auth/state');
  await A.request('/api/auth/signup', a); const login = await A.request('/api/auth/login', a);
  const sid = Object.keys(f.store.sessions).find(key => JSON.parse(f.store.sessions[key]).memberId === login.result.user.id);
  const stored = JSON.parse(f.store.sessions[sid]); stored.tokens.expires_at = 0;
  f.store.sessions[sid] = JSON.stringify(stored);
  assert.equal((await A.request('/api/auth/state')).result.user.id, login.result.user.id);
  f.provider.logout = async () => { throw new Error('offline'); };
  assert.equal((await A.request('/api/auth/logout', {})).result.message, 'loggedOutLocally');
  assert.equal((await A.request('/api/auth/state')).result.user, null);
});

test('unconfigured service returns 503 and leaves the cat website accessible', async t => {
  const f = await fixture(t, { config: { configured: false } }); const A = f.browser();
  assert.equal((await A.request('/api/auth/state')).result.error, 'authNotConfigured');
  assert.equal((await A.request('/api/auth/login', a)).status, 503);
  assert.equal(f.provider.calls, 0); assert.equal((await fetch(f.base + '/')).status, 200);
});

test('revoked or mismatched provider identity cannot access notebook; outage does not authenticate', async t => {
  const f = await fixture(t); const A = f.browser(); await A.request('/api/auth/state');
  await A.request('/api/auth/signup', a); await A.request('/api/auth/login', a);
  const original = f.provider.getUser;
  f.provider.getUser = async () => ({ error: { status: 503 } });
  assert.equal((await A.request('/api/member/notebook')).status, 503);
  f.provider.getUser = original;
  assert.equal((await A.request('/api/member/notebook')).status, 200);
  f.provider.getUser = async () => ({ data: { user: { id: 'someone-else', email: b.email } } });
  const denied = await A.request('/api/member/notebook');
  assert.equal(denied.status, 401); assert(!JSON.stringify(denied.result).includes(b.email));
  assert.equal((await A.request('/api/auth/state')).result.user, null);
});

test('signup requires email confirmation and confirmation links never sign in', async t => {
  const f = await fixture(t); const A = f.browser(); await A.request('/api/auth/state');
  const signup = f.provider.signup;
  f.provider.signup = async input => {
    await signup(input); return f.provider.login(input);
  };
  assert.equal((await A.request('/api/auth/signup', a)).result.error, 'emailConfirmationRequired');
  assert.equal((await A.request('/api/auth/state')).result.user, null);
  const link = await fetch(f.base + '/auth/confirm?token_hash=' + 'a'.repeat(64), { redirect: 'manual' });
  assert.equal(link.status, 302); assert.equal(link.headers.get('location'), '/?confirmation=success');
  assert.equal(link.headers.get('set-cookie'), null);
});

test('configuration rejects missing production settings, unsafe origins and short secrets', () => {
  assert.equal(readConfig({}).configured, false);
  assert.throws(() => readConfig({ NODE_ENV: 'production', APP_ORIGIN: 'https://example.test' }), /Missing/);
  assert.throws(() => readConfig({ APP_ORIGIN: 'http://localhost:5173/' }), /origin/);
  assert.throws(() => readConfig({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example', DATABASE_URL: 'postgres://example', SESSION_SECRET: 'short' }), /48/);
});

test('concurrent refresh and logout cannot resurrect the server session', async t => {
  const f = await fixture(t); const A = f.browser(); await A.request('/api/auth/state');
  await A.request('/api/auth/signup', a); const login = await A.request('/api/auth/login', a);
  const sid = Object.keys(f.store.sessions).find(key => JSON.parse(f.store.sessions[key]).memberId === login.result.user.id);
  const stored = JSON.parse(f.store.sessions[sid]); stored.tokens.expires_at = 0; f.store.sessions[sid] = JSON.stringify(stored);
  let releaseRefresh, announceRefresh;
  const started = new Promise(resolve => { announceRefresh = resolve; });
  const gate = new Promise(resolve => { releaseRefresh = resolve; });
  const refresh = f.provider.refresh;
  let refreshFinished = false, logoutDuringRefresh = false;
  f.provider.refresh = async token => { announceRefresh(); await gate; const result = await refresh(token); refreshFinished = true; return result; };
  const logout = f.provider.logout;
  f.provider.logout = async tokens => { if (!refreshFinished) logoutDuringRefresh = true; return logout(tokens); };
  const cookie = A.cookie;
  const stateRequest = fetch(f.base + '/api/auth/state', { headers: { cookie } });
  await started;
  const logoutRequest = fetch(f.base + '/api/auth/logout', { method: 'POST', headers: { cookie, origin: 'http://127.0.0.1:5173', 'content-type': 'application/json', 'x-csrf-token': A.csrf }, body: '{}' });
  // Let the overlapping logout reach the server while refresh is deliberately blocked.
  await new Promise(resolve => setTimeout(resolve, 25));
  releaseRefresh();
  assert.equal((await stateRequest).status, 200); assert.equal((await logoutRequest).status, 200);
  assert.equal(logoutDuringRefresh, false, 'logout waits until the in-flight refresh finishes');
  const replay = await fetch(f.base + '/api/auth/state', { headers: { cookie } }).then(res => res.json());
  assert.equal(replay.user, null);
});
