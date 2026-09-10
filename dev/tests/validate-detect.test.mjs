#!/usr/bin/env node
// dev/tests/validate-detect.test.mjs — 验证 convert.js 依赖的全局验证函数存在且正确
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFresh } from './harness.mjs';

test('validateTimestamp is a reachable global (convert.js depends on it)', () => {
  const { expr } = createFresh();
  assert.equal(expr('typeof validateTimestamp'), 'function');
  assert.equal(expr('validateTimestamp(1)'), true);
});

test('validateTimestamp boundary and invalid inputs', () => {
  const { expr } = createFresh();
  assert.equal(expr('validateTimestamp(0)'), true);
  assert.equal(expr('validateTimestamp(-8640000000000000)'), true);
  assert.equal(expr('validateTimestamp(8640000000000000)'), true);
  assert.equal(expr('validateTimestamp(NaN)'), false);
  assert.equal(expr('validateTimestamp(Infinity)'), false);
  assert.equal(expr('validateTimestamp(8640000000000001)'), false);
  assert.equal(expr('validateTimestamp(-8640000000000001)'), false);
});