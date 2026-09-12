import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFresh } from './harness.mjs';

const { expr, call } = createFresh();

test('engine exposes IANA historical data for changing zones', () => {
  // 现代 V8/Chromium/Electron 的完整 ICU 含历史 tzdata；探测结果应区分 1850 与 2026。
  assert.equal(expr('tzHasHistoricalData("Asia/Shanghai")'), true);
  assert.equal(expr('tzHasHistoricalData("America/New_York")'), true);
  assert.equal(typeof expr('tzHasHistoricalData("Etc/UTC")'), 'boolean');
});

test('offsetMinutes: pre-1901 LMT keeps sub-minute seconds (Asia/Shanghai +08:05:43)', () => {
  const v = expr('offsetMinutes(new Date(Date.UTC(1900, 0, 1, 0, 0, 0)), "Asia/Shanghai")');
  assert.ok(Math.abs(v - (485 + 43 / 60)) < 1e-9, `got ${v}`);
});

test('offsetMinutes: Tokyo LMT +09:18:59', () => {
  const v = expr('offsetMinutes(new Date(Date.UTC(1870, 0, 1, 0, 0, 0)), "Asia/Tokyo")');
  assert.ok(Math.abs(v - (558 + 59 / 60)) < 1e-9, `got ${v}`);
});

test('offsetMinutes: New York LMT -04:56:02', () => {
  const v = expr('offsetMinutes(new Date(Date.UTC(1800, 0, 1, 0, 0, 0)), "America/New_York")');
  assert.ok(Math.abs(v - -(296 + 2 / 60)) < 1e-9, `got ${v}`);
});

test('offsetMinutes: zones outside the fallback table use engine history (Asia/Kolkata)', () => {
  const v = expr('offsetMinutes(new Date(Date.UTC(1850, 0, 1, 0, 0, 0)), "Asia/Kolkata")');
  assert.ok(Math.abs(v - (353 + 28 / 60)) < 1e-9, `got ${v}`);
});

test('offsetMinutes: modern offsets remain exact integers', () => {
  assert.equal(expr('offsetMinutes(new Date(Date.UTC(2026, 0, 1, 0, 0, 0)), "Asia/Shanghai")'), 480);
  assert.equal(expr('offsetMinutes(new Date(Date.UTC(2026, 0, 1, 0, 0, 0)), "Asia/Tokyo")'), 540);
  assert.equal(expr('offsetMinutes(new Date(Date.UTC(2026, 0, 1, 0, 0, 0)), "UTC")'), 0);
  assert.equal(expr('offsetMinutes(new Date(Date.UTC(2026, 0, 1, 0, 0, 0)), "FIXED:+0800")'), 480);
});

test('offsetMinutes: DST handled per season and per historical period', () => {
  // 纽约现代夏令时（修复了旧实现把全年都当成 EST 的问题）
  assert.equal(expr('offsetMinutes(new Date(Date.UTC(2026, 6, 1, 12, 0, 0)), "America/New_York")'), -240);
  assert.equal(expr('offsetMinutes(new Date(Date.UTC(2026, 0, 15, 12, 0, 0)), "America/New_York")'), -300);
  assert.equal(expr('offsetMinutes(new Date(Date.UTC(1990, 6, 1, 12, 0, 0)), "America/New_York")'), -240);
  // 东京 1948-1951 夏令时
  assert.equal(expr('offsetMinutes(new Date(Date.UTC(1950, 6, 1, 0, 0, 0)), "Asia/Tokyo")'), 600);
  // 中国 1986-1991 全国夏令时
  assert.equal(expr('offsetMinutes(new Date(Date.UTC(1990, 6, 1, 0, 0, 0)), "Asia/Shanghai")'), 540);
  assert.equal(expr('offsetMinutes(new Date(Date.UTC(1992, 6, 1, 0, 0, 0)), "Asia/Shanghai")'), 480);
});

test('formatTz: exact historical wall-clock including LMT seconds', () => {
  assert.equal(expr('formatTz(new Date(Date.UTC(1900, 0, 1, 0, 0, 0)), "Asia/Shanghai")'), '1900-01-01 08:05:43');
  assert.equal(expr('formatTz(new Date(Date.UTC(1870, 0, 1, 0, 0, 0)), "Asia/Tokyo")'), '1870-01-01 09:18:59');
  assert.equal(expr('formatTz(new Date(Date.UTC(1850, 0, 1, 0, 0, 0)), "Asia/Kolkata")'), '1850-01-01 05:53:28');
});

test('formatTz: century-year dates use historical LMT', () => {
  assert.equal(expr('formatTz(new Date(Date.UTC(1200, 5, 15, 12, 0, 0)), "Asia/Shanghai")'), '1200-06-15 20:05:43');
});

test('BC-era years keep LMT offset/wall-clock (era-less en-GB regression)', () => {
  // 回归：en-GB formatToParts 对公元前年份不输出 era（天文年 -1199 只返回 "1200"），
  // 旧实现把 -1199 误读成 +1200 年 → 偏移被算成 UTC+21029216:05:43。
  const ms = -99997491700 * 1000;
  assert.equal(expr('offsetMinutes(new Date(' + ms + '), "Asia/Shanghai")'), 485 + 43 / 60);
  assert.equal(expr('offsetLabel("Asia/Shanghai", new Date(' + ms + '))'), 'UTC+08:05:43');
  assert.equal(expr('formatTz(new Date(' + ms + '), "Asia/Shanghai")'), '-1199-03-16 23:04:03');
  assert.equal(expr('dateToMs({ y: -1199, mo: 3, d: 16, h: 23, mi: 4, se: 3 }, "Asia/Shanghai")'), ms);
});

test('formatTz: modern NY DST renders summer as EDT', () => {
  assert.equal(expr('formatTz(new Date(Date.UTC(2026, 6, 1, 12, 0, 0)), "America/New_York")'), '2026-07-01 08:00:00');
});

test('tzParts: wall-clock parts match formatted output', () => {
  assert.deepEqual(expr('tzParts(new Date(Date.UTC(1900, 0, 1, 0, 0, 0)), "Asia/Shanghai")'), {
    y: 1900, mo: 1, d: 1, h: 8, mi: 5, se: 43, ms: 0, wd: 1,
  });
});

test('dateToMs: reverse converts historical LMT wall time to UTC exactly', () => {
  // 08:05:43 的上海 LMT 墙钟 == 1900-01-01T00:00:00Z
  assert.equal(expr('dateToMs({ y: 1900, mo: 1, d: 1, h: 8, mi: 5, se: 43 }, "Asia/Shanghai")'), Date.UTC(1900, 0, 1));
});

test('formatOffset renders sub-minute LMT offsets', () => {
  assert.equal(call('formatOffset', 485 + 43 / 60), 'UTC+08:05:43');
  assert.equal(call('formatOffset', -(296 + 2 / 60)), 'UTC-04:56:02');
  assert.equal(call('formatOffset', 480), 'UTC+08:00');
  assert.equal(call('formatOffset', -330), 'UTC-05:30');
  assert.equal(call('formatOffset', 0), 'UTC+00:00');
});

test('getHistoricalOffset: fallback table (for engines without history)', () => {
  assert.ok(Math.abs(expr('getHistoricalOffset(new Date(Date.UTC(1200, 0, 1)), "Asia/Shanghai")') - (485 + 43 / 60)) < 1e-9);
  assert.ok(Math.abs(expr('getHistoricalOffset(new Date(Date.UTC(1870, 0, 1)), "Asia/Tokyo")') - (558 + 59 / 60)) < 1e-9);
  // 1990 年 6 月：上海全国夏令时窗口
  assert.equal(expr('getHistoricalOffset(new Date(Date.UTC(1990, 5, 1)), "Asia/Shanghai")'), 540);
  // 2000 年 6 月：无夏令时
  assert.equal(expr('getHistoricalOffset(new Date(Date.UTC(2000, 5, 1)), "Asia/Shanghai")'), 480);
  // 纽约：1 月 EST、7 月 EDT
  assert.equal(expr('getHistoricalOffset(new Date(Date.UTC(2026, 0, 15)), "America/New_York")'), -300);
  assert.equal(expr('getHistoricalOffset(new Date(Date.UTC(2026, 6, 1)), "America/New_York")'), -240);
  // 不在回退表中的时区返回 null
  assert.equal(expr('getHistoricalOffset(new Date(Date.UTC(1900, 0, 1)), "Asia/Kolkata")'), null);
});

test('offsetMinutes: pre-1970 sub-second instants keep exact LMT offset (no floor-ceiling bug)', () => {
  // 回归：date.getTime() % 1000 对负周期向零截断，使 1970 前 .ms>0 时刻被上取整到下一秒 → 偏移少 1 秒。
  const sh = expr('offsetMinutes(new Date(Date.UTC(1900, 0, 1, 0, 0, 0) + 500), "Asia/Shanghai")');
  assert.ok(Math.abs(sh - (485 + 43 / 60)) < 1e-9, `got ${sh}`);
  const tk = expr('offsetMinutes(new Date(Date.UTC(1870, 0, 1, 0, 0, 0) + 123), "Asia/Tokyo")');
  assert.ok(Math.abs(tk - (558 + 59 / 60)) < 1e-9, `got ${tk}`);
  const ny = expr('offsetMinutes(new Date(Date.UTC(1800, 0, 1, 0, 0, 0) + 900), "America/New_York")');
  assert.ok(Math.abs(ny - -(296 + 2 / 60)) < 1e-9, `got ${ny}`);
});

test('dateToMs: fractional-second pre-1970 LMT input round-trips exactly', () => {
  // 08:05:43.100 的上海 LMT 墙钟 == 1900-01-01T00:00:00.100Z
  const v = expr('dateToMs({ y: 1900, mo: 1, d: 1, h: 8, mi: 5, se: 43, ms: 100 }, "Asia/Shanghai")');
  assert.equal(v, Date.UTC(1900, 0, 1) + 100);
});

test('offsetMinutes: invalid date without tz returns 0 (no NaN leak)', () => {
  assert.equal(expr('offsetMinutes(new Date("x"), "")'), 0);
  assert.equal(expr('offsetMinutes(new Date("x"), null)'), 0);
  assert.equal(expr('offsetMinutes(new Date(NaN), "Asia/Shanghai")'), 0);
  // 正常无时区路径不受影响
  assert.equal(typeof expr('offsetMinutes(new Date(), "")'), 'number');
});