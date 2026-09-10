// web/scripts/build-standalone.mjs — 生成 web/build/ 自包含镜像（不污染共享文件）
// 供 Tauri 打包与纯离线部署使用；把 ../ 相对引用改写为 build 内本地路径。
// 用法: node web/scripts/build-standalone.mjs
import { mkdirSync, rmSync, cpSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..', '..');
const WEB = join(ROOT, 'web');
const BUILD = join(WEB, 'build');

rmSync(BUILD, { recursive: true, force: true });
mkdirSync(BUILD, { recursive: true });

cpSync(join(ROOT, 'index.css'), join(BUILD, 'index.css'));
cpSync(join(ROOT, 'logo.png'), join(BUILD, 'logo.png'));
cpSync(join(ROOT, 'assets'), join(BUILD, 'assets'), { recursive: true });
cpSync(join(ROOT, 'js'), join(BUILD, 'js'), { recursive: true });
cpSync(join(WEB, 'web-boot.js'), join(BUILD, 'web-boot.js'));
cpSync(join(WEB, 'manifest.webmanifest'), join(BUILD, 'manifest.webmanifest'));
if (existsSync(join(WEB, 'sw.js'))) cpSync(join(WEB, 'sw.js'), join(BUILD, 'sw.js'));

let html = readFileSync(join(WEB, 'index.html'), 'utf8');
html = html
  .replaceAll('../index.css', 'index.css')
  .replaceAll('../js/', 'js/')
  .replaceAll('../assets/', 'assets/')
  .replaceAll('../logo.png', 'logo.png');
writeFileSync(join(BUILD, 'index.html'), html);

console.log(`✅ 已生成自包含镜像: ${BUILD}`);