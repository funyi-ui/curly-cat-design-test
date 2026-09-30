import assert from 'node:assert/strict';

// Two already-confirmed real test accounts; never print credentials or create production users.
const required = ['TEST_ACCOUNT_A_EMAIL', 'TEST_ACCOUNT_A_PASSWORD', 'TEST_ACCOUNT_B_EMAIL', 'TEST_ACCOUNT_B_PASSWORD'];
if (required.some(key => !process.env[key])) {
  console.log('NOT RUN: Two confirmed Supabase test accounts are required. See backend/README.md.');
  process.exit(0);
}
const base = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Live verification is restricted to your local server.');
function browser() {
  let cookie = '', csrf = '';
  return {
    get cookie() { return cookie; },
    async request(path, body) {
      const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', redirect: 'error',
        headers: { ...(cookie ? { cookie } : {}), ...(body === undefined ? {} : { origin: base, 'content-type': 'application/json', 'x-csrf-token': csrf }) },
        body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000) });
      const set = response.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
      const data = await response.json(); if (data.csrfToken) csrf = data.csrfToken;
      return { status: response.status, data };
    }
  };
}
const A = browser(), B = browser();
const credentials = letter => ({ email: process.env[`TEST_ACCOUNT_${letter}_EMAIL`], password: process.env[`TEST_ACCOUNT_${letter}_PASSWORD`] });
let loggedA = false, loggedB = false;
try {
  assert.equal((await A.request('/api/auth/state')).status, 200, 'Server must be configured');
  assert.equal((await B.request('/api/auth/state')).status, 200);
  assert.equal((await A.request('/api/auth/login', { ...credentials('A'), password: 'DeliberatelyWrong-' + Date.now() })).status, 401);
  const a = await A.request('/api/auth/login', credentials('A')); loggedA = a.status === 200;
  const b = await B.request('/api/auth/login', credentials('B')); loggedB = b.status === 200;
  assert.equal(a.status, 200); assert.equal(b.status, 200); assert.notEqual(a.data.user.id, b.data.user.id);
  const reload = await fetch(base + '/api/auth/state', { headers: { cookie: A.cookie } }).then(r => r.json());
  assert.equal(reload.user.id, a.data.user.id);
  assert.equal((await A.request('/api/member/notebook')).data.ownerId, a.data.user.id);
  assert.equal((await B.request('/api/member/notebook')).data.ownerId, b.data.user.id);
  assert.equal((await A.request('/api/member/notebook?userId=' + b.data.user.id)).status, 400);
  assert.equal((await A.request('/api/members/' + b.data.user.id)).status, 404);
  const oldCookie = A.cookie;
  assert.equal((await A.request('/api/auth/logout', {})).status, 200); loggedA = false;
  assert.equal((await A.request('/api/member/notebook')).status, 401);
  const replay = await fetch(base + '/api/auth/state', { headers: { cookie: oldCookie } }).then(r => r.json());
  assert.equal(replay.user, null);
  assert.equal((await B.request('/api/auth/state')).data.user.id, b.data.user.id);
  await A.request('/api/auth/state');
  const relogin = await A.request('/api/auth/login', credentials('A')); loggedA = relogin.status === 200;
  assert.equal(relogin.data.user.id, a.data.user.id);
  console.log('PASS: REAL Supabase two-account login, wrong password, refresh request, fixed IDs, self-only notebook, logout and replay rejection. Signup/email delivery and server restart need the README manual checks.');
} finally {
  if (loggedA) await A.request('/api/auth/logout', {}).catch(() => {});
  if (loggedB) await B.request('/api/auth/logout', {}).catch(() => {});
}
