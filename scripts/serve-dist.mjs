/**
 * Minimal static server for the built site, mounted under the GitHub Pages
 * base path so local checks behave like production:
 *
 *   npm run build && npm run serve   →  http://localhost:4321/noodlestall/
 *
 * Unknown paths return dist/404.html with a 404 status, as GitHub Pages does.
 * Used by the Playwright tests; no dependencies.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const PORT = Number(process.env.PORT ?? 4321);
const BASE = (process.env.SITE_BASE ?? '/noodlestall/').replace(/\/?$/, '/');
const DIST = resolve(process.cwd(), 'dist');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

function send(res, file, status = 200) {
  res.writeHead(status, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}

function notFound(res) {
  const page = join(DIST, '404.html');
  if (existsSync(page)) return send(res, page, 404);
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('Not found');
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === BASE.slice(0, -1)) {
    res.writeHead(301, { location: BASE });
    return res.end();
  }
  if (!pathname.startsWith(BASE)) return notFound(res);

  pathname = pathname.slice(BASE.length);
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, safe);
  if (!file.startsWith(DIST)) return notFound(res);

  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!url.pathname.endsWith('/')) {
      res.writeHead(301, { location: `${url.pathname}/${url.search}` });
      return res.end();
    }
    file = join(file, 'index.html');
  }

  if (existsSync(file) && statSync(file).isFile()) return send(res, file);
  return notFound(res);
});

server.listen(PORT, () => {
  console.log(`Serving ${DIST} at http://localhost:${PORT}${BASE}`);
});
