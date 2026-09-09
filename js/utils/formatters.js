/**
 * 工具函数模块 - 格式化工具
 */

import { pad, formatOffset } from './validators.js';

/**
 * 格式化本地时间
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的时间字符串
 */
export function formatLocal(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * 格式化UTC时间
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的时间字符串
 */
export function formatUTC(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

/**
 * 格式化时区时间
 * @param {Date} date - 日期对象
 * @param {string} tz - 时区
 * @returns {string} 格式化后的时间字符串
 */
export function formatTz(date, tz) {
  if (!tz || tz === 'UTC') return formatUTC(date);
  const fx = /^FIXED:([+-])(\d{2})(\d{2})$/.exec(tz);
  if (fx) {
    const t = new Date(date.getTime() + ((+fx[2] * 60 + +fx[3]) * (fx[1] === '-' ? -1 : 1)) * 60000);
    return formatUTC(t);
  }
  try {
    const fx = new Intl.DateTimeFormat('en-GB', {
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
    const parts = fx.formatToParts(date);
    const m = {};
    for (const p of parts) {
      if (p.type !== 'literal') m[p.type] = p.value;
    }
    const year = m.era === 'BC' ? '-' + m.year : m.year;
    return `${year}-${m.month}-${pad(parseInt(m.hour) % 24)}:${m.minute}:${m.second}`;
  } catch (e) {
    return '--';
  }
}

/**
 * 格式化日期字符串
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @param {number} day - 日期
 * @param {number} hours - 小时
 * @param {number} minutes - 分钟
 * @param {number} seconds - 秒钟
 * @returns {string} 格式化后的日期字符串
 */
export function toDateStr(year, month, day, hours = 0, minutes = 0, seconds = 0) {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * 格式化时间戳
 * @param {number|string} timestamp - 时间戳
 * @param {string} precision - 精度 ('sec', 'ms', 'us', 'ns')
 * @returns {string} 格式化后的时间戳字符串
 */
export function formatTimestamp(timestamp, precision = 'ms') {
  const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  
  switch (precision) {
    case 'sec':
      return String(Math.floor(ts / 1000));
    case 'ms':
      return String(ts);
    case 'us':
      return String(ts * 1000);
    case 'ns':
      return String(ts * 1000000);
    default:
      return String(ts);
  }
}

/**
 * 格式化相对时间
 * @param {Date} date - 日期对象
 * @returns {string} 相对时间字符串
 */
export function formatRelative(date) {
  const now = new Date();
  const diff = now - date;
  const absDiff = Math.abs(diff);
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  if (absDiff < minute) {
    return '刚刚';
  } else if (absDiff < hour) {
    const minutes = Math.floor(absDiff / minute);
    return `${minutes}分钟前`;
  } else if (absDiff < day) {
    const hours = Math.floor(absDiff / hour);
    return `${hours}小时前`;
  } else {
    const days = Math.floor(absDiff / day);
    return `${days}天前`;
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小字符串
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化数字
 * @param {number} num - 数字
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的数字字符串
 */
export function formatNumber(num, decimals = 2) {
  return num.toFixed(decimals);
}

/**
 * 格式化百分比
 * @param {number} num - 数字
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的百分比字符串
 */
export function formatPercentage(num, decimals = 2) {
  return (num * 100).toFixed(decimals) + '%';
}

/**
 * 格式化货币
 * @param {number} amount - 金额
 * @param {string} currency - 货币代码
 * @returns {string} 格式化后的货币字符串
 */
export function formatCurrency(amount, currency = 'CNY') {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @param {string} format - 格式字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化时间
 * @param {Date} date - 日期对象
 * @param {string} format - 格式字符串
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(date, format = 'HH:mm:ss') {
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  
  return format
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化星期
 * @param {Date} date - 日期对象
 * @returns {string} 星期字符串
 */
export function formatWeekday(date) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[date.getDay()];
}

/**
 * 格式化月份
 * @param {Date} date - 日期对象
 * @returns {string} 月份字符串
 */
export function formatMonth(date) {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return months[date.getMonth()];
}

/**
 * 格式化季度
 * @param {Date} date - 日期对象
 * @returns {string} 季度字符串
 */
export function formatQuarter(date) {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter}`;
}

/**
 * 格式化年份
 * @param {Date} date - 日期对象
 * @returns {string} 年份字符串
 */
export function formatYear(date) {
  return String(date.getFullYear());
}

/**
 * 格式化时间差
 * @param {number} milliseconds - 毫秒数
 * @returns {string} 格式化后的时间差字符串
 */
export function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}天${hours % 24}小时`;
  } else if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
}

/**
 * 格式化JSON
 * @param {Object} obj - JSON对象
 * @param {number} spaces - 缩进空格数
 * @returns {string} 格式化后的JSON字符串
 */
export function formatJSON(obj, spaces = 2) {
  return JSON.stringify(obj, null, spaces);
}

/**
 * 格式化XML
 * @param {Object} obj - XML对象
 * @returns {string} 格式化后的XML字符串
 */
export function formatXML(obj) {
  // 简单的XML格式化实现
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<root>\n';
  
  for (const [key, value] of Object.entries(obj)) {
    xml += `  <${key}>${value}</${key}>\n`;
  }
  
  xml += '</root>';
  return xml;
}

/**
 * 格式化URL
 * @param {string} url - URL字符串
 * @returns {Object} URL对象
 */
export function formatURL(url) {
  try {
    return new URL(url);
  } catch (e) {
    return null;
  }
}

/**
 * 格式化查询参数
 * @param {Object} params - 查询参数对象
 * @returns {string} 查询字符串
 */
export function formatQueryParams(params) {
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  }
  
  return searchParams.toString();
}

/**
 * 格式化Base64
 * @param {string} str - 要编码的字符串
 * @returns {string} Base64编码字符串
 */
export function formatBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * 格式化UUID
 * @returns {string} UUID字符串
 */
export function formatUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}