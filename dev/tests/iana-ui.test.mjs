import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFresh } from './harness.mjs';

const { expr, call } = createFresh();

test('filterIanaZones: filters canonical IANA registry by substring', () => {
  const asia = expr('filterIanaZones("Asia")');
  assert.ok(Array.isArray(asia) && asia.length > 0, 'expected region candidates');
  assert.ok(asia.every(v => v.toLowerCase().includes('asia')), 'all candidates match query');
  assert.ok(asia.every(v => expr('isValidIana(' + JSON.stringify(v) + ')') === true));
});

test('classifyIanaInput: canonical / resolvable alias / display-only', () => {
  assert.equal(expr('classifyIanaInput("Asia/Shanghai")').kind, 'canonical');
  assert.equal(expr('classifyIanaInput("US/Eastern")').kind, 'resolvable');
  assert.equal(expr('classifyIanaInput("Asia/Calcutta")').kind, 'canonical');
  assert.equal(expr('classifyIanaInput("Not/AZone")').kind, 'displayOnly');
  assert.equal(expr('classifyIanaInput("")').kind, 'none');
});

test('parseOffsetInput: supports seconds; legacy forms unchanged', () => {
  assert.ok(Math.abs(expr('parseOffsetInput("+08:05:43")') - (485 + 43 / 60)) < 1e-9);
  assert.ok(Math.abs(expr('parseOffsetInput("-04:56:02")') - -(296 + 2 / 60)) < 1e-9);
  assert.equal(expr('parseOffsetInput("+08:05")'), 485);
  assert.equal(expr('parseOffsetInput("+08:00")'), 480);
  assert.equal(expr('parseOffsetInput("8")'), 480);
  assert.equal(expr('parseOffsetInput("0530")'), 330);
  assert.equal(expr('parseOffsetInput("+530")'), 330);
  assert.equal(expr('parseOffsetInput("330")'), 210);
  assert.equal(expr('parseOffsetInput("+08:60")'), null);
  assert.equal(expr('parseOffsetInput("+08:00:60")'), null);
  assert.equal(expr('parseOffsetInput("+15:00")'), null);
});

test('minutesToFixedStr: builds FIXED with optional seconds', () => {
  assert.equal(expr('minutesToFixedStr(485 + 43/60)'), 'FIXED:+080543');
  assert.equal(expr('minutesToFixedStr(480)'), 'FIXED:+0800');
  assert.equal(expr('minutesToFixedStr(-330)'), 'FIXED:-0530');
});

test('FIXED zones: second-granularity arithmetic', () => {
  assert.equal(expr('offsetMinutes(new Date(Date.UTC(2026,0,1)), "FIXED:+080530")'), 485.5);
  assert.equal(expr('formatTz(new Date(Date.UTC(1900,0,1,0,0,0)), "FIXED:+080530")'), '1900-01-01 08:05:30');
  assert.deepEqual(expr('tzParts(new Date(Date.UTC(1900,0,1,0,0,0)), "FIXED:+080530")'),
    { y: 1900, mo: 1, d: 1, h: 8, mi: 5, se: 30, ms: 0, wd: 1 });
  assert.equal(expr('dateToMs({ y: 1900, mo: 1, d: 1, h: 8, mi: 5, se: 30 }, "FIXED:+080530")'), Date.UTC(1900, 0, 1));
  assert.equal(expr('offsetInputFromValue("FIXED:+080543")'), '+08:05:43');
});

test('offsetLabel: renders offset with LMT seconds when present', () => {
  assert.equal(expr('offsetLabel("Asia/Shanghai", new Date(Date.UTC(1900,0,1,0,0,0)))'), 'UTC+08:05:43');
  assert.equal(expr('offsetLabel("Asia/Shanghai", new Date(Date.UTC(2026,0,1,0,0,0)))'), 'UTC+08:00');
  assert.equal(expr('offsetLabel("UTC", new Date(Date.UTC(2026,0,1,0,0,0)))'), 'UTC+00:00');
  assert.equal(expr('offsetLabel("FIXED:+080543", new Date(Date.UTC(2026,0,1,0,0,0)))'), 'UTC+08:05:43');
});

test('formatWithTokens: Z token outputs UTC offset', () => {
  assert.equal(expr('formatWithTokens(Date.UTC(1900,0,1,0,0,0), "Asia/Shanghai", "YYYY-MM-DD HH:mm:ss Z")'), '1900-01-01 08:05:43 UTC+08:05:43');
  assert.equal(expr('formatWithTokens(Date.UTC(2026,0,1,0,0,0), "Asia/Shanghai", "Z")'), 'UTC+08:00');
  assert.equal(expr('formatWithTokens(Date.UTC(2026,0,1,0,0,0), "FIXED:+0900", "Z")'), 'UTC+09:00');
});

test('activeTz: session override takes precedence over global', () => {
  expr('inputTzEl.value = ""; timezoneEl.value = "Asia/Shanghai"');
  assert.equal(expr('activeTz()'), 'Asia/Shanghai');
  expr('inputTzEl.value = "FIXED:+0900"');
  assert.equal(expr('activeTz()'), 'FIXED:+0900');
  expr('inputTzEl.value = ""');
  assert.equal(expr('activeTz()'), 'Asia/Shanghai');
});

test('resolveModernTzInput: valid IANA reuses zone directly', () => {
  const r = expr('resolveModernTzInput("Asia/Shanghai", "")');
  assert.equal(r.value, 'Asia/Shanghai');
  assert.equal(r.iana, 'Asia/Shanghai');
  assert.equal(r.displayOnly, false);
  assert.equal(r.error, '');
});

test('resolveModernTzInput: invalid IANA falls back to fixed offset as display-only', () => {
  const r = expr('resolveModernTzInput("Mars/Olympus_Mons", "+08:30")');
  assert.equal(r.value, 'FIXED:+0830');
  assert.equal(r.iana, 'Mars/Olympus_Mons');
  assert.equal(r.displayOnly, true);
  assert.equal(r.error, '');
});

test('resolveModernTzInput: invalid IANA without offset is an error', () => {
  const r = expr('resolveModernTzInput("Mars/Olympus_Mons", "")');
  assert.ok(r.error.length > 0);
});

test('resolveModernTzInput: offset-only path stays fixed and non-display-only', () => {
  const r = expr('resolveModernTzInput("", "8")');
  assert.equal(r.value, 'FIXED:+0800');
  assert.equal(r.displayOnly, false);
  assert.equal(expr('resolveModernTzInput("", "bad").error.length > 0'), true);
});

test('displayOnly flag round-trips through persist/load', () => {
  const was = expr('JSON.stringify(CUSTOM_TIMEZONES)');
  expr('CUSTOM_TIMEZONES.push({ label: "测试", labelEn: "Test", value: "FIXED:+0830", custom: true, abbr: [], iana: "Mars/Olympus_Mons", displayOnly: true })');
  expr('persistCustomTimezones()');
  expr('CUSTOM_TIMEZONES = []');
  const loaded = expr('loadCustomTimezones()');
  const entry = loaded.find(z => z.value === 'FIXED:+0830');
  assert.ok(entry && entry.displayOnly === true, 'displayOnly must survive persist/load');
  assert.ok(entry && entry.iana === 'Mars/Olympus_Mons');
  expr('CUSTOM_TIMEZONES = ' + was);
  expr('persistCustomTimezones()');
});