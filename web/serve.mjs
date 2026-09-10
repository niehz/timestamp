// web/serve.mjs — 零依赖静态服务：serve 仓库根，/ 路由到 web/index.html
// 用法:
//   node web/serve.mjs            # 默认 http://127.0.0.1:8787
//   node web/serve.mjs --port 9000
//   node web/serve.mjs --open     # 自动打开浏览器
import http from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};

const args = process.argv.slice(2);
let port = 8787;
let openBrowser = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port') port = parseInt(args[i + 1], 10) || 8787;
  else if (args[i] === '--open') openBrowser = true;
}

function resolvePath(urlPath) {
  if (urlPath === '/' || urlPath === '') return join(ROOT, 'web', 'index.html');
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const abs = normalize(join(ROOT, decoded));
  if (abs !== ROOT && !abs.startsWith(ROOT + sep)) return null;
  if (!existsSync(abs) || statSync(abs).isDirectory()) {
    if (existsSync(abs) && statSync(abs).isDirectory()) return join(abs, 'index.html');
    return null;
  }
  return abs;
}

const server = http.createServer((req, res) => {
  const file = resolvePath(req.url || '/');
  if (!file || !existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}/`;
  console.log(`Timestamp Web 已启动: ${url}`);
  if (openBrowser) spawn('cmd', ['/c', 'start', '', url], { windowsVerbatimArguments: true, stdio: 'ignore' });
});