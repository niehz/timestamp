// ========================================================
// js/calendar.js — 日历、时间滚轮、通用视图工具、实时时钟
// Extracted from index.js (lines 1807-2325) by
// dev/scripts/split.mjs. Loaded from index.html in this order:
// core → datetime → fields → calendar → convert → tzselector → events
// ========================================================

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
      let y = +yOnly[1];
      if (y < 1) return; // 0 年不存在：new Date(0,0,1) 会被 JS 映射成 1900，直接拒绝
      if (y >= 1 && y <= 99) y += 1900; // 二位年份按 19xx 理解（如 99 → 1999）
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
  let raw = calYearInputEl.value.trim();
  if (!raw) { renderCalendar(); return; }
  const yearOnly = raw.match(/^(\d{1,4})$/);
  if (yearOnly) {
    let y = +yearOnly[1];
    if (y < 1) { calYearInputEl.classList.add('err-jump'); calYearInputEl.value = ''; toast(t('outOfTsRange')); return; } // 0 年：JS 会映射成 1900
    if (y >= 1 && y <= 99) y += 1900; // 二位年份按 19xx 理解（如 99 → 1999）
    if (!validate(new Date(y, 0, 1).getTime()) || !validate(new Date(y, 11, 31, 23, 59, 59, 999).getTime())) { calYearInputEl.classList.add('err-jump'); calYearInputEl.value = ''; toast(t('outOfTsRange')); return; }
    calYear = y;
    calMonth = calSelected && calSelected.y === y ? calSelected.mo : 0;
    calSelected = { y, mo: calMonth, d: clampDayInMonth(y, calMonth, calSelected ? calSelected.d : 1) };
    calDecadeStart = Math.floor(y / 10) * 10;
    calView = 'day';
    renderTimeWheels();
    renderCalendar();
    renderConvert();
    return;
  }
  const p = parseDate(raw);
  if (!p || p.kind !== 'date') { calYearInputEl.classList.add('err-jump'); calYearInputEl.value = ''; toast(t('invalidYear')); return; }
  const y = p.y;
  const dt = new Date(y, 0, 1);
  const start = dt.getTime();
  const endMs = new Date(y, 11, 31, 23, 59, 59, 999).getTime();
  if (!validate(start) || !validate(endMs)) { calYearInputEl.classList.add('err-jump'); calYearInputEl.value = ''; toast(t('outOfTsRange')); return; }
  calYear = y;
  if (!/^\d{4}$/.test(raw)) {
    const mo = p.mo - 1;
    const d = clampDayInMonth(y, mo, p.d || (calSelected ? calSelected.d : 1));
    calMonth = mo;
    calSelected = { y, mo, d };
    calTime.hh = p.h; calTime.mm = p.mi; calTime.ss = p.se;
    setDateFields(y, mo + 1, d, p.h, p.mi, p.se, 0, 0, 0);
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
  renderCalendar();
}

function openCalendar() {
  hideSuggestions();
  calView = 'day';
  const now = new Date();
  const isEmpty = !dateInput.value.trim() && !timeInputEl.value.trim() && !fracInputEl.value.trim();
  if (isEmpty) {
    calYear = now.getFullYear(); calMonth = now.getMonth();
    calSelected = { y: now.getFullYear(), mo: now.getMonth(), d: now.getDate() };
    calDecadeStart = Math.floor(now.getFullYear() / 10) * 10;
    calTime = { hh: now.getHours(), mm: now.getMinutes(), ss: now.getSeconds(), ms: now.getMilliseconds(), us: Math.floor(Math.random() * 1000), ns: Math.floor(Math.random() * 1000) };
  } else {
    const parsed = parseDate(dateInput.value);
    if (parsed && parsed.kind === 'date') {
      calYear = parsed.y; calMonth = parsed.mo - 1;
      calSelected = { y: parsed.y, mo: parsed.mo - 1, d: parsed.d };
    } else {
      calSelected = null;
    }
    calTime = { hh: now.getHours(), mm: now.getMinutes(), ss: now.getSeconds(), ms: now.getMilliseconds(), us: Math.floor(Math.random() * 1000), ns: Math.floor(Math.random() * 1000) };
    const tm = timeInputEl.value.trim().match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.(\d{1,9}))?)?$/);
    if (tm) {
      calTime.hh = Math.min(23, +tm[1]); calTime.mm = Math.min(59, +tm[2]);
      calTime.ss = tm[3] != null ? Math.min(59, +tm[3]) : 0;
      if (tm[4]) {
        const f = tm[4].padEnd(9, '0').slice(0, 9);
        calTime.ms = +f.slice(0, 3); calTime.us = +f.slice(3, 6); calTime.ns = +f.slice(6, 9);
      }
    }
    const fT = fracInputEl.value.trim();
    if (/^\d{1,9}$/.test(fT)) {
      const p = fracToParts(fT, 9);
      calTime.ms = p.ms; calTime.us = p.us; calTime.ns = p.ns;
    }
  }
  renderTimeWheels();
  renderCalendar();
  calendarEl.classList.add('open');
  syncTimeInput();
  }

function closeCalendar() { calendarEl.classList.remove('open'); }

const WHEEL_H = 44;
const WHEEL_VIEW = 128; // 与 CSS .wheel 高度一致

function renderTimeWheels() {
  const isMsTab = currentTab === 'ms';
  const isUsTab = currentTab === 'us';
  const isNsTab = currentTab === 'ns';
  const showMs = (isMsTab || isUsTab || isNsTab) && precisionGe('ms');
  const showUs = (isUsTab || isNsTab) && precisionGe('us');
  const showNs = isNsTab && precisionGe('ns');
  wheelMs.style.display = showMs ? '' : 'none';
  const msCol = wheelMs.parentNode;
  if (msCol) msCol.style.display = showMs ? '' : 'none';
  wheelUs.style.display = showUs ? '' : 'none';
  const usCol = wheelUs.parentNode;
  if (usCol) usCol.style.display = showUs ? '' : 'none';
  wheelNs.style.display = showNs ? '' : 'none';
  const nsCol = wheelNs.parentNode;
  if (nsCol) nsCol.style.display = showNs ? '' : 'none';
  buildWheel(wheelHh, 24, calTime.hh, (v) => { calTime.hh = v; applyWheelTime(); });
  buildWheel(wheelMm, 60, calTime.mm, (v) => { calTime.mm = v; applyWheelTime(); });
  buildWheel(wheelSs, 60, calTime.ss, (v) => { calTime.ss = v; applyWheelTime(); });
  buildWheel(wheelMs, 1000, calTime.ms, (v) => { calTime.ms = v; applyWheelTime(); });
  if (showUs) buildWheel(wheelUs, 1000, calTime.us, (v) => { calTime.us = v; applyWheelTime(); });
  if (showNs) buildWheel(wheelNs, 1000, calTime.ns, (v) => { calTime.ns = v; applyWheelTime(); });
  if (!skipTimeSync) syncTimeInput();
}

function syncTimeInput() {
  const t = calTime;
  const base = `${pad(t.hh)}:${pad(t.mm)}:${pad(t.ss)}`;
  const msStr = String(t.ms).padStart(3, '0');
  if (currentTab === 'ms') {
    calTimeInputEl.value = `${base}.${msStr}`;
  } else if (currentTab === 'us') {
    calTimeInputEl.value = `${base}.${msStr}${String(t.us).padStart(3, '0')}`;
  } else if (currentTab === 'ns') {
    calTimeInputEl.value = `${base}.${msStr}${String(t.us).padStart(3, '0')}${String(t.ns).padStart(3, '0')}`;
  } else {
    calTimeInputEl.value = base;
  }
}

function followTimeInput() {
  const raw = calTimeInputEl.value.trim();
  if (!raw) { renderTimeWheels(); return; }
  const parts = raw.split(':');
  const hh = +parts[0] || 0;
  const readFrac = (seg) => {
    const sp = seg.split('.');
    const frac = sp[1] ? sp[1].padEnd(9, '0').slice(0, 9) : '000000000';
    return {
      int: +sp[0] || 0,
      ms: +frac.slice(0, 3),
      us: +frac.slice(3, 6),
      ns: +frac.slice(6, 9),
    };
  };
  let mm = 0, ss = 0, ms = 0, us = 0, ns = 0;
  if (parts[1]) { const r = readFrac(parts[1]); mm = r.int; ms = r.ms; us = r.us; ns = r.ns; }
  if (parts[2]) { const r = readFrac(parts[2]); ss = r.int; ms = r.ms; us = r.us; ns = r.ns; }
  if (hh > 23 || mm > 59 || ss > 59) return;
  calTime.hh = hh; calTime.mm = mm; calTime.ss = ss; calTime.ms = ms; calTime.us = us; calTime.ns = ns;
  skipTimeSync = true;
  try {
    renderTimeWheels();
    applyWheelTime();
  } finally {
    skipTimeSync = false;
  }
}

function applyWheelTime() {
  if (!skipTimeSync) syncTimeInput();
}

function clampWheel(i, max) { return i < 0 ? 0 : (i > max ? max : i); }

function highlightWheel(el, idx) {
  Array.prototype.forEach.call(el.children, (c, i) => {
    c.classList.toggle('sel', i === idx);
  });
}

function wheelIndexFromScrollTop(el) {
  const step = el._step || WHEEL_H;
  const calculatedIndex = Math.round(el.scrollTop / step);
  const clampedIndex = clampWheel(calculatedIndex, el.children.length - 1);
  return clampedIndex;
}

function selectWheelValue(el, i, onChange, step) {
  const s = step || el._step || WHEEL_H;
  el._sel = i;
  el.scrollTop = i * s;
  highlightWheel(el, i);
  if (onChange) onChange(i);
}

function buildWheel(el, count, cur, onChange) {
  el.innerHTML = '';
  const viewH = el.clientHeight || WHEEL_VIEW;
  const pad = (viewH - WHEEL_H) / 2;
  el.style.paddingTop = pad + 'px';
  el.style.paddingBottom = pad + 'px';
  const digits = count > 99 ? 3 : 2;
  for (let i = 0; i < count; i++) {
    const it = document.createElement('div');
    it.className = 'wheel-item';
    it.textContent = String(i).padStart(digits, '0');
    it.addEventListener('click', (e) => { e.stopPropagation(); selectWheelValue(el, i, onChange); });
    el.appendChild(it);
  }
  el._sel = clampWheel(cur, count - 1);
  el._step = WHEEL_H;
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
  return Number.isFinite(ms) && ms >= SAFE_MIN && ms <= SAFE_MAX;
}

function t(keys) {
  return keys.split('.').reduce((o, k) => o[k], I18N[lang]);
}

function debounce(fn, ms) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 1300);
}

function copyText(text, btn) {
  const flip = () => {
    if (btn) {
      const old = btn.textContent;
      btn.textContent = t('copied');
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = old; btn.classList.remove('copied'); }, 900);
    }
  };
  const done = () => { toast(t('copiedMsg')); flip(); };
  const fail = () => toast(t('copyFailedMsg'));
  if (window.utools) {
    // preload 中 utools.copyText 是异步 ipcRenderer.invoke：同步 try/catch 捕不到 IPC 失败，
    // 桌面壳拷贝失败会被错误提示成功，须按其返回的 Promise 处理。
    const result = utools.copyText(String(text));
    if (result && typeof result.then === 'function') {
      result.then(done).catch(fail);
    } else {
      done();
    }
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(String(text)).then(done, fail);
  } else {
    fail();
  }
}

function updateNow() {
  if (paused) return;
  
  const now = Date.now();
  const currentRealTime = now;
  
  // 模拟毫秒快速滚动：在当前秒内，毫秒从000快速滚动到999
  // 基于当前秒内的真实时间比例计算显示的毫秒
  const secondProgress = (currentRealTime % 1000) / 1000; // 0.0 到 1.0
  const simulatedMs = Math.floor(secondProgress * 1000); // 0 到 999
  
  // 如果是第一次更新或者距离上次更新超过5秒，重新校准时间
  if (lastUpdateTime === 0 || now - lastUpdateTime > 5000) {
    lastNow = new Date();
    lastSec = Math.floor(currentRealTime / 1000);
    lastMs = currentRealTime;
    lastUpdateTime = now;
  } else {
    // 获取当前的真实秒数
    const currentSec = Math.floor(currentRealTime / 1000);
    
    // 更新秒数
    if (currentSec !== lastSec) {
      lastSec = currentSec;
    }
    
    lastMs = lastSec * 1000 + simulatedMs;
    lastUpdateTime = now;
  }
  
  // 微秒/纳秒秒后部分：默认由当前毫秒推算（与毫秒显示一致），或按配置改为随机
  let usTail = String(simulatedMs * 1000).padStart(6, '0');
  let nsTail = String(simulatedMs * 1000000).padStart(9, '0');
  if (SYS_SETTINGS.usNsMode === 'random') {
    usTail = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    nsTail = String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
  }
  const simulatedUs = lastSec.toString() + usTail;
  const simulatedNs = lastSec.toString() + nsTail;
  
  // 更新显示
  const displayDate = new Date(lastMs);
  const nowLocalStr = formatTz(displayDate, activeTz());
  nowDateEl.textContent = nowLocalStr;
  nowDateEl.title = nowLocalStr;
  nowSecEl.textContent = lastSec;
  nowMsEl.textContent = lastMs;
  nowUsEl.textContent = simulatedUs.toString();
  nowNsEl.textContent = simulatedNs.toString();
  nowSecEl.title = String(lastSec);
  nowMsEl.title = String(lastMs);
  nowUsEl.title = simulatedUs.toString();
  nowNsEl.title = simulatedNs.toString();
  
  // 同步「现在」偏移芯片（DST 边界或长暂停后可能过期）
  if (typeof refreshNowChip === 'function') refreshNowChip();
}
