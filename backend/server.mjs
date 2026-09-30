import 'dotenv/config';
import pg from 'pg';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { readConfig } from './config.mjs';
import { createAuthProvider } from './provider.mjs';
import { createApp } from './app.mjs';

const config = readConfig();
let pool;
let store;
if (config.configured) {
  // Run backend/schema.sql explicitly first. No automatic schema creation or admin API key.
  pool = new pg.Pool({ connectionString: config.databaseUrl, max: 5,
    connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000, statement_timeout: 10000 });
  await pool.query('SELECT 1 FROM private.member_sessions LIMIT 1');
  const PgStore = connectPgSimple(session);
  store = new PgStore({ pool, schemaName: 'private', tableName: 'member_sessions',
    createTableIfMissing: false, pruneSessionInterval: 900, errorLog: () => console.error('Session database unavailable.') });
} else {
  console.warn(`Member authentication is NOT connected. Missing: ${config.missing.join(', ')}`);
}
const app = createApp({ config, store, provider: config.configured ? createAuthProvider(config) : null });
// Local-only binding by default. A future deployment must explicitly configure its proxy.
const server = app.listen(config.port, '127.0.0.1', () => {
  console.log(`Cat fortune website: ${config.origin}`);
  console.log(config.configured ? 'Member authentication connected; verify using two real accounts.' : 'Design preview available; member authentication disabled.');
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? 'Port already in use. Stop the old preview with Ctrl+C.' : 'Server failed to start.');
  process.exitCode = 1;
});
async function shutdown() {
  server.close(async () => { store?.close(); await pool?.end(); process.exit(0); });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
