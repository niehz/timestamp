// frac-parse-sys.test.mjs — 三个需求的回归：
// 1. frac 输入框「每 3 位一个空格分组」的辅助纯函数 + readDateSelection 剥空格
// 2. loadSysSettings 缺省/旧版存储 → 「精度显示」默认纳秒级（ns），显式值保留
// 3. plugin.json 的 regex 入口与内置解析引擎一致：样例既匹配命令正则、又在
//    长度边界内，还能被 parseDateEx / normalizeEnterPayload 解析；带分隔 ISO +
//    显式时区的小数秒完整保留（ms/us/ns）并回填时区
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFresh } from './harness.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('frac 分组：stripFracSpaces / groupFracDigits 行为', () => {
  const { call } = createFresh();
  assert.equal(call('stripFracSpaces', '123 456 789'), '123456789');
  assert.equal(call('stripFracSpaces', '1,700 000\u00a0000\u200b7'), '17000000007');
  assert.equal(call('groupFracDigits', '123456789'), '123 456 789');
  assert.equal(call('groupFracDigits', '123 456 789'), '123 456 789');
  assert.equal(call('groupFracDigits', '12345678'), '12 345 678');
  assert.equal(call('groupFracDigits', ''), '');
  assert.equal(call('groupFracDigits', '5'), '5');
});

test('frac 分组：setFracValue 补满位数并分组，messy 输入净化为纯数字', () => {
  const { call } = createFresh();
  assert.equal(call('setFracValue', '123456789', 9), '123 456 789');
  assert.equal(call('setFracValue', '1.23x456 789', 9), '123 456 789');
  assert.equal(call('setFracValue', '000000', 6), '000 000');
  assert.equal(call('setFracValue', '123456789', 3), '123');
});

test('setFracDisplay：切低精度页截断写缓存，切回未编辑自动恢复完整值', () => {
  const { call } = createFresh();
  // ns→us：截断 + 缓存完整 9 位
  assert.equal(call('setFracDisplay', '123456789', 6), '123 456');
  // us→ns：期间未编辑 → 恢复
  assert.equal(call('setFracDisplay', '123 456', 9), '123 456 789');
});

test('setFracDisplay：9→6→3→9 层级导航，始终保留最长全精度', () => {
  const { call } = createFresh();
  assert.equal(call('setFracDisplay', '123456789', 9), '123 456 789');
  assert.equal(call('setFracDisplay', '123 456 789', 6), '123 456');
  assert.equal(call('setFracDisplay', '123 456', 3), '123');
  assert.equal(call('setFracDisplay', '123', 9), '123 456 789');
});

test('setFracDisplay：9→6→3→6→9 升回途中不清缓存，回到 9 位完整恢复', () => {
  const { call } = createFresh();
  assert.equal(call('setFracDisplay', '123456789', 6), '123 456');
  assert.equal(call('setFracDisplay', '123 456', 3), '123');
  // 3 升回 6：仍低于全精度，不恢复但缓存必须保留
  assert.equal(call('setFracDisplay', '123', 6), '123');
  // 6 升回 9：未编辑 → 恢复完整 9 位
  assert.equal(call('setFracDisplay', '123', 9), '123 456 789');
});

test('setFracDisplay：低精度页已被编辑则不恢复、以新值为准', () => {
  const { call } = createFresh();
  assert.equal(call('setFracDisplay', '123456789', 6), '123 456');
  assert.equal(call('setFracDisplay', '999 000', 9), '999 000');
});

test('setFracDisplay：无截断原样；digits=0 清空（秒级）', () => {
  const { call } = createFresh();
  assert.equal(call('setFracDisplay', '123', 6), '123');
  assert.equal(call('setFracDisplay', '123', 9), '123');
  assert.equal(call('setFracDisplay', '123456789', 0), '');
});

test('readDateSelection：剥除 frac 组内空格后解析 ms/us/ns', () => {
  const { call, expr } = createFresh();
  expr('currentTab = "ns"');
  expr('dateInput.value = "2026-09-07"');
  expr('fracInputEl.value = "123 456 789"');
  const r = call('readDateSelection');
  assert.equal(r.ms, 123);
  assert.equal(r.us, 456);
  assert.equal(r.ns, 789);
});

test('loadSysSettings：缺省/旧版存储 → 精度显示默认纳秒级', () => {
  const { call } = createFresh();
  assert.equal(call('loadSysSettings').precision, 'ns', '空存储默认 ns');
  call('safeSet', 'sys_settings', JSON.stringify({}));
  assert.equal(call('loadSysSettings').precision, 'ns');
  call('safeSet', 'sys_settings', JSON.stringify({ showMs: true }));
  assert.equal(call('loadSysSettings').precision, 'ms');
  call('safeSet', 'sys_settings', JSON.stringify({ precision: 'sec' }));
  assert.equal(call('loadSysSettings').precision, 'sec');
});

test('parseDateEx：带分隔 ISO + 显式时区的小数秒完整保留并回填时区', () => {
  const { call } = createFresh();
  const p = call('parseDateEx', '2026-09-07 13:49:08.123456789+08:00');
  assert.equal(p.mode, 'parts');
  assert.equal(p.ms, 123);
  assert.equal(p.us, 456);
  assert.equal(p.ns, 789);
  assert.deepEqual(p.tz, { label: '+08:00', offset: 480, value: 'FIXED:+0800' });
  const q = call('parseDateEx', '2026-09-07T13:49:08.123456789Z');
  assert.equal(q.mode, 'parts');
  assert.equal(q.us, 456);
  assert.equal(q.ns, 789);
  assert.equal(q.tz.value, 'UTC');
  const r = call('parseDateEx', '2026/09/07 13:49:08.123456789+08:00');
  assert.equal(r.ns, 789);
});

test('自动切精度+TAB：ensurePrecisionForPayload 提升 sys-precision 与 tab', () => {
  const { call, expr } = createFresh();
  call('applySysField', 'sys-precision', 'sec');
  assert.equal(expr('SYS_SETTINGS.precision'), 'sec');
  call('ensurePrecisionForPayload', 'us');
  assert.equal(expr('SYS_SETTINGS.precision'), 'us');
  // 提升到 us 级后 TAB 至少应 ≥ us
  const order = expr('PRECISION_ORDER[currentTab]');
  assert.ok(order >= 2, `currentTab 精度 ${order}`);
});

test('fracGranularity：按亚秒段判定 ms/us/ns', () => {
  const { call } = createFresh();
  assert.equal(call('fracGranularity', call('parseDateEx', '2026-09-07 13:49:08.1')), 'ms');
  assert.equal(call('fracGranularity', call('parseDateEx', '2026-09-07 13:49:08.123456')), 'us');
  assert.equal(call('fracGranularity', call('parseDateEx', '2026-09-07 13:49:08.123456789')), 'ns');
  assert.equal(call('fracGranularity', call('parseDateEx', '2026-09-07 13:49:08')), null);
  assert.equal(call('fracGranularity', { mode: 'parts', ms: 0, us: 0, ns: 0 }), null);
});

test('plugin.json regex 命令：样例匹配、长度边界、且能被内置解析引擎解析', () => {
  const { call } = createFresh();
  const plugin = JSON.parse(readFileSync(resolve(ROOT, 'plugin.json'), 'utf8'));
  const feat = plugin.features.find((f) => f.code === 'timestamp-regex');
  const cmds = feat.cmds.filter((c) => c && c.type === 'regex');
  const byLabel = Object.fromEntries(cmds.map((c) => [c.label, c]));
  const compile = (matchStr) => {
    const lastSlash = matchStr.lastIndexOf('/');
    return new RegExp(matchStr.slice(1, lastSlash), matchStr.slice(lastSlash + 1));
  };

  const samples = {
    '秒级时间戳转日期': ['1700000000'],
    '毫秒时间戳转日期': ['1700000000000'],
    '微秒时间戳转日期': ['1700000000000000'],
    '纳秒时间戳转日期': ['1700000000000000000'],
    '日期转时间戳': ['2026-09-07', '2026/09/07 13:49:08', '2026-09-07T13:49:08Z', '2026-09-07 13:49:08.123', '2026-09-07 13:49:08.123456789+08:00', '2026-09-07 13:49:08 GMT', '2026-09-07 13:49:08.5'],
    '紧凑ISO日期转时间戳': ['20260907T134908', '20260907T134908Z', '20260907T134908+0800', '20260907T134908.123456789Z', '20260907T13:49:08'],
    '中文日期转时间戳': ['2026年9月7日', '2026年9月7日 13:49:08', '2026年09月07日 13:49:08.123'],
    '英文月名日期转时间戳': ['7 Sep 2026', 'September 7, 2026', 'Thu, 07 Sep 2026 13:49:08 GMT', '07 Sep 2026 13:49:08'],
    '月日式日期转时间戳': ['09/07/2026', '9/7/2026 13:49', '09.07.2026', '12/25/2026'],
    '短日期转时间戳': ['2026', '2026-09'],
  };

  for (const [label, list] of Object.entries(samples)) {
    const cmd = byLabel[label];
    assert.ok(cmd, `plugin.json 应包含命令: ${label}`);
    const re = compile(cmd.match);
    for (const s of list) {
      const msg = `${label} 样例 ${s}`;
      assert.ok(re.test(s), `${msg} 不能匹配自身正则`);
      assert.ok(s.length >= cmd.minLength && s.length <= cmd.maxLength, `${msg} 超出长度边界`);
      if (/时间戳转日期$/.test(label)) {
        const r = call('normalizeEnterPayload', s);
        assert.equal(r.kind, 'ts', `${msg} 应归一化为时间戳`);
        const tabOf = { 10: 'sec', 13: 'ms', 16: 'us', 19: 'ns' }[s.length];
        assert.equal(r.tab, tabOf, `${msg} tab 应匹配位数`);
        assert.equal(s.length, cmd.minLength, `${msg} 标准位长应等于 minLength`);
        continue;
      }
      const pe = call('parseDateEx', s);
      assert.ok(pe, `${msg} 无法被 parseDateEx 解析`);
      const r = call('normalizeEnterPayload', s);
      assert.equal(r.kind, 'date', `${msg} 应归一化为日期`);
    }
  }
});