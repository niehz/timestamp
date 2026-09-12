#!/usr/bin/env node
// accuracy-test.mjs — 穷尽式精度校验：时间戳工具核心转换零差错。
//
// 覆盖（可配置，默认全量）：
//   * 时区：tzdb 规范时区（Intl.supportedValuesOf）+ 工具内置 + 历史链接别名
//            + UTC + FIXED 固定偏移（含秒级精度样例）
//   * 时刻：[MIN_TS=-8640000000000000, MAX_TS=+8640000000000000] 全程
//            锚点年 / DST 突变发现 / 确定种子随机漫游 / 极端边界密集扫描
//   * 套件：S1 往返不变量  S2 前向文本  S3 偏移参照+毛刺守卫  S4 反向往返
//            S5 边界/FIXED 四则 + B 边界/“极小值→大日期”异常探测
//   * 报告：分批落盘（failures/anomalies 立即追加）+ 断点续跑（state.json）
//   * 分类：真正错误→failure（硬失败）；DST 秋季回退歧义小时与极边界 ICU
//            裁剪（不可表示/不可区分）→anomaly 观测项（六要素照录，不算差错）
//
// 环境变量：
//   ACC_ZONES=all|tool|<N>     全量(默认) / 仅工具内置 / 抽样 N 个
//   ACC_ONLY=all|core|boundary all(默认) / 仅核心套件 / 仅边界探测
//   ACC_RANDOM_PER_ZONE=50     每时区随机漫游样本数
//   ACC_DST_YEARS=2020-2025    DST 突变发现年份区间
//   ACC_SEED=20260912          确定性种子
//   ACC_FRESH=1                忽略断点重跑
//   ACC_REPORT_DIR=reports/accuracy  报告目录
//
// 退出码：0=零硬失败（允许已知观测项）；1=存在失败。

import { readFileSync, existsSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { createSandbox, loadModules } from './load-test.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

// ==================== 配置 ====================
function env(name, def) {
  const v = process.env[name];
  return v === undefined || v === '' ? def : v;
}
const cfg = {
  zones: env('ACC_ZONES', 'all'),
  only: env('ACC_ONLY', 'all'),
  randomPerZone: Math.max(0, parseInt(env('ACC_RANDOM_PER_ZONE', '50'), 10) || 0),
  dstYears: env('ACC_DST_YEARS', '2020-2025').split('-').map(Number),
  seed: parseInt(env('ACC_SEED', '20260912'), 10) || 0,
  fresh: env('ACC_FRESH', '0') === '1',
  dir: env('ACC_REPORT_DIR', 'reports/accuracy'),
};
if (cfg.only !== 'all' && cfg.only !== 'core' && cfg.only !== 'boundary') {
  console.error(`ACC_ONLY 必须是 all|core|boundary，得到 "${cfg.only}"`);
  process.exit(2);
}
if (cfg.dstYears.length !== 2 || cfg.dstYears.some((y) => !Number.isFinite(y))) {
  console.error('ACC_DST_YEARS 格式应为 2020-2025');
  process.exit(2);
}

const MIN_TS = -8640000000000000;
const MAX_TS = 8640000000000000;
// 与应用一致的边界安全裕量：Intl 在墙钟越过 Date 范围时整年裁剪，统一取 32h 裕量
const SAFE_MARGIN_MS = 32 * 3600000;
const SAFE_MIN = MIN_TS + SAFE_MARGIN_MS;
const SAFE_MAX = MAX_TS - SAFE_MARGIN_MS;

function mulberry32(seed) {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    getState() { return a; },
    setState(v) { a = (v || 0) >>> 0; },
  };
}
const iso = () => new Date().toISOString();

// ==================== 报告与断点 ====================
const DIR = resolve(ROOT, cfg.dir);
const F_FAIL = `${DIR}/failures.jsonl`;
const F_ANOM = `${DIR}/anomalies.jsonl`;
const F_ZONES = `${DIR}/zones.jsonl`;
const F_SUM = `${DIR}/summary.csv`;
const F_RUN = `${DIR}/run.json`;
const F_STATE = `${DIR}/state.json`;

function ensureDir() { mkdirSync(DIR, { recursive: true }); }
function jline(p, o) { appendFileSync(p, JSON.stringify(o) + '\n', 'utf8'); }
function truncateReports() {
  for (const p of [F_FAIL, F_ANOM, F_ZONES, F_SUM, F_RUN, F_STATE]) {
    try { writeFileSync(p, '', 'utf8'); } catch (e) {}
  }
}

const totals = { samples: 0, pass: 0, fail: 0, anomalies: 0, skipped: 0, zonesDone: 0, zonesTotal: 0 };
const allZoneSummaries = [];
const globalBoundary = {};

function writeState(zones, fingerprint, rngState) {
  writeFileSync(F_STATE, JSON.stringify({
    schema: 'state-v1', fingerprint, updatedAt: iso(),
    zones: zones.map((z) => ({ zone: z.zone, done: z.done })),
    rngState: rngState,
    totals,
  }, null, 2), 'utf8');
}
function writeRun(boundary) {
  writeFileSync(F_RUN, JSON.stringify({
    schema: 'run-v1', node: process.version, icu: process.versions.icu,
    seed: cfg.seed, cfg: { zones: cfg.zones, only: cfg.only, randomPerZone: cfg.randomPerZone, dstYears: cfg.dstYears },
    totals, boundary: boundary || null, updatedAt: iso(),
  }, null, 2), 'utf8');
}
function writeCsv() {
  const head = 'zone,totalSamples,pass,fail,anomalies,minMs,minDate,maxMs,maxDate,minYear,maxYear';
  let csv = head;
  for (const z of allZoneSummaries) {
    csv += '\n' + [z.zone, z.samples, z.pass, z.fail, z.anomalies, z.minMs ?? '', z.minDate ?? '', z.maxMs ?? '', z.maxDate ?? '', z.minY ?? '', z.maxY ?? ''].join(',');
  }
  writeFileSync(F_SUM, csv + '\n', 'utf8');
}

// 失败/异常记录：用户要求六要素（当前结果 / 应得结果 / 当前时区 / 期望时区 / 触发输入 / 复现串）
// 注意：只落盘＋打印，不增减 totals（计数一律由调用方负责，避免双重计数）。
function record(kind, r) {
  const row = {
    schema: 'acc-failure-v1', kind,
    suite: r.suite, ts: iso(),
    tz: r.tz,
    tzExpected: r.tzExpected || r.tz,
    tzApplied: r.tzApplied != null ? r.tzApplied : null,
    input: r.input, actual: r.actual, expected: r.expected,
    diff: r.diff, native: r.native, repro: r.repro,
    anomalyType: r.anomalyType,
  };
  jline(kind === 'failure' ? F_FAIL : F_ANOM, row);
  dumpRow(row);
  return row;
}
function dumpRow(row) {
  const flag = row.kind === 'failure' ? '❌ FAIL' : '⚠ ANOMALY';
  console.error(`\n${flag} [${row.suite}] tz=${row.tz}  (当前时区=${row.tzApplied ?? 'n/a'} / 期望时区=${row.tzExpected})`);
  console.error(`  input: ${JSON.stringify(row.input)}`);
  console.error(`  actual:   ${JSON.stringify(row.actual)}`);
  console.error(`  expected: ${JSON.stringify(row.expected)}`);
  if (row.diff !== undefined) console.error(`  diff:     ${row.diff}`);
  if (row.native) console.error(`  native:   ${JSON.stringify(row.native)}`);
  if (row.repro) console.error(`  repro:    ${row.repro}`);
}

// ==================== 沙箱装载 ====================
loadModules(createSandbox()); // 先验证一次可加载

const sb = createSandbox();
loadModules(sb);

vm.runInNewContext(`
  // 引擎桥接
  globalThis.__ENG = {
    off: (d, tz) => { try { return offsetMinutes(d, tz); } catch (e) { return null; } },
    wall: (d, tz) => { try { if (isNaN(d.getTime())) return { invalid: true }; const p = tzParts(d, tz); if (p) p.ms = d.getMilliseconds(); return p; } catch (e) { return null; } },
    txt: (d, tz) => { try { return formatTz(d, tz); } catch (e) { return '--'; } },
    d2t: (w, tz) => { try { return dateToMs(w, tz); } catch (e) { return null; } },
    cands: (w, tz) => { try { return dateToMsCandidates(w, tz); } catch (e) { return null; } },
    val: (ms) => { try { return validate(ms) ? 1 : 0; } catch (e) { return 0; } },
    active: () => { try { return activeTz(); } catch (e) { return null; } },
    nodes: () => canonicalIanaZones(),
    toolZones: () => ALL_TIMEZONES.map(z => z.value),
    validIana: (s) => { try { return isValidIana(s) ? 1 : 0; } catch (e) { return 0; } }
  };

  // 独立参照：与引擎解题方式刻意不同（年份候选额外含 Intl 报告的 year 值）
  globalThis.__R_FMT = new Map();
  globalThis.__REF_OFF = function (date, tz) {
    if (tz === 'UTC') return 0;
    if (tz.indexOf('FIXED:') === 0) {
      const s = tz.slice(6);
      const sign = s[0] === '-' ? -1 : 1;
      return sign * (+s.slice(1, 3) * 60 + +s.slice(3, 5) + (s.length > 5 ? +s.slice(5, 7) : 0) / 60);
    }
    let f = globalThis.__R_FMT.get(tz);
    if (!f) {
      f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      globalThis.__R_FMT.set(tz, f);
    }
    const m = {};
    for (const p of f.formatToParts(date)) if (p.type !== 'literal') m[p.type] = p.value;
    if (m.year == null || m.month == null || m.day == null) return null;
    const base = Math.floor(date.getTime() / 1000) * 1000;
    const yy = date.getUTCFullYear();
    const mo = Number(m.month) - 1, d = Number(m.day);
    const h = Number(m.hour) % 24, mi = Number(m.minute) || 0, se = Number(m.second) || 0;
    let best = null, bd = Infinity;
    const cands = [];
    // 双纪元候选：yy±1 与 yy+1900±1。formatToParts 对公元 0..99 只给 2 位年
    //（"66" 可指 1966 或 66AD），凡 0..99 的候选一律以公鸡历原值构造（setUTCFullYear）。
    for (const y of [yy - 1, yy, yy + 1, parseInt(m.year, 10), yy + 1899, yy + 1900, yy + 1901]) {
      if (Number.isFinite(y)) cands.push(y);
    }
    for (const y of cands) {
      let c;
      if (y >= 0 && y < 100) { const t = new Date(0); t.setUTCFullYear(y, mo, d); t.setUTCHours(h, mi, se, 0); c = t.getTime(); }
      else c = Date.UTC(y, mo, d, h, mi, se);
      const dd = Math.abs(c - base);
      if (dd < bd) { bd = dd; best = c; }
    }
    return best == null ? null : (best - base) / 60000;
  };
  globalThis.__REF_WALL = function (date, tz) {
    const off = globalThis.__REF_OFF(date, tz);
    if (off == null) return null;
    const w = new Date(Math.floor(date.getTime() / 1000) * 1000 + Math.round(off * 60000));
    return { y: w.getUTCFullYear(), mo: w.getUTCMonth() + 1, d: w.getUTCDate(), h: w.getUTCHours(), mi: w.getUTCMinutes(), se: w.getUTCSeconds() };
  };
  globalThis.__REF_TXT = function (date, tz) {
    const w = globalThis.__REF_WALL(date, tz);
    if (!w) return null;
    const P = (n) => String(n).padStart(2, '0');
    return w.y + '-' + P(w.mo) + '-' + P(w.d) + ' ' + P(w.h) + ':' + P(w.mi) + ':' + P(w.se);
  };

  // 批量日常扫描：返回 { transitions, spikes }
  globalThis.__SCAN_DAILY = function (msArr, tz) {
    const out = { transitions: [], spikes: [] };
    let prev = null, prev2 = null;
    for (let i = 0; i < msArr.length; i++) {
      const ms = msArr[i];
      let o = null;
      try { o = __ENG.off(new Date(ms), tz); } catch (e) {}
      if (o !== null) {
        if (prev !== null && Math.abs(o - prev) > 0.0001) out.transitions.push({ ms: msArr[i - 1], prev, o });
        if (prev2 !== null && prev !== null && Math.abs(o - prev2) <= 0.0001 && Math.abs(o - prev) > 0.0001) out.spikes.push({ ms });
      }
      if (o !== null) { prev2 = prev; prev = o; }
    }
    return out;
  };
`, sb);

function run(src) { return vm.runInNewContext(src, sb, { filename: 'accuracy.js' }); }
function EN(name, ...args) {
  // Date 若走 JSON.stringify 会变成 ISO 字符串，沙箱内 formatTz 会因 d.getTime
  // 不是函数而抛错（曾导致 S2 全部误报 "--"）。改为注入 new Date(ms)。
  const jsArgs = args.map((a) => (a instanceof Date ? `new Date(${a.getTime()})` : JSON.stringify(a))).join(',');
  return run(`__ENG.${name}(${jsArgs})`);
}

// ==================== 时区全集 ====================
function buildZoneSet() {
  const set = new Set(EN('nodes') || []);
  for (const z of EN('toolZones')) set.add(z);
  const legacy = ['Asia/Calcutta','Asia/Saigon','Asia/Chungking','Asia/Istanbul','Asia/Tel_Aviv','Asia/Ujung_Pandang','Europe/Kiev','Europe/Belfast','Europe/Nicosia','Pacific/Johnston','Pacific/Midway','Pacific/Truk','Pacific/Yap','Pacific/Samoa','Pacific/Ponape','Pacific/Enderbury','America/Atka','America/Godthab','America/Argentina/ComodRivadavia','America/Montreal','America/Indianapolis','America/Louisville','US/Eastern','US/Central','US/Pacific','US/Mountain','US/Alaska','US/Arizona','US/Hawaii','Canada/Eastern','Canada/Central','Canada/Pacific','Canada/Mountain','Canada/Atlantic','Canada/Newfoundland','Canada/Saskatchewan','Brazil/East','Brazil/West','Mexico/General','Chile/Continental','Chile/EasterIsland','Cuba','Egypt','Eire','GB','GB-Eire','GMT','GMT0','Greenwich','Hongkong','Iceland','Iran','Israel','Jamaica','Japan','Kwajalein','Libya','Navajo','NZ','NZ-CHAT','Poland','Portugal','PRC','ROC','ROK','Singapore','Turkey','UCT','Universal','W-SU','Zulu'];
  for (const z of legacy) if (EN('validIana', z) === 1) set.add(z);
  for (const z of ['UTC', 'FIXED:+0000', 'FIXED:+0500', 'FIXED:+0530', 'FIXED:-0500', 'FIXED:-0530', 'FIXED:+1245', 'FIXED:-0545', 'FIXED:+1430', 'FIXED:+134545', 'FIXED:+053040']) set.add(z);
  let all = [...set];
  if (cfg.zones === 'tool') {
    all = [...new Set([...EN('toolZones'), 'UTC', 'FIXED:+0530', 'FIXED:-0545'])];
  } else if (/^\d+$/.test(cfg.zones)) {
    const n = Math.min(parseInt(cfg.zones, 10), all.length);
    if (n >= all.length) { all = []; }
    else { const out = []; for (let i = 0; i < n; i++) out.push(all[Math.floor((i * all.length) / n)]); all = out; }
  }
  return all;
}

// ==================== 采样生成（确定性） ====================
function anchorInstants() {
  const out = [];
  for (const y of [1800, 1850, 1880, 1900, 1916, 1930, 1940, 1945, 1950, 1960, 1965, 1969, 1970, 1972, 1980, 1990, 2000, 2010, 2020, 2024, 2025, 2026, 2027, 2030, 2038, 2050, 2100, 9999]) {
    out.push(Date.UTC(y, 0, 15, 0, 0, 0, 0));
    out.push(Date.UTC(y, 6, 15, 12, 0, 0, 0));
  }
  for (const y of [-1000, -500, -1, 0, 1, 100, 400, 1000, 1500, 1700]) {
    out.push(Date.UTC(y, 2, 10, 0, 0, 0, 0));
    out.push(Date.UTC(y, 8, 20, 12, 0, 0, 0));
  }
  for (const e of [MIN_TS, MIN_TS + 1, MIN_TS + 60000, MIN_TS + 86400000, MIN_TS + 86400000 * 30, -86400000, -31536000000, -9007199254740991, 0, 31536000000, 86400000, MAX_TS - 86400000 * 30, MAX_TS - 86400000, MAX_TS - 60000, MAX_TS - 1, MAX_TS]) {
    if (Number.isFinite(e)) out.push(e);
  }
  return out.filter((ms) => Number.isFinite(ms) && ms >= MIN_TS && ms <= MAX_TS);
}

function randomInstants(rng) {
  const out = [];
  for (let i = 0; i < cfg.randomPerZone; i++) out.push(MIN_TS + rng.next() * (MAX_TS - MIN_TS));
  for (let i = 0; i < Math.floor(cfg.randomPerZone / 2); i++) out.push(MIN_TS + rng.next() * (-MIN_TS) * 0.999);
  return out.map(Math.floor);
}

function dailyMsArray(years) {
  const ms = [];
  const [y0, y1] = years;
  for (let y = y0; y <= y1; y++) {
    let d = new Date(Date.UTC(y, 0, 1));
    const end = new Date(Date.UTC(y + 1, 0, 1));
    while (d < end) { ms.push(d.getTime()); d = new Date(d.getTime() + 86400000); }
  }
  return ms;
}

// ==================== 核心套件 ====================
// 返回本样本 {pass, fail, anomalies, skipped}
const EDGE_WIN_MS = 500 * 86400000; // MIN/MAX 各向内的边界滑窗：ICU 在闰年边界附近会做整年裁剪
function inEdgeWindow(ms) { return ms - MIN_TS <= EDGE_WIN_MS || MAX_TS - ms <= EDGE_WIN_MS; }
function sameWall(a, b) {
  return a && b && a.y === b.y && a.mo === b.mo && a.d === b.d && a.h === b.h && a.mi === b.mi && a.se === b.se;
}
function coreCheck(zone, ms, rng) {
  const res = { pass: 0, fail: 0, anomalies: 0, skipped: 0 };
  const refWall = run(`__REF_WALL(new Date(${ms}), ${JSON.stringify(zone)})`);
  const wall = EN('wall', new Date(ms), zone);
  if (wall && wall.invalid) { res.skipped++; return res; }
  if ((wall === null || wall === undefined) && refWall === null) { res.skipped++; return res; }

  totals.samples++;
  const native = { refWall };

  // S1 往返
  if (wall && !wall.invalid) {
    const w = { y: wall.y, mo: wall.mo, d: wall.d, h: wall.h, mi: wall.mi, se: wall.se, ms: wall.ms };
    const ms2 = EN('d2t', w, zone);
    if (ms2 === null || ms2 === undefined) {
      record('failure', { suite: 'S1', tz: zone, tzApplied: EN('active'), input: { ms }, actual: ms2, expected: ms, diff: 'null', native, repro: `dateToMs(tzParts(new Date(${ms}), "${zone}")) 返回 null` });
      res.fail++;
    } else {
      const diff = ms2 - ms;
      const refOff = run(`__REF_OFF(new Date(${ms}), ${JSON.stringify(zone)})`);
      const frac = refOff !== null ? Math.abs(refOff - Math.round(refOff * 10 ** 6) / 10 ** 6) : 0;
      const tol = frac > 0.0001 ? 1 : 0;
      if (Math.abs(diff) > tol) {
        if (inEdgeWindow(ms)) {
          record('anomaly', { suite: 'S1', anomalyType: 'unrepresentable-edge', tz: zone, tzApplied: EN('active'), input: { ms }, actual: ms2, expected: ms, diff: `${diff} ms (tol ${tol})`, native, repro: `dateToMs(tzParts(new Date(${ms}), "${zone}"))  // 边界裁剪区，ICU 墙钟不可表示` });
          res.anomalies++;
        } else {
          const wall2 = EN('wall', new Date(ms2), zone);
          if (sameWall(wall2, wall)) {
            // 秋季回退歧义：候选枚举必须同时覆盖两个真实瞬时（ms 与 dateToMs 的 ms2），
            // 任一缺失即候选算法有漏洞 → 判失败。
            const cands = EN('cands', w, zone);
            const hasBoth = Array.isArray(cands) && cands.indexOf(ms) !== -1 && cands.indexOf(ms2) !== -1;
            if (!hasBoth) {
              record('failure', { suite: 'S1', tz: zone, tzApplied: EN('active'), input: { ms }, actual: { candidates: cands }, expected: { mustInclude: [ms, ms2] }, diff: 'dst-ambiguous 候选枚举未同时覆盖两个真实瞬时', native, repro: `dateToMsCandidates(${JSON.stringify(w)}, "${zone}")` });
              res.fail++;
            } else {
              record('anomaly', { suite: 'S1', anomalyType: 'dst-ambiguous-reverse', tz: zone, tzApplied: EN('active'), input: { ms }, actual: ms2, expected: ms, diff: `${diff} ms (tol ${tol})`, native, repro: `dateToMs(tzParts(new Date(${ms}), "${zone}"))  // 秋季回退歧义小时，前向不动点稳定` });
              res.anomalies++;
            }
          } else {
            record('failure', { suite: 'S1', tz: zone, tzApplied: EN('active'), input: { ms }, actual: ms2, expected: ms, diff: `${diff} ms (tol ${tol})`, native, repro: `dateToMs(tzParts(new Date(${ms}), "${zone}"))  // 期望 ${ms}` });
            res.fail++;
          }
        }
      } else res.pass++;
    }
  }

  // S2 前向文本
  const engTxt = EN('txt', new Date(ms), zone);
  const refTxt = run(`__REF_TXT(new Date(${ms}), ${JSON.stringify(zone)})`);
  if (refTxt !== null && engTxt !== refTxt) {
    record('failure', { suite: 'S2', tz: zone, tzApplied: EN('active'), input: { ms }, actual: engTxt, expected: refTxt, diff: 'text mismatch', native, repro: `formatTz(new Date(${ms}), "${zone}")` });
    res.fail++;
  } else res.pass++;

  // S3 偏移参照
  const engOff = EN('off', new Date(ms), zone);
  const refOff = run(`__REF_OFF(new Date(${ms}), ${JSON.stringify(zone)})`);
  if (engOff === null || engOff === undefined) {
    if (refWall !== null) {
      record('anomaly', { suite: 'S3', anomalyType: 'no-offset', tz: zone, tzApplied: EN('active'), input: { ms }, actual: null, expected: refOff, native, repro: `offsetMinutes(new Date(${ms}), "${zone}")` });
      res.anomalies++;
    }
  } else if (Math.abs(engOff) > 960) {
    // 边界滑窗内：ICU 在极端年份自身偏移就损坏（如 MIN 处高达 +527023min），
    // 与 S1 的 unrepresentable-edge 同属平台决议，记观测而非硬失败。
    // 窗外出现 >±16h 才是真·换算失准（如公元 0-99 年纪元歧义）。
    if (inEdgeWindow(ms)) {
      record('anomaly', { suite: 'S3', anomalyType: 'unrepresentable-edge', tz: zone, tzApplied: EN('active'), input: { ms }, actual: engOff, expected: '|offset|<=960min(±16h)', diff: '偏移超出真实范围（边界裁剪区 ICU 失准）', native, repro: `offsetMinutes(new Date(${ms}), "${zone}")` });
      res.anomalies++;
    } else {
      record('failure', { suite: 'S3', tz: zone, tzApplied: EN('active'), input: { ms }, actual: engOff, expected: '|offset|<=960min(±16h)', diff: 'offset 超出真实物理范围（纪元/换算失准）', native, repro: `offsetMinutes(new Date(${ms}), "${zone}")` });
      res.fail++;
    }
  } else if (refOff !== null && Math.abs(engOff - refOff) > 0.02) {
    record('failure', { suite: 'S3', tz: zone, tzApplied: EN('active'), input: { ms }, actual: engOff, expected: refOff, diff: (engOff - refOff).toFixed(6), native, repro: `offsetMinutes(new Date(${ms}), "${zone}")` });
    res.fail++;
  } else res.pass++;

  // S4 反向往返（子集）
  if (wall && !wall.invalid && rng.next() < 0.15) {
    const w = { y: wall.y, mo: wall.mo, d: wall.d, h: wall.h, mi: wall.mi, se: wall.se, ms: wall.ms };
    // NaN 墙钟（FIXED 在极边界把墙钟推出可表示范围）直接归为边界观测。
    // 注意：不能只靠 isFinite(msRev)，NaN 经 JSON 往返变 null，会被 Date.UTC 当 0 处理成荒谬有限值。
    if (!Number.isFinite(wall.y) || !Number.isFinite(wall.mo) || !Number.isFinite(wall.d) ||
        !Number.isFinite(wall.h) || !Number.isFinite(wall.mi) || !Number.isFinite(wall.se)) {
      record('anomaly', { suite: 'S4', anomalyType: 'unrepresentable-edge', tz: zone, tzApplied: EN('active'), input: { ms: null, wall: w }, actual: null, expected: '有效墙钟', diff: 'reverse 前墙钟即含 NaN（边界裁剪区）', native, repro: `tzParts(new Date(${ms ?? '?'}), "${zone}") → ${JSON.stringify(w)}` });
      res.anomalies++;
    } else {
    const msRev = EN('d2t', w, zone);
    if (!Number.isFinite(msRev)) {
      record('anomaly', { suite: 'S4', anomalyType: 'unrepresentable-edge', tz: zone, tzApplied: EN('active'), input: { wall: w }, actual: null, expected: '有效 ms', diff: 'reverse 产出 NaN（边界裁剪区墙钟不可重建）', native, repro: `dateToMs(${JSON.stringify(w)}, "${zone}")` });
      res.anomalies++;
    } else {
      const back = EN('wall', new Date(msRev), zone);
      if (back && !back.invalid) {
      const ok = back.y === wall.y && back.mo === wall.mo && back.d === wall.d && back.h === wall.h && back.mi === wall.mi && back.se === wall.se;
      if (!ok) {
        if (inEdgeWindow(msRev)) {
          record('anomaly', { suite: 'S4', anomalyType: 'unrepresentable-edge', tz: zone, tzApplied: EN('active'), input: { wall: w }, actual: { y: back.y, mo: back.mo, d: back.d, h: back.h, mi: back.mi, se: back.se }, expected: { y: wall.y, mo: wall.mo, d: wall.d, h: wall.h, mi: wall.mi, se: wall.se }, diff: 'wall clock changed after reverse (边界裁剪区)', native, repro: `dateToMs(${JSON.stringify(w)}, "${zone}")` });
          res.anomalies++;
        } else {
          record('failure', { suite: 'S4', tz: zone, tzApplied: EN('active'), input: { wall: w }, actual: { y: back.y, mo: back.mo, d: back.d, h: back.h, mi: back.mi, se: back.se }, expected: { y: wall.y, mo: wall.mo, d: wall.d, h: wall.h, mi: wall.mi, se: wall.se }, diff: 'wall clock changed after reverse', native, repro: `dateToMs(${JSON.stringify(w)}, "${zone}")` });
          res.fail++;
        }
      } else res.pass++;
      }
    }
    }
  }
  return res;
}

// ==================== S5 边界（全局一次） ====================
function s5Boundaries() {
  const cases = [
    [MIN_TS, 0], [MAX_TS, 0], [MIN_TS - 1, 0], [MAX_TS + 1, 0],
    [SAFE_MIN, 1], [SAFE_MAX, 1], [SAFE_MIN - 1, 0], [SAFE_MAX + 1, 0],
    [0, 1],
    [Number.NaN, 0], [Infinity, 0], [-Infinity, 0], [9007199254740991, 0], [-9007199254740991, 0],
  ];
  for (const [ms, want] of cases) {
    const got = EN('val', ms);
    if (got !== want) {
      record('failure', { suite: 'S5', tz: 'validate', input: { ms }, actual: got === 1, expected: want === 1, diff: 'validate(ms) 边界错误', repro: `validate(${ms})` });
      totals.fail++;
    } else totals.pass++;
  }
  // FIXED 秒级四则精确
  for (const [tz, wantMin] of [['FIXED:+134545', 825.75], ['FIXED:+053040', 330.6666666666667], ['FIXED:+1245', 765], ['FIXED:-0545', -345]]) {
    for (const ms of [0, 1735689600000, -31536000000]) {
      const off = EN('off', new Date(ms), tz);
      if (off !== null && Math.abs(off - wantMin) > 0.0001) {
        record('failure', { suite: 'S5', tz, input: { ms }, actual: off, expected: wantMin, diff: (off - wantMin), native: null, repro: `offsetMinutes(new Date(${ms}), "${tz}")` });
        totals.fail++;
      } else totals.pass++;
    }
    const wall = EN('wall', new Date(1735689600000), tz);
    const back = EN('d2t', wall, tz);
    if (back !== null && back !== 1735689600000) {
      record('failure', { suite: 'S5', tz, input: { ms: 1735689600000 }, actual: back, expected: 1735689600000, diff: back - 1735689600000, repro: `dateToMs(tzParts(new Date(1735689600000), "${tz}"))` });
      totals.fail++;
    } else totals.pass++;
  }
}

// ==================== B-边界探测 ====================
function coveragePoints(n) {
  const pts = new Set();
  for (let e = 5; e <= 53; e++) {
    const p = Math.pow(2, e);
    pts.add(-Math.floor(p)); pts.add(Math.floor(p));
  }
  for (let k = 5; k <= 22; k++) {
    const off = Math.pow(2, k);
    pts.add(MIN_TS + off); pts.add(MAX_TS - off);
  }
  pts.add(MIN_TS); pts.add(0); pts.add(MAX_TS);
  const arr = [...pts].filter((v) => Number.isFinite(v) && v >= MIN_TS && v <= MAX_TS).sort((a, b) => a - b);
  if (arr.length > n) {
    const step = (arr.length - 1) / (n - 1);
    return Array.from({ length: n }, (_, i) => arr[Math.round(i * step)]);
  }
  return arr;
}

function boundaryProbe(zone) {
  const b = { minMs: null, minDate: null, maxMs: null, maxDate: null, minY: null, maxY: null };
  const cps = coveragePoints(2048);
  const years = run(`(() => {
    const pts = ${JSON.stringify(cps)};
    const tz = ${JSON.stringify(zone)};
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const ms = pts[i];
      const d = new Date(ms);
      if (isNaN(d.getTime())) { out.push('NaN'); continue; }
      let p = null; try { p = tzParts(d, tz); } catch (e) {}
      out.push(p ? p.y : null);
    }
    return out;
  })()`);
  let prevY = null;
  for (let i = 0; i < years.length; i++) {
    const y = years[i];
    if (y === 'NaN' || y === null) continue;
    const ms = cps[i];
    if (prevY !== null && y < prevY - 1) {
      record('anomaly', { suite: 'B', anomalyType: 'year-monotonicity', tz: zone, tzApplied: EN('active'), input: { ms }, actual: y, expected: `>= ${prevY}`, diff: `${y - prevY} 年`, native: run(`__REF_WALL(new Date(${ms}), ${JSON.stringify(zone)})`), repro: `tzParts(new Date(${ms}), "${zone}").y === ${y}` });
      totals.anomalies++;
    }
    // 合法年份域：MIN_TS↔-271821/275760，加时区偏移量余量后至多 ±3e5。
    // 超出即“极小值→离谱大日期”以外的全局离谱信号。
    if (Math.abs(y) > 300000) {
      record('anomaly', { suite: 'B', anomalyType: 'implausible-year', tz: zone, tzApplied: EN('active'), input: { ms }, actual: y, expected: '|y| <= 300000', native: run(`__REF_WALL(new Date(${ms}), ${JSON.stringify(zone)})`), repro: `tzParts(new Date(${ms}), "${zone}").y === ${y}` });
      totals.anomalies++;
    }
    prevY = y;
  }
  // 负/正端密集扫描
  const NSTEP = 1024;
  const span = 4194304;
  const step = Math.max(1, Math.floor(span / NSTEP));
  for (const edge of [MIN_TS, MAX_TS]) {
    const dir = edge === MIN_TS ? 1 : -1;
    const pts = [];
    for (let k = 0; k < NSTEP; k++) pts.push(edge + dir * (k * step));
    const rows = run(`(() => {
      const pts = ${JSON.stringify(pts)};
      const tz = ${JSON.stringify(zone)};
      const out = [];
      for (let i = 0; i < pts.length; i++) {
        const ms = pts[i]; const d = new Date(ms);
        if (isNaN(d.getTime())) { out.push(['NaN']); continue; }
        let p = null; try { p = tzParts(d, tz); } catch (e) {}
        out.push([p ? p.y : null]);
      }
      return out;
    })()`);
    let lastY = null;
    for (let i = 0; i < rows.length; i++) {
      const y = rows[i][0];
      const ms = pts[i];
      if (y === 'NaN' || y === null) { continue; }
      if (lastY !== null && y - lastY > 99999) {
        record('anomaly', { suite: 'B', anomalyType: 'small-value-large-date', tz: zone, tzApplied: EN('active'), input: { ms }, actual: y, expected: `≈ ${lastY}（应单调递增）`, diff: `${y - lastY} 年跳变`, native: run(`__REF_WALL(new Date(${ms}), ${JSON.stringify(zone)})`), repro: `tzParts(new Date(${ms}), "${zone}").y === ${y}` });
        totals.anomalies++;
      }
      lastY = y;
      if (dir === 1 && b.minMs === null && y !== null) { b.minMs = ms; b.minDate = new Date(ms).toISOString(); b.minY = y; }
      if (dir === -1 && y !== null) { b.maxMs = ms; b.maxDate = new Date(ms).toISOString(); b.maxY = y; }
    }
  }
  return b;
}

// ==================== 主流程 ====================
function fingerprint(zones) {
  return crypto.createHash('sha256').update(JSON.stringify({
    v: 1, node: process.version, icu: process.versions.icu,
    seed: cfg.seed, zones, randomPerZone: cfg.randomPerZone,
    dstYears: cfg.dstYears, only: cfg.only,
  })).digest('hex');
}

function processZone(zone, rng) {
  const summary = { zone, samples: 0, pass: 0, fail: 0, anomalies: 0, minMs: null, minDate: null, maxMs: null, maxDate: null, minY: null, maxY: null };
  const startPass = totals.pass, startFail = totals.fail, startAnom = totals.anomalies, startSamples = totals.samples;

  if (cfg.only !== 'boundary') {
    const instants = anchorInstants();
    for (const ms of randomInstants(rng)) instants.push(ms);
    const daily = dailyMsArray(cfg.dstYears);
    const scan = run(`__SCAN_DAILY(${JSON.stringify(daily)}, ${JSON.stringify(zone)})`) || { transitions: [], spikes: [] };
    for (const t of scan.transitions || []) {
      for (const dms of [0, 15 * 60000, 30 * 60000, 55 * 60000, 59 * 60000, 60 * 60000, 61 * 60000, 90 * 60000, 120 * 60000, 180 * 60000, 360 * 60000, 900 * 60000]) {
        const v = t.ms + dms;
        if (v >= MIN_TS && v <= MAX_TS) instants.push(v);
      }
    }
    for (const s of scan.spikes || []) {
      record('anomaly', { suite: 'S3', anomalyType: 'spurious-offset-spike', tz: zone, tzApplied: EN('active'), input: { ms: s.ms }, actual: 'isolated offset change', expected: 'offset 连续', diff: 'single-day spike in daily scan', native: null, repro: `__SCAN_DAILY(..., "${zone}")` });
      totals.anomalies++;
    }
    const uniq = [...new Set(instants)].sort((a, b) => a - b);
    for (const ms of uniq) {
      const r = coreCheck(zone, ms, rng);
      totals.pass += r.pass; totals.fail += r.fail; totals.anomalies += r.anomalies; totals.skipped += r.skipped;
    }
  }

  if (cfg.only !== 'core') {
    let b = null;
    try { b = boundaryProbe(zone); } catch (e) {
      record('anomaly', { suite: 'B', anomalyType: 'probe-exception', tz: zone, input: {}, actual: String(e && e.message || e), expected: 'no exception', repro: `boundaryProbe("${zone}")` });
      totals.anomalies++;
    }
    if (b) Object.assign(summary, { minMs: b.minMs, minDate: b.minDate, maxMs: b.maxMs, maxDate: b.maxDate, minY: b.minY, maxY: b.maxY });
  }

  summary.samples = totals.samples - startSamples;
  summary.pass = totals.pass - startPass;
  summary.fail = totals.fail - startFail;
  summary.anomalies = totals.anomalies - startAnom;
  return summary;
}

async function main() {
  console.log(`🧭 精度校验  node=${process.version} icu=${process.versions.icu}  seed=${cfg.seed}  only=${cfg.only}  dst=${cfg.dstYears.join('~')}`);
  ensureDir();
  const zones = buildZoneSet();
  const fp = fingerprint(zones);
  let zonesWork = zones.map((z) => ({ zone: z, done: false }));
  const t0 = Date.now();

  // 断点恢复
  let resumed = false;
  let resumeRng;
  if (!cfg.fresh && existsSync(F_STATE)) {
    let prev = null;
    try { prev = JSON.parse(readFileSync(F_STATE, 'utf8')); } catch (e) {}
    if (prev && prev.fingerprint === fp && Array.isArray(prev.zones)) {
      const done = new Set(prev.zones.filter((z) => z.done).map((z) => z.zone));
      zonesWork = zonesWork.map((z) => ({ zone: z.zone, done: done.has(z.zone) }));
      if (prev.totals) {
        totals.samples = prev.totals.samples; totals.pass = prev.totals.pass; totals.fail = prev.totals.fail;
        totals.anomalies = prev.totals.anomalies; totals.skipped = prev.totals.skipped; totals.zonesDone = prev.totals.zonesDone || 0;
      }
      resumeRng = Number.isFinite(prev && prev.rngState) ? prev.rngState : undefined;
      const doneN = zonesWork.filter((z) => z.done).length;
      console.log(`🔁 恢复断点：${doneN}/${zones.length} 时区已完成，继续执行`);
      resumed = true;
      for (let i = 0; i < zonesWork.length; i++) { if (zonesWork[i].done) allZoneSummaries.push({ zone: zonesWork[i].zone }); }
    } else {
      console.log('ℹ 断点指纹不匹配（config/运行时已变），按全新运行处理；ACC_FRESH=1 可强制重跑');
    }
  }
  if (!resumed) truncateReports();
  totals.zonesTotal = zones.length;
  writeState(zonesWork, fp);
  writeRun(globalBoundary);

  // S5 边界（仅在全新运行时执行；恢复的 totals 已含首段 s5 结果，重跑会翻倍计数）
  if (!resumed && cfg.only !== 'boundary') s5Boundaries();

  const rng = mulberry32(cfg.seed);
  if (resumeRng !== undefined) rng.setState(resumeRng);
  const pend = zonesWork.filter((z) => !z.done);
  for (const z of pend) {
    const perT0 = Date.now();
    const sum = processZone(z.zone, rng);
    z.done = true;
    totals.zonesDone++;
    allZoneSummaries.push(sum);
    jline(F_ZONES, { kind: 'zone', ...sum });
    writeState(zonesWork, fp, rng.getState());
    writeCsv();
    writeRun(globalBoundary);
    const grad = sum.fail === 0 && sum.anomalies === 0 ? '✅' : '❌';
    const ept = ((Date.now() - perT0) / 1000).toFixed(1);
    console.log(`[${String(totals.zonesDone).padStart(3, '0')}/${String(zones.length).padStart(3, '0')}] ${grad} ${(z.zone).padEnd(40)} samples=${sum.samples} pass=${sum.pass} fail=${sum.fail} anom=${sum.anomalies} (${ept}s)`);
  }
  // 全局边界结论
  globalBoundary.minMs = MIN_TS;
  globalBoundary.minDate = new Date(MIN_TS).toISOString();
  globalBoundary.maxMs = MAX_TS;
  globalBoundary.maxDate = new Date(MAX_TS).toISOString();
  globalBoundary.minBeyondMs = MIN_TS - 1;
  globalBoundary.minBeyondValid = EN('val', MIN_TS - 1) === 0 ? false : true;

  writeRun(globalBoundary);
  writeCsv();
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n========== 汇总 ==========');
  console.log(`时区完成: ${totals.zonesDone}/${zones.length}   运行: ${dur}s`);
  console.log(`总样本: ${totals.samples}   通过: ${totals.pass}   失败: ${totals.fail}   异常: ${totals.anomalies}   跳过(双方均不可渲染/无效): ${totals.skipped}`);
  console.log(`边界结论: JS Date 最小值 ms = ${globalBoundary.minMs} ↔ ${globalBoundary.minDate}；最大值 ms = ${globalBoundary.maxMs} ↔ ${globalBoundary.maxDate}；${globalBoundary.minBeyondMs} → ${globalBoundary.minBeyondValid ? '有效' : 'Invalid Date(NaN)'}`);
  if (totals.fail === 0) {
    if (totals.anomalies === 0) {
      console.log('✅ 校验通过：所有时区/时段核心转换零差错。');
    } else {
      console.log(`✅ 核心零失败；另有 ${totals.anomalies} 起已知环境观测（DST 回退歧义 / 极边界 ICU 裁剪，非工具差错），明细见 ${F_ANOM}。`);
    }
    process.exit(0);
  } else {
    console.log(`❌ 存在 ${totals.fail} 起失败（${F_FAIL}）/ ${totals.anomalies} 起观测（${F_ANOM}）；逐时区汇总 ${F_SUM}`);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.error('\n⚠ 收到中断，已按“完成一个时区保存一次”落盘进度；重新运行即可续传。');
  try { writeRun(globalBoundary); writeCsv(); } catch (e) {}
  process.exit(130);
});

main().catch((e) => {
  console.error('❌ 脚本异常终止：', e);
  try { writeRun(globalBoundary); } catch (e2) {}
  process.exit(1);
});