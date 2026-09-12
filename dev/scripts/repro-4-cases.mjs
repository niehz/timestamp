#!/usr/bin/env node
// repro-4-cases.mjs — 四项极边界用例的可复现回归脚本。
//
// 背景：Intl.DateTimeFormat 在墙钟越过 Date 可表示范围（±8640000000000000 ms）
// 时会整年裁剪 / 产出 NaN / null 壁钟（ICU 平台决议），因此引入 SAFE_MIN/SAFE_MAX
// 32h 安全裕量，validate() 对边界外毫秒一律判「超出范围」。
//
// 四类用例（真实引擎验证）：
//   1. S1 dst-ambiguous       D2T 秋季回退重叠小时 → 两个候选瞬时
//   2. S1 unrepresentable-edge  MIN_TS 任意时区（Asia/Shanghai）→ 壁钟不可表示
//   3. S3 unrepresentable-edge  MIN_TS Africa/Abidjan → 偏移毛刺（超 ±16h 真实范围）
//   4. S4 unrepresentable-edge  MAX_TS FIXED:+0530 → 反向壁钟不可重建
//
// 用法：node dev/scripts/repro-4-cases.mjs
// 退出码：0=全部符合预期；1=存在回归。

import { createFresh } from '../tests/harness.mjs';

const MIN_TS = -8640000000000000;
const MAX_TS = 8640000000000000;

const { call, expr } = createFresh();
const SAFE_MIN = expr('SAFE_MIN');
const SAFE_MAX = expr('SAFE_MAX');

let failed = 0;

function check(name, ok, detail) {
  if (ok) {
    console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function wallAt(ms, tz) {
  try { return call('tzParts', new Date(ms), tz); } catch (e) { return '<throw ' + e.name + '>'; }
}
function offAt(ms, tz) {
  try { return call('offsetMinutes', new Date(ms), tz); } catch (e) { return '<throw ' + e.name + '>'; }
}

console.log(`边界常量：MIN_TS=${MIN_TS}  SAFE_MIN=${SAFE_MIN}  SAFE_MAX=${SAFE_MAX}  MAX_TS=${MAX_TS}（裕量 32h）\n`);

// ============ 用例 1：S1 dst-ambiguous ============
console.log('用例 1｜S1 dst-ambiguous｜Africa/Casablanca 2020-04-19 02:00（摩洛哥斋月二次回退）');
{
  const cands = call('dateToMsCandidates', { y: 2020, mo: 4, d: 19, h: 2, mi: 0, se: 0 }, 'Africa/Casablanca');
  check('两个候选瞬时', JSON.stringify(cands) === JSON.stringify([1587258000000, 1587261600000]), `cands=${JSON.stringify(cands)}`);
  check('两个候选均在安全范围', cands.every((ms) => ms >= SAFE_MIN && ms <= SAFE_MAX), `SAFE_MIN=${SAFE_MIN} SAFE_MAX=${SAFE_MAX}`);
  const ms = call('dateToMs', { y: 2020, mo: 4, d: 19, h: 2, mi: 0, se: 0 }, 'Africa/Casablanca');
  check('用例 5 对照：Africa/Abidjan（无 DST）仅 1 候选', call('dateToMsCandidates', { y: 2020, mo: 4, d: 19, h: 2, mi: 0, se: 0 }, 'Africa/Abidjan').length === 1, 'Abidjan=1 候选，非歧义');
  check('dateToMs 固定取较晚瞬时', ms === 1587261600000, `ms=${ms}`);
}

// ============ 用例 2：S1 unrepresentable-edge ============
console.log('\n用例 2｜S1 unrepresentable-edge｜MIN_TS + Asia/Shanghai（改动前：往返偏 1 年）');
{
  const wall = wallAt(MIN_TS, 'Asia/Shanghai');
  check('壁钟不可表示（null / 异常）', wall === null || wall === '<throw TypeError>', `wall=${JSON.stringify(wall)}`);
  check('validate(MIN_TS)=false → UI 判「超出范围」', call('validate', MIN_TS) === false);
  check('validate(SAFE_MIN)=true 且 SAFE_MIN-1=false', call('validate', SAFE_MIN) === true && call('validate', SAFE_MIN - 1) === false);
}

// ============ 用例 3：S3 unrepresentable-edge ============
console.log('\n用例 3｜S3 unrepresentable-edge｜MIN_TS + Africa/Abidjan（改动前：偏移毛刺 +527023.87 分钟）');
{
  const off = offAt(MIN_TS, 'Africa/Abidjan');
  check('偏移严重失真（|off| 远超 ±16h=960min）', typeof off === 'number' && Math.abs(off) > 960, `off=${off}min（真实应 -0 min）`);
  check('validate(MIN_TS)=false → UI 判「超出范围」', call('validate', MIN_TS) === false);
}

// ============ 用例 4：S4 unrepresentable-edge ============
console.log('\n用例 4｜S4 unrepresentable-edge｜MAX_TS + FIXED:+0530（改动前：反向壁钟 NaN/null）');
{
  const wall = wallAt(MAX_TS, 'FIXED:+0530');
  check('反向壁钟不可重建（NaN/null/异常）', wall === null || wall === '<throw TypeError>', `wall=${JSON.stringify(wall)}`);
  check('validate(MAX_TS)=false → UI 判「超出范围」', call('validate', MAX_TS) === false);
  check('validate(SAFE_MAX)=true 且 SAFE_MAX+1=false', call('validate', SAFE_MAX) === true && call('validate', SAFE_MAX + 1) === false);
}

console.log(failed === 0 ? '\n全部用例符合预期 ✅' : `\n${failed} 项用例回归 ❌`);
process.exit(failed === 0 ? 0 : 1);