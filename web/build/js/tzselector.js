// ========================================================
// js/tzselector.js — 自定义时区选择器、语言(i18n)应用
// Extracted from index.js (lines 3102-3685) by
// dev/scripts/split.mjs. Loaded from index.html in this order:
// core → datetime → fields → calendar → convert → tzselector → events
// ========================================================

function reformatTimeInput() {
  const raw = timeInputEl.value.trim();
  const parts = raw ? raw.split(':') : null;
  if (parts && parts.length >= 2) {
    const frac = parts[2] && parts[2].split('.')[1];
    if (frac) {
      const digits = currentFracDigits();
      fracInputEl.value = frac.padEnd(digits || 9, '0').slice(0, digits || 9);
      parts[2] = parts[2].split('.')[0];
    }
    if (currentTab === 'us' && precisionGe('us')) {
      if (!fracInputEl.value.trim()) fracInputEl.value = '000000';
    } else if (currentTab === 'ns') {
      if (precisionGe('ns') && !fracInputEl.value.trim()) fracInputEl.value = '000000000';
      else if (precisionGe('us') && !fracInputEl.value.trim()) fracInputEl.value = '000000';
    }
    timeInputEl.value = `${parts[0]}:${parts[1]}${parts[2] ? ':' + parts[2] : ''}`;
  }
}

function toggleNowPanel() {
  const secItem = $('#now-sec-item');
  const msItem = $('#now-ms-item');
  const usItem = $('#now-us-item');
  const nsItem = $('#now-ns-item');
  
  if (secItem) secItem.style.display = currentTab === 'sec' ? '' : 'none';
  if (msItem) msItem.style.display = currentTab === 'ms' ? '' : 'none';
  if (usItem) usItem.style.display = currentTab === 'us' ? '' : 'none';
  if (nsItem) nsItem.style.display = currentTab === 'ns' ? '' : 'none';
}

async function initTimestampInput() {
  let text = '';
  let readFailed = false;
  try {
    const nc = typeof navigator !== 'undefined' ? navigator.clipboard : null;
    if (nc && nc.readText) text = ((await nc.readText()) || '').trim();
    else readFailed = true;
  } catch (e) { readFailed = true; }
  if (readFailed && !window.utools) toast(t('clipboardFail'));
  if (/^-?\d+$/.test(text)) {
    tsInput.value = text;
    const digits = text.replace(/^-/, '');
    if (/^\d{19}$/.test(digits)) switchTab('ns');
    else if (/^\d{16}$/.test(digits)) switchTab('us');
    else if (/^\d{13}$/.test(digits)) switchTab('ms');
    else if (/^\d{10}$/.test(digits)) switchTab('sec');
    else renderReverse();
    return;
  } else {
    tsInput.value = '';
    const pe = parseDateEx(text);
    if (pe) {
      applyParsedToFields(pe);
      renderConvert();
      showSuggestions();
    }
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

// FIXED 偏移时区（手动输入偏移量）。
function isFixedZone(v) { return /^FIXED:/.test(v || ''); }

// 时区城市显示名：内置/自定义时区 → 城市名；未知 IANA → 末段；否则原值。
function zoneCityName(tz) {
  const z = lookupZone(tz);
  if (z) return lang === 'zh' ? z.label.split(/[／（( ]/)[0] : z.labelEn;
  const m = /^[A-Za-z_]+\/(.+)$/.exec(tz || '');
  return m ? m[1].replace(/_/g, ' ') : (tz || '');
}

// 卡片标题时区展示：IANA → “IANA（城市）”；FIXED 覆盖 → “自定义 +hh:mm”，FIXED 全局 → 城市或偏移；UTC → UTC。
function zoneTitleSuffix(tz, isOverride) {
  const v = tz || 'UTC';
  if (isFixedZone(v)) {
    if (isOverride) return `${t('customTag')} ${currentOffsetStr(v)}`;
    const z = lookupZone(v);
    if (z) return lang === 'zh' ? z.label.split(/[／（( ]/)[0] : z.labelEn;
    return currentOffsetStr(v);
  }
  if (v === 'UTC') return 'UTC';
  const z = lookupZone(v);
  if (z) {
    const city = lang === 'zh' ? z.label.split(/[／（( ]/)[0] : z.labelEn;
    return lang === 'zh' ? `${v}（${city}）` : `${v} (${city})`;
  }
  return v;
}

// 基于双滚轮的时区选择器已移除；此处为卡片标题右侧的 UTC 偏移芯片。
function initCustomTzSelector() {
  // 确保全局时区选择器有默认值
  if (timezoneEl && !timezoneEl.value) {
    timezoneEl.value = "Asia/Shanghai";
  }
  // 确保输入时区选择器与全局时区选择器同步
  if (inputTzEl && timezoneEl && inputTzEl.value !== timezoneEl.value) {
    inputTzEl.value = timezoneEl.value;
  }
  inputTzCustom = (inputTzEl.value || "") !== (timezoneEl.value || "");
  updateDateToTsTitle();
  updateTsToDateTitle();
  renderOffsetChips();
}

// 芯片当前时刻：date→ts 取输入日期、ts→date 取当前时间戳，否则用 now。
function chipInstant(kind) {
  if (kind === "d2t") {
    try {
      const sel = readDateSelection();
      if (!sel.empty && !sel.err && typeof sel.ms === "number") return new Date(sel.ms);
    } catch (e) {}
  } else if (kind === "t2d") {
    try {
      const ms = currentT2dMs();
      if (ms !== null && ms !== undefined) return new Date(ms);
    } catch (e) {}
  }
  return new Date();
}

// 芯片两段文本：前缀（城市/自定义）+ 偏移，拆分以便分色展示。
function offsetChipParts(tz, inst) {
  const off = offsetLabel(tz, inst);
  if (isFixedZone(tz)) {
    if (inputTzCustom) return { prefix: t('customTag'), off };
    const z = lookupZone(tz);
    return { prefix: z ? (lang === 'zh' ? z.label.split(/[／（( ]/)[0] : z.labelEn) : '', off };
  }
  if (tz === 'UTC') return { prefix: '', off };
  return { prefix: zoneCityName(tz), off };
}

function offsetChipText(tz, inst) {
  const p = offsetChipParts(tz, inst);
  return p.prefix ? `${p.prefix} ${p.off}` : p.off;
}

function setOffsetChip(el, tz, inst) {
  const p = offsetChipParts(tz, inst);
  el.innerHTML = p.prefix
    ? `<span class="cz">${htmlEscape(p.prefix)}</span><span class="co">${htmlEscape(p.off)}</span>`
    : `<span class="co">${htmlEscape(p.off)}</span>`;
  el.title = tz;
}

// 渲染三个卡片标题右侧的 UTC 偏移芯片（点击弹出时区/偏移编辑弹层）。
function renderOffsetChips() {
  const tz = activeTz();
  const targets = [
    { id: "d2t-offset", kind: "d2t" },
    { id: "t2d-offset", kind: "t2d" },
    { id: "now-offset", kind: "now" },
  ];
  for (const t of targets) {
    const el = document.getElementById(t.id);
    if (!el) continue;
    const inst = t.kind === "now" ? new Date() : chipInstant(t.kind);
    setOffsetChip(el, tz, inst);
    el.classList.toggle("custom", inputTzCustom);
  }
}

// ---------- Step 3：芯片弹层（IANA 自动补全 + 偏移输入 + ⟲ 重置） ----------
const tzOverlay = document.getElementById('tz-overlay');
const tzOvSearchEl = document.getElementById('tz-ov-search');
const tzOvResultsEl = document.getElementById('tz-ov-results');
const tzOvOffsetEl = document.getElementById('tz-ov-offset');
const tzOvResetEl = document.getElementById('tz-ov-reset');
const tzOvCurrentEl = document.getElementById('tz-ov-current');

let tzOvCandidates = [];
let tzOvActiveIdx = -1;

['d2t-offset', 't2d-offset', 'now-offset'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('tabindex', '0');
  el.setAttribute('role', 'button');
  el.setAttribute('aria-haspopup', 'dialog');
  el.addEventListener('click', () => openTzOverlay(el));
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openTzOverlay(el);
    }
  });
});

// 当前时间卡片：整行标题点击也打开时区弹层（暂停按钮独立点按，芯片自身不重复触发）
const nowOffsetEl = document.getElementById('now-offset');
const nowCardTitle = nowOffsetEl && nowOffsetEl.closest('.card-title');
const nowCard = nowOffsetEl && nowOffsetEl.closest('.card');
if (nowCard) nowCard.classList.add('now-card');
const pauseBtn = document.getElementById('btn-pause');
if (pauseBtn) pauseBtn.addEventListener('click', (e) => e.stopPropagation());
if (nowCardTitle) {
  nowCardTitle.addEventListener('click', (e) => {
    if (e.target.closest('#btn-pause') || e.target.closest('.card-offset')) return;
    openTzOverlay(nowOffsetEl);
  });
}

function tzOvResultRow(v) {
  const cur = activeTz().replace(/^FIXED:/, '');
  const highClass = v === cur ? ' active' : '';
  return `<div class="tz-ov-result${highClass}" data-value="${escapeAttr(v)}" title="${escapeAttr(v)}"><span>${htmlEscape(v)}</span><span class="off">${currentOffsetStr(v)}</span></div>`;
}

function renderTzOvResults(query) {
  const q = String(query || '').trim();
  tzOvCandidates = filterIanaZones(q);
  if (!tzOvResultsEl) return;
  let html = '';
  if (tzOvCandidates.length === 0) {
    if (q && /^[A-Za-z]/.test(q)) {
      const cls = classifyIanaInput(q);
      if (cls.kind === 'resolvable') {
        html = `<div class="tz-ov-result" data-value="${escapeAttr(q)}" title="${escapeAttr(q)}"><span>${htmlEscape(q)}</span><span class="off">${t('tzOvAlias')}</span></div>`;
      }
    }
    if (!html) html = `<div class="tz-ov-result index">${t('tzOvEmpty')}</div>`;
  } else {
    html = tzOvCandidates.map(tzOvResultRow).join('');
  }
  tzOvResultsEl.innerHTML = html;
  tzOvActiveIdx = -1;
  tzOvResultsEl.querySelectorAll('.tz-ov-result[data-value]').forEach(row => {
    row.addEventListener('mousedown', (e) => { e.preventDefault(); applyOverride(row.dataset.value); });
  });
}

// 确保 select 中存在该值对应的 option（否则 select.value 读取返回 ''，覆盖静默失效）。
function ensureTzSelectOption(sel, value) {
  if (!sel || !value) return;
  if (Array.from(sel.options).some(o => o.value === value)) return;
  const o = document.createElement('option');
  o.value = value;
  o.textContent = value;
  sel.appendChild(o);
}

function applyOverride(value) {
  ensureTzSelectOption(inputTzEl, value);
  inputTzEl.value = value;
  inputTzCustom = true;
  closeTzOverlay();
  afterTzOverride();
}

function afterTzOverride() {
  updateDateToTsTitle();
  updateTsToDateTitle();
  renderConvert();
  renderReverse();
  lastUpdateTime = 0;
  updateNow();
  renderCalendar();
  renderOffsetChips();
}

function openTzOverlay(anchorEl) {
  const tz = activeTz();
  tzOvActiveIdx = -1;
  tzOvSearchEl.value = '';
  const offsetValue = offsetInputFromValue(tz) || '';
  tzOvOffsetEl.value = offsetValue;
  tzOvOffsetEl.classList.remove('invalid');
  
  // 初始化下拉选择框
  const tzOvSelect = document.getElementById('tz-ov-select');
  if (tzOvSelect) {
    tzOvSelect.value = offsetValue;
  }
  
  tzOvCurrentEl.textContent = tz;
  tzOvCurrentEl.title = tz;
  renderTzOvResults('');
  const r = anchorEl.getBoundingClientRect();
  const w = tzOverlay.offsetWidth || 260;
  const left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
  tzOverlay.style.left = left + 'px';
  // 如果是 now-offset（底部芯片），强制显示在芯片上方，避免被底部遮挡
  const isNowChip = anchorEl.id === 'now-offset';
  const top = isNowChip ? (r.top - tzOverlay.offsetHeight - 8) : (r.bottom + 6);
  tzOverlay.style.top = top + 'px';
  tzOverlay.classList.add('open');
  // 距离视口底部过近时上移，避免弹层溢出（uTools 面板高度固定）。
  const h = tzOverlay.offsetHeight || 300;
  const topMax = window.innerHeight - h - 8;
  if (parseFloat(tzOverlay.style.top) > topMax) tzOverlay.style.top = Math.max(8, topMax) + 'px';
  
  document.addEventListener('mousedown', tzOvOutside);
  tzOvSearchEl.focus();
}

function closeTzOverlay() {
  tzOverlay.classList.remove('open');
  document.removeEventListener('mousedown', tzOvOutside);
  tzOvActiveIdx = -1;
}

function tzOvOutside(e) {
  if (e.target.closest('#tz-overlay') || e.target.closest('.card-offset')) return;
  closeTzOverlay();
}

tzOvSearchEl.addEventListener('input', () => { renderTzOvResults(tzOvSearchEl.value); });
tzOvSearchEl.addEventListener('keydown', (e) => {
  if (e.isComposing || e.keyCode === 229) return;
  const rows = tzOvResultsEl.querySelectorAll('.tz-ov-result[data-value]');
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!rows.length) return;
    const dir = e.key === 'ArrowDown' ? 1 : -1;
    tzOvActiveIdx = tzOvActiveIdx < 0
      ? (dir > 0 ? 0 : rows.length - 1)
      : (tzOvActiveIdx + dir + rows.length) % rows.length;
    rows.forEach((r, i) => r.classList.toggle('highlight', i === tzOvActiveIdx));
    if (rows[tzOvActiveIdx]) rows[tzOvActiveIdx].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (tzOvActiveIdx >= 0 && rows[tzOvActiveIdx]) { applyOverride(rows[tzOvActiveIdx].dataset.value); return; }
    const raw = tzOvSearchEl.value.trim();
    const cls = classifyIanaInput(raw);
    if (cls.kind === 'canonical' || cls.kind === 'resolvable') applyOverride(cls.value);
    else if (raw) renderTzOvResults(raw);
  }
});

function commitTzOvOffset() {
  const tzOvSelect = document.getElementById('tz-ov-select');
  const offsetValue = tzOvSelect.value || tzOvOffsetEl.value;
  const mins = parseOffsetInput(offsetValue);
  if (mins === null) { tzOvOffsetEl.classList.add('invalid'); return; }
  applyOverride(minutesToFixedStr(mins));
}

const tzOvSelect = document.getElementById('tz-ov-select');
if (tzOvSelect) {
  tzOvSelect.addEventListener('change', () => {
    // 当下拉选择框有值时，填充到输入框
    if (tzOvSelect.value) {
      tzOvOffsetEl.value = tzOvSelect.value;
      tzOvOffsetEl.classList.remove('invalid');
    }
  });
}
tzOvOffsetEl.addEventListener('keydown', (e) => {
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    commitTzOvOffset();
  }
});
const tzOvApplyEl = document.getElementById('tz-ov-apply');
if (tzOvApplyEl) tzOvApplyEl.addEventListener('click', () => commitTzOvOffset());
tzOvOffsetEl.addEventListener('input', () => {
  // 当用户手动输入时，清除下拉选择框的选中状态
  if (tzOvSelect) tzOvSelect.value = '';
  tzOvOffsetEl.classList.remove('invalid');
  const v = tzOvOffsetEl.value.trim();
  tzOvOffsetEl.classList.toggle('invalid', v !== '' && parseOffsetInput(v) === null);
});

tzOvResetEl.addEventListener('click', () => {
  inputTzEl.value = timezoneEl.value || 'UTC';
  inputTzCustom = false;
  closeTzOverlay();
  afterTzOverride();
});

function updateTsToDateTitle() {
  const el = document.querySelector('[data-i18n="tsToDate"]');
  if (!el) return;
  const suffix = zoneTitleSuffix(activeTz(), inputTzCustom);
  el.textContent = lang === 'zh'
    ? `${t('tsToDate')}(${suffix})`
    : `${t('tsToDate')} (${suffix})`;
}

function updateDateToTsTitle() {
  const el = document.querySelector('[data-i18n="dateToTs"]');
  if (!el) return;
  const suffix = zoneTitleSuffix((inputTzEl && inputTzEl.value) || (timezoneEl && timezoneEl.value) || 'UTC', inputTzCustom);
  el.textContent = lang === 'zh'
    ? `${t('dateToTs')}(${suffix})`
    : `${t('dateToTs')} (${suffix})`;
}

function applyLang() {
  btnLang.textContent = lang === 'zh' ? 'EN' : '中';
  if (document.documentElement) document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  
  // 保存当前时区值
  const savedTzValue = timezoneEl.value;
  const savedInputTzValue = inputTzEl.value;
  
  // 按UTC偏移量排序时区
  const sortedTimezones = [...TIMEZONES].sort((a, b) => {
    return offsetMinutes(new Date(), a.value) - offsetMinutes(new Date(), b.value);
  });
  
  const off = (v) => currentOffsetStr(v);
  const cityOf = (z) => lang === 'zh' ? z.label.split(/[／（( ]/)[0] : z.labelEn;
  const utcName = () => lang === 'zh' ? '世界协调时' : 'Coordinated Universal Time';
  timezoneEl.innerHTML = sortedTimezones.map((z) => {
    const abbr = zoneAliases(z).slice(0, 1).join('');
    const name = z.value === 'UTC' ? utcName() : cityOf(z);
    const abbrPart = z.value === 'UTC' ? 'UTC' : abbr;
    const text = `${htmlEscape(name)}${abbrPart ? ` (${htmlEscape(abbrPart)})` : ''} ${off(z.value)}`;
    return `<option value="${escapeAttr(z.value)}">${text}</option>`;
  }).join('');
  
  // 首次加载时默认选中本地时区（innerHTML 赋值后 select 会自动选中第一个 option，需显式覆盖）
  // 非首次加载时恢复之前保存的时区值
  if (!tzInitApplied) {
    timezoneEl.value = guessLocalTzName() || 'Asia/Shanghai';
    tzInitApplied = true;
  } else {
    timezoneEl.value = savedTzValue;
    // 如果保存的时区不在选项中（如自定义时区），回退到本地时区
    if (timezoneEl.value !== savedTzValue) {
      timezoneEl.value = guessLocalTzName() || 'Asia/Shanghai';
    }
  }
  
  inputTzEl.innerHTML = sortedTimezones.map((z) => {
    const abbr = zoneAliases(z).slice(0, 1).join('');
    const name = z.value === 'UTC' ? utcName() : (lang === 'zh' ? z.label : z.labelEn);
    const abbrPart = z.value === 'UTC' ? 'UTC' : abbr;
    const text = `${htmlEscape(name)}${abbrPart ? ` (${htmlEscape(abbrPart)})` : ''} ${off(z.value)}`;
    return `<option value="${escapeAttr(z.value)}" title="${escapeAttr(text)}">${text}</option>`;
  }).join('');
  inputTzEl.title = lang === 'zh' ? '输入时区：日期按此时区解析' : 'Input timezone: dates parsed in this zone';
  // 保持输入时区不变
  // 若覆盖值不在全局列表中（如弹层选的任意 IANA 或 FIXED），重建时会被丢选项 → 补回并保持选中
  if (savedInputTzValue && !Array.from(inputTzEl.options).some(o => o.value === savedInputTzValue)) {
    const o = document.createElement('option');
    o.value = savedInputTzValue;
    o.textContent = savedInputTzValue;
    inputTzEl.appendChild(o);
  }
  inputTzEl.value = savedInputTzValue;
  if (!inputTzCustom && inputTzEl.value !== timezoneEl.value) {
    inputTzEl.value = timezoneEl.value;
  }
  btnPause.textContent = paused ? t('resume') : t('pause');
  if (currentTab === 'sec') {
    tsInput.placeholder = t('tsPlaceholderSec');
  } else if (currentTab === 'ms') {
    tsInput.placeholder = t('tsPlaceholderMs');
  } else if (currentTab === 'us') {
    tsInput.placeholder = t('tsPlaceholderUs');
  } else if (currentTab === 'ns') {
    tsInput.placeholder = t('tsPlaceholderNs');
  }
  updateTsToDateTitle();
  updateDateToTsTitle();
  updatePrecisionIndicators();
  dateInput.placeholder = t('datePlaceholder');
  timeInputEl.placeholder = t('timePlaceholder');
  updateFracInput();
  if (tzSearchEl) tzSearchEl.placeholder = t('tzSearchPlaceholder');
  if (tzOvSearchEl) tzOvSearchEl.placeholder = t('tzSearchPlaceholder');
  if (tzOvOffsetEl) tzOvOffsetEl.placeholder = t('tzOvOffsetPh');
  $('#cal-now').textContent = t('now');
  $('#cal-ok').textContent = t('ok');
  const weekNames = lang === 'zh'
    ? { Su: '日', Mo: '一', Tu: '二', We: '三', Th: '四', Fr: '五', Sa: '六' }
    : { Su: 'Su', Mo: 'Mo', Tu: 'Tu', We: 'We', Th: 'Th', Fr: 'Fr', Sa: 'Sa' };
  document.querySelectorAll('.cal-week span').forEach((el) => { el.textContent = weekNames[el.dataset.w] || el.textContent; });
  renderCalendar();
  renderOffsetChips();
  // 语言切换可能发生在弹层打开时：同步刷新结果/空态文案
  if (tzOverlay && tzOverlay.classList.contains('open') && tzOvSearchEl) renderTzOvResults(tzOvSearchEl.value);
}

// 仅刷新「现在」芯片：updateNow 每 50ms 运行，避免整体重渲染；仅当偏移文本变化时写 DOM。
function refreshNowChip() {
  const el = document.getElementById('now-offset');
  if (!el) return;
  const tz = activeTz();
  const txt = offsetChipText(tz, new Date());
  if (el.textContent !== txt) {
    setOffsetChip(el, tz, new Date());
  }
}
