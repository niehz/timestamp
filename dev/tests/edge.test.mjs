#!/usr/bin/env node
// dev/tests/edge.test.mjs — 边界条件与健壮性测试
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFresh } from './harness.mjs';

test('validYmd rejects impossible month/day edge cases', () => {
  const { call } = createFresh();
  assert.equal(call('validYmd', 2026, 0, 1), false);   // month 0
  assert.equal(call('validYmd', 2026, 13, 1), false);  // month 13
  assert.equal(call('validYmd', 2026, 4, 31), false);  // Apr 31
  assert.equal(call('validYmd', 2026, 12, 31), true);  // Dec 31 ok
  assert.equal(call('validYmd', 1900, 2, 29), false);  // non-leap 1900
  assert.equal(call('validYmd', 2000, 2, 29), true);   // leap 2000
});

test('parseOffsetInput rejects offsets beyond the real +/-14h window', () => {
  const { call } = createFresh();
  assert.equal(call('parseOffsetInput', '+14'), 840);
  assert.equal(call('parseOffsetInput', '-12'), -720);
  assert.equal(call('parseOffsetInput', '+1400'), 840);  // +14:00 is valid
  assert.equal(call('parseOffsetInput', '-1260'), null); // exceeds -12h
});

test('fracToMs safely handles rounding and malformed input', () => {
  const { call } = createFresh();
  assert.equal(call('fracToMs', '0.9999'), 999);
  assert.equal(call('fracToMs', '5'), 500);
  assert.equal(call('fracToMs', '5.0'), 0);
  assert.equal(Number.isNaN(call('fracToMs', 'abc')), true); // caller regex-guards
});

test('validateTimestamp guards the convert pipeline inputs', () => {
  const { expr } = createFresh();
  assert.equal(expr('validateTimestamp(0)'), true);
  assert.equal(expr('validateTimestamp(8640000000000000)'), true);
  assert.equal(expr('validateTimestamp(8640000000000000 + 1)'), false);
  assert.equal(expr('validateTimestamp(NaN)'), false);
  assert.equal(expr('validateTimestamp(undefined)'), false);
  assert.equal(expr('validateTimestamp("123")'), false);
});

test('parseDateEx stays null for hostile / malformed input', () => {
  const { call } = createFresh();
  assert.equal(call('parseDateEx', '0000-00-00'), null);
  assert.equal(call('parseDateEx', '2026-13-01'), null);
  assert.equal(call('parseDateEx', '2026-02-30'), null);
  assert.equal(call('parseDateEx', '2026/0/0'), null);
  assert.equal(call('parseDateEx', '99999-99-99'), null);
});