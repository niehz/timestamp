#!/usr/bin/env node
// validate.mjs — Static checks for the timestamp plugin
// Usage: node dev/scripts/validate.mjs [--json] [--verbose]

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const VERBOSE = args.includes('--verbose');
const checksArg = args.find(a => a.startsWith('--checks='));
const REQUIRED = checksArg
  ? checksArg.slice('--checks='.length).split(',').map(s => s.trim()).filter(Boolean)
  : ['js', 'plugin', 'html', 'i18n', 'split'];

const ENABLED = {
  js: REQUIRED.includes('js'),
  plugin: REQUIRED.includes('plugin'),
  html: REQUIRED.includes('html'),
  i18n: REQUIRED.includes('i18n'),
  split: REQUIRED.includes('split'),
};

let failures = 0;
let warnings = 0;
const results = [];

function fail(id, msg, detail) { failures++; results.push({ id, status: 'FAIL', msg, detail: detail || '' }); }
function warn(id, msg, detail) { warnings++; results.push({ id, status: 'WARN', msg, detail: detail || '' }); }
function pass(id, msg) { results.push({ id, status: 'PASS', msg }); }

// ─────────────────────────────────────────────
// 1. JS Syntax — node --check
// ─────────────────────────────────────────────
function checkJsSyntax() {
  const files = [];
  // Root index.js (if still exists)
  if (existsSync(resolve(ROOT, 'index.js'))) files.push('index.js');
  // js/ directory
  const jsDir = resolve(ROOT, 'js');
  if (existsSync(jsDir)) {
    for (const f of readdirSync(jsDir)) {
      if (f.endsWith('.js')) files.push('js/' + f);
    }
  }
  // Other root .js files (preload, etc.)
  for (const f of ['preload.js']) {
    if (existsSync(resolve(ROOT, f)) && !files.includes(f)) files.push(f);
  }

  for (const f of files) {
    try {
      execFileSync('node', ['--check', f], { cwd: ROOT, stdio: 'pipe', timeout: 10000 });
      pass(`js-syntax:${f}`, `${f} syntax OK`);
    } catch (e) {
      fail(`js-syntax:${f}`, `${f} syntax error`, (e.stderr || e.message).toString().trim());
    }
  }
}

// ─────────────────────────────────────────────
// 2. plugin.json validation (uTools format)
// ─────────────────────────────────────────────
function checkPluginJson() {
  const p = resolve(ROOT, 'plugin.json');
  if (!existsSync(p)) { fail('plugin:exists', 'plugin.json missing'); return; }
  let data;
  try {
    data = JSON.parse(readFileSync(p, 'utf8'));
    pass('plugin:parse', 'plugin.json valid JSON');
  } catch (e) {
    fail('plugin:parse', 'plugin.json invalid JSON', e.message);
    return;
  }

  // Essential executable fields
  for (const key of ['main', 'version']) {
    if (!data[key]) fail(`plugin:${key}`, `plugin.json missing "${key}"`);
  }
  // Informational, not blocking
  for (const key of ['name', 'developer']) {
    if (!data[key]) warn(`plugin:${key}`, `plugin.json missing "${key}" (informational)`);
  }

  // Enumerated files exist
  for (const key of ['main', 'logo', 'preload']) {
    if (data[key] && !existsSync(resolve(ROOT, data[key]))) {
      fail(`plugin:${key}:file`, `plugin.json "${key}" references ${data[key]} — file not found`);
    }
  }

  const features = data.features || [];
  if (!Array.isArray(features)) {
    fail('plugin:features', 'plugin.json "features" must be an array');
    features.length = 0;
  }
  if (features.length === 0) {
    warn('plugin:features:empty', 'plugin.json has no features — no entry commands');
  }

  let allCmds = [];
  for (const [fi, feat] of features.entries()) {
    if (!feat.code) fail(`plugin:feature:${fi}:code`, `features[${fi}] missing "code"`);
    if (!Array.isArray(feat.cmds) || feat.cmds.length === 0) {
      fail(`plugin:feature:${fi}:cmds`, `features[${fi}] must have non-empty "cmds" array`);
      continue;
    }
    for (const [ci, cmd] of feat.cmds.entries()) {
      const label = typeof cmd === 'string' ? cmd : (cmd.label || `features[${fi}].cmds[${ci}]`);
      if (typeof cmd === 'string') {
        if (!cmd.trim()) fail(`plugin:feature:${fi}:cmd:${ci}`, 'Empty keyword cmd');
        continue;
      }
      if (cmd.type === 'regex') {
        if (!cmd.match) fail(`plugin:feature:${fi}:cmd:${ci}`, `"${label}" regex cmd missing "match"`);
        if (!/^\/.+\/[a-z]*$/i.test(cmd.match || '')) {
          fail(`plugin:feature:${fi}:cmd:${ci}`, `"${label}" match "${cmd.match}" is not a /regex/flags literal`);
        }
        if (cmd.minLength != null && cmd.maxLength != null && cmd.minLength > cmd.maxLength) {
          fail(`plugin:feature:${fi}:cmd:${ci}`, `"${label}" minLength(${cmd.minLength}) > maxLength(${cmd.maxLength})`);
        }
      } else {
        fail(`plugin:feature:${fi}:cmd:${ci}`, `"${label}" object cmd must have type "regex"`);
      }
      allCmds.push({ feat: feat.code, cmd, label });
    }
  }

  const tsRegexCmds = allCmds.filter(c => c.feat === 'timestamp-regex' && c.cmd.type === 'regex');
  for (const needed of [10, 13, 16, 19]) {
    if (!tsRegexCmds.some(c => {
      const min = c.cmd.minLength ?? 0;
      const max = c.cmd.maxLength ?? Infinity;
      return needed >= min && needed <= max;
    })) {
      warn('plugin:ts-regex', `No timestamp-regex cmd covers ${needed}-digit input`);
    }
  }
}

// ─────────────────────────────────────────────
// 3. HTML id uniqueness
// ─────────────────────────────────────────────
function checkHtmlIds() {
  const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
  const idRe = /\bid="([^"]+)"/g;
  const seen = new Map();
  let m;
  while ((m = idRe.exec(html)) !== null) {
    const id = m[1];
    const prev = seen.get(id) || 0;
    seen.set(id, prev + 1);
  }
  const dupes = [...seen.entries()].filter(([, n]) => n > 1);
  if (dupes.length) {
    for (const [id, n] of dupes) {
      fail(`html:id:${id}`, `id="${id}" appears ${n} times`);
    }
  } else {
    pass('html:ids', `${seen.size} unique ids, no duplicates`);
  }
}

// ─────────────────────────────────────────────
// 4. I18n key consistency
// ─────────────────────────────────────────────
function extractI18nKeys(source) {
  const result = { zh: new Set(), en: new Set() };
  for (const lang of ['zh', 'en']) {
    // Match `zh: {` or `en: {`
    const langRe = new RegExp(`\\b${lang}\\s*:\\s*\\{`);
    const match = langRe.exec(source);
    if (!match) continue;
    let start = match.index + match[0].length;
    let depth = 1;
    let i = start;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === "'" || ch === '"') {
        // skip string
        const quote = ch;
        i++;
        while (i < source.length && source[i] !== quote) {
          if (source[i] === '\\') i++; // skip escaped
          i++;
        }
      }
      i++;
    }
    const block = source.slice(start, i - 1);
    // Evaluate the literal block to get its real keys (immune to "Word:" inside values)
    try {
      const parsed = vm.runInNewContext('({' + block + '})');
      for (const key of Object.keys(parsed)) {
        result[lang].add(key);
      }
    } catch (e) {
      for (const km of block.matchAll(/(?<=^|[\s,{])['"]?([a-zA-Z_$][\w$]*)['"]?\s*:/gm)) {
        result[lang].add(km[1]);
      }
    }
  }
  return result;
}

function extractDataI18nKeys(html) {
  const keys = new Set();
  // data-i18n="key"
  for (const m of html.matchAll(/\bdata-i18n="([^"]+)"/g)) keys.add(m[1]);
  // data-i18n-title="key"
  for (const m of html.matchAll(/\bdata-i18n-title="([^"]+)"/g)) keys.add(m[1]);
  // data-i18n-ph="key"
  for (const m of html.matchAll(/\bdata-i18n-ph="([^"]+)"/g)) keys.add(m[1]);
  return keys;
}

function extractTCalls(sources) {
  const keys = new Set();
  for (const src of sources) {
    // t('key') or t("key")
    for (const m of src.matchAll(/\bt\(\s*['"]([a-zA-Z0-9_$]+)['"]\s*\)/g)) {
      keys.add(m[1]);
    }
  }
  return keys;
}

function checkI18n() {
  // Find i18n source: prefer js/i18n.js, fall back to root index.js
  let i18nSource = '';
  for (const p of ['js/i18n.js', 'index.js']) {
    const full = resolve(ROOT, p);
    if (existsSync(full)) { i18nSource = readFileSync(full, 'utf8'); break; }
  }
  if (!i18nSource) { fail('i18n:source', 'No i18n source file found'); return; }

  const keys = extractI18nKeys(i18nSource);
  if (!keys.zh.size) { fail('i18n:zh', 'No zh keys found in I18N'); return; }
  if (!keys.en.size) { fail('i18n:en', 'No en keys found in I18N'); return; }

  // zh === en key sets
  const zhOnly = [...keys.zh].filter(k => !keys.en.has(k));
  const enOnly = [...keys.en].filter(k => !keys.zh.has(k));
  if (zhOnly.length) fail('i18n:keys:zh-only', `Keys only in zh: ${zhOnly.join(', ')}`);
  if (enOnly.length) fail('i18n:keys:en-only', `Keys only in en: ${enOnly.join(', ')}`);
  if (!zhOnly.length && !enOnly.length) pass('i18n:keys', `${keys.zh.size} keys in both zh and en`);

  // data-i18n / data-i18n-title keys exist in I18N
  const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
  const htmlKeys = extractDataI18nKeys(html);
  const missingHtml = [...htmlKeys].filter(k => !keys.zh.has(k) || !keys.en.has(k));
  if (missingHtml.length) {
    fail('i18n:html-keys', `data-i18n/data-i18n-title keys missing from I18N: ${missingHtml.join(', ')}`);
  } else {
    pass('i18n:html-keys', `${htmlKeys.size} HTML i18n keys all exist in I18N`);
  }

  // t() calls in JS exist in I18N
  const jsFiles = [];
  if (existsSync(resolve(ROOT, 'index.js'))) jsFiles.push(resolve(ROOT, 'index.js'));
  const jsDir = resolve(ROOT, 'js');
  if (existsSync(jsDir)) {
    for (const f of readdirSync(jsDir)) {
      if (f.endsWith('.js')) jsFiles.push(resolve(jsDir, f));
    }
  }
  const jsSources = jsFiles.map(f => readFileSync(f, 'utf8'));
  const tKeys = extractTCalls(jsSources);
  const missingT = [...tKeys].filter(k => !keys.zh.has(k) || !keys.en.has(k));
  if (missingT.length) {
    fail('i18n:t-calls', `t() keys missing from I18N: ${missingT.join(', ')}`);
  } else {
    pass('i18n:t-calls', `${tKeys.size} t() calls all have corresponding I18N keys`);
  }
}

// ─────────────────────────────────────────────
// 5. Local file references in HTML
// ─────────────────────────────────────────────
function checkHtmlRefs() {
  const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
  const refs = new Set();
  for (const m of html.matchAll(/\bsrc="([^"]+)"/g)) {
    const ref = m[1].split(/[?#]/)[0];
    if (ref && !ref.startsWith('http')) refs.add(ref);
  }
  for (const m of html.matchAll(/\bhref="([^"]+)"/g)) {
    const ref = m[1].split(/[?#]/)[0];
    if (ref && !ref.startsWith('http')) refs.add(ref);
  }
  const missing = [];
  for (const ref of refs) {
    const full = resolve(ROOT, ref);
    if (!existsSync(full)) missing.push(ref);
  }
  if (missing.length) {
    fail('html:refs', `Missing local file references: ${missing.join(', ')}`);
  } else {
    pass('html:refs', `${refs.size} local references all resolve`);
  }
}

// ─────────────────────────────────────────────
// 6. No leftover root index.js when js/ split exists
// ─────────────────────────────────────────────
function checkNoRedundantIndexJs() {
  const hasJsDir = existsSync(resolve(ROOT, 'js'));
  const hasRootIndexJs = existsSync(resolve(ROOT, 'index.js'));
  if (hasJsDir && hasRootIndexJs) {
    warn('split:index-js', 'Both js/ directory and root index.js exist — verify split is complete');
  } else if (hasJsDir && !hasRootIndexJs) {
    pass('split:index-js', 'Split complete: root index.js removed');
  } else {
    pass('split:index-js', 'No split in progress (single index.js)');
  }
}

// ─────────────────────────────────────────────
// Run all checks
// ─────────────────────────────────────────────
console.log('🔍 Running validation checks...\n');

if (ENABLED.js) checkJsSyntax();
if (ENABLED.plugin) checkPluginJson();
if (ENABLED.html) checkHtmlIds();
if (ENABLED.i18n) checkI18n();
if (ENABLED.html) checkHtmlRefs();
if (ENABLED.split) checkNoRedundantIndexJs();

// Output
if (JSON_OUT) {
  console.log(JSON.stringify({ failures, warnings, results }, null, 2));
} else {
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️ ' : '❌';
    console.log(`${icon} [${r.id}] ${r.msg}`);
    if (r.detail && (r.status === 'FAIL' || VERBOSE)) {
      console.log(`   ${r.detail}`);
    }
  }
  console.log('');
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  console.log(`Results: ${passed}/${total} passed, ${failures} failed, ${warnings} warnings`);
}

process.exit(failures > 0 ? 1 : 0);
