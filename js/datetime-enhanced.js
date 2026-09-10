// ========================================================
// js/datetime.js — 时间/时区格式化、日期解析引擎（增强版）
// 集成IANA时区支持，包括历史偏移数据
// ========================================================

// 全局兼容层引用
let TimezoneCompatibility;

// 全局变量
let ianaLoaded = false;

// 等待兼容层初始化
function waitForCompatibilityLayer() {
  if (typeof window.TimezoneCompatibility !== 'undefined') {
    TimezoneCompatibility = window.TimezoneCompatibility;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (typeof window.TimezoneCompatibility !== 'undefined') {
        clearInterval(checkInterval);
        TimezoneCompatibility = window.TimezoneCompatibility;
        resolve();
      }
    }, 50);
  });
}

// 初始化IANA时区支持
function initIanaTimezone() {
  if (ianaLoaded) return true;
  
  try {
    // 等待兼容层初始化
    waitForCompatibilityLayer();
    
    // 等待IANA时区库加载
    if (typeof window.IanaTimezone !== 'undefined') {
      window.IanaTimezone.loadLuxon().then(() => {
        ianaLoaded = true;
      }).catch(error => {
        console.warn('Failed to load Luxon library:', error);
      });
    } else {
      console.warn('IANA timezone library not available');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize IANA timezone support:', error);
    return false;
  }
}

// 原有的本地格式化函数
function formatLocal(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// 原有的UTC格式化函数
function formatUTC(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

// 增强的时区格式化函数
function formatTz(date, tz) {
  // 首先尝试使用IANA时区支持
  if (ianaLoaded) {
    try {
      return TimezoneCompatibility.formatTz(date, tz);
    } catch (error) {
      console.warn('IANA formatting failed, falling back to legacy:', error);
    }
  }
  
  // 回退到原有逻辑
  return legacyFormatTz(date, tz);
}

// 原有的时区格式化逻辑
function legacyFormatTz(date, tz) {
  if (!tz || tz === 'UTC') return formatUTC(date);
  const fx = /^FIXED:([+-])(\d{2})(\d{2})$/.exec(tz);
  if (fx) {
    const t = new Date(date.getTime() + ((+fx[2] * 60 + +fx[3]) * (fx[1] === '-' ? -1 : 1)) * 60000);
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())}`;
  }
  try {
    const m = partsMap(getTzFormatter(tz).formatToParts(date));
    const year = m.era === 'BC' ? '-' + m.year : m.year;
    return `${year}-${m.month}-${m.day} ${pad(m.hour % 24)}:${pad(m.minute)}:${pad(m.second)}`;
  } catch (e) { return '--'; }
}

// 增强的时区部分解析函数
function tzParts(date, tz) {
  // 首先尝试使用IANA时区支持
  if (ianaLoaded) {
    try {
      return TimezoneCompatibility.tzParts(date, tz);
    } catch (error) {
      console.warn('IANA tzParts failed, falling back to legacy:', error);
    }
  }
  
  // 回退到原有逻辑
  return legacyTzParts(date, tz);
}

// 原有的时区部分解析逻辑
function legacyTzParts(date, tz) {
  if (!tz || tz === 'UTC') {
    if (tz === 'UTC') {
      return { y: date.getUTCFullYear(), mo: date.getUTCMonth() + 1, d: date.getUTCDate(), h: date.getUTCHours(), mi: date.getUTCMinutes(), se: date.getSeconds(), ms: date.getMilliseconds(), wd: date.getUTCDay() };
    }
    return { y: date.getFullYear(), mo: date.getMonth() + 1, d: date.getDate(), h: date.getHours(), mi: date.getMinutes(), se: date.getSeconds(), ms: date.getMilliseconds(), wd: date.getDay() };
  }
  const fx = /^FIXED:([+-])(\d{2})(\d{2})$/.exec(tz);
  if (fx) {
    const off = (+fx[2] * 60 + +fx[3]) * (fx[1] === '-' ? -1 : 1);
    const t = new Date(date.getTime() + off * 60000);
    return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes(), se: t.getSeconds(), ms: date.getMilliseconds(), wd: t.getUTCDay() };
  }
  try {
    const m = partsMap(getTzFormatter(tz).formatToParts(date));
    return { y: m.era === 'BC' ? -Number(m.year) : Number(m.year), mo: Number(m.month), d: Number(m.day), h: Number(m.hour) % 24, mi: Number(m.minute), se: Number(m.second), ms: date.getMilliseconds(), wd: WD_INDEX[m.weekday] };
  } catch (e) { return null; }
}

// 增强的格式化函数（支持自定义模板）
async function formatWithTokens(ms, tz, fmt) {
  const p = await tzParts(new Date(ms), tz);
  if (!p) return '--';
  
  const hour12 = p.h % 12 === 0 ? 12 : p.h % 12;
  const ap = p.h < 12 ? 'AM' : 'PM';
  const map = {
    YYYY: String(p.y), YY: String(Math.abs(p.y)).slice(-2), MM: pad(p.mo), DD: pad(p.d),
    HH: pad(p.h), hh: pad(hour12), mm: pad(p.mi), ss: pad(p.se), SSS: String(p.ms).padStart(3, '0'),
    A: ap, a: ap.toLowerCase(), W: WEEK_CN[WEEK_EN[p.wd]] || '', WD: WEEK_EN[p.wd] || '',
  };
  return fmt.replace(/YYYY|YY|MM|DD|HH|hh|mm|ss|SSS|A|a|W|WD/g, (t) => map[t] !== undefined ? map[t] : t);
}

// 增强的时区偏移计算函数
function offsetMinutes(date, tz) {
  // 首先尝试使用IANA时区支持
  if (ianaLoaded) {
    try {
      return TimezoneCompatibility.offsetMinutes(date, tz);
    } catch (error) {
      console.warn('IANA offset calculation failed, falling back to legacy:', error);
    }
  }
  
  // 回退到原有逻辑
  return legacyOffsetMinutes(date, tz);
}

// 原有的时区偏移计算逻辑
function legacyOffsetMinutes(date, tz) {
  if (!tz) return -date.getTimezoneOffset();
  if (tz === 'UTC') return 0;
  const fx = /^FIXED:([+-])(\d{2})(\d{2})$/.exec(tz);
  if (fx) {
    const mins = (+fx[2] * 60 + +fx[3]) * (fx[1] === '-' ? -1 : 1);
    return mins;
  }
  try {
    const m = partsMap(getTzFormatter(tz).formatToParts(date));
    const year = m.era === 'BC' ? -Number(m.year) : Number(m.year);
    const asUtc = Date.UTC(year, Number(m.month) - 1, Number(m.day), Number(m.hour) % 24, Number(m.minute), Number(m.second));
    return Math.round((asUtc - date.getTime()) / 60000);
  } catch (e) { return 0; }
}

// 增强的日期到时间戳转换函数
function dateToMs(d, tz) {
  // 首先尝试使用IANA时区支持
  if (ianaLoaded) {
    try {
      return TimezoneCompatibility.dateToMs(d, tz);
    } catch (error) {
      console.warn('IANA dateToMs failed, falling back to legacy:', error);
    }
  }
  
  // 回退到原有逻辑
  return legacyDateToMs(d, tz);
}

// 原有的日期到时间戳转换逻辑
function legacyDateToMs(d, tz) {
  const hasMs = typeof d.ms === 'number';
  if (!tz) return hasMs ? new Date(d.y, d.mo - 1, d.d, d.h, d.mi, d.se, d.ms).getTime()
                         : new Date(d.y, d.mo - 1, d.d, d.h, d.mi, d.se).getTime();
  const guess = hasMs ? Date.UTC(d.y, d.mo - 1, d.d, d.h, d.mi, d.se, d.ms)
                     : Date.UTC(d.y, d.mo - 1, d.d, d.h, d.mi, d.se);
  let ms = guess - offsetMinutes(new Date(guess), tz) * 60000;
  // DST 切换日：迭代取偏移直到稳定
  for (let i = 0; i < 8; i++) {
    const next = guess - offsetMinutes(new Date(ms), tz) * 60000;
    if (next === ms) break;
    ms = next;
  }
  return ms;
}

// 原有的辅助函数
function partsMap(parts) { const m = {}; for (const p of parts) if (p.type !== 'literal') m[p.type] = p.value; return m; }
function pad(n) { return String(n).padStart(2, '0'); }

// 原有的时区格式化器
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

// 原有的常量
const WD_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// 新增：获取时区信息（增强版）
function getTzInfo(date, tz) {
  if (ianaLoaded) {
    try {
      return TimezoneCompatibility.getIanaTimezone().getTzInfo(date, tz);
    } catch (error) {
      console.warn('IANA getTzInfo failed, falling back to legacy:', error);
    }
  }
  
  // 回退到原有逻辑
  return legacyGetTzInfo(date, tz);
}

// 原有的时区信息获取逻辑
function legacyGetTzInfo(date, tz) {
  if (!tz || tz === 'UTC') {
    return {
      offset: 0,
      name: 'UTC',
      abbreviation: 'UTC',
      isDst: false
    };
  }
  
  try {
    const formatter = getTzFormatter(tz);
    const parts = formatter.formatToParts(date);
    const m = partsMap(parts);
    
    return {
      offset: offsetMinutes(date, tz),
      name: tz,
      abbreviation: m.timeZoneName || tz,
      isDst: false // 原有逻辑不支持DST检测
    };
  } catch (e) {
    return {
      offset: 0,
      name: tz,
      abbreviation: 'ERR',
      isDst: false
    };
  }
}

// 新增：检查时区是否支持历史数据
function supportsHistoricalData(tz) {
  if (ianaLoaded) {
    try {
      return TimezoneCompatibility.getIanaTimezone().supportsHistoricalData(tz);
    } catch (error) {
      console.warn('IANA supportsHistoricalData failed:", error);
      return false;
    }
  }
  
  return false;
}

// 新增：获取时区历史信息
function getTzHistoricalInfo(tz, year) {
  if (ianaLoaded) {
    try {
      return TimezoneCompatibility.getIanaTimezone().getTzHistoricalInfo(tz, year);
    } catch (error) {
      console.warn('IANA getTzHistoricalInfo failed:', error);
    }
  }
  
  return {
    hasHistoricalData: false,
    historicalOffset: 0,
    historicalName: tz,
    year: year,
    notes: '历史数据不可用'
  };
}

// 新增：获取增强时区列表
function getEnhancedTzList() {
  if (ianaLoaded) {
    try {
      return TimezoneCompatibility.getIanaTimezone().getEnhancedTzList();
    } catch (error) {
      console.warn('IANA getEnhancedTzList failed, falling back to legacy:', error);
    }
  }
  
  // 回退到原有逻辑
  return getAllZones().map(zone => ({
    ...zone,
    currentOffset: 0,
    currentOffsetFormatted: 'UTC+00:00',
    supportsHistorical: false,
    historicalInfo: {
      hasHistoricalData: false,
      historicalOffset: 0,
      historicalName: zone.value,
      year: new Date().getFullYear(),
      notes: '历史数据不可用'
    }
  }));
}

// 将所有函数和常量挂载到全局对象
window.DatetimeEnhanced = {
  // 原有函数
  formatLocal,
  formatUTC,
  formatTz,
  tzParts,
  formatWithTokens,
  offsetMinutes,
  dateToMs,
  
  // 新增函数
  initIanaTimezone,
  getTzInfo,
  supportsHistoricalData,
  getTzHistoricalInfo,
  getEnhancedTzList,
  
  // 常量
  WD_INDEX,
  WEEK_EN,
  
  // 辅助函数
  pad,
  partsMap,
  getTzFormatter
};

// 向后兼容：将函数直接挂载到全局
window.formatLocal = formatLocal;
window.formatUTC = formatUTC;
window.formatTz = formatTz;
window.tzParts = tzParts;
window.formatWithTokens = formatWithTokens;
window.offsetMinutes = offsetMinutes;
window.dateToMs = dateToMs;
window.initIanaTimezone = initIanaTimezone;
window.getTzInfo = getTzInfo;
window.supportsHistoricalData = supportsHistoricalData;
window.getTzHistoricalInfo = getTzHistoricalInfo;
window.getEnhancedTzList = getEnhancedTzList;