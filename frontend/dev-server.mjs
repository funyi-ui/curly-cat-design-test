// Local static preview only. This is not an authentication or production server.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/i18n.js', ['i18n.js', 'text/javascript; charset=utf-8']],
  ['/member-locales.js', ['member-locales.js', 'text/javascript; charset=utf-8']],
  ['/member.js', ['member.js', 'text/javascript; charset=utf-8']],
  ['/member.css', ['member.css', 'text/css; charset=utf-8']],
  ['/cat.png', ['cat.png', 'image/png']],
  ['/room.png', ['room.png', 'image/png']]
]);
const port = 5173;
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
  }
  let pathname;
  try { pathname = new URL(request.url, 'http://127.0.0.1').pathname; }
  catch { response.writeHead(400); response.end('Bad request'); return; }
  const asset = files.get(pathname);
  if (!asset) { response.writeHead(404); response.end('Not found'); return; }
  try {
    const bytes = await readFile(new URL(asset[0], import.meta.url));
    response.writeHead(200, { 'Content-Type': asset[1], 'Content-Length': bytes.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch {
    response.writeHead(500); response.end('Cannot read local asset. Check the frontend folder.');
  }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is already in use. Stop the other preview with Ctrl+C and try again.`
    : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Curly Cat local preview: http://127.0.0.1:${port}`);
  console.log('Save changes, then refresh the browser. Stop with Ctrl+C.');
});
