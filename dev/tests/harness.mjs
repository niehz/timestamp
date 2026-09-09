import { createSandbox, loadModules, defineCallBridge } from '../scripts/load-test.mjs';
import vm from 'node:vm';

function normalize(v) {
  if (v === null || v === undefined || typeof v !== 'object') return v;
  return JSON.parse(JSON.stringify(v));
}

export function createFresh() {
  const sb = createSandbox();
  loadModules(sb);
  // __call resolves function declarations via globalThis, but `const`-declared
  // arrows (e.g. pad) are global *lexical* bindings, so fall back to eval.
  vm.runInNewContext(
    'globalThis.__call = (name, args) => { const fn = globalThis[name] !== undefined ? globalThis[name] : eval(name); return fn.apply(null, args); };',
    sb
  );
  const call = (name, ...args) => normalize(vm.runInNewContext(
    '__call(' + JSON.stringify(name) + ', ' + JSON.stringify(args) + ')', sb
  ));
  const expr = (src) => normalize(vm.runInNewContext(src, sb));
  return { sb, call, expr };
}