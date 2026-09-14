// ========================================================
// js/holidays.js — 节假日标注：节日 + 法定节假日/调休
// 传统/公历节日为算法派生；法定节假日与调休上班为国务院
// 年度放假安排（目前收录 2024-2026，逐年追加）。依赖 lunar.js
// 的农历换算（1900-2100 内有效）。
// Loaded from index.html in this order: lunar → holidays → calendar.
// ========================================================

const SOLAR_FEST = {
  '1-1': '元旦', '3-8': '妇女节', '3-12': '植树节',
  '5-1': '劳动节', '6-1': '儿童节', '7-1': '建党节',
  '8-1': '建军节', '9-10': '教师节', '10-1': '国庆节', '12-25': '圣诞节',
};

// 农历节日：月-日 → 名称（除夕由次日是否正月初一判定）
const LUNAR_FEST = {
  '1-1': '春节', '1-15': '元宵', '5-5': '端午', '7-7': '七夕',
  '7-15': '中元', '8-15': '中秋', '9-9': '重阳', '12-8': '腊八',
};

// 年度法定节假日/调休表（来源：国务院办公厅放假安排通知）
// off: 放假区间 [{ name, from:[m,d], to:[m,d] }]，首日带节日名；
// work: 调休上班 [m,d] 列表。
const ANNUAL_HOLIDAYS = {
  2024: { // 国办发明电〔2023〕7号
    off: [
      { name: '元旦', from: [1, 1], to: [1, 1] },
      { name: '春节', from: [2, 10], to: [2, 17] },
      { name: '清明', from: [4, 4], to: [4, 6] },
      { name: '劳动节', from: [5, 1], to: [5, 5] },
      { name: '端午', from: [6, 8], to: [6, 10] },
      { name: '中秋', from: [9, 15], to: [9, 17] },
      { name: '国庆节', from: [10, 1], to: [10, 7] },
    ],
    work: [[2, 4], [2, 18], [4, 7], [4, 28], [5, 11], [9, 14], [9, 29], [10, 12]],
  },
  2025: { // 国办发明电〔2024〕12号
    off: [
      { name: '元旦', from: [1, 1], to: [1, 1] },
      { name: '春节', from: [1, 28], to: [2, 4] },
      { name: '清明', from: [4, 4], to: [4, 6] },
      { name: '劳动节', from: [5, 1], to: [5, 5] },
      { name: '端午', from: [5, 31], to: [6, 2] },
      { name: '国庆节', from: [10, 1], to: [10, 8] },
    ],
    work: [[1, 26], [2, 8], [4, 27], [9, 28], [10, 11]],
  },
  2026: { // 国办发明电〔2025〕7号
    off: [
      { name: '元旦', from: [1, 1], to: [1, 3] },
      { name: '春节', from: [2, 15], to: [2, 23] },
      { name: '清明', from: [4, 4], to: [4, 6] },
      { name: '劳动节', from: [5, 1], to: [5, 5] },
      { name: '端午', from: [6, 19], to: [6, 21] },
      { name: '中秋', from: [9, 25], to: [9, 27] },
      { name: '国庆节', from: [10, 1], to: [10, 7] },
    ],
    work: [[1, 4], [2, 14], [2, 28], [5, 9], [9, 20], [10, 10]],
  },
};

// "年-月-日" → { type:'off'|'work', name:''|节日名 }
const HOLIDAY_MAP = new Map();

for (const [y, cfg] of Object.entries(ANNUAL_HOLIDAYS)) {
  for (const s of cfg.off) {
    const [fm, fd] = s.from;
    const [tm, td] = s.to;
    let mo = fm, d = fd;
    while (mo < tm || (mo === tm && d <= td)) {
      const dim = new Date(Date.UTC(Number(y), mo, 0)).getUTCDate();
      if (d > dim) { d = 1; mo++; continue; }
      const firstDay = mo === fm && d === fd;
      HOLIDAY_MAP.set(`${y}-${mo}-${d}`, { type: 'off', name: firstDay ? s.name : '' });
      d++;
    }
  }
  for (const [mo, d] of cfg.work) {
    HOLIDAY_MAP.set(`${y}-${mo}-${d}`, { type: 'work', name: '' });
  }
}

// 公历固定节日：仅在 1950-2100 显示（避免早期年份出现现代纪念日）
function solarFestivalName(y, mo, d) {
  if (y < 1950 || y > 2100) return '';
  return SOLAR_FEST[`${mo}-${d}`] || '';
}

// 农历节日 + 除夕（次日为正月初一）
function lunarFestivalName(lu, nextLu) {
  if (!lu) return '';
  const f = `${lu.m}-${lu.d}`;
  if (LUNAR_FEST[f]) return LUNAR_FEST[f];
  if (nextLu && !nextLu.isLeap && nextLu.m === 1 && nextLu.d === 1) return '除夕';
  return '';
}

// 指定公历日期的次日农历
function lunarNext(y, mo, d) {
  const dim = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  if (d < dim) return lunarOf(y, mo, d + 1);
  if (mo < 12) return lunarOf(y, mo + 1, 1);
  return lunarOf(y + 1, 1, 1);
}

// 日格底部标签语义：
// { type:'none' } 普通日；{ type:'work' } 调休上班（标签由 i18n 决定）；
// { type:'off', name } 法定休（name 为首日/节日当天标签）；{ type:'fest', name } 节日。
function dayMark(y, mo, d) {
  const gy = Number(y), gm = Number(mo), gd = Number(d);
  if (!Number.isInteger(gy) || !Number.isInteger(gm) || !Number.isInteger(gd) || gd < 1 || gd > 31) return null;
  const entry = HOLIDAY_MAP.get(`${gy}-${gm}-${gd}`);
  if (entry && entry.type === 'work') return { type: 'work', name: null };
  let name = entry && entry.type === 'off' ? entry.name : '';
  if (!name) {
    const lu = lunarOf(gy, gm, gd);
    name = (lu ? lunarFestivalName(lu, lunarNext(gy, gm, gd)) : '') || solarFestivalName(gy, gm, gd);
  }
  if (entry && entry.type === 'off') return { type: 'off', name: name || null };
  if (name) return { type: 'fest', name };
  return { type: 'none', name: null };
}

// 农历底部默认标签：初一显示月份（正月/闰二月/腊月），其余显示日
function lunarDayLabel(lu) {
  if (!lu) return '';
  return lu.d === 1 ? lunarMonthCn(lu.m, lu.isLeap) : lunarDayCn(lu.d);
}