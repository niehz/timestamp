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
  const want = `${pe.y}-${call('pad', pe.mo)}-${call('pad', pe.d)}`;
  assert.equal(got, want, `${wall} roundtrip (${desc}, ${tz})`);
}

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