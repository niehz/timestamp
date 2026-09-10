import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFresh } from './harness.mjs';

const { call } = createFresh();

test('parseIsoFmt compact form with explicit offset', () => {
  assert.deepEqual(call('parseIsoFmt', '20260907T134908+0800'), {
    mode: 'parts', y: 2026, mo: 9, d: 7, h: 13, mi: 49, s: 8, ms: 0, us: 0, ns: 0,
    tz: { label: '+08:00', offset: 480, value: 'FIXED:+0800' },
  });
  assert.equal(call('parseIsoFmt', '2026-09-07'), null);
});

test('parseYmdFmt / parseCjkFmt basics', () => {
  assert.deepEqual(call('parseYmdFmt', '2026-09-07 13:49:08'), {
    mode: 'parts', y: 2026, mo: 9, d: 7, h: 13, mi: 49, s: 8, ms: 0, us: 0, ns: 0,
  });
  assert.deepEqual(call('parseCjkFmt', '2026年9月7日'), {
    mode: 'parts', y: 2026, mo: 9, d: 7, h: 0, mi: 0, s: 0, ms: 0, us: 0, ns: 0,
  });
});

test('parseNumFmt respects ambiguity style (default us)', () => {
  assert.deepEqual(call('parseNumFmt', '07/09/2026'), {
    mode: 'parts', y: 2026, mo: 7, d: 9, h: 0, mi: 0, s: 0, ms: 0, us: 0, ns: 0,
  });
});

test('parseRelative resolves relative day keywords', () => {
  const r = call('parseRelative', '明天');
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  assert.equal(r.kind, 'date');
  assert.equal(r.y, base.getFullYear());
  assert.equal(r.mo, base.getMonth() + 1);
  assert.equal(r.d, base.getDate());
  assert.equal(call('parseRelative', 'nonsense-xyz'), null);
});

test('parseDateEx resolves common formats', () => {
  assert.deepEqual(call('parseDateEx', '2026-09-07'), {
    mode: 'parts', y: 2026, mo: 9, d: 7, h: 0, mi: 0, s: 0, ms: 0, us: 0, ns: 0, fd: 0, src: 'ymd',
  });
  assert.deepEqual(call('parseDateEx', '2026年9月7日'), {
    mode: 'parts', y: 2026, mo: 9, d: 7, h: 0, mi: 0, s: 0, ms: 0, us: 0, ns: 0, fd: 0, src: 'cjk',
  });
  assert.deepEqual(call('parseDateEx', '09/07/2026'), {
    mode: 'parts', y: 2026, mo: 9, d: 7, h: 0, mi: 0, s: 0, ms: 0, us: 0, ns: 0, fd: 0, src: 'num',
  });
  assert.equal(call('parseDateEx', 'not a date at all'), null);
});

test('parseDate collapses to a date descriptor', () => {
  assert.deepEqual(call('parseDate', '2026-09-07'), {
    kind: 'date', y: 2026, mo: 9, d: 7, h: 0, mi: 0, se: 0,
  });
});

test('custom placeholder/regex rules parse', () => {
  assert.deepEqual(call('parseCustomPlaceholder', 'YYYY-MM-DD', '2026-09-07'), {
    mode: 'parts', y: 2026, mo: 9, d: 7, h: 0, mi: 0, s: 0, ms: 0, us: 0, ns: 0,
  });
  assert.deepEqual(
    call('parseCustomRegex', '(?<y>\\d{4})-(?<mo>\\d{2})-(?<d>\\d{2})', '2026-09-07'),
    { mode: 'parts', y: 2026, mo: 9, d: 7, h: 0, mi: 0, s: 0, ms: 0, us: 0, ns: 0 }
  );
});

test('parseDateEx returns null for garbage', () => {
  assert.equal(call('parseDateEx', ''), null);
  assert.equal(call('parseDateEx', '   '), null);
});

test('fraction handling in date parsing', () => {
  assert.deepEqual(call('parseYmdFmt', '2026-09-07 13:49:08.456'), {
    mode: 'parts', y: 2026, mo: 9, d: 7, h: 13, mi: 49, s: 8, ms: 456, us: 0, ns: 0,
  });
});

test('fraction parsing preserves us / ns sub-second digits', () => {
  const r = call('parseYmdFmt', '2026-09-07 13:49:08.123456789');
  assert.equal(r.ms, 123);
  assert.equal(r.us, 456);
  assert.equal(r.ns, 789);
  const c = call('parseIsoFmt', '20260907T134908.123456789Z');
  assert.equal(c.ms, 123);
  assert.equal(c.us, 456);
  assert.equal(c.ns, 789);
});

test('parseDateEx fd reflects fraction digit count', () => {
  assert.equal(call('parseDateEx', '2026-09-07 14:23:45.123').fd, 3);
  assert.equal(call('parseDateEx', '2026-09-07T14:23:45.123456Z').fd, 6);
  assert.equal(call('parseDateEx', '2026-09-07T14:23:45.123456789+0800').fd, 9);
  assert.equal(call('parseDateEx', '2026-09-07').fd, 0);
});

test('fracToTab maps parse result to a precision tab', () => {
  assert.equal(call('fracToTab', { mode: 'parts', fd: 0 }), 'sec');
  assert.equal(call('fracToTab', { mode: 'parts', fd: 3 }), 'ms');
  assert.equal(call('fracToTab', { mode: 'parts', fd: 6 }), 'us');
  assert.equal(call('fracToTab', { mode: 'parts', fd: 9 }), 'ns');
  assert.equal(call('fracToTab', { mode: 'abs', abs: Date.UTC(2026, 0, 1, 0, 0, 0) }), 'sec');
  assert.equal(call('fracToTab', { mode: 'abs', abs: Date.UTC(2026, 0, 1, 0, 0, 0, 250) }), 'ms');
});