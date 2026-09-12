import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFresh } from './harness.mjs';

const { call } = createFresh();

test('Casablanca fall-back wall 02:00 → two sorted candidates', () => {
  const w = { y: 2020, mo: 4, d: 19, h: 2, mi: 0, se: 0 };
  const cands = call('dateToMsCandidates', w, 'Africa/Casablanca');
  assert.deepEqual(cands, [1587258000000, 1587261600000]);
});

test('Casablanca spring-forward gap wall 02:30 → no candidates', () => {
  const w = { y: 2020, mo: 5, d: 31, h: 2, mi: 30, se: 0 };
  const cands = call('dateToMsCandidates', w, 'Africa/Casablanca');
  assert.deepEqual(cands, []);
});

test('normal non-transition wall → exactly one candidate', () => {
  const cands = call('dateToMsCandidates', { y: 2020, mo: 6, d: 1, h: 12, mi: 0, se: 0 }, 'Africa/Casablanca');
  assert.equal(cands.length, 1);
  const cands2 = call('dateToMsCandidates', { y: 2026, mo: 9, d: 7, h: 13, mi: 49, se: 8 }, 'Asia/Shanghai');
  assert.equal(cands2.length, 1);
});

test('fixed-offset and UTC zones → exactly one candidate', () => {
  const cands = call('dateToMsCandidates', { y: 2026, mo: 9, d: 7, h: 13, mi: 49, se: 8 }, 'FIXED:+0530');
  assert.equal(cands.length, 1);
  const cands2 = call('dateToMsCandidates', { y: 2026, mo: 9, d: 7, h: 13, mi: 49, se: 8 }, 'UTC');
  assert.equal(cands2.length, 1);
});

test('candidate enumeration matches default dateToMs result (later instant)', () => {
  const w = { y: 2020, mo: 4, d: 19, h: 2, mi: 0, se: 0 };
  const cands = call('dateToMsCandidates', w, 'Africa/Casablanca');
  const ms = call('dateToMs', w, 'Africa/Casablanca');
  assert.equal(cands.includes(ms), true);
  assert.equal(ms, 1587261600000);
});

test('SAFE_MIN/SAFE_MAX 32h 裕量边界：validate 收窄到安全区，边界外一律判越界', () => {
  const MIN_TS = -8640000000000000;
  const MAX_TS = 8640000000000000;
  const SAFE_MIN = MIN_TS + 32 * 3600000;
  const SAFE_MAX = MAX_TS - 32 * 3600000;
  assert.equal(call('validate', MIN_TS), false);
  assert.equal(call('validate', MAX_TS), false);
  assert.equal(call('validate', SAFE_MIN - 1), false);
  assert.equal(call('validate', SAFE_MIN), true);
  assert.equal(call('validate', SAFE_MAX), true);
  assert.equal(call('validate', SAFE_MAX + 1), false);
});

test('极边界时区引擎产出为不可表示观测（tzParts 为 null / dateToMs 抛错），非硬失败', () => {
  const MAX_TS = 8640000000000000;
  let wall = null;
  try { wall = call('tzParts', new Date(MAX_TS), 'FIXED:+0530'); } catch (e) {}
  assert.ok(wall === null || wall === undefined);
});