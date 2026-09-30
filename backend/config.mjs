import { z } from 'zod';

export function readConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const origin = env.APP_ORIGIN || 'http://127.0.0.1:5173';
  const parsed = z.string().url().parse(origin);
  const url = new URL(parsed);
  if (url.origin !== origin || (production && url.protocol !== 'https:')) {
    throw new Error('APP_ORIGIN must be an origin without a trailing slash; production requires HTTPS.');
  }
  const provided = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'DATABASE_URL', 'SESSION_SECRET'];
  const missing = provided.filter(key => !env[key]);
  if (missing.length && production) throw new Error(`Missing settings: ${missing.join(', ')}`);
  if (!missing.length) {
    const authUrl = new URL(env.SUPABASE_URL);
    if (authUrl.protocol !== 'https:') throw new Error('SUPABASE_URL requires HTTPS.');
    if (env.SESSION_SECRET.length < 48) throw new Error('SESSION_SECRET requires at least 48 characters.');
    if (!/^postgres(ql)?:\/\//.test(env.DATABASE_URL)) throw new Error('DATABASE_URL must be a PostgreSQL connection URL.');
    if (env.SUPABASE_PUBLISHABLE_KEY.startsWith('sb_secret_')) throw new Error('Use a publishable key, not an admin secret key.');
    // Legacy anon JWTs are supported, but a service_role JWT must not be used.
    if (env.SUPABASE_PUBLISHABLE_KEY.startsWith('eyJ')) {
      try {
        const claims = JSON.parse(Buffer.from(env.SUPABASE_PUBLISHABLE_KEY.split('.')[1], 'base64url'));
        if (claims.role !== 'anon') throw new Error('wrong role');
      } catch { throw new Error('Use a publishable key or legacy anon key.'); }
    }
  }
  const port = Number(env.PORT || 5173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT.');
  return { production, origin, port, configured: !missing.length, missing,
    supabaseUrl: env.SUPABASE_URL, supabaseKey: env.SUPABASE_PUBLISHABLE_KEY,
    databaseUrl: env.DATABASE_URL, sessionSecret: env.SESSION_SECRET };
}
