// ========================================================
// js/lunar.js — 公历 → 农历（阴历）换算（纯逻辑）
// 数据表：1900-2100 年农历闰大小信息（经典 lunarInfo 表，
// 含 JJonline 修正版 1919/1930/1979 等值）。范围外返回 null。
// 基准点：1900-01-31（UTC）为农历 1900 年正月初一。
// ========================================================

const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
  0x0d520, // 2100
];

// 农历 y 年闰月（0 表示无闰月）
function lunarLeapMonth(y) {
  return LUNAR_INFO[y - 1900] & 0xf;
}

// 农历 y 年闰月天数（无闰月返回 0）
function lunarLeapDays(y) {
  return lunarLeapMonth(y) ? ((LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29) : 0;
}

// 农历 y 年 m 月（非闰月）天数：大月 30、小月 29
function lunarMonthDays(y, m) {
  if (m > 12 || m < 1) return -1;
  return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29;
}

// 农历 y 年全年总天数
function lunarYearDays(y) {
  let sum = 348;
  for (let bit = 0x8000; bit > 0x8; bit >>= 1) {
    sum += (LUNAR_INFO[y - 1900] & bit) ? 1 : 0;
  }
  return sum + lunarLeapDays(y);
}

// 公历 (y, mo, d) 转农历；越出 1900-2100 农历可覆盖区间返回 null
// 返回 { y: 农历年, m: 农历月, d: 农历日, isLeap: 是否闰月 }
function lunarOf(y, mo, d) {
  const gy = Number(y), gm = Number(mo), gd = Number(d);
  if (!Number.isInteger(gy) || !Number.isInteger(gm) || !Number.isInteger(gd)) return null;
  if (gy < 1900 || gy > 2100 || gm < 1 || gm > 12 || gd < 1 || gd > 31) return null;
  if (gy === 1900 && gm === 1 && gd < 31) return null; // 下限：1900-01-31 为农历 1900 年正月初一

  let offset = (Date.UTC(gy, gm - 1, gd) - Date.UTC(1900, 0, 31)) / 86400000;
  let i = 1900, temp = 0;
  for (i = 1900; i < 2101 && offset > 0; i++) {
    temp = lunarYearDays(i);
    offset -= temp;
  }
  if (i === 2101 && offset > 0) return null; // 超出 2100 农历可覆盖区间
  if (offset < 0) { offset += temp; i--; }
  const lYear = i;
  const leap = lunarLeapMonth(lYear);
  let isLeap = false;
  for (i = 1; i < 13 && offset > 0; i++) {
    if (leap > 0 && i === leap + 1 && !isLeap) {
      --i;
      isLeap = true;
      temp = lunarLeapDays(lYear);
    } else {
      temp = lunarMonthDays(lYear, i);
    }
    if (isLeap && i === leap + 1) isLeap = false;
    offset -= temp;
  }
  if (offset === 0 && leap > 0 && i === leap + 1) {
    if (isLeap) {
      isLeap = false;
    } else {
      isLeap = true;
      --i;
    }
  }
  if (offset < 0) { offset += temp; --i; }
  if (i < 1 || i > 12 || offset + 1 > 30) return null; // 表尾越界保护
  return { y: lYear, m: i, d: offset + 1, isLeap };
}

const LUNAR_DAYS = ['日', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const LUNAR_DEC = ['初', '十', '廿', '卅'];

// 农历日中文表示：1 → 初一 … 30 → 三十
function lunarDayCn(d) {
  if (d === 10) return '初十';
  if (d === 20) return '二十';
  if (d === 30) return '三十';
  return (LUNAR_DEC[Math.floor(d / 10)] + LUNAR_DAYS[d % 10]);
}

const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

// 农历月中文表示（含闰月前缀）：1 → 正月，8+闰 → 闰八月
function lunarMonthCn(m, isLeap) {
  if (m < 1 || m > 12) return '';
  return (isLeap ? '闰' : '') + LUNAR_MONTHS[m - 1] + '月';
}