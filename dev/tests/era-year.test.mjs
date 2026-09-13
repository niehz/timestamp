import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFresh } from './harness.mjs';

const { call } = createFresh();

test('years outside SAFE range are rejected at parse', () => {
  assert.equal(call('parseDateEx', '-271821-01-01'), null);
  assert.equal(call('parseDateEx', '-271821-12-31'), null);
  assert.equal(call('parseDateEx', '275760-01-01'), null);
  assert.equal(call('parseDateEx', '275760-12-31'), null);
  assert.equal(call('parseDateEx', '500000-01-01'), null);
  assert.equal(call('parseDateEx', '-500000-01-01'), null);
  assert.equal(call('parseDateEx', '-271821'), null);
  assert.equal(call('parseDateEx', '275760'), null);
});

function parseRoundtrip(wall, tz, desc) {
  const pe = call('parseDateEx', wall);
  assert.notEqual(pe, null, `${wall} should parse (${desc})`);
  const w = { y: pe.y, mo: pe.mo, d: pe.d, h: 0, mi: 0, se: 0, ms: 0 };
  const ms = call('dateToMs', w, tz);
  assert.equal(Number.isFinite(ms), true, `${wall} ms finite (${desc})`);
  assert.equal(call('validate', ms), true, `${wall} within SAFE (${desc})`);
  const got = call('formatWithTokens', ms, tz, 'YYYY-MM-DD');
  const want = `${call('formatYear', pe.y)}-${call('pad', pe.mo)}-${call('pad', pe.d)}`;
  assert.equal(got, want, `${wall} roundtrip (${desc}, ${tz})`);
}

test('era 0 manual 2-digit input parses (00-01-01 …)', () => {
  const p = call('parseDateEx', '00-01-01 15:00:00');
  assert.notEqual(p, null);
  assert.equal(p.y, 0);
  assert.equal(p.mo, 1);
  assert.equal(p.d, 1);
  assert.equal(p.h, 15);
  assert.equal(call('formatWithTokens', call('dateToMs', { y: p.y, mo: p.mo, d: p.d, h: p.h, mi: p.mi, se: p.s, ms: 0 }, 'UTC'), 'UTC', 'YYYY-MM-DD HH:mm:ss'), '0000-01-01 15:00:00');
  const p66 = call('parseDateEx', '0066-01-01');
  assert.notEqual(p66, null);
  assert.equal(p66.y, 66);
  assert.equal(p66.mo, 1);
  assert.equal(p66.d, 1);
  assert.equal(call('parseDateEx', '00-01').y, 0);
});

test('2-digit short years keep num-format shorthand semantics', () => {
  // ymd 的短年份只有在数字格式吃不掉时才按历元年；可被数字格式消化的仍归 19xx/20xx。
  const p1 = call('parseDateEx', '01-02-03'); // us 风格 → 2003-01-02
  assert.notEqual(p1, null);
  assert.equal(p1.y, 2003);
  assert.equal(p1.mo, 1);
  assert.equal(p1.d, 2);
  const p3 = call('parseDateEx', '12/31/99');
  assert.notEqual(p3, null);
  assert.equal(p3.y, 1999);
  // 数字格式消化不了（年 <2 位）→ 属新增历元能力，此前为 null
  const p1d = call('parseDateEx', '1/2/3');
  assert.notEqual(p1d, null);
  assert.equal(p1d.y, 1);
  // 月份/日期的 0 使数字格式必然失效 → 归历元 0
  assert.equal(call('parseDateEx', '00-01-01').y, 0);
});

test('era roundtrip in UTC across the full year range', () => {
  parseRoundtrip('0000-02-29', 'UTC', 'era year 0 leap day');
  parseRoundtrip('0096-02-29', 'UTC', 'era year 96 leap day');
  parseRoundtrip('0000-01-01', 'UTC', 'era year 0');
  parseRoundtrip('-20000-06-15', 'UTC', 'BCE');
  parseRoundtrip('-271820-01-01', 'UTC', 'SAFE min year');
  parseRoundtrip('-271820-12-31', 'UTC', 'SAFE min year end');
  parseRoundtrip('275759-01-01', 'UTC', 'SAFE max year');
  parseRoundtrip('275759-12-31', 'UTC', 'SAFE max year end');
});

test('era roundtrip through IANA tz for BCE year', () => {
  parseRoundtrip('-20000-06-15', 'Asia/Shanghai', 'BCE IANA');
  parseRoundtrip('0000-02-29', 'Asia/Shanghai', 'era year 0 IANA');
});

test('year 0 weekday grid is era-correct (not 1900-mapped)', () => {
  const ms0 = call('dateToMs', { y: 0, mo: 1, d: 1, h: 0, mi: 0, se: 0, ms: 0 }, 'UTC');
  assert.equal(call('formatWithTokens', ms0, 'UTC', 'W'), '周六'); // 0000-01-01 是周六
  const ms66 = call('dateToMs', { y: 66, mo: 1, d: 1, h: 0, mi: 0, se: 0, ms: 0 }, 'UTC');
  assert.equal(call('formatWithTokens', ms66, 'UTC', 'W'), '周五'); // 0066-01-01 是周五
});