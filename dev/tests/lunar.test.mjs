import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFresh } from './harness.mjs';

const { call } = createFresh();

function l(y, m, d) {
  return call('lunarOf', y, m, d);
}

test('lunar: 春节锚点均为正月初一', () => {
  for (const [y, m, d] of [
    [1900, 1, 31],
    [2000, 2, 5],
    [2020, 1, 25],
    [2023, 1, 22],
    [2024, 2, 10],
    [2025, 1, 29],
    [2026, 2, 17],
    [2100, 2, 9],
  ]) {
    const r = l(y, m, d);
    assert.notEqual(r, null, `${y}-${m}-${d} 应有农历`);
    assert.equal(r.m, 1, `${y}-${m}-${d} 应为正月`);
    assert.equal(r.d, 1, `${y}-${m}-${d} 应为初一`);
    assert.equal(r.isLeap, false, `${y}-${m}-${d} 不应为闰月`);
  }
});

test('lunar: 已知对照日期', () => {
  assert.deepEqual(l(1949, 10, 1), { y: 1949, m: 8, d: 10, isLeap: false }); // 开国大典 八月初十
  assert.deepEqual(l(2023, 3, 22), { y: 2023, m: 2, d: 1, isLeap: true }); // 闰二月初一
  assert.deepEqual(l(2023, 4, 1), { y: 2023, m: 2, d: 11, isLeap: true });
  assert.deepEqual(l(2024, 9, 17), { y: 2024, m: 8, d: 15, isLeap: false }); // 中秋节
  assert.deepEqual(l(2100, 12, 31), { y: 2100, m: 12, d: 1, isLeap: false }); // 尾边界 腊月初一
});

test('lunar: 1900 下限前与 2100 覆盖后返回 null', () => {
  assert.equal(l(1899, 12, 31), null);
  for (let d = 1; d <= 30; d++) assert.equal(l(1900, 1, d), null, `1900-1-${d} 应在下限前`);
  assert.notEqual(l(1900, 1, 31), null);
  assert.equal(l(2101, 1, 1), null);
  assert.equal(l(2101, 1, 27), null); // 农历 2100 表仅覆盖至 腊月初一
  assert.equal(l(2101, 1, 28), null);
  assert.equal(l(3000, 1, 1), null);
  assert.equal(l(-271820, 1, 1), null);
});

test('lunar: 非法入参返回 null', () => {
  assert.equal(l(2024, 13, 1), null);
  assert.equal(l(2024, 0, 1), null);
  assert.equal(l(2024, 1, 32), null);
  assert.equal(l(2024, 1, 0), null);
  assert.equal(l(undefined, 1, 1), null);
  assert.equal(l('abc', 2, 10), null);
});

test('lunar: 农历日中文表示', () => {
  const day = (d) => call('lunarDayCn', d);
  assert.equal(day(1), '初一');
  assert.equal(day(4), '初四');
  assert.equal(day(10), '初十');
  assert.equal(day(15), '十五');
  assert.equal(day(19), '十九');
  assert.equal(day(20), '二十');
  assert.equal(day(21), '廿一');
  assert.equal(day(29), '廿九');
  assert.equal(day(30), '三十');
});

test('lunar: 农历月中文表示（含闰月）', () => {
  const mon = (m, isLeap) => call('lunarMonthCn', m, isLeap);
  assert.equal(mon(1, false), '正月');
  assert.equal(mon(8, true), '闰八月');
  assert.equal(mon(11, false), '冬月');
  assert.equal(mon(12, false), '腊月');
});