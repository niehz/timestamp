// ========================================================
// js/core.js — 基础工具、系统设置、时区配置 UI
// 常量/时区数据/i18n 已拆出：js/utils/constants.js、
// js/data/timezones.js、js/i18n.js（均在 core 之前加载）。
// Loaded from index.html in this order:
// constants → timezones → i18n → core → datetime → fields →
// calendar → convert → tzselector → events
// ========================================================

const $ = (s) => document.querySelector(s);

// 输入清洗（纯函数，供测试与 events 接线共用）：
// 时间戳只保留数字与开头一个负号，剥离复制来源的千分位/空格等噪音。
function stripTsNoise(raw) {
  const r = String(raw == null ? '' : raw);
  const neg = /^\s*-/.test(r);
  const s = r.replace(/[^\d-]/g, '').replace(/-/g, '');
  return neg ? '-' + s : s;
}
// 日期/时间通用去噪：仅剥离数字间的千分位分隔（, ' NBSP NNBSP）与零宽字符，
// 其余保留——RFC2822 的 "Thu, 07 Sep"、"7, 2026"（逗号后非数字）不受影响。
function stripSeparators(raw) {
  return String(raw == null ? '' : raw)
    .replace(/[\u200B\u2060\uFEFF]/g, '')
    .replace(/(\d)[,'\u00A0\u202F](\d)/g, '$1$2');
}

// 便捷：从别名查找对应时区
function zonesByAlias(alias) {
  const u = alias.toUpperCase();
  return getAllZones().filter(z => zoneAliases(z).includes(u));
}
function zoneAliases(z) {
  const builtin = TZ_ALIASES[z.value] || [];
  const custom = Array.isArray(z.abbr) ? z.abbr : (z.abbr ? [String(z.abbr)] : []);
  return [...custom, ...builtin];
}

// 必须先于 TIMEZONES 加载：loadTzConfig() 会经 lookupZone 解析自定义时区，否则 TDZ 报错或标签退化为原始值。
let CUSTOM_TIMEZONES = loadCustomTimezones();
let TIMEZONES = loadTzConfig();
let tzInitApplied = false;

const SYS_DEFAULTS = { defaultTab: 'sec', precision: 'ns', theme: 'auto', usNsMode: 'derive' };
let SYS_SETTINGS = loadSysSettings();
function loadSysSettings() {
  let s = null;
  try {
    const raw = localStorage.getItem('sys_settings');
    if (raw) s = JSON.parse(raw) || {};
  } catch (e) {}
  if (typeof s !== 'object' || s === null) s = {};
  if (s.precision == null) {
    s.precision = s.showNs ? 'ns' : s.showUs ? 'us' : s.showMs ? 'ms' : 'sec';
  }
  delete s.showMs; delete s.showUs; delete s.showNs;
  s = { ...SYS_DEFAULTS, ...s };
  if (!['sec', 'ms', 'us', 'ns'].includes(s.defaultTab)) s.defaultTab = SYS_DEFAULTS.defaultTab;
  if (!['sec', 'ms', 'us', 'ns'].includes(s.precision)) s.precision = SYS_DEFAULTS.precision;
  if (!['auto', 'dark', 'light'].includes(s.theme)) s.theme = SYS_DEFAULTS.theme;
  if (!['derive', 'random'].includes(s.usNsMode)) s.usNsMode = SYS_DEFAULTS.usNsMode;
  return s;
}
const PRECISION_ORDER = { sec: 0, ms: 1, us: 2, ns: 3 };
function precisionGe(level) {
  return (PRECISION_ORDER[SYS_SETTINGS.precision] || 0) >= PRECISION_ORDER[level];
}
function applyTheme() {
  let light = SYS_SETTINGS.theme === 'light';
  if (SYS_SETTINGS.theme === 'auto' && window.matchMedia) {
    light = window.matchMedia('(prefers-color-scheme: light)').matches;
  }
  document.body.classList.toggle('theme-light', light);
  document.body.classList.toggle('theme-dark', !light);
}
function initThemeWatcher() {
  if (!window.matchMedia || typeof window.matchMedia !== 'function') return;
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const onChange = () => {
    if (SYS_SETTINGS.theme === 'auto') applyTheme();
  };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
}
function saveSysSettings() {
  try { localStorage.setItem('sys_settings', JSON.stringify(SYS_SETTINGS)); } catch (e) {}
}

let lang = 'zh';
const BUILD = 'v1.0.0';
let currentTab = 'sec';
let inputTzCustom = false;
let paused = false;
let lastNow = new Date();
let lastSec = 0;
let lastMs = 0;
let lastUpdateTime = 0;

const timezoneEl = $('#timezone');
const inputTzEl = $('#input-tz');
const toastEl = $('#toast');
const nowDateEl = $('#now-date');
const nowSecEl = $('#now-sec');
const nowMsEl = $('#now-ms');
const nowUsEl = $('#now-us');
const nowNsEl = $('#now-ns');
const liveDot = $('#live-dot');
const btnPause = $('#btn-pause');
const dateInput = $('#date-input');
const timeInputEl = $('#time-input');
const fracInputEl = $('#frac-input');
const tsInput = $('#ts-input');

// 强制设置时间戳输入框背景色，与日期输入框保持一致
tsInput.style.backgroundColor = 'var(--panel)';
// 设置圆滑的边框
tsInput.style.borderRadius = '12px';
const d2tVal = $('#d2t-val');
const t2dVal = $('#t2d-val');
const d2tResultEl = $('#d2t-result');
const d2tAmbigPopoverEl = $('#d2t-ambig-popover');
const t2dResultEl = $('#t2d-result');
const t2dPopoverEl = $('#t2d-popover');
const hintD2t = $('#d2t-hint');
const hintD2tResult = $('#d2t-result-hint');
const hintT2d = $('#t2d-hint');
const btnDateClear = $('#btn-date-clear');
const btnTsClear = $('#btn-ts-clear');
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
const wheelUs = $('#wheel-us');
const wheelNs = $('#wheel-ns');
const calTimeInputEl = $('#cal-time-input');
const dateSuggestEl = $('#date-suggest');
const dateFieldEl = $('#date-field');

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let calSelected = null;
let calView = 'day';
let calDecadeStart = Math.floor(new Date().getFullYear() / 10) * 10;
let calTime = { hh: 0, mm: 0, ss: 0, ms: 0, us: 0, ns: 0 };
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

function lookupZone(value) {
  return ALL_TIMEZONES.find(z => z.value === value) || CUSTOM_TIMEZONES.find(z => z.value === value);
}

// 当前生效时区：会话级覆盖（inputTzEl）优先，其次全局时区。
function activeTz() {
  return (inputTzEl && inputTzEl.value) || (timezoneEl && timezoneEl.value) || 'UTC';
}

// 引擎 IANA 规范目录（ES2024 Intl.supportedValuesOf）；不可用时回退内置全量列表。
function canonicalIanaZones() {
  try {
    const list = Intl.supportedValuesOf('timeZone');
    if (Array.isArray(list) && list.length) return list;
  } catch (e) {}
  return ALL_TIMEZONES.map(z => z.value).filter(v => /^[A-Za-z_]+\//.test(v));
}

// IANA 自动补全候选：按子串过滤规范目录。
function filterIanaZones(query) {
  const q = String(query || '').trim().toLowerCase();
  const list = canonicalIanaZones();
  if (!q) return list.slice(0, 12);
  return list.filter(v => v.toLowerCase().includes(q)).slice(0, 12);
}

// 分类输入：canonical=规范名（可自动补全）、resolvable=合法但非规范（别名）、displayOnly=仅展示。
function classifyIanaInput(str) {
  const v = String(str || '').trim();
  if (!v) return { kind: 'none', value: '' };
  if (canonicalIanaZones().includes(v)) return { kind: 'canonical', value: v };
  if (isValidIana(v)) return { kind: 'resolvable', value: v };
  return { kind: 'displayOnly', value: v };
}

// 偏移分钟数 -> FIXED 内部值（支持可选秒段）。
function minutesToFixedStr(mins) {
  const sign = mins >= 0 ? '+' : '-';
  const a = Math.abs(mins);
  let hh = Math.floor(a / 60);
  let mm = Math.floor(a % 60);
  let sec = Math.round((a - Math.floor(a)) * 60);
  if (sec >= 60) { sec = 0; mm += 1; }
  if (mm >= 60) { mm = 0; hh += 1; }
  let s = `FIXED:${sign}${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}`;
  if (sec > 0) s += String(sec).padStart(2, '0');
  return s;
}

function guessLocalTzName() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; }
}

function withLocalZone(list) {
  const local = guessLocalTzName();
  if (!local || list.some(z => z.value === local)) return list;
  const z = lookupZone(local) || { label: local, labelEn: local, value: local };
  return [z, ...list];
}

function loadTzConfig() {
  const saved = localStorage.getItem('tz_selected');
  if (saved) {
    try {
      const ids = JSON.parse(saved);
      const list = ids.map(id => lookupZone(id) || { label: id, labelEn: id, value: id })
        .filter(z => z && (z.label || z.labelEn));
      if (list.length > 0) return withLocalZone(list);
    } catch (e) {}
  }
  return withLocalZone([...DEFAULT_TZ_LIST]);
}

function saveTzConfig(selectedValues) {
  localStorage.setItem('tz_selected', JSON.stringify(selectedValues));
}

function commitTzConfig() {
  const selected = DEFAULT_TZ_LIST.map(z => z.value).filter(v => tzConfigSelected.has(v)).concat(
    getAllZones().filter(z => tzConfigSelected.has(z.value) && !DEFAULT_TZ_LIST.some(d => d.value === z.value)).map(z => z.value)
  );
  tzConfigSelected.forEach(v => { if (!selected.includes(v)) selected.push(v); });
  saveTzConfig(selected);
  TIMEZONES = withLocalZone(selected.map(v =>
    lookupZone(v) || { label: v, labelEn: v, value: v }
  ));
  applyLang();
}

function resetTzConfig() {
  localStorage.removeItem('tz_selected');
  TIMEZONES = withLocalZone([...DEFAULT_TZ_LIST]);
  tzConfigSelected = new Set(DEFAULT_TZ_LIST.map(z => z.value));
  renderTzConfigList();
  applyLang();
}

const tzConfigModal = $('#tz-config-modal');
const tzConfigListEl = $('#timezone-list');
const tzSearchEl = $('#tz-search');
const tzFilterEl = $('#tz-filter');
const btnResetTzConfig = $('#reset-tz-config');
const btnTzConfig = $('#tz-config-btn');
const modalCloseEl = $('#modal-close');
const dateParseSearchEl = $('#date-parse-search');
const btnCustomFmtAdd = $('#custom-fmt-add');
const btnResetFmtConfig = $('#reset-fmt-config');
const customTzCnEl = $('#custom-tz-cn');
const customTzEnEl = $('#custom-tz-en');
const customTzOffsetEl = $('#custom-tz-offset');
const customTzAbbrEl = $('#custom-tz-abbr');
const customTzIanaEl = $('#custom-tz-iana');
const customTzListEl = $('#custom-tz-list');
const btnCustomTzAdd = $('#custom-tz-add');
let tzConfigSelected = new Set(TIMEZONES.filter(z => z.value !== '').map(z => z.value));

function loadCustomTimezones() {
  try {
    const raw = localStorage.getItem('tz_custom');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr.filter(t => t && t.value && (t.label || t.labelEn)).map(t => ({ ...t, custom: true }));
      }
    }
  } catch (e) {}
  return [];
}
let tzEditingValue = null;

function getAllZones() {
  return [...ALL_TIMEZONES, ...CUSTOM_TIMEZONES];
}

function renderTzConfigList() {
  if (!tzConfigListEl) return;
  const query = tzSearchEl ? tzSearchEl.value.trim().toLowerCase() : '';
  const activeBtn = tzFilterEl ? tzFilterEl.querySelector('.tz-filter-btn.active') : null;
  const filter = activeBtn ? activeBtn.dataset.value : 'all';
  const list = getAllZones().filter(z => {
    if (filter === 'selected' && !tzConfigSelected.has(z.value)) return false;
    if (filter === 'unselected' && tzConfigSelected.has(z.value)) return false;
    if (!query) return true;
    if (z.label.toLowerCase().includes(query)) return true;
    if (z.labelEn.toLowerCase().includes(query)) return true;
    if (z.value.toLowerCase().includes(query)) return true;
    if (z.iana && z.iana.toLowerCase().includes(query)) return true;
    if (zoneAliases(z).some(a => a.toLowerCase().includes(query))) return true;
    if (zoneAliases(z).some(a => a.toLowerCase() === query)) return true;
    const offset = offsetMinutes(new Date(), z.value);
    const offsetHour = Math.floor(Math.abs(offset) / 60);
    const offsetMinute = Math.abs(offset) % 60;
    const hourPadded = String(offsetHour).padStart(2, '0');
    const offsetVariants = [
      `${offset >= 0 ? '+' : '-'}${offsetHour}`,          // +8 / -5
      `${offset >= 0 ? '+' : '-'}${hourPadded}`,          // +08
      `${Math.abs(offset)}`,                              // 8 / 330 / 830
      formatOffset(offset),                               // UTC+8 / UTC+08:00
    ];
    if (offsetMinute > 0) {
      offsetVariants.push(`${offset >= 0 ? '+' : '-'}${hourPadded}:${String(offsetMinute).padStart(2, '0')}`); // +05:30
      offsetVariants.push(`${offset >= 0 ? '+' : '-'}${offsetHour}${offsetMinute}`); // +530
      offsetVariants.push(`${hourPadded}${String(offsetMinute).padStart(2, '0')}`); // 0530
    }
    return offsetVariants.some(v => v.toLowerCase().includes(query));
  });
  tzConfigListEl.innerHTML = list.map((z, idx) => {
    const offset = offsetMinutes ? offsetMinutes(new Date(), z.value) : 0;
    const offsetStr = formatOffset ? formatOffset(offset) : '';
    const selected = tzConfigSelected.has(z.value);
    const label = htmlEscape(lang === 'zh' ? z.label : z.labelEn);
    const aliasStr = zoneAliases(z).length ? `<span class="tz-alias">${zoneAliases(z).map(a => htmlEscape(a)).join('/')}</span>` : '';
    const valueAttr = escapeAttr(z.value);
    return `<div class="timezone-item ${selected ? 'selected' : ''}" data-value="${valueAttr}">
      <div class="timezone-info">
        <div class="timezone-name">${label} ${aliasStr}</div>
        <div class="timezone-offset">${offsetStr} · <span class="timezone-value">${htmlEscape(z.value)}</span></div>
      </div>
      <span class="tz-check">${selected ? '✓' : ''}</span>
    </div>`;
  }).join('');
  if (tzConfigListEl) {
    tzConfigListEl.querySelectorAll('.timezone-item').forEach(item => {
      item.addEventListener('click', () => {
        const val = item.dataset.value;
        if (tzConfigSelected.has(val)) {
          tzConfigSelected.delete(val);
          item.classList.remove('selected');
        } else {
          tzConfigSelected.add(val);
          item.classList.add('selected');
        }
        item.querySelector('.tz-check').textContent = tzConfigSelected.has(val) ? '✓' : '';
        commitTzConfig();
      });
    });
  }
  renderCustomTzList();
}

function parseOffsetInput(str) {
  const s = String(str || '').trim();
  if (!s) return null;
  // 支持：+8 / -5 / 8 / +08:00 / +08:05 / +08:05:43 / -04:30 / 0530 / +530 / 330
  let m = s.match(/^([+-])?(\d{1,2})(?::(\d{2})(?::(\d{2}))?)?$/);
  if (!m) m = s.match(/^([+-])?(\d{1,2})(\d{2})$/);
  if (!m) return null;
  const sign = m[1] === '-' ? -1 : 1;
  const hh = parseInt(m[2], 10);
  const mm = m[3] ? parseInt(m[3], 10) : 0;
  const ss = m[4] ? parseInt(m[4], 10) : 0;
  if (mm >= 60 || ss >= 60) return null;
  const totalMins = hh * 60 + mm + ss / 60;
  const adj = totalMins * sign;
  if (adj > 14 * 60 || adj < -12 * 60) return null;
  return adj;
}

function isValidIana(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch (e) { return false; }
}

function clearCustomTzAddForm() {
  if (customTzCnEl) customTzCnEl.value = '';
  if (customTzEnEl) customTzEnEl.value = '';
  if (customTzOffsetEl) customTzOffsetEl.value = '';
  if (customTzAbbrEl) customTzAbbrEl.value = '';
  if (customTzIanaEl) customTzIanaEl.value = '';
}

function addCustomTimezone() {
  const cn = customTzCnEl ? customTzCnEl.value.trim() : '';
  const en = customTzEnEl ? customTzEnEl.value.trim() : '';
  const offsetStr = customTzOffsetEl ? customTzOffsetEl.value.trim() : '';
  const abbrStr = customTzAbbrEl ? customTzAbbrEl.value.trim() : '';
  const iana = customTzIanaEl ? customTzIanaEl.value.trim() : '';
  if (!cn && !en) { toast(lang === 'zh' ? '请输入中文名或英文名' : 'Enter a Chinese or English name'); return; }

  const r = resolveModernTzInput(iana, offsetStr);
  if (r.error) { toast(r.error); return; }

  // 内置时区自动启用：输入的合法 IANA 是内置时区 → 直接启用加入下拉列表，不创建自定义副本
  if (r.value === iana && !r.displayOnly && ALL_TIMEZONES.some(z => z.value === iana) && !CUSTOM_TIMEZONES.some(z => z.value === iana)) {
    tzConfigSelected.add(iana);
    clearCustomTzAddForm();
    renderCustomTzList();
    renderTzConfigList();
    commitTzConfig();
    if (cn || en || abbrStr) toast(`${t('tzBuiltinNamedWarn')}: ${iana}`);
    else toast(`${t('tzBuiltinEnabled')}: ${iana}`);
    highlightTzConfigItem(iana);
    return;
  }

  if (ALL_TIMEZONES.some(z => z.value === r.value) || CUSTOM_TIMEZONES.some(z => z.value === r.value)) {
    toast(lang === 'zh' ? '该时区已存在' : 'This timezone already exists');
    return;
  }
  const abbr = abbrStr ? abbrStr.split(/[\/\s,，]+/).map(x => x.trim()).filter(Boolean) : [];
  const zone = { label: cn || `自定义 ${r.fallbackLabel}`, labelEn: en || `Custom ${r.fallbackLabel}`, value: r.value, custom: true, abbr, iana: r.iana, displayOnly: r.displayOnly || undefined };
  CUSTOM_TIMEZONES.push(zone);
  persistCustomTimezones();
  tzConfigSelected.add(r.value);
  clearCustomTzAddForm();
  renderCustomTzList();
  renderTzConfigList();
  commitTzConfig();
  if (r.displayOnly) toast(t('tzIanaOnlyWarn'));
  else toast(lang === 'zh' ? '自定义时区已添加' : 'Custom timezone added');
}

function highlightTzConfigItem(value) {
  if (!tzConfigListEl) return;
  const items = tzConfigListEl.querySelectorAll('.timezone-item');
  let target = null;
  items.forEach(it => { if (it.dataset.value === value) target = it; });
  if (!target) return;
  target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  target.classList.add('tz-blink');
  setTimeout(() => target.classList.remove('tz-blink'), 1600);
}

function persistCustomTimezones() {
  localStorage.setItem('tz_custom', JSON.stringify(CUSTOM_TIMEZONES.map(z => ({ label: z.label, labelEn: z.labelEn, value: z.value, abbr: z.abbr || [], iana: z.iana || '', displayOnly: !!z.displayOnly }))));
}

// 解析“真实时区 + 偏移”输入：合法 IANA 直接生效；非法 IANA 接受为仅展示(displayOnly)，
// 回退到固定偏移；两者皆无偏移则报错。
function resolveModernTzInput(iana, offsetStr) {
  const zIana = String(iana || '').trim();
  const zOffset = String(offsetStr || '').trim();
  if (zIana) {
    if (isValidIana(zIana)) return { value: zIana, iana: zIana, displayOnly: false, fallbackLabel: zIana, error: '' };
    const mins = parseOffsetInput(zOffset);
    if (mins === null) return { error: lang === 'zh' ? '该IANA时区无效且未填写偏移' : 'Invalid IANA timezone and no offset provided' };
    return { value: minutesToFixedStr(mins), iana: zIana, displayOnly: true, fallbackLabel: formatOffset(mins), error: '' };
  }
  const mins = parseOffsetInput(zOffset);
  if (mins === null) return { error: lang === 'zh' ? '请输入 -12 到 +14 之间的有效偏移' : 'Enter a valid offset between -12 and +14' };
  return { value: minutesToFixedStr(mins), iana: '', displayOnly: false, fallbackLabel: formatOffset(mins), error: '' };
}

function removeCustomTimezone(value) {
  CUSTOM_TIMEZONES = CUSTOM_TIMEZONES.filter(z => z.value !== value);
  persistCustomTimezones();
  tzConfigSelected.delete(value);
  renderCustomTzList();
  renderTzConfigList();
  commitTzConfig();
}

function offsetInputFromValue(value) {
  const m = String(value || '').match(/^FIXED:([+-])(\d{2})(\d{2})(\d{2})?$/);
  if (!m) return '';
  return m[4] ? `${m[1]}${m[2]}:${m[3]}:${m[4]}` : `${m[1]}${m[2]}:${m[3]}`;
}

function renderCustomTzList() {
  if (!customTzListEl) return;
  if (CUSTOM_TIMEZONES.length === 0) {
    customTzListEl.innerHTML = `<div class="empty-tip" data-i18n="noCustomTz">暂无自定义时区</div>`;
    applyModalI18n();
    return;
  }
  customTzListEl.innerHTML = CUSTOM_TIMEZONES.map(z => {
    if (tzEditingValue === z.value) {
      const aliasVal = (Array.isArray(z.abbr) ? z.abbr : [z.abbr]).filter(Boolean).join('/');
      return `<div class="custom-tz-item editing" data-value="${z.value}">
        <div class="custom-tz-edit-form">
          <div class="custom-tz-form-row">
            <input type="text" class="edit-cn" value="${escapeAttr(z.label)}" placeholder="${t('customTzCnPh')}">
            <input type="text" class="edit-en" value="${escapeAttr(z.labelEn)}" placeholder="English">
            <input type="text" class="edit-offset" value="${escapeAttr(offsetInputFromValue(z.value))}" placeholder="${t('customTzOffsetPh')}">
          </div>
          <div class="custom-tz-form-row optional-row">
            <input type="text" class="edit-abbr" value="${escapeAttr(aliasVal)}" placeholder="${t('customTzAbbrPh')}">
            <input type="text" class="edit-iana" value="${escapeAttr(z.iana || '')}" placeholder="${t('customTzIanaPh')}">
            <button class="custom-tz-save">${lang === 'zh' ? '保存' : 'Save'}</button>
            <button class="custom-tz-cancel">${lang === 'zh' ? '取消' : 'Cancel'}</button>
          </div>
        </div>
      </div>`;
    }
    const label = htmlEscape(lang === 'zh' ? z.label : z.labelEn);
    const offsetStr = formatOffset(offsetMinutes(new Date(), z.value));
    const idStr = z.displayOnly
      ? `<span class="timezone-value">${htmlEscape(z.iana || z.value)}</span><span class="tz-iana-only">${t('tzIanaOnlyBadge')}</span>`
      : (z.iana ? `<span class="timezone-value">${htmlEscape(z.iana)}</span>` : `<span class="timezone-value">${htmlEscape(z.value)}</span>`);
    const aliasStr = zoneAliases(z).length ? `<span class="tz-alias">${zoneAliases(z).map(a => htmlEscape(a)).join('/')}</span>` : '';
    return `<div class="custom-tz-item" data-value="${escapeAttr(z.value)}">
      <div class="timezone-info">
        <div class="timezone-name">${label} ${aliasStr}</div>
        <div class="timezone-offset">${offsetStr} · ${idStr}</div>
      </div>
      <div class="custom-tz-actions">
        <button class="custom-tz-edit" title="${lang === 'zh' ? '编辑' : 'Edit'}">✎</button>
        <button class="custom-tz-del" title="${lang === 'zh' ? '删除' : 'Delete'}">✕</button>
      </div>
    </div>`;
  }).join('');
  customTzListEl.querySelectorAll('.custom-tz-item').forEach(item => {
    if (item.classList.contains('editing')) {
      const val = item.dataset.value;
      item.querySelector('.custom-tz-save').addEventListener('click', (e) => {
        e.stopPropagation();
        saveEditCustomTimezone(val, item);
      });
      item.querySelector('.custom-tz-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        tzEditingValue = null;
        renderCustomTzList();
      });
      return;
    }
    item.querySelector('.custom-tz-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      tzEditingValue = item.dataset.value;
      renderCustomTzList();
    });
    item.querySelector('.custom-tz-del').addEventListener('click', (e) => {
      e.stopPropagation();
      removeCustomTimezone(item.dataset.value);
    });
  });
  customTzListEl.querySelectorAll('.edit-iana').forEach(inp => {
    attachIanaAutocomplete(inp, (v) => { inp.value = v; });
  });
}

function saveEditCustomTimezone(value, item) {
  const zone = CUSTOM_TIMEZONES.find(z => z.value === value);
  if (!zone) return;
  const cn = (item.querySelector('.edit-cn').value || '').trim();
  const en = (item.querySelector('.edit-en').value || '').trim();
  const offsetStr = (item.querySelector('.edit-offset').value || '').trim();
  const abbrStr = (item.querySelector('.edit-abbr').value || '').trim();
  const iana = (item.querySelector('.edit-iana').value || '').trim();
  if (!cn && !en) { toast(lang === 'zh' ? '请输入中文名或英文名' : 'Enter a Chinese or English name'); return; }

  const r = resolveModernTzInput(iana, offsetStr);
  if (r.error) { toast(r.error); return; }
  if (r.value !== value && (ALL_TIMEZONES.some(z => z.value === r.value) || CUSTOM_TIMEZONES.some(z => z.value === r.value))) {
    toast(lang === 'zh' ? '该时区已存在' : 'This timezone already exists');
    return;
  }
  const abbr = abbrStr ? abbrStr.split(/[\/\s,，]+/).map(x => x.trim()).filter(Boolean) : [];
  zone.label = cn || `自定义 ${r.fallbackLabel}`;
  zone.labelEn = en || `Custom ${r.fallbackLabel}`;
  zone.abbr = abbr;
  zone.iana = r.iana;
  zone.displayOnly = r.displayOnly || undefined;
  if (r.value !== value) {
    zone.value = r.value;
    tzConfigSelected.delete(value);
    tzConfigSelected.add(r.value);
  }
  persistCustomTimezones();
  tzEditingValue = null;
  renderCustomTzList();
  renderTzConfigList();
  commitTzConfig();
  if (r.displayOnly) toast(t('tzIanaOnlyWarn'));
  else toast(lang === 'zh' ? '自定义时区已更新' : 'Custom timezone updated');
}

function escapeAttr(str) {
  return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------- Step 5：IANA 字段自动补全（配置面板，静态添加表单与行内编辑表单共用） ----------
let ianaAcEl = null;
let ianaAcInput = null;
let ianaAcOnPick = null;

function ensureIanaAcEl() {
  if (ianaAcEl) return ianaAcEl;
  ianaAcEl = document.createElement('div');
  ianaAcEl.className = 'iana-ac';
  ianaAcEl.style.display = 'none';
  document.body.appendChild(ianaAcEl);
  return ianaAcEl;
}

function closeIanaAc() {
  if (ianaAcEl) ianaAcEl.style.display = 'none';
  ianaAcInput = null;
  ianaAcOnPick = null;
}

function positionIanaAc(inputEl) {
  const r = inputEl.getBoundingClientRect();
  const w = ianaAcEl.offsetWidth || 300;
  const h = ianaAcEl.offsetHeight || 260;
  // 左右：优先对齐左缘，右缘放不下则靠右翻转
  let left = r.left;
  if (left + w > window.innerWidth - 8) left = Math.max(8, r.right - w);
  ianaAcEl.style.left = left + 'px';
  // 上下：优先放下方，放不下则翻转到输入框上方，保证不遮住输入
  let top = r.bottom + 4;
  if (top + h > window.innerHeight - 8) {
    top = r.top - h - 4;
    if (top < 8) top = 8;
  }
  ianaAcEl.style.top = top + 'px';
}

function ianaAcRows(query) {
  const q = String(query || '').trim();
  const zones = filterIanaZones(q);
  let html = '';
  if (zones.length === 0) {
    if (q && /^[A-Za-z]/.test(q)) {
      const cls = classifyIanaInput(q);
      if (cls.kind === 'resolvable') {
        html = `<div class="tz-ov-result" data-value="${escapeAttr(q)}"><span>${htmlEscape(q)}</span><span class="off">${t('tzOvAlias')}</span></div>`;
      }
    }
    if (!html) html = `<div class="tz-ov-result index">${t('tzOvEmpty')}</div>`;
  } else {
    html = zones.map(v => `<div class="tz-ov-result" data-value="${escapeAttr(v)}"><span>${htmlEscape(v)}</span><span class="off">${currentOffsetStr(v)}</span></div>`).join('');
  }
  return html;
}

function pickIanaAc(inputEl, value) {
  inputEl.value = value;
  if (ianaAcOnPick) ianaAcOnPick(value);
  closeIanaAc();
}

function attachIanaAutocomplete(inputEl, onPick) {
  if (!inputEl || inputEl.dataset.ianaAc === '1') return;
  inputEl.dataset.ianaAc = '1';
  const ac = ensureIanaAcEl();

  function bindRows() {
    ac.querySelectorAll('.tz-ov-result[data-value]').forEach(row => {
      row.addEventListener('mousedown', (e) => { e.preventDefault(); pickIanaAc(inputEl, row.dataset.value); });
    });
  }

  function open() {
    // 配置弹窗里的输入框：先滚到可见区，避免被弹层/遮挡影响定位与可读性
    if (inputEl.closest('#tz-config-modal')) inputEl.scrollIntoView({ block: 'nearest' });
    ac.innerHTML = ianaAcRows(inputEl.value);
    positionIanaAc(inputEl);
    ac.style.display = 'block';
    ianaAcInput = inputEl;
    ianaAcOnPick = onPick;
    bindRows();
  }

  inputEl.addEventListener('focus', () => { open(); });
  inputEl.addEventListener('input', () => {
    if (ac.style.display === 'block' && ianaAcInput === inputEl) {
      ac.innerHTML = ianaAcRows(inputEl.value);
      bindRows();
      positionIanaAc(inputEl);
    } else open();
  });
  inputEl.addEventListener('keydown', (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    const active = ac.style.display === 'block' && ianaAcInput === inputEl;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!active) { open(); return; }
      e.preventDefault();
      const rows = ac.querySelectorAll('.tz-ov-result[data-value]');
      if (!rows.length) return;
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      let idx = Array.prototype.findIndex.call(rows, r => r.classList.contains('highlight'));
      idx = idx < 0 ? (dir > 0 ? 0 : rows.length - 1) : (idx + dir + rows.length) % rows.length;
      rows.forEach((r, i) => r.classList.toggle('highlight', i === idx));
      rows[idx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      if (!active) return;
      const rows = ac.querySelectorAll('.tz-ov-result[data-value]');
      const hl = Array.prototype.findIndex.call(rows, r => r.classList.contains('highlight'));
      if (hl >= 0 && rows[hl]) { e.preventDefault(); pickIanaAc(inputEl, rows[hl].dataset.value); return; }
      const q = inputEl.value.trim();
      const cls = classifyIanaInput(q);
      if (cls.kind === 'canonical' || cls.kind === 'resolvable') { e.preventDefault(); pickIanaAc(inputEl, cls.value); }
    }
  });
}

document.addEventListener('mousedown', (e) => {
  if (!ianaAcEl || ianaAcEl.style.display === 'none') return;
  if (e.target.closest('.iana-ac')) return;
  if (ianaAcInput && ianaAcInput.contains(e.target)) return;
  closeIanaAc();
});

function applyModalI18n() {
  const emptyTip = customTzListEl && customTzListEl.querySelector('.empty-tip');
  if (emptyTip) emptyTip.textContent = t('noCustomTz');
  renderDateParseList();
  renderCustomParseRules();
  updateParseStyleBtns();
  const dateParseSearch = $('#date-parse-search');
  if (dateParseSearch) dateParseSearch.placeholder = t('dateParseSearchPlaceholder');
}

function initTzConfig() {
  const configTabsEl = $('#config-tabs');
  const configPanes = { tz: $('#pane-tz'), fmt: $('#pane-fmt'), parse: $('#pane-parse'), sys: $('#pane-sys') };
  if (configTabsEl) {
    configTabsEl.querySelectorAll('.config-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        configTabsEl.querySelectorAll('.config-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const name = btn.dataset.tab;
        Object.entries(configPanes).forEach(([k, pane]) => {
          if (pane) pane.classList.toggle('hidden', k !== name);
        });
      });
    });
  }
  if (btnTzConfig) {
    btnTzConfig.addEventListener('click', () => {
      tzConfigModal.classList.add('show');
      renderTzConfigList();
      renderCustomTzList();
      renderDateParseList();
      renderCustomParseRules();
      updateParseStyleBtns();
      renderSysConfig();
    });
  }
  if (modalCloseEl) {
    modalCloseEl.addEventListener('click', () => tzConfigModal.classList.remove('show'));
  }
  tzConfigModal.addEventListener('click', (e) => {
    if (e.target === tzConfigModal) tzConfigModal.classList.remove('show');
  });
  const donateModal = $('#donate-modal');
  const donateLink = $('#donate-link');
  const donateClose = $('#donate-close');
  if (donateLink) {
    donateLink.addEventListener('click', () => {
      if (donateModal) donateModal.classList.add('show');
    });
  }
  if (donateClose) {
    donateClose.addEventListener('click', () => {
      if (donateModal) donateModal.classList.remove('show');
    });
  }
  if (donateModal) {
    donateModal.addEventListener('click', (e) => {
      if (e.target === donateModal) donateModal.classList.remove('show');
    });
  }
  if (btnCustomTzAdd) {
    btnCustomTzAdd.addEventListener('click', () => addCustomTimezone());
    [customTzCnEl, customTzEnEl, customTzOffsetEl].forEach(el => {
      if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomTimezone(); });
    });
    if (customTzIanaEl) {
      attachIanaAutocomplete(customTzIanaEl, (v) => {
        const z = lookupZone(v);
        if (z) {
          if (!customTzCnEl.value.trim()) customTzCnEl.value = z.label || '';
          if (!customTzEnEl.value.trim()) customTzEnEl.value = z.labelEn || v;
        }
      });
      customTzIanaEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !(ianaAcEl && ianaAcEl.style.display === 'block')) {
          e.preventDefault();
          addCustomTimezone();
        }
      });
    }
  }
  if (btnResetTzConfig) {
    btnResetTzConfig.addEventListener('click', () => resetTzConfig());
  }
  if (tzSearchEl) {
    tzSearchEl.addEventListener('input', debounce(() => renderTzConfigList(), 150));
  }
  if (tzFilterEl) {
    tzFilterEl.querySelectorAll('.tz-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tzFilterEl.querySelectorAll('.tz-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTzConfigList();
      });
    });
  }
}

function setFilterValue(id, value) {
  const group = document.getElementById(id);
  if (!group) return;
  group.querySelectorAll('.tz-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.value === value));
}
function getFilterValue(id) {
  const group = document.getElementById(id);
  const active = group && group.querySelector('.tz-filter-btn.active');
  return active ? active.dataset.value : null;
}
function renderSysConfig() {
  setFilterValue('sys-default-tab', SYS_SETTINGS.defaultTab);
  setFilterValue('sys-precision', SYS_SETTINGS.precision);
  setFilterValue('sys-theme', SYS_SETTINGS.theme);
  setFilterValue('sys-usns', SYS_SETTINGS.usNsMode);
}
function applySysField(id, value) {
  if (id === 'sys-default-tab') {
    SYS_SETTINGS.defaultTab = value || SYS_DEFAULTS.defaultTab;
  } else if (id === 'sys-precision') {
    SYS_SETTINGS.precision = value || SYS_DEFAULTS.precision;
  } else if (id === 'sys-theme') {
    SYS_SETTINGS.theme = value || SYS_DEFAULTS.theme;
  } else if (id === 'sys-usns') {
    SYS_SETTINGS.usNsMode = value || SYS_DEFAULTS.usNsMode;
  }
  saveSysSettings();
  if (id === 'sys-precision') {
    switchTab(currentTab);
    updatePrecisionIndicators();
  } else if (id === 'sys-theme') applyTheme();
}
function resetSysConfig() {
  SYS_SETTINGS = { ...SYS_DEFAULTS };
  saveSysSettings();
  renderSysConfig();
  applyTheme();
  switchTab(currentTab);
  updatePrecisionIndicators();
  toast(t('sysReset'));
}
function initSysConfig() {
  const resetBtn = $('#reset-sys-config');
  if (resetBtn) resetBtn.addEventListener('click', resetSysConfig);
  ['sys-default-tab', 'sys-precision', 'sys-theme', 'sys-usns'].forEach(id => {
    const g = document.getElementById(id);
    if (!g) return;
    g.addEventListener('click', (e) => {
      const btn = e.target.closest('.tz-filter-btn');
      if (!btn || btn.classList.contains('active')) return;
      g.querySelectorAll('.tz-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applySysField(id, btn.dataset.value);
    });
  });
}
