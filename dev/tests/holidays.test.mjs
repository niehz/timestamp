import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFresh } from './harness.mjs';

const { call } = createFresh();

function mark(y, m, d) {
  return call('dayMark', y, m, d);
}

test('holidays: 2024 法定节假日与调休', () => {
  // 放假区间（离线索引）：米 { [m,d]: 名称|null }
  const off24 = {
    '1-1': '元旦',
    '2-10': '春节', '2-11': null, '2-17': null,
    '4-4': '清明', '4-5': null, '4-6': null,
    '5-1': '劳动节', '5-2': null, '5-5': null,
    '6-8': '端午', '6-9': null, '6-10': '端午',
    '9-15': '中秋', '9-16': null, '9-17': '中秋',
    '10-1': '国庆节', '10-2': null, '10-7': null,
  };
  for (const [md, name] of Object.entries(off24)) {
    const [m, d] = md.split('-').map(Number);
    const r = mark(2024, m, d);
    assert.equal(r.type, 'off', `2024-${m}-${d} 应为法定休`);
    assert.equal(r.name, name, `2024-${m}-${d} 标签应为 ${name}`);
  }
  for (const [m, d] of [[2, 4], [2, 18], [4, 7], [4, 28], [5, 11], [9, 14], [9, 29], [10, 12]]) {
    assert.equal(mark(2024, m, d).type, 'work', `2024-${m}-${d} 应为调休上班`);
  }
});

test('holidays: 2025 法定节假日与调休', () => {
  const off25 = {
    '1-1': '元旦',
    '1-28': '春节', '1-29': '春节', '2-4': null,
    '4-4': '清明', '4-5': null, '4-6': null,
    '5-1': '劳动节', '5-2': null, '5-5': null,
    '5-31': '端午', '6-1': '儿童节', '6-2': null,
    '10-1': '国庆节', '10-5': null, '10-6': '中秋', '10-8': null,
  };
  for (const [md, name] of Object.entries(off25)) {
    const [m, d] = md.split('-').map(Number);
    const r = mark(2025, m, d);
    assert.equal(r.type, 'off', `2025-${m}-${d} 应为法定休`);
    assert.equal(r.name, name, `2025-${m}-${d} 标签应为 ${name}`);
  }
  for (const [m, d] of [[1, 26], [2, 8], [4, 27], [9, 28], [10, 11]]) {
    assert.equal(mark(2025, m, d).type, 'work', `2025-${m}-${d} 应为调休上班`);
  }
});

test('holidays: 2026 法定节假日与调休', () => {
  const off26 = {
    '1-1': '元旦', '1-2': null, '1-3': null,
    '2-15': '春节', '2-16': '除夕', '2-17': '春节', '2-22': null, '2-23': null,
    '4-4': '清明', '4-5': null, '4-6': null,
    '5-1': '劳动节', '5-2': null, '5-5': null,
    '6-19': '端午', '6-20': null, '6-21': null,
    '9-25': '中秋', '9-26': null, '9-27': null,
    '10-1': '国庆节', '10-2': null, '10-6': null, '10-7': null,
  };
  for (const [md, name] of Object.entries(off26)) {
    const [m, d] = md.split('-').map(Number);
    const r = mark(2026, m, d);
    assert.equal(r.type, 'off', `2026-${m}-${d} 应为法定休`);
    assert.equal(r.name, name, `2026-${m}-${d} 标签应为 ${name}`);
  }
  for (const [m, d] of [[1, 4], [2, 14], [2, 28], [5, 9], [9, 20], [10, 10]]) {
    assert.equal(mark(2026, m, d).type, 'work', `2026-${m}-${d} 应为调休上班`);
  }
});

test('holidays: 2024 除夕为非法定节假日（鼓励休息）', () => {
  // 2024 国务院仅"鼓励"除夕调休，非法定 → 判为节日而非休
  const r = mark(2024, 2, 9);
  assert.equal(r.type, 'fest');
  assert.equal(r.name, '除夕');
});

test('holidays: 公历固定节日', () => {
  for (const [m, d, name] of [
    [1, 1, '元旦'], [3, 8, '妇女节'], [3, 12, '植树节'], [5, 1, '劳动节'],
    [6, 1, '儿童节'], [7, 1, '建党节'], [8, 1, '建军节'], [9, 10, '教师节'],
    [10, 1, '国庆节'], [12, 25, '圣诞节'],
  ]) {
    assert.equal(mark(2026, m, d).name, name, `2026-${m}-${d} 应为 ${name}`);
  }
});

test('holidays: 农历节日锚点', () => {
  assert.equal(mark(2026, 3, 3).name, '元宵'); // 正月十五（2026-02-17 正月初一）
  assert.equal(mark(2025, 10, 6).name, '中秋'); // 八月十五
  assert.equal(mark(2026, 2, 16).name, '除夕'); // 腊月最后一天
  assert.equal(mark(2024, 6, 10).name, '端午'); // 五月初五（法定假内非首日）
});

test('holidays: 农历初一显示月份', () => {
  const monOf = (y, m, d) => call('lunarDayLabel', call('lunarOf', y, m, d));
  assert.equal(monOf(2026, 2, 17), '正月');
  assert.equal(monOf(2025, 1, 29), '正月');
  assert.equal(monOf(2023, 3, 22), '闰二月');
  assert.equal(monOf(2024, 9, 17), '十五');
  assert.equal(call('lunarDayLabel', null), '');
});

test('holidays: 除夕判定依据为次日正月初一', () => {
  const next = call('lunarNext', 2026, 2, 16);
  assert.equal(next.m, 1);
  assert.equal(next.d, 1);
  assert.equal(call('lunarFestivalName', call('lunarOf', 2026, 2, 16), next), '除夕');
  assert.equal(call('lunarFestivalName', call('lunarOf', 2026, 2, 17), call('lunarNext', 2026, 2, 17)), '春节');
});

test('holidays: 无年度数据年份的降级行为', () => {
  // 2027：无法定表 → 元旦/国庆按公历节日（fest）显示，非法定
  assert.equal(mark(2027, 1, 1).type, 'fest');
  assert.equal(mark(2027, 1, 1).name, '元旦');
  assert.equal(mark(2027, 10, 1).name, '国庆节');
  assert.equal(mark(2027, 5, 9).type, 'none');
  // 1900 下限前后：无法定/公历节日，农历节日范围外
  assert.equal(mark(1900, 1, 1).type, 'none');
  assert.equal(mark(2100, 12, 31).type, 'none');
  // 公历节日仅在 1950-2100 出现
  assert.equal(call('solarFestivalName', 1900, 1, 1), '');
  assert.equal(call('solarFestivalName', 1950, 1, 1), '元旦');
  assert.equal(call('solarFestivalName', 2100, 12, 25), '圣诞节');
  // 非法入参
  assert.equal(mark('abc', 1, 1), null);
  assert.equal(mark(2026, 1, 0), null);
});

test('holidays: 年度节假日/调休天数与国务院公告一致', () => {
  const offDays = { 2024: 30, 2025: 28, 2026: 33 };
  const workDays = { 2024: 8, 2025: 5, 2026: 6 };
  for (const y of [2024, 2025, 2026]) {
    let off = 0, work = 0;
    for (let mo = 1; mo <= 12; mo++) {
      const dim = new Date(Date.UTC(y, mo, 0)).getUTCDate();
      for (let d = 1; d <= dim; d++) {
        const r = mark(y, mo, d);
        if (r.type === 'off') off++;
        else if (r.type === 'work') work++;
      }
    }
    assert.equal(off, offDays[y], `${y} 放假天数应为 ${offDays[y]} 天`);
    assert.equal(work, workDays[y], `${y} 调休上班应为 ${workDays[y]} 天`);
    assert.notEqual(off + work, 0, `${y} 数据不应为空`);
  }
});

test('holidays: 普通工作日/周末无标注', () => {
  assert.deepEqual(mark(2026, 7, 15), { type: 'none', name: null });
  assert.deepEqual(mark(2026, 12, 26), { type: 'none', name: null }); // 周六普通日
});