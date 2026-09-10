// ========================================================
// js/timezone/iana-timezone.js — IANA时区处理核心模块
// 使用Luxon库提供完整的IANA时区支持，包括历史偏移
// ========================================================

// Luxon库导入（通过CDN）
let DateTime;
let Interval;

// 动态加载Luxon库
function loadLuxon() {
  return new Promise((resolve, reject) => {
    if (window.luxon) {
      DateTime = window.luxon.DateTime;
      Interval = window.luxon.Interval;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/luxon@3.4.4/build/global/luxon.min.js';
    script.onload = () => {
      DateTime = window.luxon.DateTime;
      Interval = window.luxon.Interval;
      resolve();
    };
    script.onerror = () => {
      console.error('Failed to load Luxon library');
      reject(new Error('Luxon library failed to load'));
    };
    document.head.appendChild(script);
  });
}

// 时区处理配置
const IANA_CONFIG = {
  enableHistoricalData: true,
  showTzOffsetInfo: true,
  performanceMode: 'balanced', // 'balanced' | 'fast' | 'accurate'
  cacheSize: 100
};

// 时区缓存
const tzCache = new Map();

// 缓存键生成
function getCacheKey(date, timeZone) {
  return `${date.getTime()}-${timeZone}`;
}

// 获取缓存的时区信息
function getCachedTzInfo(date, timeZone) {
  const key = getCacheKey(date, timeZone);
  return tzCache.get(key);
}

// 设置缓存的时区信息
function setCachedTzInfo(date, timeZone, info) {
  const key = getCacheKey(date, timeZone);
  tzCache.set(key, info);
  
  // 限制缓存大小
  if (tzCache.size > IANA_CONFIG.cacheSize) {
    const firstKey = tzCache.keys().next().value;
    tzCache.delete(firstKey);
  }
}

// 清空缓存
function clearTzCache() {
  tzCache.clear();
}

// 检查时区是否有效
function isValidTimeZone(timeZone) {
  try {
    DateTime.local().setZone(timeZone);
    return true;
  } catch (e) {
    return false;
  }
}

// 获取时区偏移（支持历史数据）
function getTzOffset(date, timeZone) {
  if (!timeZone || timeZone === 'UTC') return 0;
  
  // 固定偏移时区处理
  if (timeZone.startsWith('FIXED:')) {
    return parseFixedOffset(timeZone);
  }
  
  try {
    const dt = DateTime.fromJSDate(date, { zone: timeZone });
    return dt.offset;
  } catch (e) {
    console.warn(`Failed to get offset for ${timeZone}:`, e);
    return 0;
  }
}

// 解析固定偏移格式 (FIXED:+08:00)
function parseFixedOffset(timeZone) {
  const match = timeZone.match(/^FIXED:([+-])(\d{2}):?(\d{2})$/);
  if (!match) return 0;
  
  const sign = match[1] === '-' ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;
  
  return (hours * 60 + minutes) * sign;
}

// 格式化时区偏移
function formatOffset(minutes) {
  if (minutes === 0) return 'UTC+00:00';
  
  const sign = minutes > 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  
  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// 获取时区信息（包含历史数据）
function getTzInfo(date, timeZone) {
  if (!timeZone || timeZone === 'UTC') {
    return {
      offset: 0,
      name: 'UTC',
      abbreviation: 'UTC',
      isDst: false,
      historicalOffset: 0,
      historicalName: 'UTC'
    };
  }
  
  // 固定偏移时区处理
  if (timeZone.startsWith('FIXED:')) {
    const offset = parseFixedOffset(timeZone);
    return {
      offset,
      name: timeZone,
      abbreviation: 'FIXED',
      isDst: false,
      historicalOffset: offset,
      historicalName: timeZone
    };
  }
  
  // 尝试从缓存获取
  const cached = getCachedTzInfo(date, timeZone);
  if (cached) return cached;
  
  try {
    const dt = DateTime.fromJSDate(date, { zone: timeZone });
    const info = {
      offset: dt.offset,
      name: dt.zoneName,
      abbreviation: dt.zoneName,
      isDst: dt.isInDST,
      historicalOffset: dt.offset,
      historicalName: dt.zoneName,
      formattedOffset: formatOffset(dt.offset)
    };
    
    // 缓存结果
    setCachedTzInfo(date, timeZone, info);
    return info;
  } catch (e) {
    console.warn(`Failed to get tz info for ${timeZone}:`, e);
    return {
      offset: 0,
      name: timeZone,
      abbreviation: 'ERR',
      isDst: false,
      historicalOffset: 0,
      historicalName: timeZone
    };
  }
}

// 格式化时区日期（支持历史数据）
function formatTzDate(date, timeZone, format = 'yyyy-MM-dd HH:mm:ss') {
  if (!timeZone || timeZone === 'UTC') {
    return formatUtcDate(date, format);
  }
  
  // 固定偏移时区处理
  if (timeZone.startsWith('FIXED:')) {
    const offset = parseFixedOffset(timeZone);
    const adjustedDate = new Date(date.getTime() + offset * 60000);
    return formatUtcDate(adjustedDate, format);
  }
  
  try {
    const dt = DateTime.fromJSDate(date, { zone: timeZone });
    return dt.toFormat(format);
  } catch (e) {
    console.warn(`Failed to format date for ${timeZone}:`, e);
    return formatUtcDate(date, format);
  }
}

// 格式化UTC日期
function formatUtcDate(date, format = 'yyyy-MM-dd HH:mm:ss') {
  const dt = DateTime.fromJSDate(date);
  return dt.toFormat(format);
}

// 解析时区日期字符串
function parseTzDateString(dateStr, timeZone) {
  try {
    let dt;
    
    if (timeZone && timeZone !== 'UTC') {
      dt = DateTime.fromFormat(dateStr, format, { zone: timeZone });
    } else {
      dt = DateTime.fromFormat(dateStr, format);
    }
    
    if (!dt.isValid) {
      throw new Error('Invalid date format');
    }
    
    return dt.toJSDate();
  } catch (e) {
    console.warn(`Failed to parse date string:`, e);
    return null;
  }
}

// 获取时区历史信息
function getTzHistoricalInfo(timeZone, year) {
  if (!timeZone || timeZone.startsWith('FIXED:')) {
    return {
      hasHistoricalData: false,
      historicalOffset: parseFixedOffset(timeZone),
      historicalName: timeZone,
      notes: 'Fixed offset timezone'
    };
  }
  
  try {
    // 创建一个指定年份的日期来检查历史偏移
    const testDate = new Date(year, 0, 1);
    const dt = DateTime.fromJSDate(testDate, { zone: timeZone });
    
    return {
      hasHistoricalData: true,
      historicalOffset: dt.offset,
      historicalName: dt.zoneName,
      year: year,
      notes: dt.offset === 0 ? 'Standard UTC' : `Historical offset: ${formatOffset(dt.offset)}`
    };
  } catch (e) {
    console.warn(`Failed to get historical info for ${timeZone}:`, e);
    return {
      hasHistoricalData: false,
      historicalOffset: 0,
      historicalName: timeZone,
      year: year,
      notes: 'Unable to determine historical offset'
    };
  }
}

// 检查时区是否支持历史数据
function supportsHistoricalData(timeZone) {
  if (!timeZone || timeZone.startsWith('FIXED:')) {
    return false;
  }
  
  try {
    // 测试几个关键年份
    const testYears = [1200, 1900, 1950, 2000];
    for (const year of testYears) {
      const testDate = new Date(year, 0, 1);
      const dt = DateTime.fromJSDate(testDate, { zone: timeZone });
      if (dt.offset !== 0) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

// 获取时区列表（增强版）
function getEnhancedTzList() {
  const allZones = getAllZones();
  return allZones.map(zone => {
    const tzInfo = getTzInfo(new Date(), zone.value);
    return {
      ...zone,
      currentOffset: tzInfo.offset,
      currentOffsetFormatted: tzInfo.formattedOffset,
      supportsHistorical: supportsHistoricalData(zone.value),
      historicalInfo: getTzHistoricalInfo(zone.value, new Date().getFullYear())
    };
  });
}

// 获取所有可用时区
function getAllAvailableTimeZones() {
  try {
    return DateTime.now().setZone('UTC').availableZoneNames;
  } catch (e) {
    console.warn('Failed to get available time zones:', e);
    return [];
  }
}

// 导出API
const IanaTimezone = {
  // 核心功能
  loadLuxon,
  getTzOffset,
  formatOffset,
  getTzInfo,
  formatTzDate,
  parseTzDateString,
  
  // 历史数据支持
  getTzHistoricalInfo,
  supportsHistoricalData,
  
  // 工具函数
  isValidTimeZone,
  clearTzCache,
  
  // 配置
  config: IANA_CONFIG,
  
  // 获取增强时区列表
  getEnhancedTzList,
  getAllAvailableTimeZones
};

// 全局导出
if (typeof window !== 'undefined') {
  window.IanaTimezone = IanaTimezone;
}