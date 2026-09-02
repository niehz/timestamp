const $ = (s) => document.querySelector(s);

const MIN_TS = -8640000000000000;
const MAX_TS = 8640000000000000;

const WEEK_CN = { Sun: '周日', Mon: '周一', Tue: '周二', Wed: '周三', Thu: '周四', Fri: '周五', Sat: '周六' };

const TIMEZONES = [
  { label: '本地时区', labelEn: 'Local', value: '' },
  { label: 'UTC 协调世界时', labelEn: 'UTC', value: 'UTC' },
  { label: '北京 / 上海（中国）', labelEn: 'Beijing/Shanghai', value: 'Asia/Shanghai' },
  { label: '香港', labelEn: 'Hong Kong', value: 'Asia/Hong_Kong' },
  { label: '台北', labelEn: 'Taipei', value: 'Asia/Taipei' },
  { label: '东京（日本）', labelEn: 'Tokyo', value: 'Asia/Tokyo' },
  { label: '首尔（韩国）', labelEn: 'Seoul', value: 'Asia/Seoul' },
  { label: '新加坡', labelEn: 'Singapore', value: 'Asia/Singapore' },
  { label: '曼谷（泰国）', labelEn: 'Bangkok', value: 'Asia/Bangkok' },
  { label: '迪拜', labelEn: 'Dubai', value: 'Asia/Dubai' },
  { label: '孟买（印度）', labelEn: 'Kolkata', value: 'Asia/Kolkata' },
  { label: '莫斯科（俄罗斯）', labelEn: 'Moscow', value: 'Europe/Moscow' },
  { label: '伦敦（英国）', labelEn: 'London', value: 'Europe/London' },
  { label: '巴黎（法国）', labelEn: 'Paris', value: 'Europe/Paris' },
  { label: '柏林（德国）', labelEn: 'Berlin', value: 'Europe/Berlin' },
  { label: '纽约（美国东部）', labelEn: 'New York', value: 'America/New_York' },
  { label: '芝加哥（美国中部）', labelEn: 'Chicago', value: 'America/Chicago' },
  { label: '丹佛（美国山地）', labelEn: 'Denver', value: 'America/Denver' },
  { label: '洛杉矶（美国西部）', labelEn: 'Los Angeles', value: 'America/Los_Angeles' },
  { label: '悉尼（澳大利亚）', labelEn: 'Sydney', value: 'Australia/Sydney' },
  { label: '奥克兰（新西兰）', labelEn: 'Auckland', value: 'Pacific/Auckland' },
];

const I18N = {
  zh: {
    secTab: '秒级', msTab: '毫秒级',
    tzLabel: '时区', toggleEn: 'EN',
    dateToTs: '日期 → 时间戳', tsToDate: '时间戳 → 日期',
    tsOutput: '时间戳', dateOutput: '日期',
    convert: '转换', copy: '复制', copied: '已复制',
    datePlaceholder: 'YYYY-MM-DD',
    timePlaceholder: 'HH:mm:ss', msPlaceholder: '毫秒',
    tsPlaceholderSec: '请输入秒级时间戳 (10位)',
    tsPlaceholderMs: '请输入毫秒时间戳 (13位)',
    currentTime: '当前时间', pause: '暂停', resume: '继续',
    localTime: '本地时间', secTs: '秒级时间戳', msTs: '毫秒级时间戳',
    copiedMsg: '已复制到剪贴板', tsUnitSec: '秒', tsUnitMs: '毫秒',
    outOfRange: '超出可表示范围',
    hintClick: '输入即转换 · 点击结果复制',
    invalidDate: '日期格式无效',
    invalidTs: '时间戳格式无效',
    ok: '确定', now: '此刻',
    today: '今天', yesterday: '昨天', tomorrow: '明天', dayAfter: '后天',
    useDate: '使用该日期', quick: '快捷',
  },
  en: {
    secTab: 'Seconds', msTab: 'Milliseconds',
    tzLabel: 'Timezone', toggleEn: '中',
    dateToTs: 'Date → Timestamp', tsToDate: 'Timestamp → Date',
    tsOutput: 'Timestamp', dateOutput: 'Date',
    convert: 'Convert', copy: 'Copy', copied: 'Copied',
    datePlaceholder: 'YYYY-MM-DD',
    timePlaceholder: 'HH:mm:ss', msPlaceholder: 'ms',
    tsPlaceholderSec: 'Enter seconds timestamp (10 digits)',
    tsPlaceholderMs: 'Enter ms timestamp (13 digits)',
    currentTime: 'Current Time', pause: 'Pause', resume: 'Resume',
    localTime: 'Local Time', secTs: 'Seconds TS', msTs: 'Milliseconds TS',
    copiedMsg: 'Copied to clipboard', tsUnitSec: 'sec', tsUnitMs: 'ms',
    outOfRange: 'Out of representable range',
    hintClick: 'Type to convert · Click result to copy',
    invalidDate: 'Invalid date format',
    invalidTs: 'Invalid timestamp format',
    ok: 'OK', now: 'Now',
    today: 'Today', yesterday: 'Yesterday', tomorrow: 'Tomorrow', dayAfter: 'Day after',
    useDate: 'Use this date', quick: 'Quick',
  },
};

let lang = 'zh';
const BUILD = 'v20';
let currentTab = 'sec';
let paused = false;
let lastNow = new Date();
let lastSec = 0;
let lastMs = 0;

const timezoneEl = $('#timezone');
const inputTzEl = $('#input-tz');
const toastEl = $('#toast');
const nowDateEl = $('#now-date');
const nowSecEl = $('#now-sec');
const nowMsEl = $('#now-ms');
const liveDot = $('#live-dot');
const btnPause = $('#btn-pause');
const dateInput = $('#date-input');
const timeInputEl = $('#time-input');
const msInputEl = $('#ms-input');
const tsInput = $('#ts-input');
const d2tVal = $('#d2t-val');
const t2dVal = $('#t2d-val');
const hintD2t = $('#d2t-hint');
const hintT2d = $('#t2d-hint');
const btnLang = $('#btn-lang');
const calendarEl = $('#calendar');
const calGrid = $('#cal-grid');
const calRightEl = document.querySelector('#calendar .cal-right');
const calTitle = $('#cal-title');
const calHeadEl = document.querySelector('#calendar .cal-head');
const wheelHh = $('#wheel-hh');
const wheelMm = $('#wheel-mm');
const wheelSs = $('#wheel-ss');
const wheelMs = $('#wheel-ms');
const calTimeInputEl = $('#cal-time-input');
const dateSuggestEl = $('#date-suggest');
const dateFieldEl = $('#date-field');

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let calSelected = null;
let calView = 'day';
let calDecadeStart = Math.floor(new Date().getFullYear() / 10) * 10;
let calTime = { hh: 0, mm: 0, ss: 0, ms: 0 };
let skipViewSync = false;
let skipTimeSync = false;

const calMonthsEl = $('#cal-months');
const calYearsEl = $('#cal-years');
const calYearHeadEl = $('#cal-year-head');
const calBodyDay = $('#cal-body-day');
const calBodyMonth = $('#cal-body-month');
const calBodyYear = $('#cal-body-year');
const calYearInputEl = $('#cal-year-input');

const pad = (n) => String(n).padStart(2, '0');

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
  try {
    const m = partsMap(getTzFormatter(tz).formatToParts(date));
    const year = m.era === 'BC' ? '-' + m.year : m.year;
    return `${year}-${m.month}-${m.day} ${pad(m.hour % 24)}:${m.minute}:${m.second}`;
  } catch (e) { return '--'; }
}

function offsetMinutes(date, tz) {
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

function formatOffset(mins) {
  if (!mins) return 'UTC±0';
  const sign = mins > 0 ? '+' : '-';
  const abs = Math.abs(mins);
  return `UTC${sign}${Math.floor(abs / 60)}${abs % 60 ? ':' + pad(abs % 60) : ''}`;
}

function currentOffsetStr(tz) {
  const mins = offsetMinutes(new Date(), tz);
  if (mins === 0) return '+00:00';
  const sign = mins > 0 ? '+' : '-';
  const a = Math.abs(mins);
  return `${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}

function dateToMs(d, tz) {
  const hasMs = typeof d.ms === 'number';
  if (!tz) return hasMs ? new Date(d.y, d.mo - 1, d.d, d.h, d.mi, d.se, d.ms).getTime()
                        : new Date(d.y, d.mo - 1, d.d, d.h, d.mi, d.se).getTime();
  const guess = hasMs ? Date.UTC(d.y, d.mo - 1, d.d, d.h, d.mi, d.se, d.ms)
                      : Date.UTC(d.y, d.mo - 1, d.d, d.h, d.mi, d.se);
  return guess - offsetMinutes(new Date(guess), tz) * 60000;
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

function parseDate(text) {
  const s = text.trim();
  if (!s) return null;
  const rel = parseRelative(s);
  if (rel) return rel;
  const tzInfo = tzFromDateString(s);
  if (tzInfo) {
    const abs = Date.parse(s);
    if (!Number.isNaN(abs)) return { kind: 'date', abs, tz: tzInfo };
    return null;
  }
  const m = s.match(/^(\d{4})(?:[-/年](\d{1,2}))?(?:[-/月](\d{1,2})(?:日)?)?(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (m) {
    const y = +m[1];
    if (m[2] == null) return { kind: 'date', y, mo: new Date().getMonth() + 1, d: new Date().getDate(), h: 0, mi: 0, se: 0 };
    const mo = +m[2];
    if (m[3] == null) {
      if (mo >= 1 && mo <= 12) return { kind: 'date', y, mo, d: 1, h: 0, mi: 0, se: 0 };
      return null;
    }
    const d = +m[3];
    const h = m[4] != null ? +m[4] : 0, mi = m[5] != null ? +m[5] : 0, se = m[6] != null ? +m[6] : 0;
    if (mo >= 1 && mo <= 12 && h <= 23 && mi <= 59 && se <= 59) {
      const dim = new Date(y, mo, 0).getDate();
      if (d >= 1 && d <= dim) return { kind: 'date', y, mo, d, h, mi, se };
    }
    return null;
  }
  if (/^-?\d+$/.test(s)) return null;
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return { kind: 'stamp', ms: t };
  return null;
}

function tzFromDateString(s) {
  const str = s.trim();
  if (/Z(?:[+-]\d{2}:?\d{2})?$/i.test(str)) return { label: 'UTC', value: 'UTC' };
  if (/\b(UTC|GMT)\b/i.test(str)) return { label: 'UTC', value: 'UTC' };
  const off = /([+-])(\d{2}):?(\d{2})$/.exec(str);
  if (off) {
    const hh = +off[2], mm = +off[3];
    const mins = (hh * 60 + mm) * (off[1] === '-' ? -1 : 1);
    return { label: `${off[1]}${pad(hh)}:${pad(mm)}`, offset: mins, value: `FIXED:${off[1]}${pad(hh)}${pad(mm)}` };
  }
  const rfc = /\b([A-Z]{3,5})\b/.exec(s.replace(/\b(GMT|UTC)\b/gi, ''));
  if (rfc) return { label: rfc[1], value: null };
  return null;
}

function toDateStr(y, mo, d, h, mi, se) {
  return `${y}-${pad(mo)}-${pad(d)} ${pad(h)}:${pad(mi)}:${pad(se)}`;
}

function setDateFields(y, mo, d, h, mi, se, ms) {
  dateInput.value = `${pad(y)}-${pad(mo)}-${pad(d)}`;
  timeInputEl.value = `${pad(h)}:${pad(mi)}:${pad(se)}`;
  msInputEl.value = typeof ms === 'number' && ms > 0 ? String(ms).padStart(3, '0') : '';
}

function applyFullDateStr(str) {
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}):(\d{2}))?$/);
  if (!m) return;
  if (m[4] != null) {
    setDateFields(+m[1], +m[2], +m[3], +m[4], +m[5], +m[6], 0);
  } else {
    dateInput.value = `${pad(+m[1])}-${pad(+m[2])}-${pad(+m[3])}`;
  }
}
function readDateSelection() {
  const base = dateInput.value.trim();
  const timeText = timeInputEl.value.trim();
  const msText = msInputEl.value.trim();
  if (!base && !timeText && !msText) return { empty: true };
  if (!base) return { err: true };
  const parsed = parseDate(base);
  if (!parsed) return { err: true };
  if (parsed.abs != null) {
    applyParsedTz(parsed.tz);
    return { kind: 'abs', ms: parsed.abs };
  }
  if (parsed.kind !== 'date') return { err: true };
  let h = parsed.h, mi = parsed.mi, se = parsed.se, ms = 0;
  if (timeText) {
    const tm = timeText.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
    if (!tm) return { err: true };
    h = +tm[1]; mi = +tm[2]; se = tm[3] != null ? +tm[3] : 0;
    if (h > 23 || mi > 59 || se > 59) return { err: true };
  }
  if (msText) {
    if (!/^\d{1,3}$/.test(msText)) return { err: true };
    ms = +msText;
  }
  return { y: parsed.y, mo: parsed.mo, d: parsed.d, h, mi, se, ms };
}

function applyParsedTz(tzInfo) {
  if (!tzInfo || !tzInfo.value) return;
  if (tzInfo.value === 'UTC') { inputTzEl.value = 'UTC'; return; }
  if (tzInfo.offset != null) {
    let exists = false;
    for (let i = 0; i < inputTzEl.options.length; i++) {
      if (inputTzEl.options[i].value === tzInfo.value) { exists = true; break; }
    }
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = tzInfo.value;
      opt.textContent = tzInfo.label;
      inputTzEl.appendChild(opt);
    }
    inputTzEl.value = tzInfo.value;
  }
}

function buildSuggestions(text) {
  const s = text.trim();
  if (!s) return [];
  const out = [];
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const rel = parseRelative(s);
  if (rel) {
    out.push({ date: toDateStr(rel.y, rel.mo, rel.d, 0, 0, 0), desc: t('quick') + ' · ' + s });
  }

  const m = s.match(/^(\d{4})(?:[-/年](\d{1,2}))?(?:[-/月](\d{1,2})(?:日)?)?(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (m) {
    const y = +m[1];
    const mo = m[2] != null ? +m[2] : 0;
    const d = m[3] != null ? +m[3] : 0;
    const h = m[4] != null ? +m[4] : 0;
    const mi = m[5] != null ? +m[5] : 0;
    const se = m[6] != null ? +m[6] : 0;
    if (mo >= 1 && mo <= 12) {
      const dim = new Date(y, mo, 0).getDate();
      if (d >= 1 && d <= dim) {
        out.push({ date: toDateStr(y, mo, d, h, mi, se), desc: t('useDate') });
      } else if (d === 0 && mo >= 1 && mo <= 12) {
        out.push({
          month: `${y}-${mo - 1}`,
          date: toDateStr(y, mo, 1, 0, 0, 0),
          desc: `${y}-${pad(mo)} · ${t('quick')}`,
        });
        out.push({ date: toDateStr(y, mo, 15, 0, 0, 0), desc: `${y}-${pad(mo)}-15` });
        out.push({ date: toDateStr(y, mo, dim, 0, 0, 0), desc: `${y}-${pad(mo)}-${pad(dim)}` });
      }
    } else if (mo === 0) {
      out.push({ date: toDateStr(y, 1, 1, 0, 0, 0), desc: `${y}-01-01` });
      out.push({ date: toDateStr(y, now.getMonth() + 1, now.getDate(), 0, 0, 0), desc: `${y}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} (${t('today')})` });
    }
  }

  const uniq = [];
  const seen = new Set();
  for (const it of out) {
    const key = it.date;
    if (!seen.has(key)) { seen.add(key); uniq.push(it); }
  }
  return uniq;
}

function showSuggestions() {
  const items = buildSuggestions(dateInput.value);
  if (!items.length) { dateSuggestEl.classList.remove('open'); return; }
  dateSuggestEl.innerHTML = items.map((it) =>
    `<div class="sg-item" data-date="${it.date}" ${it.month ? `data-month="${it.month}"` : ''}>
      <span class="sg-desc">${it.desc}</span>
      <span class="sg-date">${it.date}</span>
    </div>`).join('');
  dateSuggestEl.classList.add('open');
  dateSuggestEl.dataset.monthMark = items.some((i) => i.month) ? '1' : '';
}

function hideSuggestions() { dateSuggestEl.classList.remove('open'); }


function renderCalendar() {
  const dayMode = calView === 'day';
  const monthMode = calView === 'month';
  const yearMode = calView === 'year';

  calHeadEl.style.display = yearMode ? 'none' : 'flex';
  if (calRightEl) calRightEl.style.display = dayMode ? 'flex' : 'none';

  calTitle.textContent = dayMode
    ? `${calYear}${lang === 'zh' ? '年' : '/'}${pad(calMonth + 1)}${lang === 'zh' ? '月' : ''}`
    : monthMode
      ? `${calYear}${lang === 'zh' ? '年' : ''}`
      : `${calDecadeStart} - ${calDecadeStart + 9}`;

  calBodyDay.style.display = dayMode ? 'block' : 'none';
  calBodyMonth.style.display = monthMode ? 'block' : 'none';
  calBodyYear.style.display = yearMode ? 'block' : 'none';

  if (dayMode) renderDayGrid();
  if (monthMode) renderMonths();
  if (yearMode) renderYears();
  if (!skipViewSync) syncViewInput();
}

function syncViewInput() {
  if (calView === 'day') {
    const d = (calSelected && calSelected.y === calYear && calSelected.mo === calMonth) ? calSelected.d : 1;
    calYearInputEl.value = `${calYear}-${pad(calMonth + 1)}-${pad(d)}`;
  } else if (calView === 'month') {
    calYearInputEl.value = `${calYear}-${pad(calMonth + 1)}`;
  } else {
    calYearInputEl.value = `${calYear}`;
  }
}

function renderDayGrid() {
  const first = new Date(calYear, calMonth, 1);
  const dim = new Date(calYear, calMonth + 1, 0).getDate();
  const startDow = first.getDay();
  const today = new Date();
  calGrid.innerHTML = '';
  for (let i = 0; i < startDow; i++) calGrid.appendChild(el('button', 'cal-day empty', ''));
  for (let d = 1; d <= dim; d++) {
    const btn = el('button', 'cal-day', String(d));
    const dow = (startDow + d - 1) % 7;
    if (dow === 0 || dow === 6) btn.classList.add('weekend');
    const isSel = calSelected && calSelected.y === calYear && calSelected.mo === calMonth && calSelected.d === d;
    if (isSel) btn.classList.add('selected');
    if (d === today.getDate() && calYear === today.getFullYear() && calMonth === today.getMonth()) btn.classList.add('today');
    btn.addEventListener('click', (e) => { e.stopPropagation(); selectDay(d); });
    calGrid.appendChild(btn);
  }
}

function renderMonths() {
  const MONTHS = lang === 'zh'
    ? ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  calMonthsEl.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const btn = el('button', 'cal-month', MONTHS[i]);
    const isSel = calSelected && calSelected.y === calYear && calSelected.mo === i;
    if (isSel) btn.classList.add('selected');
    const cur = new Date();
    if (calYear === cur.getFullYear() && i === cur.getMonth()) btn.classList.add('today');
    if (i === calMonth) btn.classList.add('edited');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      calMonth = i;
      calView = 'day';
      renderCalendar();
    });
    calMonthsEl.appendChild(btn);
  }
}

function renderYears() {
  calYearHeadEl.innerHTML = `
    <div class="cal-nav-group">
      <button type="button" class="cal-nav tiny" data-step="-1000" title="-1000">&lt;&lt;&lt;</button>
      <button type="button" class="cal-nav tiny" data-step="-100" title="-100">&lt;&lt;</button>
      <button type="button" class="cal-nav tiny" data-step="-10" title="-10">&lt;</button>
    </div>
    <span class="cal-range">${calDecadeStart} - ${calDecadeStart + 9}</span>
    <div class="cal-nav-group">
      <button type="button" class="cal-nav tiny" data-step="10" title="+10">&gt;</button>
      <button type="button" class="cal-nav tiny" data-step="100" title="+100">&gt;&gt;</button>
      <button type="button" class="cal-nav tiny" data-step="1000" title="+1000">&gt;&gt;&gt;</button>
    </div>`;

  calYearsEl.innerHTML = '';
  for (let y = calDecadeStart; y <= calDecadeStart + 9; y++) {
    const btn = el('button', 'cal-year', String(y));
    if (y === calYear) btn.classList.add('selected');
    const cur = new Date().getFullYear();
    if (y === cur) btn.classList.add('today');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      calYear = y;
      calView = 'month';
      renderCalendar();
    });
    calYearsEl.appendChild(btn);
  }
}

function showMonthView() { calView = 'month'; renderCalendar(); }
function showYearView() { calDecadeStart = Math.floor(calYear / 10) * 10; calView = 'year'; calYearInputEl.value = String(calYear); renderCalendar(); }

function clampDayInMonth(y, mo, d) { const dim = new Date(y, mo + 1, 0).getDate(); return Math.min(d || 1, dim); }

function followYearInput() {
  const raw = calYearInputEl.value.trim();
  calYearInputEl.classList.remove('err-jump');
  if (!raw) return;
  skipViewSync = true;
  try {
    const inRange = (y) => validate(new Date(y, 0, 1).getTime()) && validate(new Date(y, 11, 31, 23, 59, 59, 999).getTime());

    const yOnly = raw.match(/^(\d{1,4})$/);
    if (yOnly) {
      const y = +yOnly[1].padEnd(4, '0');
      if (!inRange(y)) return;
      calYear = y;
      calView = 'year';
      calDecadeStart = Math.floor(y / 10) * 10;
      renderCalendar();
      return;
    }

    const ym = raw.match(/^(\d{4})[-\/年](\d{1,2})$/);
    if (ym) {
      const y = +ym[1], mo = +ym[2];
      if (!inRange(y) || mo < 1 || mo > 12) return;
      calYear = y; calMonth = mo - 1;
      calView = 'month';
      calDecadeStart = Math.floor(y / 10) * 10;
      renderCalendar();
      return;
    }

    const ymd = raw.match(/^(\d{4})[-\/年](\d{1,2})[-\/月](\d{1,2})(?:日)?$/);
    if (ymd) {
      const y = +ymd[1], mo = +ymd[2], d = +ymd[3];
      if (!inRange(y) || mo < 1 || mo > 12) return;
      const dim = new Date(y, mo, 0).getDate();
      if (d < 1 || d > dim) return;
      calYear = y; calMonth = mo - 1;
      calSelected = { y, mo: mo - 1, d };
      calView = 'day';
      calDecadeStart = Math.floor(y / 10) * 10;
      renderCalendar();
      return;
    }
  } finally {
    skipViewSync = false;
  }
}

function jumpToYearInput() {
  const raw = calYearInputEl.value.trim();
  if (!raw) { renderCalendar(); return; }
  const p = parseDate(raw);
  if (!p || p.kind !== 'date') { calYearInputEl.classList.add('err-jump'); calYearInputEl.value = ''; toast('无效年份'); return; }
  const y = p.y;
  const dt = new Date(y, 0, 1);
  const start = dt.getTime();
  const endMs = new Date(y, 11, 31, 23, 59, 59, 999).getTime();
  if (!validate(start) || !validate(endMs)) { calYearInputEl.classList.add('err-jump'); calYearInputEl.value = ''; toast('超出时间戳范围'); return; }
  calYear = y;
  if (!/^\d{4}$/.test(raw)) {
    const mo = p.mo - 1;
    const d = clampDayInMonth(y, mo, p.d || (calSelected ? calSelected.d : 1));
    calMonth = mo;
    calSelected = { y, mo, d };
    calTime.hh = p.h; calTime.mm = p.mi; calTime.ss = p.se;
    setDateFields(y, mo + 1, d, p.h, p.mi, p.se, 0);
    renderTimeWheels();
    renderConvert();
  } else {
    calMonth = calSelected && calSelected.y === y ? calSelected.mo : 0;
    calSelected = { y, mo: calMonth, d: clampDayInMonth(y, calMonth, calSelected ? calSelected.d : 1) };
  }
  calDecadeStart = Math.floor(y / 10) * 10;
  calView = 'day';
  renderTimeWheels();
  renderCalendar();
  renderConvert();
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  node.textContent = text;
  return node;
}

function selectDay(d) {
  calSelected = { y: calYear, mo: calMonth, d };
  setDateFields(calYear, calMonth + 1, d, calTime.hh, calTime.mm, calTime.ss, calTime.ms);
  renderCalendar();
  renderConvert();
}

function openCalendar() {
  hideSuggestions();
  calView = 'day';
  const now = new Date();
  const isEmpty = !dateInput.value.trim() && !timeInputEl.value.trim() && !msInputEl.value.trim();
  if (isEmpty) {
    calYear = now.getFullYear(); calMonth = now.getMonth();
    calSelected = { y: now.getFullYear(), mo: now.getMonth(), d: now.getDate() };
    calDecadeStart = Math.floor(now.getFullYear() / 10) * 10;
    calTime = { hh: now.getHours(), mm: now.getMinutes(), ss: now.getSeconds(), ms: now.getMilliseconds() };
  } else {
    const parsed = parseDate(dateInput.value);
    if (parsed && parsed.kind === 'date') {
      calYear = parsed.y; calMonth = parsed.mo - 1;
      calSelected = { y: parsed.y, mo: parsed.mo - 1, d: parsed.d };
    } else {
      calSelected = null;
    }
    calTime = { hh: now.getHours(), mm: now.getMinutes(), ss: now.getSeconds(), ms: now.getMilliseconds() };
    const tm = timeInputEl.value.trim().match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
    if (tm) {
      calTime.hh = Math.min(23, +tm[1]); calTime.mm = Math.min(59, +tm[2]);
      calTime.ss = tm[3] != null ? Math.min(59, +tm[3]) : 0;
    }
    const msT = msInputEl.value.trim();
    if (/^\d{1,3}$/.test(msT)) calTime.ms = +msT;
  }
  renderTimeWheels();
  renderCalendar();
  calendarEl.classList.add('open');
  syncTimeInput();
  if (window.console) console.log('[debug openCalendar]', 'tab=' + currentTab, 'calTime=', JSON.stringify(calTime), 'dateIn=' + JSON.stringify(dateInput.value), 'timeIn=' + JSON.stringify(timeInputEl.value), 'msIn=' + JSON.stringify(msInputEl.value), 'timeInputDom=' + JSON.stringify(calTimeInputEl.value));
}

function closeCalendar() { calendarEl.classList.remove('open'); }

const WHEEL_H = 40;
const WHEEL_VIEW = 128;

function renderTimeWheels() {
  wheelMs.style.display = currentTab === 'ms' ? '' : 'none';
  const msCol = wheelMs.parentNode;
  if (msCol) msCol.style.display = currentTab === 'ms' ? '' : 'none';
  buildWheel(wheelHh, 24, calTime.hh, (v) => { calTime.hh = v; applyWheelTime(); });
  buildWheel(wheelMm, 60, calTime.mm, (v) => { calTime.mm = v; applyWheelTime(); });
  buildWheel(wheelSs, 60, calTime.ss, (v) => { calTime.ss = v; applyWheelTime(); });
  buildWheel(wheelMs, 1000, calTime.ms, (v) => { calTime.ms = v; applyWheelTime(); });
  if (!skipTimeSync) syncTimeInput();
}

function syncTimeInput() {
  const t = calTime;
  const base = `${pad(t.hh)}:${pad(t.mm)}:${pad(t.ss)}`;
  calTimeInputEl.value = currentTab === 'ms' ? `${base}.${String(t.ms).padStart(3, '0')}` : base;
}

function followTimeInput() {
  const raw = calTimeInputEl.value.trim();
  if (!raw) { renderTimeWheels(); return; }
  const parts = raw.split(':');
  const hh = +parts[0] || 0;
  const readMmSs = (seg) => {
    const sp = seg.split('.');
    return [ +sp[0] || 0, sp[1] ? +sp[1].padEnd(3, '0').slice(0, 3) : 0 ];
  };
  let mm = 0, ss = 0, ms = 0;
  if (parts[1]) { const r = readMmSs(parts[1]); mm = r[0]; ms = r[1]; }
  if (parts[2]) { const r = readMmSs(parts[2]); ss = r[0]; ms = r[1]; }
  if (hh > 23 || mm > 59 || ss > 59) return;
  calTime.hh = hh; calTime.mm = mm; calTime.ss = ss; calTime.ms = ms;
  skipTimeSync = true;
  try {
    renderTimeWheels();
    applyWheelTime();
  } finally {
    skipTimeSync = false;
  }
}

function applyWheelTime() {
  const y = calSelected ? calSelected.y : calYear;
  const mo = calSelected ? calSelected.mo + 1 : calMonth + 1;
  const d = calSelected ? calSelected.d : 1;
  setDateFields(y, mo, d, calTime.hh, calTime.mm, calTime.ss, calTime.ms);
  renderConvert();
  if (!skipTimeSync) syncTimeInput();
}

function clampWheel(i, max) { return i < 0 ? 0 : (i > max ? max : i); }

function highlightWheel(el, idx) {
  Array.prototype.forEach.call(el.children, (c, i) => c.classList.toggle('sel', i === idx));
}

function wheelIndexFromScrollTop(el) {
  return clampWheel(Math.round(el.scrollTop / WHEEL_H), el.children.length - 1);
}

function selectWheelValue(el, i, onChange) {
  el._sel = i;
  el.scrollTop = i * WHEEL_H;
  highlightWheel(el, i);
  if (onChange) onChange(i);
}

function buildWheel(el, count, cur, onChange) {
  el.innerHTML = '';
  el.style.paddingTop = ((WHEEL_VIEW - WHEEL_H) / 2) + 'px';
  el.style.paddingBottom = ((WHEEL_VIEW - WHEEL_H) / 2) + 'px';
  for (let i = 0; i < count; i++) {
    const it = document.createElement('div');
    it.className = 'wheel-item';
    it.textContent = String(i).padStart(2, '0');
    it.addEventListener('click', (e) => { e.stopPropagation(); selectWheelValue(el, i, onChange); });
    el.appendChild(it);
  }
  el._sel = clampWheel(cur, count - 1);
  highlightWheel(el, el._sel);
  el._suspend = true;
  const apply = () => { el.scrollTop = el._sel * WHEEL_H; };
  if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(apply);
  else apply();
  if (typeof setTimeout !== 'undefined') setTimeout(() => { el._suspend = false; }, 150);
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    const dir = e.deltaY > 0 ? 1 : -1;
    const ni = clampWheel(el._sel + dir, count - 1);
    if (ni === el._sel) return;
    el._sel = ni;
    highlightWheel(el, ni);
    el._suspend = true;
    el.scrollTop = ni * WHEEL_H;
    if (typeof setTimeout !== 'undefined') setTimeout(() => { el._suspend = false; }, 220);
    if (onChange) onChange(ni);
  }, { passive: false });
  el.addEventListener('scroll', () => {
    if (el._suspend) return;
    const idx = wheelIndexFromScrollTop(el);
    if (idx !== el._sel) { el._sel = idx; highlightWheel(el, idx); if (onChange) onChange(idx); }
  });
}

function setCalendarMonth(year, month) {
  calYear = year; calMonth = month;
  calView = 'day';
  renderCalendar();
}

function calNavigate(dir) {
  if (calView === 'day') {
    setCalendarMonth(calMonth + dir < 0 ? calYear - 1 : (calMonth + dir > 11 ? calYear + 1 : calYear), (calMonth + dir + 12) % 12);
  } else if (calView === 'month') {
    calYear += dir;
    renderCalendar();
  } else if (calView === 'year') {
    calDecadeStart += dir * 10;
    renderCalendar();
  }
}

function validate(ms) {
  return Number.isFinite(ms) && ms >= MIN_TS && ms <= MAX_TS;
}

function t(keys) {
  return keys.split('.').reduce((o, k) => o[k], I18N[lang]);
}

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 1300);
}

function copyText(text, btn) {
  if (window.utools) utools.copyText(String(text));
  else if (navigator.clipboard) navigator.clipboard.writeText(String(text));
  toast(t('copiedMsg'));
  if (btn) {
    const old = btn.textContent;
    btn.textContent = t('copied');
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = old; btn.classList.remove('copied'); }, 900);
  }
}

function updateNow() {
  if (paused) return;
  const now = new Date();
  lastNow = now;
  lastSec = Math.floor(now.getTime() / 1000);
  lastMs = now.getTime();
  nowDateEl.textContent = formatLocal(now);
  nowSecEl.textContent = lastSec;
  nowMsEl.textContent = lastMs;
}

function setResult(valEl, text, state) {
  valEl.dataset.value = state === 'empty' || state === 'err' ? '' : (valEl.dataset.value || '');
  valEl.setAttribute('aria-result', state || '');
  valEl.textContent = text;
  valEl.classList.toggle('placeholder', state === 'empty' || state === 'err');
  valEl.classList.remove('copied');
}

function setHint(hintEl, text, state) {
  hintEl.textContent = text || '';
  hintEl.className = 'input-hint' + (state ? ' ' + state : '');
}

function renderConvert() {
  const tz = timezoneEl.value;
  const isSec = currentTab === 'sec';
  const sel = readDateSelection();
  d2tVal.dataset.value = '';
  if (sel.empty) {
    setResult(d2tVal, '', 'empty');
    setHint(hintD2t, '', '');
    return;
  }
  if (sel.err) {
    setResult(d2tVal, t('invalidDate'), 'err');
    setHint(hintD2t, t('invalidDate'), 'err');
    return;
  }
  let ms;
  if (sel.kind === 'abs') {
    ms = sel.ms;
  } else {
    ms = dateToMs(sel, inputTzEl.value);
  }
  if (!validate(ms)) {
    setResult(d2tVal, t('outOfRange'), 'err');
    setHint(hintD2t, '', '');
    return;
  }
  const secVal = String(Math.floor(ms / 1000));
  const msVal = String(ms);
  const text = isSec ? secVal : msVal;
  d2tVal.dataset.value = isSec ? secVal : msVal;
  setResult(d2tVal, text, 'ok');
  setHint(hintD2t, '', '');
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function tzWeekday(date, tz) {
  try {
    if (!tz) return WEEK_CN[DAYS[date.getDay()]];
    const m = partsMap(getTzFormatter(tz).formatToParts(date));
    return WEEK_CN[m.weekday] || '';
  } catch (e) { return ''; }
}

function renderReverse() {
  const tz = timezoneEl.value;
  const isSec = currentTab === 'sec';
  const raw = tsInput.value.trim();
  t2dVal.dataset.value = '';
  if (!raw) {
    setResult(t2dVal, '', 'empty');
    setHint(hintT2d, '', '');
    return;
  }
  const num = raw.match(/^(-?)(\d+)$/);
  if (!num) {
    setResult(t2dVal, t('invalidTs'), 'err');
    setHint(hintT2d, t('invalidTs'), 'err');
    return;
  }
  const n = Number(raw);
  const ms = isSec ? n * 1000 : n;
  if (!validate(ms)) {
    setResult(t2dVal, t('outOfRange'), 'err');
    setHint(hintT2d, t('outOfRange'), 'err');
    return;
  }
  const date = new Date(ms);
  const fmt = tz ? formatTz(date, tz) : formatLocal(date);
  const week = lang === 'zh' ? tzWeekday(date, tz) : '';
  const text = fmt + (tz && week ? ` ${week}` : '');
  t2dVal.dataset.value = (isSec ? Math.floor(ms / 1000) : ms).toString();
  setResult(t2dVal, text, 'ok');
  setHint(hintT2d, '', '');
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach((el) => el.classList.toggle('active', el.dataset.tab === tab));
  tsInput.placeholder = '';
  msInputEl.style.display = tab === 'ms' ? '' : 'none';
  toggleNowPanel();
  if (calendarEl.classList.contains('open')) renderTimeWheels();
  renderConvert();
  renderReverse();
}

function toggleNowPanel() {
  const secItem = $('#now-sec-item');
  const msItem = $('#now-ms-item');
  const showSec = currentTab === 'sec';
  if (secItem) secItem.style.display = showSec ? '' : 'none';
  if (msItem) msItem.style.display = showSec ? 'none' : '';
}

async function initTimestampInput() {
  let text = '';
  try {
    const nc = typeof navigator !== 'undefined' ? navigator.clipboard : null;
    if (nc && nc.readText) text = ((await nc.readText()) || '').trim();
  } catch (e) { text = ''; }
  if (/^-?\d+$/.test(text)) {
    tsInput.value = text;
  } else {
    const now = Date.now();
    tsInput.value = currentTab === 'sec' ? String(Math.floor(now / 1000)) : String(now);
  }
  renderReverse();
}

function currentOffsetStr(tz) {
  const mins = offsetMinutes(new Date(), tz);
  if (mins === 0) return '+00:00';
  const sign = mins > 0 ? '+' : '-';
  const a = Math.abs(mins);
  return `${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}

function applyLang() {
  btnLang.textContent = lang === 'zh' ? 'EN' : '中';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  const off = (v) => currentOffsetStr(v);
  const cityOf = (z) => lang === 'zh' ? z.label.split(/[\/（( ]/)[0] : z.labelEn;
  timezoneEl.innerHTML = TIMEZONES.map((z) => {
    if (z.value === '') return `<option value="">${lang === 'zh' ? '本地' : 'Local'} ${off('')}</option>`;
    if (z.value === 'UTC') return `<option value="UTC">UTC</option>`;
    return `<option value="${z.value}">${cityOf(z)} ${off(z.value)}</option>`;
  }).join('');
  inputTzEl.innerHTML = TIMEZONES.map((z) => {
    if (z.value === '') return `<option value="" title="${lang === 'zh' ? '本地时区' : 'Local time'}">${off('')}</option>`;
    if (z.value === 'UTC') return `<option value="UTC" title="UTC">UTC</option>`;
    return `<option value="${z.value}" title="${lang === 'zh' ? z.label : z.labelEn}">${off(z.value)}</option>`;
  }).join('');
  inputTzEl.title = lang === 'zh' ? '输入时区：日期按此时区解析' : 'Input timezone: dates parsed in this zone';
  if (inputTzEl.value !== timezoneEl.value) inputTzEl.value = timezoneEl.value;
  btnPause.textContent = paused ? t('resume') : t('pause');
  tsInput.placeholder = '';
  dateInput.placeholder = t('datePlaceholder');
  timeInputEl.placeholder = t('timePlaceholder');
  msInputEl.placeholder = t('msPlaceholder');
  msInputEl.style.display = currentTab === 'ms' ? '' : 'none';
  $('#cal-now').textContent = t('now');
  $('#cal-ok').textContent = t('ok');
  const weekNames = lang === 'zh'
    ? { Su: '日', Mo: '一', Tu: '二', We: '三', Th: '四', Fr: '五', Sa: '六' }
    : { Su: 'Su', Mo: 'Mo', Tu: 'Tu', We: 'We', Th: 'Th', Fr: 'Fr', Sa: 'Sa' };
  document.querySelectorAll('.cal-week span').forEach((el) => { el.textContent = weekNames[el.dataset.w] || el.textContent; });
  renderCalendar();
}

function toggleLang() { lang = lang === 'zh' ? 'en' : 'zh'; applyLang(); renderConvert(); renderReverse(); }

timezoneEl.addEventListener('change', () => { inputTzEl.value = timezoneEl.value; renderConvert(); renderReverse(); updateNow(); renderCalendar(); });
inputTzEl.addEventListener('change', () => { renderConvert(); });
dateInput.addEventListener('input', () => { renderConvert(); showSuggestions(); });
dateInput.addEventListener('focus', () => { calendarEl.classList.remove('open'); showSuggestions(); });
dateInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { renderConvert(); hideSuggestions(); calendarEl.classList.remove('open'); }
  if (e.key === 'Escape') { hideSuggestions(); calendarEl.classList.remove('open'); if (window.utools) utools.outPlugin(); }
});
timeInputEl.addEventListener('input', renderConvert);
timeInputEl.addEventListener('keydown', (e) => { if (e.key === 'Escape' && window.utools) utools.outPlugin(); });
msInputEl.addEventListener('input', renderConvert);
msInputEl.addEventListener('keydown', (e) => { if (e.key === 'Escape' && window.utools) utools.outPlugin(); });
tsInput.addEventListener('input', renderReverse);
tsInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') renderReverse(); if (e.key === 'Escape' && window.utools) utools.outPlugin(); });

$('#btn-calendar').addEventListener('click', () => {
  if (calendarEl.classList.contains('open')) closeCalendar();
  else openCalendar();
});
$('#cal-prev').addEventListener('click', (e) => { e.stopPropagation(); calNavigate(-1); });
$('#cal-next').addEventListener('click', (e) => { e.stopPropagation(); calNavigate(1); });
$('#cal-title').addEventListener('click', (e) => {
  e.stopPropagation();
  if (calView === 'day') showMonthView();
  else if (calView === 'month') showYearView();
  else { calView = 'day'; renderCalendar(); }
});
$('#cal-year-input').addEventListener('input', followYearInput);
$('#cal-year-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); jumpToYearInput(); } if (e.key === 'Escape') closeCalendar(); });
$('#cal-year-input').addEventListener('focus', () => calYearInputEl.classList.remove('err-jump'));
calTimeInputEl.addEventListener('input', followTimeInput);
calTimeInputEl.addEventListener('focus', syncTimeInput);
calTimeInputEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCalendar(); });
calendarEl.addEventListener('click', (e) => {
  const z = e.target.closest('.wheel-zero');
  if (!z) return;
  e.stopPropagation();
  const k = z.dataset.wheel;
  const map = { hh: 'hh', mm: 'mm', ss: 'ss', ms: 'ms' };
  if (!map[k]) return;
  calTime[map[k]] = 0;
  renderTimeWheels();
  applyWheelTime();
});
calYearHeadEl.addEventListener('click', (e) => {
  const navBtn = e.target.closest('button');
  if (navBtn && navBtn.dataset.step) {
    e.stopPropagation();
    e.preventDefault();
    calDecadeStart += +navBtn.dataset.step;
    renderCalendar();
  }
});
$('#cal-now').addEventListener('click', (e) => {
  e.stopPropagation();
  const n = new Date();
  calSelected = { y: n.getFullYear(), mo: n.getMonth(), d: n.getDate() };
  calYear = n.getFullYear(); calMonth = n.getMonth();
  calTime.hh = n.getHours(); calTime.mm = n.getMinutes(); calTime.ss = n.getSeconds(); calTime.ms = n.getMilliseconds();
  setDateFields(calYear, calMonth + 1, calSelected.d, calTime.hh, calTime.mm, calTime.ss, calTime.ms);
  renderTimeWheels();
  renderCalendar(); renderConvert();
});
$('#cal-ok').addEventListener('click', (e) => {
  e.stopPropagation();
  if (calSelected) {
    setDateFields(calSelected.y, calSelected.mo + 1, calSelected.d,
      calTime.hh, calTime.mm, calTime.ss, calTime.ms);
  }
  renderConvert();
  closeCalendar();
});

dateSuggestEl.addEventListener('click', (e) => {
  const item = e.target.closest('.sg-item');
  if (!item) return;
  applyFullDateStr(item.dataset.date);
  hideSuggestions();
  if (item.dataset.month) {
    const [y, mo0] = item.dataset.month.split('-').map(Number);
    calSelected = { y, mo: mo0, d: parseInt(item.dataset.date.slice(8, 10)) };
    setCalendarMonth(y, mo0);
    openCalendar();
    return;
  }
  renderConvert();
});

document.addEventListener('click', (e) => {
  if (!dateFieldEl.contains(e.target)) {
    hideSuggestions();
    closeCalendar();
  }
});

btnLang.addEventListener('click', toggleLang);
document.querySelectorAll('.tab').forEach((el) => el.addEventListener('click', () => switchTab(el.dataset.tab)));

btnPause.addEventListener('click', () => {
  paused = !paused;
  liveDot.classList.toggle('paused', paused);
  btnPause.textContent = paused ? t('resume') : t('pause');
  if (!paused) updateNow();
});

document.addEventListener('click', (e) => {
  const block = e.target.closest('.result-block');
  if (block) {
    const val = block.querySelector('.result-value');
    if (val && val.dataset.value) copyText(val.dataset.value, null);
    return;
  }
  const item = e.target.closest('.now-item.clickable');
  if (item) { copyText(item.querySelector('.now-value').textContent, null); return; }
});

const buildTagEl = $('#build-tag');
if (buildTagEl) buildTagEl.textContent = BUILD;
applyLang();
switchTab('sec');
updateNow();
initTimestampInput();

if (window.utools) {
  utools.onPluginEnter(({ payload }) => {
    const p = payload && payload.trim();
    if (!p) { initTimestampInput(); tsInput.focus(); return; }
    if (/^\d{13}$/.test(p)) { switchTab('ms'); tsInput.value = p; renderReverse(); }
    else if (/^\d{10}$/.test(p)) { switchTab('sec'); tsInput.value = p; renderReverse(); }
    else if (parseDate(p)) { applyFullDateStr(p); timeInputEl.focus(); renderConvert(); }
    else { initTimestampInput(); }
    tsInput.focus();
  });
  try { utools.setExpendHeight(560); } catch (e) {}
}

setInterval(updateNow, 1000);
