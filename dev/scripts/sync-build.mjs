#!/usr/bin/env node
// sync-build.mjs — 单向同步根目录前端产物 → web/build，并在被引用内容有变更时自动更新缓存戳。
//
// 设计要点：
//  1. 白名单：index.html / index.css / logo.png / js/** / assets/**（build 独有的 sw.js、
//     web-boot.js、manifest.webmanifest 等一律不动）。
//  2. 缓存戳：对 index.html 引用的本地文件内容做聚合哈希；哈希相对上一状态未变 → 保留原戳；
//     有变更 → 用 Date.now() 统一替换根与 build 两处 index.html 的 ?v= 值（杜绝人肉双改）。
//     首次运行（无状态文件）时沿用 index.html 现有戳，避免无意义的首次 diff。
//  3. 同步记录保存在 dev/scripts/.sync-state.json（已 gitignore），其中 synced 用于清理
//     曾经同步过、现已从根移除的镜像文件（如 js/utils/validators.js）。
//
// 用法：node dev/scripts/sync-build.mjs [--check]

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, rmSync } from 'node:fs';
import { resolve, dirname, join, relative, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const BUILD = resolve(ROOT, 'web', 'build');
const STATE_FILE = resolve(__dirname, '.sync-state.json');

const VERBOSE = process.argv.includes('--verbose');

function toPosix(p) { return p.split(sep).join(posix.sep); }

const EXCLUDE_DIRS = new Set(['js/timezone']);

function walk(dir, base, out) {
  const relBase = toPosix(relative(base, dir));
  for (const ent of readdirSync(dir)) {
    const full = join(dir, ent);
    const rel = toPosix(relative(base, full));
    const st = statSync(full);
    if (st.isDirectory()) {
      const relDir = `${relBase}${relBase ? '/' : ''}${ent}`;
      if (EXCLUDE_DIRS.has(relDir)) continue;
      walk(full, base, out);
    } else {
      out.push(rel);
    }
  }
  return out;
}

function whitelist() {
  const out = ['index.html', 'index.css', 'logo.png'];
  for (const sub of ['js', 'assets']) {
    const dir = resolve(ROOT, sub);
    if (existsSync(dir)) walk(dir, ROOT, out);
  }
  return out;
}

function readRefs(html) {
  // 本地 src/href 引用（剥离 ?v= 查询串），用于内容哈希
  const refs = [];
  for (const m of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    const ref = m[1].split(/[?#]/)[0];
    if (ref && ref !== 'index.html' && !ref.startsWith('http') && !/^(?:mailto:|javascript:)/.test(ref)) {
      refs.push(ref);
    }
  }
  return [...new Set(refs)];
}

function contentHashFor(refs) {
  const h = createHash('sha1');
  let missing = [];
  for (const ref of sortedByDepth(refs)) {
    const full = resolve(ROOT, ref);
    if (!existsSync(full)) { missing.push(ref); continue; }
    h.update(readFileSync(full));
    h.update('\u0000');
  }
  return { hash: h.digest('hex'), missing };
}

function sortedByDepth(refs) {
  return [...refs].sort((a, b) => b.split('/').length - a.split('/').length);
}

function currentStamp(html) {
  const m = /\?v=(\d+)/.exec(html);
  return m ? Number(m[1]) : 0;
}

function loadState() {
  try {
    if (existsSync(STATE_FILE)) return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {}
  return null;
}

function saveState(state) { writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); }

function plan() {
  const htmlPath = resolve(ROOT, 'index.html');
  const html = readFileSync(htmlPath, 'utf8');
  const refs = readRefs(html);
  const { hash, missing } = contentHashFor(refs);
  const state = loadState();
  const stampChanged = !state || state.hash !== hash;
  const stamp = state ? (stampChanged ? Date.now() : state.stamp) : (currentStamp(html) || Date.now());
  const newHtml = html.replace(/\?v=\d+/g, '?v=' + stamp);
  const stampUpdated = newHtml !== html && (state ? state.stamp !== stamp : currentStamp(html) !== stamp);
  return { refs, hash, missing, state, stamp, stampChanged, stampUpdated, newHtml, htmlOriginal: html };
}

function expectedContents(p) {
  // 统一以 Buffer 承载，保证二进制资源（png 等）比对与写出无损
  const out = new Map();
  for (const rel of p.whitelistFiles) {
    const full = resolve(ROOT, rel);
    if (!existsSync(full)) continue;
    const content = rel === 'index.html' ? Buffer.from(p.newHtml, 'utf8') : readFileSync(full);
    out.set(rel, content);
  }
  return out;
}

function runCheck() {
  const files = whitelist();
  const p = plan();
  const expected = expectedContents({ ...p, whitelistFiles: files });
  const diffs = [];
  for (const [rel, content] of expected) {
    const target = resolve(BUILD, rel);
    if (!existsSync(target)) {
      diffs.push(`missing:${rel}`);
      continue;
    }
    if (!readFileSync(target).equals(content)) diffs.push(`diff:${rel}`);
  }
  const staleSynced = (p.state && p.state.synced || []).filter(rel => !files.includes(rel));
  for (const rel of staleSynced) {
    if (existsSync(resolve(BUILD, rel))) diffs.push(`stale:${rel}`);
  }
  return { diffs, stamp: p.stamp, stampUpdated: p.stampUpdated, missing: p.missing, expected };
}

function runApply() {
  const files = whitelist();
  const p = plan();
  const expected = expectedContents({ ...p, whitelistFiles: files });
  let copied = 0;
  let stalePruned = 0;
  for (const [rel, content] of expected) {
    const target = resolve(BUILD, rel);
    if (existsSync(target) && readFileSync(target).equals(content)) continue;
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
    copied++;
  }
  const stale = (p.state && p.state.synced || []).filter(rel => !files.includes(rel));
  for (const rel of stale) {
    const target = resolve(BUILD, rel);
    if (existsSync(target)) { rmSync(target); stalePruned++; }
  }
  if (p.stampUpdated) writeFileSync(resolve(ROOT, 'index.html'), p.newHtml);
  saveState({ stamp: p.stamp, hash: p.hash, synced: files });
  return { copied, stalePruned, stamp: p.stamp, stampUpdated: p.stampUpdated, missing: p.missing };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const CHECK = process.argv.includes('--check');
  if (CHECK) {
    const r = runCheck();
    if (r.missing.length) {
      console.log(`❌ [build] 引用文件缺失：${r.missing.join(', ')}`);
      process.exit(1);
    }
    if (r.diffs.length) {
      console.log('❌ [build] web/build 与根目录不同步：');
      for (const d of r.diffs) console.log(`   - ${d}`);
      console.log('\n运行 `npm run build:web` 同步。');
      process.exit(1);
    }
    console.log(`✅ [build] web/build 与根目录同步（缓存戳 v${r.stamp}${r.stampUpdated ? '' : ''}）`);
    process.exit(0);
  }
  const r = runApply();
  console.log(`✅ [build] 同步完成：复制 ${r.copied} 个文件，清理 ${r.stalePruned} 个旧镜像。`);
  if (r.stampUpdated) console.log(`   ℹ 内容有变更，缓存戳已更新为 v${r.stamp}（根与 build 双端）`);
  else if (VERBOSE) console.log(`   ℹ 内容未变，缓存戳保持 v${r.stamp}`);
  if (r.missing.length) {
    console.log(`   ⚠ 忽略缺失引用：${r.missing.join(', ')}`);
  }
  process.exit(r.missing.length ? 1 : 0);
}

export { runCheck, runApply };