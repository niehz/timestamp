// round6-payload.test.mjs — 第六轮修复回归：
// 1. normalizeEnterPayload：onPluginEnter / URL 载荷分发——负时间戳、千分位分组、
//    非整码长度、关键字前缀此前落入剪贴板兜底，现按统一归一化分发。
// 2. flashCopied 无 DOM 断言（样式层），此处验证纯分发逻辑与 focus 分支。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFresh } from './harness.mjs';

function norm(call, p) {
  const r = call('normalizeEnterPayload', p);
  if (r && r.parts) r.parts = '<<parts>>';
  return r;
}

test('normalizeEnterPayload: 标准位长时间戳分发到对应 tab', () => {
  const { call } = createFresh();
  assert.deepEqual(norm(call, '1700000000'), { kind: 'ts', value: '1700000000', tab: 'sec' });
  assert.deepEqual(norm(call, '1700000000000'), { kind: 'ts', value: '1700000000000', tab: 'ms' });
  assert.deepEqual(norm(call, '1700000000000000'), { kind: 'ts', value: '1700000000000000', tab: 'us' });
  assert.deepEqual(norm(call, '1700000000000000000'), { kind: 'ts', value: '1700000000000000000', tab: 'ns' });
});

test('normalizeEnterPayload: 负时间戳不再落入剪贴板兜底', () => {
  const { call } = createFresh();
  assert.deepEqual(norm(call, '-1700000000'), { kind: 'ts', value: '-1700000000', tab: 'sec' });
  assert.deepEqual(norm(call, '-1710000000000'), { kind: 'ts', value: '-1710000000000', tab: 'ms' });
});

test('normalizeEnterPayload: 千分位/空格/引号噪音剥离', () => {
  const { call } = createFresh();
  assert.deepEqual(norm(call, '1,700,000,000'), { kind: 'ts', value: '1700000000', tab: 'sec' });
  assert.deepEqual(norm(call, '1 700 000 000'), { kind: 'ts', value: '1700000000', tab: 'sec' });
  assert.deepEqual(norm(call, "1'700'000'000"), { kind: 'ts', value: '1700000000', tab: 'sec' });
});

test('normalizeEnterPayload: 非整码长度按当前 tab 原样填充', () => {
  const { call } = createFresh();
  assert.deepEqual(norm(call, '123456789'), { kind: 'ts', value: '123456789', tab: null });
  assert.deepEqual(norm(call, '123456789012'), { kind: 'ts', value: '123456789012', tab: null });
  assert.deepEqual(norm(call, '12345678901234567890'), { kind: 'ts', value: '12345678901234567890', tab: null });
});

test('normalizeEnterPayload: 关键字前缀剥离后分发', () => {
  const { call } = createFresh();
  assert.deepEqual(norm(call, 'ts 1700000000'), { kind: 'ts', value: '1700000000', tab: 'sec' });
  assert.deepEqual(norm(call, '时间戳:1700000000'), { kind: 'ts', value: '1700000000', tab: 'sec' });
  assert.deepEqual(norm(call, 'timestamp 1700000000000'), { kind: 'ts', value: '1700000000000', tab: 'ms' });
});

test('normalizeEnterPayload: 日期串走 parseDateEx 不回 ts', () => {
  const { call } = createFresh();
  const r = norm(call, '2026-09-13 12:00:00');
  assert.equal(r.kind, 'date');
  assert.equal(r.parts, '<<parts>>');
  const r2 = norm(call, '2026/09/13');
  assert.equal(r2.kind, 'date');
});

test('normalizeEnterPayload: 空载荷走剪贴板兜底', () => {
  const { call } = createFresh();
  assert.deepEqual(norm(call, ''), { kind: 'empty' });
  assert.deepEqual(norm(call, null), { kind: 'empty' });
  assert.deepEqual(norm(call, '   '), { kind: 'empty' });
});

test('normalizeEnterPayload: 无法解析的非数字回退剪贴板', () => {
  const { call } = createFresh();
  assert.deepEqual(norm(call, 'hello world'), { kind: 'clipboard' });
  assert.deepEqual(norm(call, '1700000000.1'), { kind: 'clipboard' });
});

test('normalizeEnterPayload: 既有日期不再被剥成数字时间戳', () => {
  const { call } = createFresh();
  const r = norm(call, '2026');
  assert.equal(r.kind, 'date');
  const r2 = norm(call, '2026-09-13');
  assert.equal(r2.kind, 'date');
});