// ========================================================
// js/timezone/compatibility-layer.js — 时区处理兼容层
// 提供向后兼容的API，同时支持新的IANA时区功能
// ========================================================

// IANA时区库将通过全局变量加载
let IanaTimezone;

// 兼容层配置
const COMPAT_CONFIG = {
  enableHistoricalData: true,
  fallbackToLegacy: true,
  verboseLogging: false
};

// 日志函数
function log(message, type = 'info') {
  if (COMPAT_CONFIG.verboseLogging) {
    console[type](`[Timezone Compatibility] ${message}`);
  }
}

// 兼容的时区格式化器缓存（保持原有API）
const tzFormatters = new Map();

// 获取时区格式化器（兼容原有API）
function getTzFormatter(tz) {
  if (!tzFormatters.has(tz)) {
    // 检查IANA时区库是否可用
    if (IanaTimezone && typeof IanaTimezone.getTzOffset === 'function') {
      tzFormatters.set(tz, {
        format: (date) => IanaTimezone.formatTzDate(date, tz),
        getOffset: (date) => IanaTimezone.getTzOffset(date, tz),
        getInfo: (date) => IanaTimezone.getTzInfo(date, tz)
      });
    } else {
      // 使用传统方式 - 创建一个简单的Intl格式化器
      try {
        const formatter = new Intl.DateTimeFormat('en-GB', {
          timeZone: tz, 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit', 
          weekday: 'short', 
          hour12: false,
        });
        
        tzFormatters.set(tz, {
          format: (date) => formatter.format(date),
          formatToParts: (date) => formatter.formatToParts(date),
          getOffset: (date) => legacyOffsetMinutes(date, tz),
          getInfo: (date) => legacyGetTzInfo(date, tz)
        });
      } catch (e) {
        // 如果创建格式化器失败，使用最简单的回退
        tzFormatters.set(tz, {
          format: (date) => legacyFormatTz(date, tz),
          getOffset: (date) => legacyOffsetMinutes(date, tz),
          getInfo: (date) => legacyGetTzInfo(date, tz)
        });
      }
    }
  }
  return tzFormatters.get(tz);
}

// 兼容的offsetMinutes函数
function offsetMinutes(date, tz) {
  log(`Calculating offset for ${tz} at ${date.toISOString()}`);
  
  if (!tz) return -date.getTimezoneOffset();
  if (tz === 'UTC') return 0;
  
  // 检查IANA时区库是否可用
  if (IanaTimezone && typeof IanaTimezone.getTzOffset === 'function') {
    try {
      const offset = IanaTimezone.getTzOffset(date, tz);
      log(`New IANA offset: ${offset} minutes for ${tz}`);
      return offset;
    } catch (e) {
      log(`IANA calculation failed: ${e.message}, falling back to legacy`);
    }
  }
  
  // 回退到原有逻辑
  if (COMPAT_CONFIG.fallbackToLegacy) {
    return legacyOffsetMinutes(date, tz);
  }
  
  // 如果没有回退配置，返回0
  return 0;
}

// 原有的offsetMinutes逻辑（作为回退）
function legacyOffsetMinutes(date, tz) {
  const fx = /^FIXED:([+-])(\d{2})(\d{2})$/.exec(tz);
  if (fx) {
    const mins = (+fx[2] * 60 + +fx[3]) * (fx[1] === '-' ? -1 : 1);
    return mins;
  }
  
  try {
    const formatter = getTzFormatter(tz);
    return formatter.getOffset(date);
  } catch (e) {
    log(`Legacy calculation failed: ${e.message}`);
    return 0;
  }
}

// 兼容的formatTz函数
function formatTz(date, tz) {
  log(`Formatting date for ${tz}`);
  
  if (!tz || tz === 'UTC') {
    return formatUtc(date);
  }
  
  // 检查IANA时区库是否可用
  if (IanaTimezone && typeof IanaTimezone.formatTzDate === 'function') {
    try {
      return IanaTimezone.formatTzDate(date, tz);
    } catch (e) {
      log(`IANA formatting failed: ${e.message}, falling back to legacy`);
    }
  }
  
  // 回退到原有逻辑
  if (COMPAT_CONFIG.fallbackToLegacy) {
    return legacyFormatTz(date, tz);
  }
  
  return '--';
}

// 原有的formatTz逻辑（作为回退）
function legacyFormatTz(date, tz) {
  const fx = /^FIXED:([+-])(\d{2})(\d{2})$/.exec(tz);
  if (fx) {
    const t = new Date(date.getTime() + ((+fx[2] * 60 + +fx[3]) * (fx[1] === '-' ? -1 : 1)) * 60000);
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())}`;
  }
  
  try {
    const formatter = getTzFormatter(tz);
    return formatter.format(date);
  } catch (e) {
    log(`Legacy formatting failed: ${e.message}`);
    return '--';
  }
}

// 兼容的tzParts函数
function tzParts(date, tz) {
  log(`Getting timezone parts for ${tz}`);
  
  if (!tz || tz === 'UTC') {
    if (tz === 'UTC') {
      return {
        y: date.getUTCFullYear(),
        mo: date.getUTCMonth() + 1,
        d: date.getUTCDate(),
        h: date.getUTCHours(),
        mi: date.getUTCMinutes(),
        se: date.getUTCSeconds(),
        ms: date.getMilliseconds(),
        wd: date.getUTCDay()
      };
    }
    return {
      y: date.getFullYear(),
      mo: date.getMonth() + 1,
      d: date.getDate(),
      h: date.getHours(),
      mi: date.getMinutes(),
      se: date.getSeconds(),
      ms: date.getMilliseconds(),
      wd: date.getDay()
    };
  }
  
  // 检查IANA时区库是否可用
  if (IanaTimezone && typeof IanaTimezone.getTzInfo === 'function') {
    try {
      const tzInfo = IanaTimezone.getTzInfo(date, tz);
      const dt = IanaTimezone.formatTzDate(date, tz, 'yyyy-MM-dd HH:mm:ss');
      
      // 解析格式化后的日期
      const parts = dt.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
      if (parts) {
        return {
          y: parseInt(parts[1], 10),
          mo: parseInt(parts[2], 10),
          d: parseInt(parts[3], 10),
          h: parseInt(parts[4], 10),
          mi: parseInt(parts[5], 10),
          se: parseInt(parts[6], 10),
          ms: date.getMilliseconds(),
          wd: date.getDay(),
          tzOffset: tzInfo.offset,
          tzName: tzInfo.name,
          isDst: tzInfo.isDst
        };
      }
    } catch (e) {
      log(`IANA tzParts failed: ${e.message}, falling back to legacy`);
    }
  }
  
  // 回退到原有逻辑
  if (COMPAT_CONFIG.fallbackToLegacy) {
    return legacyTzParts(date, tz);
  }
  
  return null;
}

// 原有的tzParts逻辑（作为回退）
function legacyTzParts(date, tz) {
  const fx = /^FIXED:([+-])(\d{2})(\d{2})$/.exec(tz);
  if (fx) {
    const off = (+fx[2] * 60 + +fx[3]) * (fx[1] === '-' ? -1 : 1);
    const t = new Date(date.getTime() + off * 60000);
    return {
      y: t.getUTCFullYear(),
      mo: t.getUTCMonth() + 1,
      d: t.getUTCDate(),
      h: t.getUTCHours(),
      mi: t.getUTCMinutes(),
      se: t.getUTCSeconds(),
      ms: date.getMilliseconds(),
      wd: t.getUTCDay()
    };
  }
  
  try {
    const formatter = getTzFormatter(tz);
    const info = formatter.getInfo(date);
    const formatted = formatter.format(date);
    const parts = formatted.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
    
    if (parts) {
      return {
        y: parseInt(parts[1], 10),
        mo: parseInt(parts[2], 10),
        d: parseInt(parts[3], 10),
        h: parseInt(parts[4], 10),
        mi: parseInt(parts[5], 10),
        se: parseInt(parts[6], 10),
        ms: date.getMilliseconds(),
        wd: date.getDay(),
        tzOffset: info.offset,
        tzName: info.name,
        isDst: info.isDst
      };
    }
  } catch (e) {
    log(`Legacy tzParts failed: ${e.message}`);
  }
  
  return null;
}

// 兼容的dateToMs函数
function dateToMs(d, tz) {
  log(`Converting date to timestamp for ${tz}`);
  
  if (!tz) {
    return new Date(d.y, d.mo - 1, d.d, d.h, d.mi, d.se, d.ms || 0).getTime();
  }
  
  // 检查IANA时区库是否可用
  if (IanaTimezone && typeof IanaTimezone.getTzInfo === 'function') {
    try {
      const date = new Date(d.y, d.mo - 1, d.d, d.h, d.mi, d.se, d.ms || 0);
      const tzInfo = IanaTimezone.getTzInfo(date, tz);
      
      // 使用时区信息调整时间戳
      const adjustedDate = new Date(date.getTime() - tzInfo.offset * 60000);
      return adjustedDate.getTime();
    } catch (e) {
      log(`IANA dateToMs failed: ${e.message}, falling back to legacy`);
    }
  }
  
  // 回退到原有逻辑
  if (COMPAT_CONFIG.fallbackToLegacy) {
    return legacyDateToMs(d, tz);
  }
  
  // 如果没有回退配置，使用UTC时间
  return Date.UTC(d.y, d.mo - 1, d.d, d.h, d.mi, d.se, d.ms || 0);
}

// 原有的dateToMs逻辑（作为回退）
function legacyDateToMs(d, tz) {
  const hasMs = typeof d.ms === 'number';
  if (!tz) {
    return hasMs ? new Date(d.y, d.mo - 1, d.d, d.h, d.mi, d.se, d.ms).getTime()
                 : new Date(d.y, d.mo - 1, d.d, d.h, d.mi, d.se).getTime();
  }
  
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

// 辅助函数
function pad(n) {
  return String(n).padStart(2, '0');
}

function formatUtc(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getSeconds())}`;
}

// 原有的时区信息获取逻辑（作为回退）
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
    const parts = formatter.formatToParts ? formatter.formatToParts(date) : [];
    const m = {};
    for (const p of parts) {
      if (p.type !== 'literal') m[p.type] = p.value;
    }
    
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

// 导出兼容层API
const TimezoneCompatibility = {
  // 核心兼容函数
  offsetMinutes,
  formatTz,
  tzParts,
  dateToMs,
  
  // 工具函数
  getTzFormatter,
  clearCache: () => {
    tzFormatters.clear();
    IanaTimezone.clearTzCache();
  },
  
  // 配置
  config: COMPAT_CONFIG,
  setConfig: (newConfig) => {
    Object.assign(COMPAT_CONFIG, newConfig);
  },
  
  // 状态检查
  isUsingHistoricalData: () => COMPAT_CONFIG.enableHistoricalData,
  isFallbackEnabled: () => COMPAT_CONFIG.fallbackToLegacy,
  
  // 获取IANA时区库实例
  getIanaTimezone: () => IanaTimezone
};

// 全局导出
if (typeof window !== 'undefined') {
  window.TimezoneCompatibility = TimezoneCompatibility;
}

// 初始化函数
function initializeCompatibility() {
  // 等待IANA时区库加载
  if (typeof window.IanaTimezone !== 'undefined') {
    IanaTimezone = window.IanaTimezone;
    console.log('Timezone compatibility layer initialized with IANA support');
  } else {
    console.warn('IANA timezone library not found, using legacy mode only');
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  // 延迟初始化以确保IANA库已加载
  setTimeout(initializeCompatibility, 200);
  
  // 提供手动初始化方法
  window.initializeTimezoneCompatibility = initializeCompatibility;
}