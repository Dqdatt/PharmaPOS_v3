// Server dev cho test iPhone qua HTTPS tunnel: phục vụ pwa/dist + chuyển tiếp Supabase local cùng origin.
// Chạy: npm run serve:pwa (cổng 4176) rồi `cloudflared tunnel --url http://localhost:4176`.
// shortcut: chỉ dùng cho dev/test local, không dùng làm server thật.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT || 4176);
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const SUPABASE = { host: '127.0.0.1', port: 54321 };
const PROXY = /^\/(auth|rest|functions|storage)\/v1\//;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

http.createServer(async (req, res) => {
  if (PROXY.test(req.url)) {
    const up = http.request({ ...SUPABASE, path: req.url, method: req.method,
      headers: { ...req.headers, host: `${SUPABASE.host}:${SUPABASE.port}` } }, (r) => {
      res.writeHead(r.statusCode, r.headers);
      r.pipe(res);
    });
    up.on('error', () => { res.writeHead(502); res.end('Supabase local chưa chạy'); });
    return req.pipe(up);
  }
  const path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const file = join(DIST, path.endsWith('/') ? 'index.html' : path);
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(PORT, () => console.log(`PWA + proxy Supabase: http://localhost:${PORT}`));
