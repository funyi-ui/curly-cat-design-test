import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Lightweight UI behavior harness, not a rendered browser or fake production login.
function boot(handler, lang = 'ko') {
  const html = readFileSync(new URL('../../frontend/index.html', import.meta.url), 'utf8');
  const elements = new Map();
  for (const tag of html.matchAll(/<\w+\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
    const listeners = {};
    const node = { value: '', textContent: '', hidden: /\bhidden\b/.test(tag[0]), listeners,
      addEventListener(type, fn) { listeners[type] = fn; }, focus() {}, scrollIntoView() {},
      showModal() { this.open = true; }, close() { this.open = false; listeners.close?.(); } };
    elements.set(tag[1], node);
  }
  const listeners = {};
  const document = { documentElement: { lang }, getElementById: id => elements.get(id),
    addEventListener: (type, fn) => { listeners[type] = fn; } };
  const calls = [];
  const context = vm.createContext({ document, window: { addEventListener() {} }, URL, AbortSignal,
    location: { href: 'http://127.0.0.1:5173/', pathname: '/', hash: '' }, history: { replaceState() {} },
    matchMedia: () => ({ matches: true }),
    fetch: async (path, options) => {
      calls.push({ path, options });
      const reply = await handler(path, options);
      return { ok: reply.status < 400, json: async () => reply.data };
    }
  });
  for (const file of ['i18n.js', 'member-locales.js', 'member.js']) vm.runInContext(readFileSync(new URL(`../../frontend/${file}`, import.meta.url), 'utf8'), context);
  return { elements, document, listeners, context, calls };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('unconnected member UI cannot log in and keeps notebook hidden', async () => {
  const ui = boot(async () => ({ status: 503, data: { error: 'authNotConfigured' } }));
  await tick();
  assert.match(ui.elements.get('member-status-text').textContent, /연결되지/);
  assert.equal(ui.elements.get('member-open-notebook').hidden, true);
  await ui.elements.get('member-signup').listeners.click();
  ui.elements.get('member-email').value = 'test@example.test';
  ui.elements.get('member-password').value = 'NotARealPassword123';
  await ui.elements.get('member-form').listeners.submit({ preventDefault() {} });
  assert.match(ui.elements.get('member-message').textContent, /연결되지/);
  assert.equal(ui.elements.get('member-password').value, '');
  assert(ui.calls.every(call => call.path === '/api/auth/state'), 'no fake signup or login fallback');
});

test('server identity gates notebook, login errors clear passwords, logout hides member UI', async () => {
  let signedIn = false, bad = true;
  const user = { id: 'test-member-id', email: 'test@example.test' };
  const ui = boot(async path => {
    if (path === '/api/auth/state') return { status: 200, data: { user: signedIn ? user : null, csrfToken: 'csrf-token' } };
    if (path === '/api/auth/login') {
      if (bad) return { status: 401, data: { error: 'invalidCredentials' } };
      signedIn = true; return { status: 200, data: { user, csrfToken: 'rotated-token' } };
    }
    if (path === '/api/member/notebook') return { status: 200, data: { ownerId: user.id, entries: [], storageEnabled: false } };
    if (path === '/api/auth/logout') { signedIn = false; return { status: 200, data: { message: 'loggedOut' } }; }
    throw new Error('Unexpected route');
  });
  await tick();
  assert.equal(ui.elements.get('member-status-text').textContent, '');
  ui.elements.get('member-login').listeners.click();
  ui.elements.get('member-email').value = user.email;
  ui.elements.get('member-password').value = 'Incorrect123';
  await ui.elements.get('member-form').listeners.submit({ preventDefault() {} });
  assert.match(ui.elements.get('member-message').textContent, /올바르지/);
  assert.equal(ui.elements.get('member-password').value, '');
  bad = false; ui.elements.get('member-password').value = 'CorrectTest123';
  await ui.elements.get('member-form').listeners.submit({ preventDefault() {} });
  assert.equal(ui.elements.get('member-open-notebook').hidden, false);
  assert.equal(ui.elements.get('member-login').hidden, true);
  assert.equal(ui.elements.get('member-dialog').open, false);
  await ui.elements.get('member-open-notebook').listeners.click();
  assert.equal(ui.elements.get('member-notebook').hidden, false);
  ui.document.documentElement.lang = 'fr'; ui.listeners['member-language-change']();
  assert.equal(ui.elements.get('member-status-text').textContent, 'Connecté');
  await ui.elements.get('member-logout').listeners.click();
  assert.equal(ui.elements.get('member-notebook').hidden, true);
  assert.equal(ui.elements.get('member-open-notebook').hidden, true);
  assert.equal(ui.elements.get('member-login').hidden, false);
  const logoutCall = ui.calls.find(call => call.path === '/api/auth/logout');
  assert.equal(logoutCall.options.headers['X-CSRF-Token'], 'rotated-token');
});

test('member error keys and language packs match across all five languages', () => {
  const ui = boot(async () => ({ status: 503, data: { error: 'authNotConfigured' } }));
  const copy = vm.runInContext('MEMBER_COPY', ui.context);
  for (const lang of ['ko','en','id','fr','es']) {
    assert.deepEqual(Object.keys(copy[lang]).sort(), Object.keys(copy.en).sort());
    for (const value of Object.values(copy[lang])) assert.equal(typeof value, 'string');
  }
});
