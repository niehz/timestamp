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

const WEEK_CN = { Sun: '周日', Mon: '周一', Tue: '周二', Wed: '周三', Thu: '周四', Fri: '周五', Sat: '周六' };
