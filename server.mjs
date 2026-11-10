// Static development server only: contributions never leave the browser.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.webm': 'video/webm'
};

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!filename.startsWith(root) || pathname.split('/').some(part => part.startsWith('.')) || !types[path.extname(filename)]) {
      response.writeHead(404).end('Not found');
      return;
    }
    const info = await stat(filename);
    if (!info.isFile()) throw new Error('Not a file');
    const headers = { 'Content-Type': types[path.extname(filename)], 'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes' };
    const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Math.min(range[2] ? Number(range[2]) : info.size - 1, info.size - 1);
      if (start > end || start >= info.size) {
        response.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end();
        return;
      }
      const data = await readFile(filename);
      response.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${info.size}` });
      response.end(data.subarray(start, end + 1));
    } else {
      response.writeHead(200, { ...headers, 'Content-Length': info.size });
      response.end(request.method === 'HEAD' ? undefined : await readFile(filename));
    }
  } catch {
    response.writeHead(404).end('Not found');
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`The Balikbayan Project: http://127.0.0.1:${port}`));