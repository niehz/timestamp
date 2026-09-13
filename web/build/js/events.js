// ========================================================
// js/events.js — 全局事件绑定、剪贴板/滚动条、启动引导
// Extracted from index.js (lines 3686-4053) by
// dev/scripts/split.mjs. Loaded from index.html in this order:
// core → datetime → fields → calendar → convert → tzselector → events
// ========================================================

function toggleLang() { lang = lang === 'zh' ? 'en' : 'zh'; applyLang(); renderConvert(); renderReverse(); if (window.tsShell) window.tsShell.setSettings({ uiLang: lang }); }

function setAppLang(l) {
  const target = l === 'en' ? 'en' : 'zh';
  if (lang === target) return;
  lang = target;
  applyLang();
  renderConvert();
  renderReverse();
  if (window.tsShell) window.tsShell.setSettings({ uiLang: lang });
}

timezoneEl.addEventListener('change', () => { 
  if (!inputTzCustom) {
    inputTzEl.value = timezoneEl.value;
    inputTzEl.dispatchEvent(new Event('change'));
  }
  updateDateToTsTitle();
  updateTsToDateTitle();
  renderConvert(); 
  renderReverse(); 
  // 时区变化时重新校准时间
  if (typeof renderOffsetChips === 'function') renderOffsetChips();
  lastUpdateTime = 0;
  updateNow(); 
  renderCalendar(); 
});
// —— 输入清洗：时间戳仅允许数字与开头负号；日期/时间剥离千分位逗号等粘贴噪音 ——
function insertSanitized(el, value) {
  const start = el.selectionStart != null ? el.selectionStart : el.value.length;
  const end = el.selectionEnd != null ? el.selectionEnd : el.value.length;
  el.value = el.value.slice(0, start) + value + el.value.slice(end);
  const pos = start + value.length;
  try { el.setSelectionRange(pos, pos); } catch (e) {}
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
function bindPasteFilter(el, clean) {
  el.addEventListener('paste', (e) => {
    const text = e.clipboardData && e.clipboardData.getData('text');
    if (!text) return;
    const cleaned = clean(text);
    if (cleaned !== text) {
      e.preventDefault();
      insertSanitized(el, cleaned);
    }
  });
}
function bindInputFilter(el, clean) {
  el.addEventListener('input', () => {
    const cleaned = clean(el.value);
    if (cleaned === el.value) return;
    const pos = Math.min(el.selectionStart ?? el.value.length, cleaned.length);
    el.value = cleaned;
    try { el.setSelectionRange(pos, pos); } catch (e) {}
  });
}
bindPasteFilter(dateInput, stripSeparators);
bindInputFilter(dateInput, stripSeparators);
bindPasteFilter(timeInputEl, stripSeparators);
bindInputFilter(timeInputEl, stripSeparators);
bindPasteFilter(calTimeInputEl, stripSeparators);
bindInputFilter(calTimeInputEl, stripSeparators);
bindPasteFilter(calYearInputEl, stripSeparators);
bindInputFilter(calYearInputEl, stripSeparators);
// 时间戳输入上限：符号 + 最多 19 位纳秒（超长无合法含义，截断并提示）
const MAX_TS_LEN = 20;
function cleanTsInput(raw) {
  const cleaned = stripTsNoise(raw);
  if (cleaned.length > MAX_TS_LEN) {
    toast(lang === 'zh' ? '时间戳过长，已截断' : 'Timestamp too long, truncated');
    return cleaned.slice(0, MAX_TS_LEN);
  }
  return cleaned;
}
bindPasteFilter(tsInput, cleanTsInput);
bindInputFilter(tsInput, cleanTsInput);
tsInput.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length !== 1) return;
  if (e.key === '-') {
    const v = tsInput.value;
    const sel = e.target.selectionStart != null ? e.target.selectionStart : 0;
    if (!(sel === 0 && (!v.startsWith('-') || v.charAt(0) === '-'))) e.preventDefault();
    return;
  }
  if (!/\d/.test(e.key)) e.preventDefault();
});
dateInput.addEventListener('input', () => { renderConvert(); showSuggestions(); syncClearBtns(); });
dateInput.addEventListener('focus', () => { calendarEl.classList.remove('open'); showSuggestions(); });
dateInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { renderConvert(); hideSuggestions(); calendarEl.classList.remove('open'); }
});
timeInputEl.addEventListener('input', () => { renderConvert(); syncClearBtns(); });
fracInputEl.addEventListener('input', () => { renderConvert(); syncClearBtns(); });
tsInput.addEventListener('input', () => { renderReverse(); syncClearBtns(); });
tsInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') renderReverse(); });

// 全局 ESC 分发（捕获阶段，最内层优先逐级回退；主页无弹层时才退出 uTools）
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (dateParseSearchEl && e.target === dateParseSearchEl && dateParseSearchEl.value.trim()) return; // 日期解析搜索框：先清空，再 ESC 关弹窗
  const ianaAc = document.querySelector('.iana-ac');
  if (ianaAc && ianaAc.style.display === 'block') { closeIanaAc(); e.preventDefault(); e.stopPropagation(); return; }
  if (calendarEl.classList.contains('open')) { closeCalendar(); e.preventDefault(); e.stopPropagation(); return; }
  if (tzOverlay.classList.contains('open')) { closeTzOverlay(); e.preventDefault(); e.stopPropagation(); return; }
  const donateModal = document.getElementById('donate-modal');
  if (donateModal && donateModal.classList.contains('show')) { donateModal.classList.remove('show'); e.preventDefault(); e.stopPropagation(); return; }
  if (tzConfigModal.classList.contains('show')) { tzConfigModal.classList.remove('show'); e.preventDefault(); e.stopPropagation(); return; }
  if (dateSuggestEl.classList.contains('open')) { hideSuggestions(); e.preventDefault(); e.stopPropagation(); return; }
  const ae = document.activeElement;
  if (!(ae && ae.tagName === 'SELECT')) {
    if (window.utools) utools.outPlugin();
  }
  e.stopPropagation();
}, true);

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
$('#cal-year-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); jumpToYearInput(); } });
$('#cal-year-input').addEventListener('focus', () => calYearInputEl.classList.remove('err-jump'));
calTimeInputEl.addEventListener('input', followTimeInput);
calTimeInputEl.addEventListener('focus', syncTimeInput);
calendarEl.addEventListener('click', (e) => {
  const z = e.target.closest('.wheel-zero');
  if (!z) return;
  e.stopPropagation();
  const k = z.dataset.wheel;
  const map = { hh: 'hh', mm: 'mm', ss: 'ss', ms: 'ms', us: 'us', ns: 'ns' };
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
  calTime.us = Math.floor(Math.random() * 1000);
  calTime.ns = Math.floor(Math.random() * 1000);
  setDateFields(calYear, calMonth + 1, calSelected.d, calTime.hh, calTime.mm, calTime.ss, calTime.ms, calTime.us, calTime.ns);
  renderTimeWheels();
  renderCalendar(); renderConvert();
});
$('#cal-ok').addEventListener('click', (e) => {
  e.stopPropagation();
  if (calSelected) {
    setDateFields(calSelected.y, calSelected.mo + 1, calSelected.d,
      calTime.hh, calTime.mm, calTime.ss, calTime.ms, calTime.us, calTime.ns);
  }
  renderConvert();
  closeCalendar();
});

dateSuggestEl.addEventListener('click', (e) => {
  const item = e.target.closest('.sg-item');
  if (!item) return;
  hideSuggestions();
  if (item.dataset.month) {
    applyFullDateStr(item.dataset.date);
    const [y, mo0] = item.dataset.month.split('-').map(Number);
    calSelected = { y, mo: mo0, d: parseInt(item.dataset.date.slice(8, 10)) };
    setCalendarMonth(y, mo0);
    openCalendar();
    return;
  }
  const pe = parseDateEx(dateInput.value.trim());
  const wallStr = peWallStr(pe, inputTzEl.value || timezoneEl.value);
  if (pe && (pe.mode === 'abs' || wallStr === item.dataset.date)) {
    applyParsedToFields(pe);
  } else {
    applyFullDateStr(item.dataset.date);
  }
  renderConvert();
});

if (btnDateClear) {
  btnDateClear.addEventListener('click', () => {
    dateInput.value = '';
    timeInputEl.value = '';
    fracInputEl.value = '';
    hideSuggestions();
    calendarEl.classList.remove('open');
    syncClearBtns();
    renderConvert();
    dateInput.focus();
  });
}
if (btnTsClear) {
  btnTsClear.addEventListener('click', () => {
    tsInput.value = '';
    syncClearBtns();
    renderReverse();
    tsInput.focus();
  });
}

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
  if (e.target.closest('.t2d-popover, .d2t-ambig-popover')) return;
  const block = e.target.closest('.result-block');
  if (block) {
    const val = block.querySelector('.result-value');
    if (val && val.dataset.value) copyText(val.textContent.trim(), null);
    return;
  }
  const item = e.target.closest('.now-item.clickable');
  if (item) { copyText(item.querySelector('.now-value').textContent, null); return; }
});

let popoverHideTimer = null;
function hideT2dPopover() {
  clearTimeout(popoverHideTimer);
  t2dResultEl.classList.remove('show-popover');
}
t2dResultEl.addEventListener('mouseenter', () => {
  clearTimeout(popoverHideTimer);
  if (currentT2dMs() === null) return;
  renderT2dPopover();
  t2dResultEl.classList.add('show-popover');
});
t2dResultEl.addEventListener('mouseleave', () => {
  clearTimeout(popoverHideTimer);
  popoverHideTimer = setTimeout(() => t2dResultEl.classList.remove('show-popover'), 180);
});
t2dPopoverEl.addEventListener('mouseenter', () => {
  clearTimeout(popoverHideTimer);
});
t2dPopoverEl.addEventListener('click', (e) => {
  const item = e.target.closest('.t2d-pop-item');
  if (!item) return;
  copyText(item.dataset.value, null);
  hideT2dPopover();
});

// —— D2T 歧义候选浮层：悬停展示两个瞬时，点击选择其一（结构/交互镜像 t2d 浮层） ——
let ambigPopoverHideTimer = null;
function hideAmbigPopover() {
  clearTimeout(ambigPopoverHideTimer);
  if (d2tResultEl) d2tResultEl.classList.remove('show-ambig');
}
if (d2tResultEl) {
  d2tResultEl.addEventListener('mouseenter', () => {
    clearTimeout(ambigPopoverHideTimer);
    if (typeof renderAmbigPopover === 'function') renderAmbigPopover();
    if (d2tResultEl.classList.contains('ambig')) d2tResultEl.classList.add('show-ambig');
  });
  d2tResultEl.addEventListener('mouseleave', () => {
    clearTimeout(ambigPopoverHideTimer);
    ambigPopoverHideTimer = setTimeout(() => d2tResultEl.classList.remove('show-ambig'), 180);
  });
}
if (d2tAmbigPopoverEl) {
  d2tAmbigPopoverEl.addEventListener('mouseenter', () => {
    clearTimeout(ambigPopoverHideTimer);
  });
  d2tAmbigPopoverEl.addEventListener('click', (e) => {
    const item = e.target.closest('.d2t-ambig-pop-item');
    if (!item) return;
    if (typeof selectD2tCandidate === 'function') selectD2tCandidate(Number(item.dataset.ms));
    hideAmbigPopover();
  });
}

const buildTagEl = $('#build-tag');
if (buildTagEl) buildTagEl.textContent = BUILD;

// 自定义滚动条：隐藏原生白条，使用自绘深色滚动条（兼容 utools WebView 等不识别 -webkit-scrollbar 的环境）
const csbList = [];
function setupCsb(scrollEl) {
  if (!scrollEl || scrollEl.__csb) return;
  scrollEl.__csb = true;
  const track = document.createElement('div');
  track.className = 'csb';
  track.innerHTML = '<div class="csb-thumb"></div>';
  scrollEl.insertBefore(track, scrollEl.firstChild);
  const thumb = track.firstElementChild;
  const csb = { el: scrollEl, track, thumb, last: '' };
  csbList.push(csb);
  const sync = () => {
    const contentH = scrollEl.scrollHeight, viewH = scrollEl.clientHeight;
    const scrollTop = scrollEl.scrollTop;
    const key = contentH + '|' + viewH + '|' + Math.round(scrollTop / 2);
    if (key === csb.last) return;
    csb.last = key;
    if (contentH <= viewH + 1 || viewH <= 0) {
      track.classList.remove('show');
      thumb.style.height = '0px';
      thumb.style.top = '0px';
      return;
    }
    track.classList.add('show');
    const trackH = Math.max(20, viewH - 4);
    const thumbH = Math.max(20, trackH * viewH / contentH);
    const maxScroll = contentH - viewH;
    thumb.style.height = thumbH + 'px';
    const maxTop = Math.max(0, trackH - thumbH);
    thumb.style.top = (maxScroll > 0 ? Math.min(maxTop, trackH * scrollTop / maxScroll) : 0) + 'px';
  };
  csb.sync = sync;
  scrollEl.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  let dragging = null;
  thumb.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragging = { startY: e.clientY, startTop: scrollEl.scrollTop };
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
    if (maxScroll <= 0) return;
    const trackH = Math.max(20, scrollEl.clientHeight - 4);
    const thumbH = Math.max(20, thumb.offsetHeight);
    const ratio = (e.clientY - dragging.startY) / ((trackH - thumbH) || 1);
    scrollEl.scrollTop = dragging.startTop + ratio * maxScroll;
  });
  document.addEventListener('mouseup', () => { dragging = null; });
  new MutationObserver(() => requestAnimationFrame(sync)).observe(scrollEl, { childList: true, subtree: true });
  sync();
}
function setupCsbAbs(scrollEl, host) {
  if (!scrollEl || scrollEl.__csb) return;
  scrollEl.__csb = true;
  const track = document.createElement('div');
  track.className = 'csb-abs';
  track.innerHTML = '<div class="csb-thumb"></div>';
  host.appendChild(track);
  const thumb = track.firstElementChild;
  const csb = { el: scrollEl, track, thumb, host, last: '' };
  csbList.push(csb);
  const sync = () => {
    const contentH = scrollEl.scrollHeight, viewH = scrollEl.clientHeight;
    const scrollTop = scrollEl.scrollTop;
    const r = scrollEl.getBoundingClientRect();
    const top = Math.round(r.top - host.getBoundingClientRect().top);
    const key = contentH + '|' + viewH + '|' + Math.round(scrollTop / 2) + '|' + top;
    if (key === csb.last) return;
    csb.last = key;
    const trackH = Math.max(20, viewH - 4);
    track.style.top = (top + 2) + 'px';
    track.style.height = trackH + 'px';
    if (contentH <= viewH + 1 || viewH <= 0) {
      track.classList.remove('show');
      thumb.style.height = '0px';
      thumb.style.top = '0px';
      return;
    }
    track.classList.add('show');
    const thumbH = Math.max(20, trackH * viewH / contentH);
    const maxScroll = contentH - viewH;
    thumb.style.height = thumbH + 'px';
    const maxTop = Math.max(0, trackH - thumbH);
    thumb.style.top = (maxScroll > 0 ? Math.min(maxTop, trackH * scrollTop / maxScroll) : 0) + 'px';
  };
  csb.sync = sync;
  scrollEl.addEventListener('scroll', sync, { passive: true });
  host.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  let dragging = null;
  thumb.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragging = { startY: e.clientY, startTop: scrollEl.scrollTop };
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
    if (maxScroll <= 0) return;
    const trackH = Math.max(20, scrollEl.clientHeight - 4);
    const thumbH = Math.max(20, thumb.offsetHeight);
    const ratio = (e.clientY - dragging.startY) / ((trackH - thumbH) || 1);
    scrollEl.scrollTop = dragging.startTop + ratio * maxScroll;
  });
  document.addEventListener('mouseup', () => { dragging = null; });
  new MutationObserver(() => requestAnimationFrame(sync)).observe(scrollEl, { childList: true, subtree: true });
  sync();
}
function initCsb() {
  const appHost = document.querySelector('.app');
  document.querySelectorAll('.timezone-list-container').forEach(setupCsb);
  document.querySelectorAll('.modal-body').forEach((el) => {
    const host = el.closest('.modal-content') || appHost;
    setupCsbAbs(el, host);
  });
  document.querySelectorAll('.main-grid').forEach((el) => setupCsbAbs(el, appHost));
  document.querySelectorAll('.modal').forEach((m) => {
    new MutationObserver(() => {
      for (const c of csbList) c.last = '';
      requestAnimationFrame(() => csbList.forEach((c) => { c.last = ''; c.sync(); }));
    }).observe(m, { attributes: true, attributeFilter: ['class'] });
  });
  document.querySelectorAll('.config-pane').forEach((p) => {
    new MutationObserver(() => {
      for (const c of csbList) c.last = '';
      requestAnimationFrame(() => csbList.forEach((c) => { c.last = ''; c.sync(); }));
    }).observe(p, { attributes: true, attributeFilter: ['class'] });
  });
}

initTzConfig();
initSysConfig();
initDateParseConfig();
renderDateFormatList();
applyLang();
applyTheme();
initThemeWatcher();
switchTab(SYS_SETTINGS.defaultTab);
updatePrecisionIndicators();
updateNow();
initTimestampInput();
initCsb();

if (window.utools) {
  utools.onPluginEnter(({ payload }) => {
    const p = payload && payload.trim();
    if (!p) { initTimestampInput(); tsInput.focus(); return; }
    if (/^\d{19}$/.test(p)) { switchTab('ns'); tsInput.value = p; renderReverse(); }
    else if (/^\d{16}$/.test(p)) { switchTab('us'); tsInput.value = p; renderReverse(); }
    else if (/^\d{13}$/.test(p)) { switchTab('ms'); tsInput.value = p; renderReverse(); }
    else if (/^\d{10}$/.test(p)) { switchTab('sec'); tsInput.value = p; renderReverse(); }
    else {
      const pe = parseDateEx(p);
      if (pe) {
        applyParsedToFields(pe);
        timeInputEl.focus();
        renderConvert();
      } else {
        initTimestampInput();
      }
    }
    tsInput.focus();
  });
  try { utools.setExpendHeight(560); } catch (e) {}
}

// 延迟初始化双滚轮时区选择器，避免阻塞（uTools 与浏览器直接打开均可用）
setTimeout(() => {
  try {
    initCustomTzSelector();
  } catch (error) {
  }
}, 100);

// 每50ms更新一次，实现更流畅的毫秒滚动效果
setInterval(updateNow, 50);

// —— 桌面壳 (tsShell) 扩展：快捷键设置区块 / 语言双向联动 / 呼出聚焦 ——
// uTools 环境无 tsShell 整块跳过；依赖 applyLang/setAppLang/t/toast/tsInput/initTimestampInput
if (window.tsShell) {
  const paneEl = document.getElementById('pane-sys');
  if (paneEl && !document.getElementById('sys-hotkey')) {
    const h = document.createElement('div');
    h.className = 'config-section';
    h.id = 'sys-hotkey';
    h.style.display = 'none';
    h.innerHTML =
      '<h4 data-i18n="hotkey">全局快捷键</h4>' +
      '<p class="config-desc" data-i18n="hotkeyDesc">设置呼出主窗口的全局快捷键，支持任意组合。</p>' +
      '<div class="hotkey-row" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
      '<input type="text" id="hotkey-input" readonly placeholder="Ctrl+Alt+T" autocomplete="off" spellcheck="false">' +
      '<label class="hotkey-opt" style="white-space:nowrap;"><input type="checkbox" id="hotkey-enabled"><span data-i18n="hotkeyEnabled"></span></label>' +
      '<button type="button" class="btn-secondary" id="hotkey-reset" data-i18n="hotkeyReset"></button>' +
      '</div>';
    paneEl.insertBefore(h, paneEl.firstChild);
  }

  const sysHotkey = document.getElementById('sys-hotkey');
  const hotkeyInput = document.getElementById('hotkey-input');
  const hotkeyToggle = document.getElementById('hotkey-enabled');
  const hotkeyReset = document.getElementById('hotkey-reset');
  if (sysHotkey) sysHotkey.style.display = '';

  if (hotkeyInput && hotkeyToggle && hotkeyReset) {
    const accelDisplay = (acc) => String(acc).replace(/CommandOrControl/g, 'Ctrl').replace(/CmdOrCtrl/g, 'Ctrl');
    const accelFromEvent = (e) => {
      const parts = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      let key = e.key;
      if (/^[a-zA-Z]$/.test(key)) key = key.toUpperCase();
      else if (/^[0-9]$/.test(key) || /^F\d{1,2}$/.test(key)) { /* keep */ }
      else if (key === ' ') key = 'Space';
      else return null;
      if (parts.length === 0) return null;
      parts.push(key);
      return parts.join('+');
    };
    const setHotkeyDisplay = (s) => {
      hotkeyInput.value = s.hotkeyEnabled ? accelDisplay(s.hotkey) : t('hotkeyDisabled');
      hotkeyToggle.checked = !!s.hotkeyEnabled;
    };
    let recording = false;
    hotkeyInput.addEventListener('focus', () => {
      recording = true;
      hotkeyInput.classList.add('recording');
      hotkeyInput.value = t('hotkeyRecord');
    });
    hotkeyInput.addEventListener('keydown', (e) => {
      if (!recording) return;
      e.preventDefault();
      if (e.key === 'Escape') { hotkeyInput.blur(); return; }
      const accel = accelFromEvent(e);
      if (!accel) { toast(t('hotkeyNoModifier')); return; }
      hotkeyInput.blur();
      window.tsShell.setSettings({ hotkey: accel }).then((r) => {
        if (r && r.ok) {
          if (r.settings) setHotkeyDisplay(r.settings);
          toast(t('hotkeySaved'));
        } else {
          toast(t('hotkeyConflict'));
          window.tsShell.getSettings().then(setHotkeyDisplay).catch(() => {});
        }
      }).catch(() => {});
    });
    hotkeyInput.addEventListener('blur', () => {
      recording = false;
      hotkeyInput.classList.remove('recording');
      window.tsShell.getSettings().then(setHotkeyDisplay).catch(() => {});
    });
    hotkeyToggle.addEventListener('change', () => {
      window.tsShell.setSettings({ hotkeyEnabled: hotkeyToggle.checked }).then((r) => {
        if (r && r.ok && r.settings) setHotkeyDisplay(r.settings);
        else { hotkeyToggle.checked = !hotkeyToggle.checked; toast(t('hotkeyConflict')); }
      }).catch(() => {});
    });
    hotkeyReset.addEventListener('click', () => {
      window.tsShell.setSettings({ hotkey: 'Ctrl+Alt+T' }).then((r) => {
        if (r && r.ok && r.settings) { setHotkeyDisplay(r.settings); toast(t('hotkeySaved')); }
        else toast(t('hotkeyConflict'));
      }).catch(() => {});
    });
    window.tsShell.getSettings().then(setHotkeyDisplay).catch(() => {});
    window.tsShell.onSettingsChanged(setHotkeyDisplay);
  }

  // 启动即采用壳的界面语言；菜单切换语言时同步前端
  window.tsShell.getSettings().then((s) => {
    if (s && s.uiLang) setAppLang(s.uiLang === 'en' ? 'en' : 'zh');
    applyLang();
  }).catch(() => {});
  window.tsShell.onUiLangChanged((l) => { setAppLang(l === 'en' ? 'en' : 'zh'); });
  window.tsShell.onSummon(() => {
    if (typeof initTimestampInput === 'function' && tsInput) { initTimestampInput(); tsInput.focus(); }
  });
}
