// round5-state.test.mjs — 第五轮修复回归：
// 1. cleanTsInput 拒绝小数/科学计数/十六进制粘贴（此前 stripTsNoise 会静默削成错值）。
// 2. applyParsedTz 同值短路（配合 inputTzEl change 监听防重入，另防重复 appendChild option）。
// 3. pickD2tMs / d2tKeyOf：歧义瞬时选择持久化。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFresh } from './harness.mjs';

test('cleanTsInput: 小数/科学计数/十六进制 => 拒绝并置空', () => {
  const { call } = createFresh();
  assert.equal(call('cleanTsInput', '1700000000.1'), '');
  assert.equal(call('cleanTsInput', '1.7e10'), '');
  assert.equal(call('cleanTsInput', '0x5F3759DF'), '');
  assert.equal(call('cleanTsInput', '1700000000.5'), '');
});

test('cleanTsInput: 常规时间戳与千分位剥离不受影响', () => {
  const { call } = createFresh();
  assert.equal(call('cleanTsInput', '1700000000'), '1700000000');
  assert.equal(call('cleanTsInput', '1,700,000,000'), '1700000000');
  assert.equal(call('cleanTsInput', '-1700000000'), '-1700000000');
  assert.equal(call('cleanTsInput', ' 1700000000 '), '1700000000');
});

test('cleanTsInput: 超长截断', () => {
  const { call } = createFresh();
  const out = call('cleanTsInput', '8'.repeat(25));
  assert.equal(out.length, 20);
});

test('applyParsedTz: 首次应用写入 inputTzEl，同值二次调用短路不重入', () => {
  const { call, expr } = createFresh();
  assert.equal(expr('inputTzEl.value'), 'Asia/Shanghai');
  call('applyParsedTz', { value: 'FIXED:+0800', label: '+08:00', offset: 480 });
  assert.equal(expr('inputTzEl.value'), 'FIXED:+0800');
  call('applyParsedTz', { value: 'FIXED:+0800', label: '+08:00', offset: 480 });
  assert.equal(expr('inputTzEl.value'), 'FIXED:+0800');
});

test('applyParsedTz: UTC 分支同值短路', () => {
  const { call, expr } = createFresh();
  call('applyParsedTz', { value: 'UTC', label: 'UTC', offset: 0 });
  assert.equal(expr('inputTzEl.value'), 'UTC');
  call('applyParsedTz', { value: 'UTC', label: 'UTC', offset: 0 });
  assert.equal(expr('inputTzEl.value'), 'UTC');
});

test('pickD2tMs: 匹配选择持续生效，输入变化回退默认（较早候选）', () => {
  const { call } = createFresh();
  const cands = [1577808000000, 1577782800000];
  const key = '2020-01-01 3:00:00.0.0.0@Asia/Shanghai';
  const sel = { key, ms: cands[1] };
  assert.equal(call('pickD2tMs', cands, sel, key, 0), cands[1]);
  assert.equal(call('pickD2tMs', cands, sel, 'another-key', 0), cands[0]);
  assert.equal(call('pickD2tMs', cands, null, key, 0), cands[0]);
  assert.equal(call('pickD2tMs', [cands[0]], sel, key, 0), 0);
  assert.equal(call('pickD2tMs', null, sel, key, 0), 0);
  const stale = { key, ms: 111 }; // 选择值已不在候选里
  assert.equal(call('pickD2tMs', cands, stale, key, 0), cands[0]);
});

test('d2tKeyOf: abs/空/错误 => null；墙钟输入含亚秒与时区', () => {
  const { call } = createFresh();
  assert.equal(call('d2tKeyOf', { empty: true }), null);
  assert.equal(call('d2tKeyOf', { err: true }), null);
  assert.equal(call('d2tKeyOf', { kind: 'abs', ms: 1 }), null);
  const k = call('d2tKeyOf', { y: 2020, mo: 1, d: 1, h: 3, mi: 0, se: 0, ms: 0, us: 0, ns: 0 });
  assert.ok(typeof k === 'string' && k.startsWith('2020-1-1 3:0:0.0.0.0@'));
});