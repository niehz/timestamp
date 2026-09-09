/**
 * 工具函数模块 - 验证器
 */

// 时间戳常量
export const MIN_TS = -8640000000000000;
export const MAX_TS = 8640000000000000;

/**
 * 时间戳验证器
 * @param {number|string} timestamp - 要验证的时间戳
 * @returns {boolean} 是否有效
 */
export function validateTimestamp(timestamp) {
  const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  if (typeof ts !== 'number' || !Number.isInteger(ts)) return false;
  return ts >= MIN_TS && ts <= MAX_TS;
}

/**
 * 日期验证器
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @param {number} day - 日期
 * @returns {boolean} 是否有效
 */
export function validateDate(year, month, day) {
  if (year < 1 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

/**
 * 时区偏移验证器
 * @param {string} offset - 时区偏移
 * @returns {boolean} 是否有效
 */
export function validateTimezoneOffset(offset) {
  const parsed = parseOffsetInput(offset);
  return parsed !== null;
}

/**
 * 时间输入验证器
 * @param {string} time - 时间字符串 (HH:mm:ss)
 * @returns {boolean} 是否有效
 */
export function validateTime(time) {
  if (!time || typeof time !== 'string') return false;
  
  const parts = time.split(':');
  if (parts.length !== 3) return false;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  
  return hours >= 0 && hours <= 23 &&
         minutes >= 0 && minutes <= 59 &&
         seconds >= 0 && seconds <= 59;
}

/**
 * 毫秒输入验证器
 * @param {string} ms - 毫秒字符串
 * @param {string} precision - 精度 ('ms', 'us', 'ns')
 * @returns {boolean} 是否有效
 */
export function validateFraction(ms, precision = 'ms') {
  if (!ms || typeof ms !== 'string') return false;
  
  const num = parseInt(ms, 10);
  if (isNaN(num)) return false;
  
  switch (precision) {
    case 'ms':
      return num >= 0 && num <= 999;
    case 'us':
      return num >= 0 && num <= 999999;
    case 'ns':
      return num >= 0 && num <= 999999999;
    default:
      return false;
  }
}

/**
 * 输入验证器
 * @param {string} input - 输入字符串
 * @param {string} type - 输入类型 ('date', 'time', 'timestamp', 'fraction')
 * @returns {boolean} 是否有效
 */
export function validateInput(input, type) {
  if (!input || typeof input !== 'string') return false;
  
  switch (type) {
    case 'date':
      const dateMatch = input.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
      if (!dateMatch) return false;
      return validateDate(parseInt(dateMatch[1], 10), parseInt(dateMatch[2], 10), parseInt(dateMatch[3], 10));
    
    case 'time':
      return validateTime(input);
    
    case 'timestamp':
      return validateTimestamp(input);
    
    case 'fraction':
      return validateFraction(input);
    
    default:
      return false;
  }
}

/**
 * HTML转义函数
 * @param {string} s - 要转义的字符串
 * @returns {string} 转义后的字符串
 */
export function htmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * 属性转义函数
 * @param {string} str - 要转义的字符串
 * @returns {string} 转义后的字符串
 */
export function escapeAttr(str) {
  return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * 防抖函数
 * @param {Function} fn - 要防抖的函数
 * @param {number} ms - 防抖时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * 节流函数
 * @param {Function} fn - 要节流的函数
 * @param {number} ms - 节流时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, ms) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

/**
 * 数字补零函数
 * @param {number} num - 要补零的数字
 * @param {number} length - 补零后的长度
 * @returns {string} 补零后的字符串
 */
export function pad(num, length = 2) {
  return String(num).padStart(length, '0');
}

/**
 * 解析时区偏移输入
 * @param {string} str - 时区偏移字符串
 * @returns {number|null} 解析后的偏移分钟数，失败返回null
 */
export function parseOffsetInput(str) {
  const s = String(str || '').trim();
  if (!s) return null;
  // +8 / -5 / 8 / +08:00 / -04:30 / 0530 / +530 / 330
  let m = s.match(/^([+-])?(\d{1,2})(?::(\d{2}))?$/) || s.match(/^([+-])?(\d{2})?(\d{2})$/.exec(s) && s.match(/^([+-])?(\d{1,2})(\d{2})$/));
  let sign, hh, mm;
  if (m) {
    sign = m[1] === '-' ? -1 : 1;
    hh = parseInt(m[2], 10);
    mm = m[3] ? parseInt(m[3], 10) : 0;
  } else {
    const m2 = s.match(/^([+-])?(\d{1,2})(\d{2})$/);
    if (m2) { sign = m2[1] === '-' ? -1 : 1; hh = parseInt(m2[2], 10); mm = parseInt(m2[3], 10); }
  }
  if (typeof hh === 'undefined') return null;
  if (mm === undefined) mm = 0;
  if (mm >= 60) return null;
  const total = hh * 60 + mm;
  const adj = total * sign;
  if (adj > 14 * 60 || adj < -12 * 60) return null;
  return adj;
}

/**
 * BigInt向下取整除法
 * @param {bigint} a - 被除数
 * @param {bigint} b - 除数
 * @returns {bigint} 向下取整的结果
 */
export function bigFloorDiv(a, b) {
  if (b === 0n) throw new Error('Division by zero');
  const result = a / b;
  const remainder = a % b;
  return remainder < 0n ? result - 1n : result;
}

/**
 * 格式化偏移量
 * @param {number} minutes - 偏移分钟数
 * @returns {string} 格式化后的偏移字符串
 */
export function formatOffset(minutes) {
  if (minutes === 0) return 'UTC+00:00';
  const sign = minutes < 0 ? '-' : '+';
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  return `UTC${sign}${pad(hours)}:${pad(mins)}`;
}

/**
 * 检查是否为有效的IANA时区
 * @param {string} tz - 时区字符串
 * @returns {boolean} 是否有效
 */
export function isValidIana(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 获取系统时区
 * @returns {string} 系统时区
 */
export function getSystemTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch (e) {
    return '';
  }
}

/**
 * 检查字符串是否为空
 * @param {string} str - 要检查的字符串
 * @returns {boolean} 是否为空
 */
export function isEmpty(str) {
  return !str || typeof str !== 'string' || str.trim().length === 0;
}

/**
 * 检查字符串是否为数字
 * @param {string} str - 要检查的字符串
 * @returns {boolean} 是否为数字
 */
export function isNumeric(str) {
  return /^\d+$/.test(str);
}

/**
 * 检查字符串是否为负数
 * @param {string} str - 要检查的字符串
 * @returns {boolean} 是否为负数
 */
export function isNegative(str) {
  return /^-\d+$/.test(str);
}

/**
 * 检查是否为闰年
 * @param {number} year - 年份
 * @returns {boolean} 是否为闰年
 */
export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * 获取月份的天数
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {number} 天数
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * 检查日期是否有效
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @param {number} day - 日期
 * @returns {boolean} 是否有效
 */
export function isValidDate(year, month, day) {
  if (year < 1 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > getDaysInMonth(year, month)) return false;
  return true;
}