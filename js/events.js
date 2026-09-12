// ========================================================
// js/events.js — 全局事件绑定、剪贴板/滚动条、启动引导
// Extracted from index.js (lines 3686-4053) by
// dev/scripts/split.mjs. Loaded from index.html in this order:
// core → datetime → fields → calendar → convert → tzselector → events
// ========================================================

function toggleLang() { lang = lang === 'zh' ? 'en' : 'zh'; applyLang(); renderConvert(); renderReverse(); }

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
dateInput.addEventListener('input', () => { renderConvert(); showSuggestions(); syncClearBtns(); });
dateInput.addEventListener('focus', () => { calendarEl.classList.remove('open'); showSuggestions(); });
dateInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { renderConvert(); hideSuggestions(); calendarEl.classList.remove('open'); }
  if (e.key === 'Escape') { hideSuggestions(); calendarEl.classList.remove('open'); if (window.utools) utools.outPlugin(); }
});
timeInputEl.addEventListener('input', () => { renderConvert(); syncClearBtns(); });
timeInputEl.addEventListener('keydown', (e) => { if (e.key === 'Escape' && window.utools) utools.outPlugin(); });
fracInputEl.addEventListener('input', () => { renderConvert(); syncClearBtns(); });
fracInputEl.addEventListener('keydown', (e) => { if (e.key === 'Escape' && window.utools) utools.outPlugin(); });
tsInput.addEventListener('input', () => { renderReverse(); syncClearBtns(); });
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
  if (e.target.closest('.t2d-popover')) return;
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
