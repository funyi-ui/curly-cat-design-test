import express from 'express';
import { installLiuyao } from './liuyao.mjs';
import session from 'express-session';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const frontend = fileURLToPath(new URL('../frontend/', import.meta.url));
const credentials = z.object({
  email: z.string().trim().max(254).email().transform(value => value.toLowerCase()),
  password: z.string().min(1).max(128)
}).strict();
const publicUser = user => ({ id: user.id, email: user.email });
const save = req => new Promise((resolve, reject) => {
  if (req.res.destroyed) return reject(new Error('Request disconnected'));
  req.session.save(error => error ? reject(error) : resolve());
});
const regenerate = req => new Promise((resolve, reject) => {
  if (req.res.destroyed) return reject(new Error('Request disconnected'));
  req.session.regenerate(error => error ? reject(error) : resolve());
});
const destroy = req => new Promise((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve()));
const failure = (res, status, code) => res.status(status).json({ error: code });
const unavailable = error => !error?.status || error.status >= 500 || error.name === 'AuthRetryableFetchError';
function providerFailure(res, error, signup = false) {
  if (unavailable(error)) return failure(res, 503, 'serviceUnavailable');
  if (error.status === 429 || /rate_limit|over_request/.test(error.code || '')) return failure(res, 429, 'tooManyAttempts');
  if (error.code === 'email_not_confirmed') return failure(res, 403, 'emailNotConfirmed');
  if (error.code === 'weak_password') return failure(res, 400, 'weakPassword');
  // Avoid account enumeration. Never echo provider messages, credentials or tokens.
  return failure(res, signup ? 400 : 401, signup ? 'signupFailed' : 'invalidCredentials');
}

export function createApp({ config, store, provider, limits = {}, liuyao }) {
  if (config.configured && (!store || !provider)) throw new Error('Authentication requires a database session store and provider.');
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use(helmet({
    strictTransportSecurity: config.production ? undefined : false,
    contentSecurityPolicy: { directives: {
      defaultSrc: ["'self'"], scriptSrc: ["'self'"], scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"], frameAncestors: ["'none'"], formAction: ["'self'"],
      upgradeInsecureRequests: config.production ? [] : null
    } }, referrerPolicy: { policy: 'no-referrer' }
  }));
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  const cookieName = config.production ? '__Host-cat-session' : 'cat-session';
  const clearCookie = res => res.clearCookie(cookieName, { path: '/', httpOnly: true, sameSite: 'lax', secure: config.production });
  const limiter = max => rateLimit({ windowMs: 15 * 60 * 1000, limit: max,
    standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (_req, res) => failure(res, 429, 'tooManyAttempts') });
  app.use('/api', limiter(limits.api ?? 240));
  app.use('/api', (req, res, next) => {
    if (!config.configured) return failure(res, 503, 'authNotConfigured');
    next();
  });
  // One local Node process: serialize requests carrying the same session cookie BEFORE
  // express-session loads the row. A slow refresh must not recreate a logged-out session.
  // A multi-instance deployment needs a distributed equivalent (see README).
  const sessionQueues = new Map();
  app.use('/api', async (req, res, next) => {
    const match = (req.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]*)`));
    if (!match) return next();
    let value = match[1].trim().replace(/^"|"$/g, '');
    try { value = decodeURIComponent(value); } catch { /* Invalid cookie is rejected by express-session. */ }
    const key = createHash('sha256').update(value).digest('hex');
    const previous = sessionQueues.get(key) || Promise.resolve();
    let unlock;
    const queued = new Promise(resolve => { unlock = resolve; });
    sessionQueues.set(key, queued);
    await previous;
    let released = false;
    const release = () => {
      if (released) return;
      released = true; clearTimeout(timer); unlock();
      if (sessionQueues.get(key) === queued) sessionQueues.delete(key);
    };
    const timer = setTimeout(release, 90000); timer.unref();
    req.releaseAuthQueue = release;
    res.once('finish', release);
    if (res.destroyed) { release(); return; }
    next();
  });
  const guarded = handler => async (req, res) => {
    try { await handler(req, res); }
    finally { req.releaseAuthQueue?.(); }
  };
  if (config.configured) app.use('/api', session({
    name: cookieName, secret: config.sessionSecret, store, resave: false, saveUninitialized: false,
    rolling: false, cookie: { httpOnly: true, secure: config.production, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 }
  }));
  // Reject cross-site requests before parsing credentials. Same-origin JSON + CSRF token required.
  app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD'].includes(req.method)) return next();
    if (req.get('origin') !== config.origin) return failure(res, 403, 'requestRejected');
    if (!req.is('application/json')) return failure(res, 415, 'invalidInput');
    const actual = req.get('x-csrf-token') || '';
    const expected = req.session.csrf || '';
    if (!expected || Buffer.byteLength(actual) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) {
      return failure(res, 403, 'requestRejected');
    }
    next();
  });
  app.locals.liuyaoControl = installLiuyao(app, { configuration: liuyao, config, currentUser, guarded });
  app.use('/api', express.json({ limit: '4kb' }));
  async function currentUser(req, res) {
    let tokens = req.session.tokens;
    if (!tokens) return null;
    if (tokens.expires_at <= Math.floor(Date.now() / 1000) + 30) {
      const refreshed = await provider.refresh(tokens.refresh_token);
      if (refreshed.error) {
        if (unavailable(refreshed.error)) throw new Error('Provider unavailable');
        await destroy(req); clearCookie(res); return null;
      }
      if (!refreshed.data.session || refreshed.data.session.user.id !== req.session.memberId) {
        await destroy(req); clearCookie(res); return null;
      }
      const result = refreshed.data.session;
      req.session.tokens = tokens = { access_token: result.access_token, refresh_token: result.refresh_token, expires_at: result.expires_at };
      await save(req);
    }
    const result = await provider.getUser(tokens.access_token);
    if (result.error || !result.data.user || result.data.user.id !== req.session.memberId) {
      if (result.error && unavailable(result.error)) throw new Error('Provider unavailable');
      await destroy(req); clearCookie(res); return null;
    }
    return publicUser(result.data.user);
  }
  async function establish(req, result) {
    await regenerate(req); // Prevent session fixation; drop all anonymous session state.
    req.session.memberId = result.user.id;
    req.session.tokens = { access_token: result.access_token, refresh_token: result.refresh_token, expires_at: result.expires_at };
    req.session.csrf = randomBytes(32).toString('hex');
    await save(req);
    return { user: publicUser(result.user), csrfToken: req.session.csrf };
  }
  app.get('/api/auth/state', guarded(async (req, res) => {
    if (Object.keys(req.query).length) return failure(res, 400, 'invalidInput');
    const user = await currentUser(req, res);
    // An invalid authenticated session may have been destroyed; return 401 so client can retry.
    if (!req.session) return failure(res, 401, 'sessionExpired');
    req.session.csrf ||= randomBytes(32).toString('hex');
    await save(req);
    res.json({ user, csrfToken: req.session.csrf });
  }));
  const loginLimit = limiter(limits.login ?? 15);
  const signupLimit = limiter(limits.signup ?? 5);
  const emailLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: limits.email ?? 10,
    keyGenerator: req => createHash('sha256').update(typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : 'invalid').digest('hex'),
    standardHeaders: 'draft-8', legacyHeaders: false, handler: (_req, res) => failure(res, 429, 'tooManyAttempts') });
  async function authenticate(req, res, signup) {
    const input = credentials.safeParse(req.body);
    if (!input.success || (signup && (input.data.password.length < 12 || !/[a-zA-Z]/.test(input.data.password) || !/[0-9]/.test(input.data.password)))) {
      return failure(res, 400, signup ? 'invalidSignupInput' : 'invalidInput');
    }
    if (req.session.tokens) return failure(res, 409, 'alreadySignedIn');
    const result = await provider[signup ? 'signup' : 'login'](input.data);
    if (result.error) return providerFailure(res, result.error, signup);
    if (signup) {
      // Confirmation ON is required. Do not treat signUp's response as proof of identity.
      if (result.data.session) {
        await provider.logout(result.data.session);
        return failure(res, 503, 'emailConfirmationRequired');
      }
      return res.status(202).json({ message: 'checkEmail' });
    }
    if (!result.data.session?.user?.id) return failure(res, 503, 'serviceUnavailable');
    res.json(await establish(req, result.data.session));
  }
  app.post('/api/auth/signup', signupLimit, emailLimit, guarded((req, res) => authenticate(req, res, true)));
  app.post('/api/auth/login', loginLimit, emailLimit, guarded((req, res) => authenticate(req, res, false)));
  app.post('/api/auth/logout', guarded(async (req, res) => {
    const tokens = req.session.tokens;
    let revoked = true;
    try { if (tokens) revoked = !(await provider.logout(tokens)).error; }
    catch { revoked = false; }
    // Local server session is invalidated even if the provider is temporarily unavailable.
    await destroy(req); clearCookie(res);
    res.json({ message: revoked ? 'loggedOut' : 'loggedOutLocally' });
  }));
  app.get('/api/member/notebook', guarded(async (req, res) => {
    const user = await currentUser(req, res);
    if (!user) return failure(res, 401, 'signInRequired');
    // Self-only API. Never accept a caller-supplied member ID.
    if (Object.keys(req.query).length) return failure(res, 400, 'invalidInput');
    res.json({ ownerId: user.id, entries: [], storageEnabled: false });
  }));
  app.use('/api', (_req, res) => failure(res, 404, 'notFound'));
  app.get('/auth/confirm', limiter(10), async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!config.configured) return res.redirect('/?confirmation=unavailable');
    const token = req.query.token_hash;
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) return res.redirect('/?confirmation=failed');
    const { error } = await provider.confirm(token);
    res.redirect(error ? '/?confirmation=failed' : '/?confirmation=success');
  });
  const assets = new Set(['index.html', 'style.css', 'app.js', 'i18n.js', 'cat.png', 'room.png', 'member.js', 'member-locales.js', 'member.css', 'liuyao.js']);
  app.use((req, res, next) => {
    const name = req.path === '/' ? 'index.html' : req.path.slice(1);
    if (!['GET', 'HEAD'].includes(req.method) || !assets.has(name)) return next();
    res.set('Cache-Control', 'no-store');
    res.sendFile(name, { root: frontend });
  });
  app.use((_req, res) => res.sendStatus(404));
  app.use((error, req, res, _next) => {
    req.releaseAuthQueue?.();
    if (res.headersSent) return;
    if (req.path === '/auth/confirm') return res.redirect('/?confirmation=failed');
    const malformed = error.type === 'entity.parse.failed' || error.type === 'entity.too.large';
    failure(res, malformed ? 400 : 503, malformed ? 'invalidInput' : 'serviceUnavailable');
  });
  return app;
}
