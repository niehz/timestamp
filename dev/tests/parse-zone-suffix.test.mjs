// parse-zone-suffix.test.mjs — 回归测试：
// 1. "HH:mm UTC+08:00" 一类组合时区后缀此前会被 splitZone 拆成【数值偏移 + 残留 UTC】，
//    残留部分再被 iso 的 Date.parse 捷径解释，导致偏移静默丢失（12:00 UTC+08:00 → 12:00Z 而非 04:00Z）。
// 2. "3:00 PM" 的 am/pm 此前被 splitZone 当未知时区令牌剥离，静默丢失 12 小时语义。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox, loadModules } from '../scripts/load-test.mjs';
import vm from 'node:vm';

function fresh() {
  const sb = createSandbox();
  loadModules(sb);
  vm.runInNewContext(
    'globalThis.__call = (name, args) => { const fn = globalThis[name] !== undefined ? globalThis[name] : eval(name); return fn.apply(null, args); };',
    sb
  );
  const call = (name, ...args) => JSON.parse(vm.runInNewContext(
    'JSON.stringify(__call(' + JSON.stringify(name) + ', ' + JSON.stringify(args) + '))', sb
  ));
  return { sb, call };
}

const { call } = fresh();
const parseDateEx = (s) => call('parseDateEx', s);
const splitZone = (s) => call('splitZone', s);
const dateToMs = (pe, tz) => call('dateToMs',
  { y: pe.y, mo: pe.mo, d: pe.d, h: pe.h, mi: pe.mi, se: pe.s, ms: pe.ms || 0 }, tz);

test('splitZone: UTC+08:00 组合令牌整体识别，不留残留 UTC', () => {
  const r = splitZone('2020-01-01 12:00 UTC+08:00');
  assert.equal(r.base, '2020-01-01 12:00');
  assert.deepEqual(r.tz, { label: '+08:00', offset: 480, value: 'FIXED:+0800' });
});

test('splitZone: UTC+8 / GMT-5:30 / GMT+0800 变体', () => {
  assert.deepEqual(splitZone('2020-01-01 12:00 UTC+8').tz, { label: '+08:00', offset: 480, value: 'FIXED:+0800' });
  assert.deepEqual(splitZone('2020-01-01 12:00 GMT-5:30').tz, { label: '-05:30', offset: -330, value: 'FIXED:-0530' });
  assert.deepEqual(splitZone('2020-01-01 12:00 GMT+0800').tz, { label: '+08:00', offset: 480, value: 'FIXED:+0800' });
});

test('splitZone: 无偏移的 UTC / Z / 纯 +0800 行为不变', () => {
  assert.deepEqual(splitZone('2020-01-01 12:00 UTC').tz, { label: 'UTC', value: 'UTC', offset: 0 });
  assert.deepEqual(splitZone('2020-01-01T12:00:00Z').tz, { label: 'UTC', value: 'UTC', offset: 0 });
  assert.deepEqual(splitZone('2020-01-01 12:00 +0800').tz, { label: '+08:00', offset: 480, value: 'FIXED:+0800' });
});

test('splitZone: am/pm 不再被当作未知时区剥离', () => {
  const r = splitZone('2020-01-01 3:00 PM');
  assert.equal(r.tz, null);
  assert.equal(r.base, '2020-01-01 3:00 PM');
});

test('UTC+08:00 端到端：12:00 +08:00 => 04:00Z (1577851200000)', () => {
  const pe = parseDateEx('2020-01-01 12:00 UTC+08:00');
  assert.equal(pe.mode, 'parts');
  assert.equal(pe.h, 12);
  assert.equal(pe.tz.value, 'FIXED:+0800');
  assert.equal(dateToMs(pe, pe.tz.value), 1577851200000);
});

test('UTC+8 / GMT+08:00 与 UTC+0800 同一瞬时', () => {
  for (const s of ['2020-01-01 12:00 UTC+8', '2020-01-01 12:00 GMT+08:00', '2020-01-01 12:00 UTC+0800']) {
    const pe = parseDateEx(s);
    assert.equal(pe.mode, 'parts', s);
    assert.equal(dateToMs(pe, pe.tz.value), 1577851200000, s);
  }
});

test('RFC 形式带偏移仍解析为同一瞬时（绝对值由机器本地语义给出）', () => {
  const pe = parseDateEx('Sun, 01 Jan 2020 12:00:00 UTC+08:00');
  assert.equal(pe.mode, 'abs');
  assert.equal(pe.abs, Date.parse('Sun, 01 Jan 2020 12:00:00'));
});

test('am/pm：3:00 PM => h=15，12:00 am => h=0，12:00 PM => h=12', () => {
  assert.equal(parseDateEx('2020-01-01 3:00 PM').h, 15);
  assert.equal(parseDateEx('2020-01-01 3:00 pm').h, 15);
  assert.equal(parseDateEx('2020-01-01 12:00 am').h, 0);
  assert.equal(parseDateEx('2020-01-01 12:00AM').h, 0);
  assert.equal(parseDateEx('2020-01-01 12:00 pm').h, 12);
  assert.equal(parseDateEx('2020-01-01 3:00:13 PM').h, 15);
});

test('am/pm：数字格式 1/1/2020 3:05 pm => h=15 mi=5', () => {
  const pe = parseDateEx('1/1/2020 3:05 pm');
  assert.equal(pe.h, 15);
  assert.equal(pe.mi, 5);
});

test('am/pm 端到端：3:00 PM + 上海时区 => 07:00Z (1577862000000)', () => {
  const pe = parseDateEx('2020-01-01 3:00 PM');
  assert.equal(dateToMs(pe, 'Asia/Shanghai'), 1577862000000);
  assert.equal(dateToMs(parseDateEx('2020-01-01 12:00 am'), 'Asia/Shanghai'), 1577808000000);
});

test('回归：无偏移/纯 Z/纯偏移解析不受影响', () => {
  assert.equal(parseDateEx('2020-01-01 12:00 UTC').tz.value, 'UTC');
  assert.equal(parseDateEx('2020-01-01T12:00:00Z').tz.value, 'UTC');
  assert.equal(parseDateEx('2020-01-01 12:00 +0800').tz.value, 'FIXED:+0800');
  assert.equal(parseDateEx('2020-01-01 12:00 JST').tz.value, 'FIXED:+0900');
});