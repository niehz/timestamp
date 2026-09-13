import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox, loadModules } from '../scripts/load-test.mjs';
import vm from 'node:vm';

function throwingStorage() {
  return {
    getItem() { throw new Error('Storage disabled'); },
    setItem() { throw new Error('Storage disabled'); },
    removeItem() { throw new Error('Storage disabled'); },
  };
}

function freshWithStorage(override) {
  const sb = createSandbox();
  if (override) sb.localStorage = override;
  loadModules(sb);
  vm.runInNewContext(
    'globalThis.__call = (name, args) => { const fn = globalThis[name] !== undefined ? globalThis[name] : eval(name); return fn.apply(null, args); };',
    sb
  );
  const call = (name, ...args) => vm.runInNewContext(
    '__call(' + JSON.stringify(name) + ', ' + JSON.stringify(args) + ')', sb
  );
  const expr = (src) => vm.runInNewContext(src, sb);
  return { sb, call, expr };
}

test('storage fallback: all localStorage ops throw → modules still initialize', () => {
  const { expr } = freshWithStorage(throwingStorage());
  assert.equal(expr('SYS_SETTINGS.defaultTab'), 'sec');
  assert.equal(expr('typeof safeGet'), 'function');
  assert.equal(expr('typeof safeSet'), 'function');
  assert.equal(expr('typeof safeRemove'), 'function');
});

test('storage fallback: safeGet returns null and safeSet/safeRemove do not throw', () => {
  const { call } = freshWithStorage(throwingStorage());
  assert.equal(call('safeGet', 'sys_settings'), null);
  assert.doesNotThrow(() => call('safeSet', 'sys_settings', '{}'));
  assert.doesNotThrow(() => call('safeRemove', 'sys_settings'));
});

test('storage normal: safeSet→safeGet round-trips through the sandbox storage', () => {
  const { call } = freshWithStorage(null);
  call('safeSet', 'roundtrip', 'v1');
  assert.equal(call('safeGet', 'roundtrip'), 'v1');
  call('safeRemove', 'roundtrip');
  assert.equal(call('safeGet', 'roundtrip'), null);
});