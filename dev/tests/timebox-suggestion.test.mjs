// timebox-suggestion.test.mjs — 方案一：日期类建议在“时间框已有值”时带回时间框时间，
// 点击不再用 00:00 覆盖时间框。覆盖点：
// 1. parseTimeBoxValue：时间框值解析（纯函数，可注入）。
// 2. timeBoxSubstitute：午夜壁钟文本 → 时间框时间 + keep 标记。
// 3. buildSuggestions 端到端：注入 timeInputEl.value 后，日期建议显示当前时间并带 keepTime；
//    时间框为空或不含时间时保持 00:00 基线行为。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFresh } from './harness.mjs';

function freshWithTime(v) {
  const f = createFresh();
  if (v != null) f.expr('timeInputEl.value = ' + JSON.stringify(String(v)));
  return f;
}

test('parseTimeBoxValue: 合法值', () => {
  const { call } = createFresh();
  assert.deepEqual(call('parseTimeBoxValue', '15:00'), { h: 15, mi: 0, se: 0 });
  assert.deepEqual(call('parseTimeBoxValue', '15:00:00'), { h: 15, mi: 0, se: 0 });
  assert.deepEqual(call('parseTimeBoxValue', '15:00:00.5'), { h: 15, mi: 0, se: 0 });
  assert.deepEqual(call('parseTimeBoxValue', '3:05'), { h: 3, mi: 5, se: 0 });
  assert.deepEqual(call('parseTimeBoxValue', '23:59:59'), { h: 23, mi: 59, se: 59 });
  assert.deepEqual(call('parseTimeBoxValue', ' 15:00 '), { h: 15, mi: 0, se: 0 });
});

test('parseTimeBoxValue: 非法值 => null', () => {
  const { call } = createFresh();
  assert.equal(call('parseTimeBoxValue', ''), null);
  assert.equal(call('parseTimeBoxValue', '15:'), null);
  assert.equal(call('parseTimeBoxValue', '24:00'), null);
  assert.equal(call('parseTimeBoxValue', '15:61'), null);
  assert.equal(call('parseTimeBoxValue', '15:00:61'), null);
  assert.equal(call('parseTimeBoxValue', 'abc'), null);
});

test('timeBoxSubstitute: 午夜壁钟文本替换为时间框时间并标记保持', () => {
  const { call } = createFresh();
  assert.deepEqual(call('timeBoxSubstitute', '2020-01-01 00:00:00', { h: 15, mi: 0, se: 0 }, 'parts'),
    { wall: '2020-01-01 15:00:00', keep: true });
  assert.deepEqual(call('timeBoxSubstitute', '2020-01-01 00:00:00', { h: 9, mi: 5, se: 30 }, 'parts'),
    { wall: '2020-01-01 09:05:30', keep: true });
});

test('timeBoxSubstitute: 非午夜/非 parts/空 => 不替换', () => {
  const { call } = createFresh();
  assert.deepEqual(call('timeBoxSubstitute', '2020-01-01 13:49:08', { h: 15, mi: 0, se: 0 }, 'parts'),
    { wall: '2020-01-01 13:49:08', keep: false });
  assert.deepEqual(call('timeBoxSubstitute', '2020-01-01 00:00:00', { h: 15, mi: 0, se: 0 }, 'abs'),
    { wall: '2020-01-01 00:00:00', keep: false });
  assert.deepEqual(call('timeBoxSubstitute', null, { h: 15, mi: 0, se: 0 }, 'parts'),
    { wall: null, keep: false });
});

test('buildSuggestions: 时间框为空 => 日期建议保持 00:00 且无 keepTime', () => {
  const { call } = createFresh();
  const items = call('buildSuggestions', '2020-01-01');
  const exact = items.filter(i => i.date === '2020-01-01 00:00:00');
  assert.equal(exact.length, 1);
  assert.ok(!exact[0].keepTime);
  assert.ok(items.every(i => !i.keepTime));
});

test('buildSuggestions: 时间框已有 15:00 => 日期建议显示 15:00 并带 keepTime', () => {
  const { call } = freshWithTime('15:00');
  const items = call('buildSuggestions', '2020-01-01');
  const hit = items.filter(i => i.date === '2020-01-01 15:00:00');
  assert.equal(hit.length, 1);
  assert.equal(hit[0].keepTime, true);
  assert.ok(!items.some(i => i.date === '2020-01-01 00:00:00'));
});

test('buildSuggestions: 文本自带时间 => 用文本时间，不标记 keepTime', () => {
  const { call } = freshWithTime('15:00');
  const items = call('buildSuggestions', '2020-01-01 09:30');
  const hit = items.filter(i => i.date === '2020-01-01 09:30:00');
  assert.equal(hit.length, 1);
  assert.ok(!hit[0].keepTime);
});

test('buildSuggestions: 月份快捷（2020-01）第15/末日带时间框时间', () => {
  const { call } = freshWithTime('18:05:30');
  const items = call('buildSuggestions', '2020-01');
  const d15 = items.filter(i => i.date === '2020-01-15 18:05:30');
  const last = items.filter(i => i.date === '2020-01-31 18:05:30');
  assert.equal(d15.length, 1);
  assert.equal(d15[0].keepTime, true);
  assert.equal(last.length, 1);
  assert.equal(last[0].keepTime, true);
});

test('buildSuggestions: 仅年份（2020）快捷同样带回时间框时间', () => {
  const { call } = freshWithTime('7:05');
  const items = call('buildSuggestions', '2020');
  const yEnd = items.find(i => i.date === '2020-01-01 07:05:00');
  assert.ok(yEnd);
  assert.equal(yEnd.keepTime, true);
});

test('buildSuggestions: 非纯日期文本不误替换（未含 midnight 后缀）', () => {
  const { call } = freshWithTime('15:00');
  const items = call('buildSuggestions', '2020-01-01 00:00');
  const hit = items.filter(i => i.date === '2020-01-01 00:00:00');
  assert.equal(hit.length, 1);
  assert.ok(!hit[0].keepTime);
});