import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFresh } from './harness.mjs';

test('chipInstantFromSel: parts-mode d2t uses the typed date instant, not 1970', () => {
  const { expr } = createFresh();
  const julyOff = expr('offsetLabel("Europe/London", chipInstantFromSel({ y: 2026, mo: 7, d: 15, h: 12, mi: 0, se: 0, ms: 0, us: 0, ns: 0 }, "Europe/London"))');
  assert.equal(julyOff, 'UTC+01:00');
  const janOff = expr('offsetLabel("Europe/London", chipInstantFromSel({ y: 2026, mo: 1, d: 15, h: 12, mi: 0, se: 0, ms: 0, us: 0, ns: 0 }, "Europe/London"))');
  assert.equal(janOff, 'UTC+00:00');
});

test('chipInstantFromSel: parts-mode instant round-trips to the typed wall time', () => {
  const { expr } = createFresh();
  const p = expr('(() => { const d = chipInstantFromSel({ y: 2026, mo: 7, d: 15, h: 12, mi: 34, se: 56, ms: 0, us: 0, ns: 0 }, "Asia/Shanghai"); return tzParts(d, "Asia/Shanghai"); })()');
  assert.equal(p.y, 2026);
  assert.equal(p.mo, 7);
  assert.equal(p.d, 15);
  assert.equal(p.h, 12);
  assert.equal(p.mi, 34);
  assert.equal(p.se, 56);
  assert.equal(p.wd, 3);
});

test('chipInstantFromSel: abs mode keeps the exact epoch instant', () => {
  const { expr } = createFresh();
  assert.equal(expr('chipInstantFromSel({ kind: "abs", ms: 0 }, "UTC").getTime()'), 0);
  assert.equal(expr('chipInstantFromSel({ kind: "abs", ms: 1752544800000 }, "UTC").getTime()'), 1752544800000);
});

test('chipInstantFromSel: empty/err/null inputs fall back to a null instant', () => {
  const { expr } = createFresh();
  assert.equal(expr('chipInstantFromSel({ empty: true }, "UTC")'), null);
  assert.equal(expr('chipInstantFromSel({ err: true }, "UTC")'), null);
  assert.equal(expr('chipInstantFromSel(null, "UTC")'), null);
});

test('msFromCardValue: per-tab unit conversion matches the card display', () => {
  const { call } = createFresh();
  assert.equal(call('msFromCardValue', '0', 'sec'), 0);
  assert.equal(call('msFromCardValue', '1767225600', 'sec'), 1767225600000);
  assert.equal(call('msFromCardValue', '1767225600123', 'ms'), 1767225600123);
  assert.equal(call('msFromCardValue', '1767225600123456', 'us'), 1767225600123);
  assert.equal(call('msFromCardValue', '1767225600123456789', 'ns'), 1767225600123);
  assert.equal(call('msFromCardValue', '-543211', 'us'), -544);
  assert.equal(call('msFromCardValue', '-544000000000', 'ns'), -544000);
  assert.equal(call('msFromCardValue', '', 'sec'), null);
  assert.equal(call('msFromCardValue', null, 'sec'), null);
  assert.equal(call('msFromCardValue', '12.5', 'sec'), null);
});

test('epochSubFromMs: positive and negative epochs rebuild exact us/ns digits', () => {
  const { call } = createFresh();
  assert.deepEqual(call('epochSubFromMs', 1741496, 789, 12), {
    usVal: '1741496789',
    nsVal: '1741496789012',
  });
  // -544 ms = -1000 + 456（1969-12-31 23:59:59.456），补 us/ns 后仍精确：
  assert.deepEqual(call('epochSubFromMs', -544, 789, 12), {
    usVal: '-543211',
    nsVal: '-543210988',
  });
  assert.deepEqual(call('epochSubFromMs', -544000, null, null), {
    usVal: '-544000000',
    nsVal: '-544000000000',
  });
});