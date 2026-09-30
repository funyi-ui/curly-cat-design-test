'use strict';
(() => {
  const el = id => document.getElementById(id);
  const text = key => LOCALES[document.documentElement.lang].ui[key] || LOCALES.en.ui[key];
  let user = null, csrf = null, mode = 'login', busy = false, ready = false;
  let statusKey = 'memberChecking', dialogKey = '', generation = 0;
  const dialog = el('member-dialog');
  function render() {
    el('member-status-text').textContent = statusKey ? text(statusKey) : '';
    el('member-retry').hidden = ready || busy;
    el('member-login').hidden = Boolean(user);
    el('member-signup').hidden = Boolean(user);
    el('member-logout').hidden = !user;
    el('member-open-notebook').hidden = !user;
    if (!user) el('member-notebook').hidden = true;
    el('member-dialog-title').textContent = text(mode === 'signup' ? 'memberSignup' : 'memberLogin');
    el('member-submit').textContent = text(busy ? 'memberWait' : mode === 'signup' ? 'memberSignup' : 'memberLogin');
    el('member-switch').textContent = text(mode === 'signup' ? 'memberLogin' : 'memberSignup');
    el('member-password').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    el('member-password').minLength = mode === 'signup' ? 12 : 1;
    el('member-password-hint').hidden = mode !== 'signup';
    el('member-message').textContent = dialogKey ? text(dialogKey) : '';
    for (const id of ['member-submit','member-switch','member-email','member-password','member-logout']) el(id).disabled = busy;
  }
  async function api(path, body) {
    const response = await fetch(path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok) throw Object.assign(new Error('Request failed'), { code: result.error });
    return result;
  }
  async function check() {
    const version = ++generation;
    try {
      let result;
      try { result = await api('/api/auth/state'); }
      catch (error) { if (error.code !== 'sessionExpired') throw error; result = await api('/api/auth/state'); }
      if (version !== generation) return;
      user = result.user; csrf = result.csrfToken; ready = true;
      statusKey = user ? 'memberSignedIn' : '';
    } catch (error) {
      if (version !== generation) return;
      user = null; csrf = null; ready = false;
      statusKey = error.code || 'serviceUnavailable';
    }
    render();
  }
  function open(value) {
    mode = value; dialogKey = ''; el('member-password').value = '';
    render(); dialog.showModal(); el('member-email').focus();
  }
  el('member-login').addEventListener('click', () => open('login'));
  el('member-signup').addEventListener('click', () => open('signup'));
  el('member-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { el('member-password').value = ''; });
  el('member-switch').addEventListener('click', () => { mode = mode === 'signup' ? 'login' : 'signup'; dialogKey = ''; el('member-password').value = ''; render(); });
  el('member-retry').addEventListener('click', check);
  el('member-form').addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    busy = true; dialogKey = ''; render(); ++generation;
    const password = el('member-password').value;
    try {
      if (!csrf) await check();
      if (!csrf) throw Object.assign(new Error('Not connected'), { code: statusKey });
      const result = await api(`/api/auth/${mode}`, { email: el('member-email').value.trim(), password });
      if (mode === 'signup') dialogKey = result.message;
      else { user = result.user; csrf = result.csrfToken; ready = true; statusKey = 'memberSignedIn'; dialog.close(); }
    } catch (error) {
      dialogKey = error.code || 'serviceUnavailable';
      if (['requestRejected','alreadySignedIn'].includes(dialogKey)) await check();
    } finally { el('member-password').value = ''; busy = false; render(); }
  });
  el('member-logout').addEventListener('click', async () => {
    if (busy) return; busy = true; ++generation; render();
    try {
      const result = await api('/api/auth/logout', {});
      user = null; csrf = null; ready = false; el('member-notebook').hidden = true;
      await check(); statusKey = result.message;
    } catch (error) { statusKey = error.code || 'serviceUnavailable'; }
    finally { busy = false; render(); }
  });
  el('member-open-notebook').addEventListener('click', async () => {
    const version = generation;
    try {
      const result = await api('/api/member/notebook');
      if (version !== generation || !user || result.ownerId !== user.id) return;
      el('member-notebook').hidden = false; el('member-notebook').focus({ preventScroll: true });
      el('member-notebook').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    } catch (error) { await check(); statusKey = error.code || 'serviceUnavailable'; render(); }
  });
  document.addEventListener('member-language-change', render);
  // Revalidate when returning from another tab (including email confirmation or logout).
  window.addEventListener('focus', () => { if (!busy) check(); });
  const confirmation = new URL(location.href).searchParams.get('confirmation');
  // Old/default Supabase email templates may append a fragment. Never use it as a login.
  if (location.hash || confirmation) history.replaceState(null, '', location.pathname);
  if (confirmation) {
    dialogKey = confirmation === 'success' ? 'confirmationSuccess' : confirmation === 'unavailable' ? 'authNotConfigured' : 'confirmationFailed';
    mode = 'login'; render(); dialog.showModal();
  }
  check();
})();
