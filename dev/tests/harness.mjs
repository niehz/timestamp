import { createSandbox, loadModules } from '../scripts/load-test.mjs';
import vm from 'node:vm';

function normalize(v) {
  if (v === null || v === undefined || typeof v !== 'object') return v;
  return JSON.parse(JSON.stringify(v));
}

export function createFresh() {
  const sb = createSandbox();
  loadModules(sb);
  // Resolve the callee via eval: it sees both global object properties
  // (function declarations) and global lexical bindings (const arrows like pad).
  // Cross-script `globalThis[name]` lookups alone miss the lexical kind.
  vm.runInNewContext('globalThis.__call = (name, args) => eval(name)(...args);', sb);
  const call = (name, ...args) => normalize(vm.runInNewContext(
    '__call(' + JSON.stringify(name) + ', ' + JSON.stringify(args) + ')', sb
  ));
  const expr = (src) => normalize(vm.runInNewContext(src, sb));
  return { sb, call, expr };
}