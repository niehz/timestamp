import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFresh } from './harness.mjs';

const { call } = createFresh();

test('pad pads to 2 digits', () => {
  assert.equal(call('pad', 5), '05');
  assert.equal(call('pad', 12), '12');
  assert.equal(call('pad', 0), '00');
});

test('bigFloorDiv floors for negative dividends', () => {
  const { expr } = createFresh();
  assert.equal(expr('bigFloorDiv(7n, 2n)'), 3n);
  assert.equal(expr('bigFloorDiv(6n, 2n)'), 3n);
  assert.equal(expr('bigFloorDiv(-7n, 2n)'), -4n);
  assert.equal(expr('bigFloorDiv(-6n, 2n)'), -3n);
});

test('htmlEscape escapes HTML metacharacters', () => {
  assert.equal(call('htmlEscape', '<a&">'), '&lt;a&amp;&quot;&gt;');
  assert.equal(call('htmlEscape', 'plain'), 'plain');
});

test('escapeAttr escapes attributes', () => {
  assert.equal(call('escapeAttr', '"<&>'), '&quot;&lt;&amp;&gt;');
  assert.equal(call('escapeAttr', null), '');
});

test('parseOffsetInput parses common offset forms', () => {
  assert.equal(call('parseOffsetInput', '+8'), 480);
  assert.equal(call('parseOffsetInput', '8'), 480);
  assert.equal(call('parseOffsetInput', '-04:30'), -270);
  assert.equal(call('parseOffsetInput', '0530'), 330);
  assert.equal(call('parseOffsetInput', '+530'), 330);
  assert.equal(call('parseOffsetInput', '+08:00'), 480);
  assert.equal(call('parseOffsetInput', ''), null);
  assert.equal(call('parseOffsetInput', 'abc'), null);
  assert.equal(call('parseOffsetInput', '15'), null);
  assert.equal(call('parseOffsetInput', '-13'), null);
});

test('formatOffset renders UTC offsets', () => {
  assert.equal(call('formatOffset', 0), 'UTC+00:00');
  assert.equal(call('formatOffset', 480), 'UTC+08:00');
  assert.equal(call('formatOffset', -330), 'UTC-05:30');
});

test('fracToMs converts fractional strings to ms', () => {
  assert.equal(call('fracToMs', '0.123'), 123);
  assert.equal(call('fracToMs', '1.23'), 230);
  assert.equal(call('fracToMs', '123'), 123);
  assert.equal(call('fracToMs', null), 0);
});

test('validYmd validates calendar dates', () => {
  assert.equal(call('validYmd', 2026, 9, 7), true);
  assert.equal(call('validYmd', 2026, 2, 30), false);
  assert.equal(call('validYmd', 2024, 2, 29), true);
  assert.equal(call('validYmd', 2023, 2, 29), false);
  assert.equal(call('validYmd', 0, 1, 1), false);
});

test('fixedZoneValue / splitZone / toDateStr', () => {
  assert.equal(call('fixedZoneValue', 480), 'FIXED:+0800');
  assert.equal(call('fixedZoneValue', -330), 'FIXED:-0530');
  assert.deepEqual(call('splitZone', '2026-09-07T13:49:08Z'), {
    base: '2026-09-07T13:49:08',
    tz: { label: 'UTC', value: 'UTC', offset: 0 },
  });
  assert.deepEqual(call('splitZone', '2026-09-07 14:00 +08:00'), {
    base: '2026-09-07 14:00',
    tz: { label: '+08:00', offset: 480, value: 'FIXED:+0800' },
  });
  assert.equal(call('toDateStr', 2026, 9, 7, 13, 49, 8), '2026-09-07 13:49:08');
});

test('fracToParts / partsToFrac segment fractional digits', () => {
  assert.deepEqual(call('fracToParts', '12345', 6), { ms: 123, us: 450, ns: 0 });
  assert.equal(call('partsToFrac', 123, 450, 0, 6), '123450');
  assert.equal(call('partsToFrac', 123, 450, 7, 9), '123450007');
});

test('formatWithTokens expands placeholders', () => {
  const { expr } = createFresh();
  assert.equal(expr('formatWithTokens(0, "UTC", "YYYY/MM/DD HH:mm:ss")'), '1970/01/01 00:00:00');
  assert.equal(expr('formatWithTokens(0, "UTC", "YYYY年MM月DD日")'), '1970年01月01日');
});

test('formatTz / formatUTC / formatLocal', () => {
  const { expr } = createFresh();
  assert.equal(expr('formatTz(new Date(0), "UTC")'), '1970-01-01 00:00:00');
  assert.equal(expr('formatUTC(new Date(0))'), '1970-01-01 00:00:00');
  assert.equal(expr('formatTz(new Date(Date.UTC(2026, 8, 7, 5, 6, 7)), "FIXED:+0800")'), '2026-09-07 13:06:07');
  assert.equal(expr('formatLocal(new Date(2026, 0, 1))'), '2026-01-01 00:00:00');
});

test('offsetMinutes resolves IANA and FIXED zones', () => {
  const { expr } = createFresh();
  assert.equal(expr('offsetMinutes(new Date("2026-01-01T00:00:00Z"), "UTC")'), 0);
  assert.equal(expr('offsetMinutes(new Date("2026-01-01T00:00:00Z"), "FIXED:+0800")'), 480);
  assert.equal(expr('offsetMinutes(new Date("2026-01-01T00:00:00Z"), "Asia/Shanghai")'), 480);
});

test('tzParts returns wall-clock parts for a zone', () => {
  const { expr } = createFresh();
  assert.deepEqual(expr('tzParts(new Date(Date.UTC(2026, 0, 1)), "UTC")'), {
    y: 2026, mo: 1, d: 1, h: 0, mi: 0, se: 0, ms: 0, wd: 4,
  });
});

test('dateToMs converts wall time in a zone to epoch ms', () => {
  const { expr } = createFresh();
  assert.equal(expr('dateToMs({y:2026, mo:1, d:1, h:0, mi:0, se:0}, "UTC")'), Date.UTC(2026, 0, 1));
  assert.equal(
    expr('dateToMs({y:2026, mo:1, d:1, h:0, mi:0, se:0}, "FIXED:+0800")'),
    Date.UTC(2026, 0, 1) - 480 * 60000
  );
});