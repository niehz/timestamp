#!/usr/bin/env node
// load-test.mjs — smoke-test that the js/ modules load without runtime errors,
// and reusable harness for unit tests (dev/tests/*.test.mjs).
//
// Classic scripts share the browser global lexical scope, so concatenating the
// modules in load order reproduces single-file semantics. A permissive DOM
// stub is provided so load-time rendering/binding code paths can run.

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

export const ORDER = ['utils/constants', 'data/timezones', 'i18n', 'utils/error-handler', 'utils/storage', 'core', 'datetime', 'fields', 'calendar', 'convert', 'tzselector', 'events'];

export function makeUniv() {
  let proxy;
  const f = function () { return proxy; };
  proxy = new Proxy(f, {
    get(t, p) {
      if (p === 'valueOf' || p === 'toString') return () => '';
      if (p === Symbol.toPrimitive) return (hint) => (hint === 'number' ? 0 : '');
      if (typeof p === 'symbol') return undefined;
      if (p === 'length') return 0;
      return proxy;
    },
    has() { return true; },
    set() { return true; },
  });
  return proxy;
}

export function makeEl() {
  const handlers = {
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    getElementById: () => null,
    setAttribute: () => {},
    getAttribute: () => null,
    focus: () => {},
    blur: () => {},
    appendChild: () => null,
    removeChild: () => null,
    remove: () => {},
    closest: () => null,
    matches: () => false,
    contains: () => false,
    insertBefore: () => null,
    getBoundingClientRect: () => ({ top: 0, left: 0, height: 0, width: 0 }),
    classList: new Proxy({}, { get: () => () => {}, set: () => true, has: () => true }),
    style: new Proxy({}, { get: () => '', set: () => true, has: () => true }),
    dataset: {},
  };
  const univ = makeUniv();
  return new Proxy(handlers, {
    get(t, p) {
      if (p === '__isStub') return true;
      if (Reflect.has(t, p)) return t[p];
      return univ;
    },
    set(t, p, v) { if (typeof p === 'string') t[p] = v; return true; },
    has() { return true; },
  });
}

function storageFactory() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    clear: () => { map.clear(); },
  };
}

class MutationObserverStub { constructor() {} observe() {} disconnect() {} takeRecords() { return []; } }

export function createSandbox() {
  const documentStub = new Proxy({
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    getElementById: () => makeEl(),
    createElement: () => makeEl(),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: makeEl(),
    head: makeEl(),
    documentElement: makeEl(),
    title: '',
  }, {
    get(t, p) {
      if (Reflect.has(t, p)) return t[p];
      return makeEl();
    },
    set(t, p, v) { if (typeof p === 'string') t[p] = v; return true; },
    has() { return true; },
  });

  const windowObj = {
    addEventListener: () => {},
    matchMedia: () => ({ matches: true, addEventListener: () => {}, addListener: () => {}, removeListener: () => {} }),
    requestAnimationFrame: () => 0,
    utools: undefined,
    innerWidth: 1200,
    innerHeight: 800,
  };

  const sandbox = {
    console,
    document: documentStub,
    window: windowObj,
    self: windowObj,
    top: windowObj,
    localStorage: storageFactory(),
    sessionStorage: storageFactory(),
    navigator: { language: 'zh-CN', userAgent: 'load-test', platform: 'win32' },
    location: { href: 'about:blank', hostname: 'load-test', origin: 'null', pathname: '/' },
    history: { pushState: () => {}, replaceState: () => {} },
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    MutationObserver: MutationObserverStub,
    performance: { now: () => Date.now() },
    Intl, Date, Math, RegExp, Map, Set, Array, Object, String, Number, Boolean, JSON, Promise,
    isNaN, parseFloat, parseInt, isFinite,
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
  };
  return sandbox;
}

export function moduleCode() {
  const files = ORDER.map(n => `js/${n}.js`);
  return files.map(f => readFileSync(resolve(ROOT, f), 'utf8')).join('\n;\n');
}

export function loadModules(sandbox) {
  vm.runInNewContext(moduleCode(), sandbox, { filename: 'plugin.js' });
  return sandbox;
}

export function defineCallBridge(sandbox) {
  vm.runInNewContext('globalThis.__call = (name, args) => globalThis[name].apply(null, args);', sandbox);
}

export function call(sandbox, name, ...args) {
  defineCallBridge(sandbox);
  return vm.runInNewContext('__call(' + JSON.stringify(name) + ', ' + JSON.stringify(args) + ')', sandbox);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Direct invocation: smoke test only.
  const missing = ORDER.map(n => `js/${n}.js`).filter(f => {
    try { readFileSync(resolve(ROOT, f)); return false; } catch { return true; }
  });
  if (missing.length) {
    console.error(`Missing modules: ${missing.join(', ')}`);
    process.exit(1);
  }
  const jsDir = resolve(ROOT, 'js');
  const walkJs = (dir) => {
    const files = [];
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const rel = resolve(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === 'timezone') continue;
        files.push(...walkJs(rel));
      } else if (ent.name.endsWith('.js')) {
        files.push(relative(jsDir, rel).replace(/\\/g, '/').replace(/\.js$/, ''));
      }
    }
    return files;
  };
  const extra = walkJs(jsDir).filter(f => !ORDER.includes(f));
  if (extra.length) console.warn(`Extra .js files not in load order (ignored): ${extra.join(', ')}`);

  try {
    loadModules(createSandbox());
    console.log('✅ load-test OK: all modules loaded in order, no load-time errors.');
    process.exit(0);
  } catch (e) {
    console.error('❌ load-test FAILED (load-time error):');
    console.error(`   ${e.name}: ${e.message}`);
    if (e.stack) console.error(e.stack.split('\n').slice(0, 6).join('\n'));
    process.exit(1);
  }
}