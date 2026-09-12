// ========================================================
// js/datetime.js — 时间/时区格式化、日期解析引擎（纯逻辑）
// Extracted from index.js (lines 1143-1519) by
// dev/scripts/split.mjs. Loaded from index.html in this order:
// core → datetime → fields → calendar → convert → tzselector → events
// ========================================================

function formatLocal(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatUTC(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

const tzFormatters = new Map();
function getTzFormatter(tz) {
  if (!tzFormatters.has(tz)) {
    tzFormatters.set(tz, new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', hour12: false,
    }));
  }
  return tzFormatters.get(tz);
}
function partsMap(parts) { const m = {}; for (const p of parts) if (p.type !== 'literal') m[p.type] = p.value; return m; }

function formatTz(date, tz) {
  if (!tz || tz === 'UTC') return formatUTC(date);
  const fx = /^FIXED:([+-])(\d{2})(\d{2})(\d{2})?$/.exec(tz);
  if (fx) {
    const offMins = ((+fx[2] * 3600 + +fx[3] * 60 + (+fx[4] || 0)) / 60) * (fx[1] === '-' ? -1 : 1);
    const t = new Date(date.getTime() + Math.round(offMins * 60000));
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())}`;
  }
  
  // IANA 时区：引擎缺失历史数据时使用内置回退偏移（正常引擎直接走下方 Intl，精确到秒）
  if (!tzHasHistoricalData(tz)) {
    const fallback = getHistoricalOffset(date, tz);
    if (fallback != null) {
      const t = new Date(date.getTime() + Math.round(fallback * 60000));
      return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())}`;
    }
  }
  
  // 正常路径：Intl 精确到秒（含 LMT 秒分量，如 Asia/Shanghai 的 +08:05:43）
  try {
    const m = partsMap(getTzFormatter(tz).formatToParts(date));
    const year = m.era === 'BC' ? '-' + m.year : m.year;
    return `${year}-${m.month}-${m.day} ${pad(m.hour % 24)}:${m.minute}:${m.second}`;
  } catch (e) { return '--'; }
}

const WD_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function tzParts(date, tz) {
  if (!tz || tz === 'UTC') {
    if (tz === 'UTC') {
      return { y: date.getUTCFullYear(), mo: date.getUTCMonth() + 1, d: date.getUTCDate(), h: date.getUTCHours(), mi: date.getUTCMinutes(), se: date.getUTCSeconds(), ms: date.getMilliseconds(), wd: date.getUTCDay() };
    }
    return { y: date.getFullYear(), mo: date.getMonth() + 1, d: date.getDate(), h: date.getHours(), mi: date.getMinutes(), se: date.getSeconds(), ms: date.getMilliseconds(), wd: date.getDay() };
  }
  const fx = /^FIXED:([+-])(\d{2})(\d{2})(\d{2})?$/.exec(tz);
  if (fx) {
    const off = ((+fx[2] * 3600 + +fx[3] * 60 + (+fx[4] || 0)) / 60) * (fx[1] === '-' ? -1 : 1);
    const t = new Date(date.getTime() + Math.round(off * 60000));
    return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes(), se: t.getUTCSeconds(), ms: date.getMilliseconds(), wd: t.getUTCDay() };
  }
  
  // IANA 时区：引擎缺失历史数据时使用内置回退偏移（正常引擎直接走下方 Intl，精确到秒）
  if (!tzHasHistoricalData(tz)) {
    const fallback = getHistoricalOffset(date, tz);
    if (fallback != null) {
      const t = new Date(date.getTime() + Math.round(fallback * 60000));
      return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes(), se: t.getUTCSeconds(), ms: date.getMilliseconds(), wd: t.getUTCDay() };
    }
  }
  
  // 正常路径：Intl 精确到秒（含 LMT 秒分量）
  try {
    const m = partsMap(getTzFormatter(tz).formatToParts(date));
    return { y: m.era === 'BC' ? -Number(m.year) : Number(m.year), mo: Number(m.month), d: Number(m.day), h: Number(m.hour) % 24, mi: Number(m.minute), se: Number(m.second), ms: date.getMilliseconds(), wd: WD_INDEX[m.weekday] };
  } catch (e) { return null; }
}

function formatWithTokens(ms, tz, fmt) {
  const p = tzParts(new Date(ms), tz);
  if (!p) return '--';
  const hour12 = p.h % 12 === 0 ? 12 : p.h % 12;
  const ap = p.h < 12 ? 'AM' : 'PM';
  const map = {
    YYYY: String(p.y), YY: String(Math.abs(p.y)).slice(-2), MM: pad(p.mo), DD: pad(p.d),
    HH: pad(p.h), hh: pad(hour12), mm: pad(p.mi), ss: pad(p.se), SSS: String(p.ms).padStart(3, '0'),
    A: ap, a: ap.toLowerCase(), W: WEEK_CN[WEEK_EN[p.wd]] || '', WD: WEEK_EN[p.wd] || '',
    Z: offsetLabel(tz, new Date(ms)),
  };
  return fmt.replace(/YYYY|YY|MM|DD|HH|hh|mm|ss|SSS|A|a|W|WD|Z/g, (t) => map[t] !== undefined ? map[t] : t);
}

const DATE_FMT_PRESETS = [
  { label: 'ISO-8601', labelEn: 'ISO-8601', fmt: 'YYYY-MM-DD HH:mm:ss' },
  { label: '斜杠格式', labelEn: 'Slash', fmt: 'YYYY/MM/DD HH:mm:ss' },
  { label: '中文完整', labelEn: 'Chinese', fmt: 'YYYY年MM月DD日 HH:mm:ss' },
  { label: '中文带星期', labelEn: 'Chinese+Week', fmt: 'YYYY年MM月DD日 HH:mm:ss W' },
  { label: '含毫秒', labelEn: 'With ms', fmt: 'YYYY-MM-DD HH:mm:ss.SSS' },
];
const DATE_FMT_DEFAULT_CONST = 'YYYY-MM-DD HH:mm:ss';
const DATE_FMT_MAX_ENABLED = 6;

// ============ IANA 历史偏移 ============
// 现代 V8 / Chromium / Electron 附带的完整 ICU tzdata 本身即可正确处理 IANA
// 时区的历史偏移（含 1901 年之前的 LMT 秒分量），因此优先用 Intl 精确计算：
//   1. ianaOffsetMinutes —— 用 Intl.DateTimeFormat 计算任意年份的精确偏移；
//   2. tzHasHistoricalData —— 探测引擎是否带历史数据（1850 与 2026 偏移是否不同）；
//   3. 仅当引擎缺失历史数据时，才回退到下方 HISTORICAL_OFFSETS 近似表。
// 例如：Asia/Shanghai 在 1901 年前的 LMT 为 +08:05:43（485 + 43/60 分钟），
// 引擎在 year 1200 也能给出 20:05:43 的墙钟时间（已实测验证）。

// IANA 时区精确偏移（分钟，可为小数以保留 LMT 秒分量）。失败返回 null。
function ianaOffsetMinutes(date, tz) {
  if (!(date instanceof Date)) date = new Date(date);
  try {
    const m = partsMap(getTzFormatter(tz).formatToParts(date));
    if (!m || m.year == null || m.month == null || m.day == null || m.hour == null) return null;
    const year = m.era === 'BC' ? -Math.abs(Number(m.year)) : Number(m.year);
    const asUtc = Date.UTC(year, Number(m.month) - 1, Number(m.day), Number(m.hour) % 24, Number(m.minute) || 0, Number(m.second) || 0);
    // 必须向下取整到秒边界：JS 的 % 对负周期截断向零，会使 1970 前的毫秒级时刻上取整到下一秒。
    const baseMs = Math.floor(date.getTime() / 1000) * 1000;
    return (asUtc - baseMs) / 60000;
  } catch (e) { return null; }
}

// 探测引擎是否支持该时区的历史偏移（结果缓存）。
const TZ_HIST_PROBE = new Map();
function tzHasHistoricalData(tz) {
  if (TZ_HIST_PROBE.has(tz)) return TZ_HIST_PROBE.get(tz);
  let has = false;
  try {
    const a = ianaOffsetMinutes(Date.UTC(1850, 0, 15, 12, 0, 0), tz);
    const b = ianaOffsetMinutes(Date.UTC(2026, 0, 15, 12, 0, 0), tz);
    has = a != null && b != null && a !== b;
  } catch (e) { has = false; }
  TZ_HIST_PROBE.set(tz, has);
  return has;
}

// 回退表：仅当引擎缺失历史时区数据时使用。偏移为分钟（小数保留 LMT 秒分量），
// 夏令时按日期区间近似，取值已按 tzdata 核对（Asia/Shanghai LMT +08:05:43、
// Asia/Tokyo LMT +09:18:59、America/New_York LMT -04:56:02）。
const HISTORICAL_OFFSETS = {
  'Asia/Shanghai': {
    lmt: 485 + 43 / 60, lmtUntil: 1900, base: 480, dstOffset: 540,
    dst: [
      { y0: 1940, m0: 6, d0: 3, y1: 1940, m1: 10, d1: 1 },
      { y0: 1941, m0: 3, d0: 16, y1: 1941, m1: 11, d1: 1 },
      { y0: 1942, m0: 1, d0: 1, y1: 1945, m1: 9, d1: 30 },
      { y0: 1946, m0: 5, d0: 15, y1: 1946, m1: 9, d1: 14 },
      { y0: 1947, m0: 4, d0: 15, y1: 1947, m1: 10, d1: 14 },
      { y0: 1948, m0: 5, d0: 1, y1: 1948, m1: 9, d1: 30 },
      { y0: 1986, m0: 4, d0: 10, y1: 1991, m1: 9, d1: 10 }
    ]
  },
  'Asia/Tokyo': {
    lmt: 558 + 59 / 60, lmtUntil: 1886, base: 540, dstOffset: 600,
    dst: [
      { y0: 1948, m0: 5, d0: 1, y1: 1951, m1: 9, d1: 10 }
    ]
  },
  'America/New_York': {
    lmt: -(296 + 2 / 60), lmtUntil: 1883, base: -300, dstOffset: -240,
    dst: [
      { y0: 1918, m0: 3, d0: 31, y1: 1919, m1: 10, d1: 26 },
      { y0: 1942, m0: 2, d0: 9, y1: 1945, m1: 9, d1: 30 },
      { y0: 1946, m0: 4, d0: 1, y1: 1966, m1: 10, d1: 31 },
      { y0: 1967, m0: 4, d0: 1, y1: 1973, m1: 10, d1: 31 },
      { y0: 1974, m0: 1, d0: 6, y1: 1975, m1: 10, d1: 26 },
      { y0: 1976, m0: 4, d0: 1, y1: 1986, m1: 10, d1: 31 },
      { y0: 1987, m0: 4, d0: 1, y1: 2006, m1: 10, d1: 31 },
      { y0: 2007, m0: 3, d0: 11, y1: 9999, m1: 11, d1: 7 }
    ]
  }
};

// 返回回退表中的历史偏移（分钟，可为小数）；不在表中时返回 null。
function getHistoricalOffset(date, timeZone) {
  const tz = HISTORICAL_OFFSETS[timeZone];
  if (!tz) return null;
  const y = date.getUTCFullYear();
  const mo = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  if (tz.lmt != null && y <= tz.lmtUntil) return tz.lmt;
  if (!tz.dst) return tz.base;
  for (const r of tz.dst) {
    if (y < r.y0 || y > r.y1) continue;
    const afterStart = mo > r.m0 || (mo === r.m0 && d >= r.d0);
    const beforeEnd = y < r.y1 || mo < r.m1 || (mo === r.m1 && d <= r.d1);
    if (afterStart && beforeEnd) return tz.dstOffset;
  }
  return tz.base;
}


// 以毫秒为单位的时区偏移（内部用于精确反推时间戳，避免分钟取整误差）。
function zoneOffsetMs(date, tz) {
  if (!tz) {
    const g = date && typeof date.getTime === 'function' ? date.getTime() : NaN;
    if (!Number.isFinite(g)) return 0;
    return -date.getTimezoneOffset() * 60000;
  }
  if (tz === 'UTC') return 0;
  const fx = /^FIXED:([+-])(\d{2})(\d{2})(\d{2})?$/.exec(tz);
  if (fx) {
    return ((+fx[2] * 3600 + +fx[3] * 60 + (+fx[4] || 0)) * (fx[1] === '-' ? -1 : 1)) * 1000;
  }
  // 引擎缺失历史数据时，优先使用回退表偏移
  if (!tzHasHistoricalData(tz)) {
    const fb = getHistoricalOffset(date, tz);
    if (fb != null) return Math.round(fb * 60000);
  }
  // 正常路径：Intl 精确到毫秒（含 LMT 秒分量，如 8:05:43 -> 485.7167 分）
  const exact = ianaOffsetMinutes(date, tz);
  return exact == null ? 0 : Math.round(exact * 60000);
}

function offsetMinutes(date, tz) {
  return zoneOffsetMs(date, tz) / 60000;
}

function formatOffset(mins) {
  const sign = mins >= 0 ? '+' : '-';
  const m = Math.abs(mins);
  const h = String(Math.floor(m / 60)).padStart(2, '0');
  const mi = String(Math.floor(m % 60)).padStart(2, '0');
  const sec = Math.round((m - Math.floor(m)) * 60);
  if (sec > 0) return `UTC${sign}${h}:${mi}:${String(sec).padStart(2, '0')}`;
  return `UTC${sign}${h}:${mi}`;
}

// 时区偏移标签（含 LMT 秒部件），供标题/芯片/格式 token 复用。
function offsetLabel(tz, inst) {
  return formatOffset(offsetMinutes(inst, tz));
}

function dateToMs(d, tz) {
  const hasMs = typeof d.ms === 'number';
  if (!tz) return hasMs ? new Date(d.y, d.mo - 1, d.d, d.h, d.mi, d.se, d.ms).getTime()
                        : new Date(d.y, d.mo - 1, d.d, d.h, d.mi, d.se).getTime();
  const guess = hasMs ? Date.UTC(d.y, d.mo - 1, d.d, d.h, d.mi, d.se, d.ms)
                      : Date.UTC(d.y, d.mo - 1, d.d, d.h, d.mi, d.se);
  let ms = guess - zoneOffsetMs(new Date(guess), tz);
  // DST 切换日：首次 guess 的偏移可能属于另一时区段，迭代取偏移直到稳定（正常 1 次收敛）
  for (let i = 0; i < 8; i++) {
    const next = guess - zoneOffsetMs(new Date(ms), tz);
    if (next === ms) break;
    ms = next;
  }
  return ms;
}

function parseRelative(text) {
  const s = text.trim().toLowerCase();
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const DAY_MS = 86400000;
  const rel = {
    today: 0, t: 0, now: 0, '今天': 0,
    yesterday: -1, yes: -1, '昨天': -1,
    tomorrow: 1, tom: 1, '明天': 1,
    '后天': 2, dayafter: 2,
  };
  const n = rel[s];
  if (n === undefined) return null;
  const d = new Date(base.getTime() + n * DAY_MS);
  return { kind: 'date', y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate(), h: 0, mi: 0, se: 0 };
}

// ============ 日期解析引擎 ============
const DATE_PARSE_FORMATS = [
  { id: 'iso', label: 'ISO 8601（含时区 / Z / 偏移）', labelEn: 'ISO 8601 (tz / Z / offset)', examples: ['2026-09-07', '2026-09-07 13:49:08', '2026-09-07T13:49:08Z', '20260907T134908+0800', '2026-09-07 13:49:08 GMT'] },
  { id: 'cjk', label: '中文年月日（2026年9月7日）', labelEn: 'Chinese y/m/d (2026年9月7日)', examples: ['2026年9月7日', '2026年9月7日 13:49:08', '2026年09月07日13时49分08秒'] },
  { id: 'ymd', label: '年在前 YYYY-MM-DD / YYYY-MM', labelEn: 'Year-first YYYY-MM-DD / YYYY-MM', examples: ['2026-09-07', '2026-09-07 13:49:08', '2026/09/07', '2026-09'] },
  { id: 'rfcm', label: 'RFC 2822 / 英文月份', labelEn: 'RFC 2822 / English months', examples: ['Thu, 07 Sep 2026 13:49:08 GMT', '7 Sep 2026', 'September 7, 2026'] },
  { id: 'num', label: '月/日式（受歧义风格控制）', labelEn: 'Month-day style (via ambiguity style)', examples: ['09/07/2026', '09-07-2026', '9/7/2026 13:49', '09.07'] },
];
function loadDateParseSettings() {
  try {
    const raw = localStorage.getItem('date_parse_settings');
    if (raw) {
      const o = JSON.parse(raw);
      const ids = DATE_PARSE_FORMATS.map(f => f.id);
      const enabled = Array.isArray(o.enabled)
        ? o.enabled.filter(id => ids.includes(id))
        : null;
      return {
        enabled: Array.isArray(enabled) && enabled.length
          ? new Set(enabled)
          : new Set(ids),
        style: o.style === 'eu' ? 'eu' : 'us',
        custom: Array.isArray(o.custom) ? o.custom.filter(v => v && typeof v === 'object') : [],
      };
    }
  } catch (e) {}
  return { enabled: new Set(DATE_PARSE_FORMATS.map(f => f.id)), style: 'us', custom: [] };
}
const _dateParseCfg = loadDateParseSettings();
let DATE_PARSE_ENABLED = _dateParseCfg.enabled;
let dateParseStyle = _dateParseCfg.style;
let CUSTOM_PARSE_RULES = _dateParseCfg.custom;
function saveDateParseSettings() {
  localStorage.setItem('date_parse_settings', JSON.stringify({ enabled: [...DATE_PARSE_ENABLED], style: dateParseStyle, custom: CUSTOM_PARSE_RULES }));
}
function fracToMs(f) {
  if (f == null) return 0;
  const s = String(f).split('.')[1] || String(f);
  return Math.round(Number('0.' + s.slice(0, 3).padEnd(3, '0')) * 1000);
}
function validYmd(y, mo, d) {
  return y >= 1 && y <= 9999 && mo >= 1 && mo <= 12 && d >= 1 && d <= new Date(y, mo, 0).getDate();
}
function parseIsoFmt(s) {
  const tzInfo = tzFromDateString(s);
  const explicit = tzInfo && (tzInfo.value === 'UTC' || tzInfo.offset != null);
  const compact = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2}):?(\d{2})(?::?(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:?\d{2})?$/i);
  if (compact) {
    const y = +compact[1], mo = +compact[2], d = +compact[3];
    const h = +compact[4], mi = +compact[5], se = compact[6] != null ? +compact[6] : 0;
    const ms = fracToMs(compact[7]);
    if (!validYmd(y, mo, d) || h > 23 || mi > 59 || se > 59) return null;
    const zone = compact[8];
    if (!zone) return { mode: 'parts', y, mo, d, h, mi, s: se, ms };
    if (/^z$/i.test(zone)) return { mode: 'parts', y, mo, d, h, mi, s: se, ms, tz: { label: 'UTC', value: 'UTC', offset: 0 } };
    const om = /^([+-])(\d{2}):?(\d{2})$/.exec(zone);
    if (om) {
      const offset = (+om[2] * 60 + +om[3]) * (om[1] === '-' ? -1 : 1);
      return { mode: 'parts', y, mo, d, h, mi, s: se, ms, tz: { label: `${om[1]}${om[2]}:${om[3]}`, offset, value: `FIXED:${om[1]}${om[2]}${om[3]}` } };
    }
    return null;
  }
  if (explicit) {
    const abs = Date.parse(s);
    if (Number.isNaN(abs)) return null;
    return { mode: 'abs', abs, tz: tzInfo };
  }
  return null;
}
function parseYmdFmt(s) {
  if (/^\d{4}$/.test(s)) {
    const now = new Date();
    return { mode: 'parts', y: +s, mo: now.getMonth() + 1, d: now.getDate(), h: 0, mi: 0, s: 0, ms: 0 };
  }
  const ym = s.match(/^(\d{4})[-/年](\d{1,2})月?$/);
  if (ym) {
    const y = +ym[1], mo = +ym[2];
    if (!validYmd(y, mo, 1)) return null;
    return { mode: 'parts', y, mo, d: 1, h: 0, mi: 0, s: 0, ms: 0 };
  }
  const m = s.match(/^(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})(?:日)?(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.(\d{1,9}))?)?)?$/);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const h = m[4] != null ? +m[4] : 0, mi = m[5] != null ? +m[5] : 0, se = m[6] != null ? +m[6] : 0;
  if (!validYmd(y, mo, d) || h > 23 || mi > 59 || se > 59) return null;
  return { mode: 'parts', y, mo, d, h, mi, s: se, ms: fracToMs(m[7]) };
}
function parseCjkFmt(s) {
  const m = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.(\d{1,9}))?)?)?$/);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const h = m[4] != null ? +m[4] : 0, mi = m[5] != null ? +m[5] : 0, se = m[6] != null ? +m[6] : 0;
  if (!validYmd(y, mo, d) || h > 23 || mi > 59 || se > 59) return null;
  return { mode: 'parts', y, mo, d, h, mi, s: se, ms: fracToMs(m[7]) };
}
function parseRfcmFmt(s) {
  if (!/[A-Za-z]{3,}/.test(s)) return null;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  return { mode: 'abs', abs: t, tz: tzFromDateString(s) || null };
}
function parseNumFmt(s) {
  const m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.(\d{1,9}))?)?)?$/);
  if (m) {
    let y = +m[3];
    if (y < 100) y += y < 70 ? 2000 : 1900;
    const a = +m[1], b = +m[2];
    const mo = dateParseStyle === 'us' ? a : b, d = dateParseStyle === 'us' ? b : a;
    const h = m[4] != null ? +m[4] : 0, mi = m[5] != null ? +m[5] : 0, se = m[6] != null ? +m[6] : 0;
    if (!validYmd(y, mo, d) || h > 23 || mi > 59 || se > 59) return null;
    return { mode: 'parts', y, mo, d, h, mi, s: se, ms: fracToMs(m[7]) };
  }
  const yl = s.match(/^(\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.(\d{1,9}))?)?)?$/);
  if (yl) {
    const a = +yl[1], b = +yl[2];
    const mo = dateParseStyle === 'us' ? a : b, d = dateParseStyle === 'us' ? b : a;
    const y = new Date().getFullYear();
    const h = yl[3] != null ? +yl[3] : 0, mi = yl[4] != null ? +yl[4] : 0, se = yl[5] != null ? +yl[5] : 0;
    if (!validYmd(y, mo, d) || h > 23 || mi > 59 || se > 59) return null;
    return { mode: 'parts', y, mo, d, h, mi, s: se, ms: fracToMs(yl[6]) };
  }
  return null;
}
function parseCustomPlaceholder(pattern, s) {
  if (!pattern || !s) return null;
  let regexStr = '';
  const fields = [];
  let pi = 0;
  const tokenRe = /YYYY|YY|MM|DD|HH|hh|mm|ss|SSS|[A-Za-z]+|\S|./g;
  let m;
  while ((m = tokenRe.exec(pattern)) !== null) {
    const tok = m[0];
    if (tok === 'YYYY') { fields.push({ k: 'y', i: fields.length + 1 }); regexStr += '(\\d{4})'; }
    else if (tok === 'YY') { fields.push({ k: 'yy', i: fields.length + 1 }); regexStr += '(\\d{2})'; }
    else if (tok === 'MM') { fields.push({ k: 'mo', i: fields.length + 1 }); regexStr += '(\\d{1,2})'; }
    else if (tok === 'DD') { fields.push({ k: 'd', i: fields.length + 1 }); regexStr += '(\\d{1,2})'; }
    else if (tok === 'HH') { fields.push({ k: 'h', i: fields.length + 1 }); regexStr += '(\\d{1,2})'; }
    else if (tok === 'hh') { fields.push({ k: 'hh', i: fields.length + 1 }); regexStr += '(\\d{1,2})'; }
    else if (tok === 'mm') { fields.push({ k: 'mi', i: fields.length + 1 }); regexStr += '(\\d{1,2})'; }
    else if (tok === 'ss') { fields.push({ k: 's', i: fields.length + 1 }); regexStr += '(\\d{1,2})'; }
    else if (tok === 'SSS') { fields.push({ k: 'ms', i: fields.length + 1 }); regexStr += '(\\d{1,3})'; }
    else if (/^[A-Za-z]+$/.test(tok)) { regexStr += tok; }
    else regexStr += tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    pi += tok.length;
  }
  const re = new RegExp('^' + regexStr + '$');
  const mm2 = s.match(re);
  if (!mm2) return null;
  const out = {};
  let yy = null;
  for (const f of fields) {
    const v = mm2[f.i];
    if (v == null || v === '') return null;
    if (f.k === 'yy') { yy = +v; continue; }
    if (f.k === 'hh') { if (out.h == null) out.h = (+v) % 24; continue; }
    const key = f.k; // y | mo | d | h | mi | s | ms
    out[key] = +v;
  }
  if (yy != null) {
    out.y = yy < 70 ? 2000 + yy : 1900 + yy;
  }
  if (out.y == null) out.y = new Date().getFullYear();
  if (out.mo == null) out.mo = 1;
  if (out.d == null) out.d = 1;
  if (!validYmd(out.y, out.mo, out.d) || (out.h != null && out.h > 23) || (out.mi != null && out.mi > 59) || (out.s != null && out.s > 59)) return null;
  const r = { mode: 'parts', y: out.y, mo: out.mo, d: out.d };
  if (out.h != null) r.h = out.h; else r.h = 0;
  if (out.mi != null) r.mi = out.mi; else r.mi = 0;
  if (out.s != null) r.s = out.s; else r.s = 0;
  if (out.ms != null) r.ms = out.ms; else r.ms = 0;
  return r;
}
function parseCustomRegex(pattern, s) {
  if (!pattern || !s) return null;
  let re;
  try { re = new RegExp(pattern); } catch (e) { return null; }
  const mm = re.exec(s);
  if (!mm) return null;
  const g = mm.groups || {};
  const num = (v) => (v == null || v === '' ? null : +v);
  const y = num(g.y), mo = num(g.mo), d = num(g.d);
  const h = num(g.h), mi = num(g.mi), se = num(g.s), ms = num(g.ms);
  if ((y == null || mo == null || d == null) && !(y != null && mo == null && (g.d == null))) {
    return null;
  }
  let yy = y;
  if (yy != null && g.y != null ? /^\d{2}$/.test(g.y) : false) yy = yy < 70 ? 2000 + yy : 1900 + yy;
  const outY = yy != null ? yy : new Date().getFullYear();
  const outMo = mo != null ? mo : 1;
  const outD = d != null ? d : 1;
  if (!validYmd(outY, outMo, outD) || (h != null && h > 23) || (mi != null && mi > 59) || (se != null && se > 59)) return null;
  return { mode: 'parts', y: outY, mo: outMo, d: outD, h: h != null ? h : 0, mi: mi != null ? mi : 0, s: se != null ? se : 0, ms: ms != null ? ms : 0 };
}
function parseDateEx(text) {
  const s = text.trim();
  if (!s) return null;
  const rel = parseRelative(s);
  if (rel) return { mode: 'parts', y: rel.y, mo: rel.mo, d: rel.d, h: 0, mi: 0, s: 0, ms: 0 };
  const split = splitZone(s);
  const base = split.base;
  const tz = split.tz;
  // 自定义规则优先于内置格式
  for (const rule of CUSTOM_PARSE_RULES) {
    if (rule && rule.enabled === false) continue;
    if (!rule || !rule.pattern) continue;
    let r = rule.type === 'regex' ? parseCustomRegex(rule.pattern, base) : parseCustomPlaceholder(rule.pattern, base);
    if (r) {
      if (tz && r.mode === 'parts') r.tz = tz;
      r.src = 'custom';
      r.customId = rule.id;
      return r;
    }
  }
  for (const f of DATE_PARSE_FORMATS) {
    if (!DATE_PARSE_ENABLED.has(f.id)) continue;
    let r = null;
    if (f.id === 'iso') r = parseIsoFmt(base);
    else if (f.id === 'ymd') r = parseYmdFmt(base);
    else if (f.id === 'cjk') r = parseCjkFmt(base);
    else if (f.id === 'rfcm') r = parseRfcmFmt(s);
    else if (f.id === 'num') r = parseNumFmt(base);
    if (r) {
      if (tz && r.mode === 'parts') r.tz = tz;
      r.src = f.id;
      return r;
    }
  }
  if (tz && tz.value === 'UTC') {
    const abs = Date.parse(s);
    if (!Number.isNaN(abs)) return { mode: 'abs', abs, tz, src: 'iso' };
  }
  return null;
}

function parseDate(text) {
  const pe = parseDateEx(text);
  if (!pe) return null;
  if (pe.mode === 'parts') return { kind: 'date', y: pe.y, mo: pe.mo, d: pe.d, h: pe.h, mi: pe.mi, se: pe.s };
  if (pe.tz != null) return { kind: 'date', abs: pe.abs, tz: pe.tz };
  return { kind: 'stamp', ms: pe.abs };
}
