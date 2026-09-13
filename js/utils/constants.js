// ========================================================
// js/utils/constants.js — 基础常量（时间戳范围、星期中文）
// Extracted from js/core.js by Phase A split. Loaded before core.js.
// ========================================================
const MIN_TS = -8640000000000000;
const MAX_TS = 8640000000000000;

// 边界安全裕量：Intl.DateTimeFormat 在墙钟越过 Date 范围时会整年裁剪，
// dateToMs 内部二次推导偏移使裕量翻倍。经验最小值：MIN 侧 32h，MAX 侧 28h；
// 统一取 32h（含余量），FIXED/IANA 历史 LMT 全覆盖。
const SAFE_MARGIN_MS = 32 * 3600000; // 115,200,000 ms
const SAFE_MIN = MIN_TS + SAFE_MARGIN_MS;
const SAFE_MAX = MAX_TS - SAFE_MARGIN_MS;

// 可完整表示的 proleptic Gregorian 年份区间（Jan 1 00:00 ~ Dec 31 23:59:59.999 均在 SAFE 内）。
// 由 SAFE_MIN/MAX 推导：-271821 年最早日期在 SAFE_MIN 之前、275760 年最晚日期超出 SAFE_MAX，
// 故完整合法年为 -271820 与 275759。日期输入/日历/解析一律按此口径，与 t2d/d2t 转换层一致。
const YEAR_MIN = -271820;
const YEAR_MAX = 275759;

const WEEK_CN = { Sun: '周日', Mon: '周一', Tue: '周二', Wed: '周三', Thu: '周四', Fri: '周五', Sat: '周六' };
