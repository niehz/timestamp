// ========================================================
// js/convert.js — 转换渲染、日期格式/解析配置、精度与 TAB 切换
// Extracted from index.js (lines 2326-3101) by
// dev/scripts/split.mjs. Loaded from index.html in this order:
// core → datetime → fields → calendar → convert → tzselector → events
// ========================================================

// 导入公共函数库
try {
  if (typeof window.addEventListener === 'function') {
    // 使用公共函数库中的工具函数
    const { addEventListener, safeSetHtml, safeSetText, toggleClass, handleError, withErrorHandling, debounce } = window;
  }
} catch (e) {
  console.error('加载公共函数库失败:', e);
}

function setResult(valEl, text, state) {
  valEl.dataset.value = state === 'empty' || state === 'err' ? '' : (valEl.dataset.value || '');
  valEl.setAttribute('aria-result', state || '');
  safeSetText(valEl, text);
  toggleClass(valEl, 'placeholder', state === 'empty' || state === 'err');
  valEl.classList.remove('copied');
}

function setHint(hintEl, text, state) {
  hintEl.textContent = text || '';
  hintEl.className = 'input-hint' + (state ? ' ' + state : '');
}

function renderConvert() {
  syncClearBtns();
  const tz = timezoneEl.value;
  const isSec = currentTab === 'sec';
  const isMs = currentTab === 'ms';
  const isUs = currentTab === 'us';
  const isNs = currentTab === 'ns';
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
  
  // 使用公共函数库中的验证函数
  if (!validateTimestamp(ms)) {
    setResult(d2tVal, t('outOfRange'), 'err');
    setHint(hintD2t, '', '');
    return;
  }
  const secVal = String(Math.floor(ms / 1000));
  const msVal = String(ms);
  const us = (sel.us || 0) % 1000;
  const ns = (sel.ns || 0) % 1000;
  const msInt = Math.floor(ms);
  const usVal = (BigInt(msInt) * 1000n + BigInt(us)).toString();
  const nsVal = (BigInt(msInt) * 1000000n + BigInt(us) * 1000n + BigInt(ns)).toString();
  
  let text, value;
  if (isSec) {
    text = secVal;
    value = secVal;
  } else if (isMs) {
    text = msVal;
    value = msVal;
  } else if (isUs) {
    text = usVal;
    value = usVal;
  } else if (isNs) {
    text = nsVal;
    value = nsVal;
  }
  
  d2tVal.dataset.value = value;
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

function bigFloorDiv(n, d) {
  const q = n / d;
  return (n % d !== 0n && n < 0n) ? q - 1n : q;
}

function renderReverse() {
  syncClearBtns();
  const tz = timezoneEl.value;
  const isSec = currentTab === 'sec';
  const isMs = currentTab === 'ms';
  const isUs = currentTab === 'us';
  const isNs = currentTab === 'ns';
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
  const n = BigInt(raw);
  let ms;
  if (isSec) {
    ms = Number(n * 1000n);
  } else if (isMs) {
    ms = Number(n);
  } else if (isUs) {
    ms = Number(bigFloorDiv(n, 1000n));
  } else if (isNs) {
    ms = Number(bigFloorDiv(n, 1000000n));
  }
  if (!validate(ms)) {
    setResult(t2dVal, t('outOfRange'), 'err');
    setHint(hintT2d, t('outOfRange'), 'err');
    return;
  }
  const date = new Date(ms);
  const text = formatWithTokens(ms, tz, defaultDateFmt());
  let displayValue;
  if (isSec) {
    displayValue = Math.floor(ms / 1000);
  } else if (isMs) {
    displayValue = ms;
  } else if (isUs) {
    displayValue = raw;
  } else if (isNs) {
    displayValue = raw;
  }
  t2dVal.dataset.value = displayValue.toString();
  setResult(t2dVal, text, 'ok');
  setHint(hintT2d, '', '');
}

function htmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function currentT2dMs() {
  const v = t2dVal.dataset.value;
  if (v === '' || v === undefined) return null;
  if (!/^-?\d+$/.test(v)) return null;
  const n = BigInt(v);
  if (currentTab === 'sec') {
    return Number(n * 1000n);
  } else if (currentTab === 'ms') {
    return Number(n);
  } else if (currentTab === 'us') {
    return Number(bigFloorDiv(n, 1000n));
  } else if (currentTab === 'ns') {
    return Number(bigFloorDiv(n, 1000000n));
  }
  return Number(n);
}

function renderT2dPopover() {
  const ms = currentT2dMs();
  if (ms === null) { t2dPopoverEl.innerHTML = ''; return; }
  const tz = timezoneEl.value;
  const items = currentDateFormats().map(f => {
    const val = formatWithTokens(ms, tz, f.fmt);
    return `<div class="t2d-pop-item" data-value="${htmlEscape(val)}"><div class="t2d-pop-fmt">${htmlEscape(f.fmt)}</div><div class="t2d-pop-val">${htmlEscape(val)}</div></div>`;
  }).join('');
  t2dPopoverEl.innerHTML = items;
}

let DATE_FMT_CUSTOM = loadDateFmtCustom();
let DATE_FMT_ENABLED = loadDateFmtEnabled();
let DATE_FMT_ORDER = loadDateFmtOrder();
let fmtEditingIndex = -1;

function fmtAlias(fmt) {
  const hit = DATE_FMT_PRESETS.find(p => p.fmt === fmt);
  if (hit) return lang === 'zh' ? hit.label : hit.labelEn;
  const c = DATE_FMT_CUSTOM.find(c => c.fmt === fmt);
  return c ? c.label : fmt;
}
function loadDateFmtCustom() {
  try {
    const raw = localStorage.getItem('date_fmt_custom');
    const a = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(a)) return [];
    return a.map(x => typeof x === 'string' ? { label: x, fmt: x } : { label: x.label || x.fmt, fmt: x.fmt }).filter(x => x.fmt);
  } catch (e) { return []; }
}
function loadDateFmtEnabled() {
  try {
    const raw = localStorage.getItem('date_fmt_enabled');
    if (raw) {
      const a = JSON.parse(raw);
      if (Array.isArray(a)) {
        const arr = a.filter(Boolean).slice(0, DATE_FMT_MAX_ENABLED);
        return new Set(arr);
      }
    }
  } catch (e) {}
  return new Set(DATE_FMT_PRESETS.map(p => p.fmt).concat(DATE_FMT_CUSTOM.map(c => c.fmt)).slice(0, DATE_FMT_MAX_ENABLED));
}
function loadDateFmtOrder() {
  try {
    const raw = localStorage.getItem('date_fmt_order');
    if (raw) {
      const a = JSON.parse(raw);
      if (Array.isArray(a) && a.length) {
        const order = a.filter(Boolean);
        const merged = [];
        for (const f of order.concat(DATE_FMT_PRESETS.map(p => p.fmt)).concat(DATE_FMT_CUSTOM.map(c => c.fmt))) {
          if (!merged.includes(f)) merged.push(f);
        }
        return merged;
      }
    }
  } catch (e) {}
  return DATE_FMT_PRESETS.map(p => p.fmt).concat(DATE_FMT_CUSTOM.map(c => c.fmt));
}
function normalizeOrder() {
  const enabled = DATE_FMT_ORDER.filter(f => DATE_FMT_ENABLED.has(f));
  const others = DATE_FMT_ORDER.filter(f => !DATE_FMT_ENABLED.has(f));
  DATE_FMT_ORDER = enabled.concat(others);
}
function saveDateFmtConfig() {
  localStorage.setItem('date_fmt_custom', JSON.stringify(DATE_FMT_CUSTOM));
  localStorage.setItem('date_fmt_enabled', JSON.stringify([...DATE_FMT_ENABLED]));
  normalizeOrder();
  localStorage.setItem('date_fmt_order', JSON.stringify(DATE_FMT_ORDER));
}
function allDateFmts() {
  return [...DATE_FMT_PRESETS, ...DATE_FMT_CUSTOM];
}
function defaultDateFmt() {
  const firstEnabled = DATE_FMT_ORDER.find(f => DATE_FMT_ENABLED.has(f));
  return firstEnabled || DATE_FMT_ORDER[0] || DATE_FMT_DEFAULT_CONST;
}
function currentDateFormats() {
  const def = defaultDateFmt();
  const res = [];
  for (const fmt of DATE_FMT_ORDER) {
    if (!DATE_FMT_ENABLED.has(fmt) || fmt === def) continue;
    const p = DATE_FMT_PRESETS.find(p => p.fmt === fmt);
    const c = DATE_FMT_CUSTOM.find(c => c.fmt === fmt);
    res.push({ fmt, label: c ? c.label : (p ? (lang === 'zh' ? p.label : p.labelEn) : fmt) });
  }
  return res;
}
let fmtDrag = null;
let fmtDragJustMoved = false;
function bindFmtList(el) {
  el.querySelectorAll('.timezone-item').forEach(item => {
    const handle = item.querySelector('.fmt-drag');
    if (handle) {
      addEventListener(handle, 'mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startFmtDrag(e, item, el);
      });
    }
    
    addEventListener(item, 'mousedown', (e) => {
      if (e.target.closest('.fmt-drag')) return;
      if (e.button !== 0) return;
      if (fmtDrag) return;
      
      const sx = e.clientX, sy = e.clientY;
      const moveCheck = (ev) => {
        if (Math.abs(ev.clientX - sx) > 3 || Math.abs(ev.clientY - sy) > 3) {
          window.removeEventListener('mousemove', moveCheck);
          window.removeEventListener('mouseup', clearCheck);
          startFmtDrag(ev, item, el);
        }
      };
      
      const clearCheck = () => {
        window.removeEventListener('mousemove', moveCheck);
        window.removeEventListener('mouseup', clearCheck);
      };
      
      window.addEventListener('mousemove', moveCheck);
      window.addEventListener('mouseup', clearCheck);
    });
    
    addEventListener(item, 'click', (e) => {
      if (fmtDragJustMoved) { 
        fmtDragJustMoved = false; 
        return; 
      }
      if (e.target.closest('.fmt-drag')) return;
      
      const fmt = item.dataset.fmt;
      if (DATE_FMT_ENABLED.has(fmt)) {
        DATE_FMT_ENABLED.delete(fmt);
      } else {
        if (DATE_FMT_ENABLED.size >= DATE_FMT_MAX_ENABLED) {
          toast(lang === 'zh' ? `最多同时启用 ${DATE_FMT_MAX_ENABLED} 个格式` : `At most ${DATE_FMT_MAX_ENABLED} formats enabled`);
          return;
        }
        DATE_FMT_ENABLED.add(fmt);
      }
      
      saveDateFmtConfig();
      renderDateFormatList();
      renderReverse();
    });
  });
}
function renderDateParseList() {
  const el = $('#date-parse-list');
  if (!el) return;
  const q = (dateParseSearchEl ? dateParseSearchEl.value : '').trim().toLowerCase();
  const rows = DATE_PARSE_FORMATS.filter(f =>
    !q || (f.id + ' ' + f.label + ' ' + f.labelEn).toLowerCase().includes(q)
  ).map(f => {
    const on = DATE_PARSE_ENABLED.has(f.id);
    const ex = (f.examples || []).map(e => `<span class="parse-exam">${htmlEscape(e)}</span>`).join('');
    return `<div class="timezone-item parse-item ${on ? 'selected' : ''}" data-parse-id="${f.id}">
      <div class="timezone-info">
        <div class="timezone-name">${lang === 'zh' ? f.label : f.labelEn}</div>
        <div class="timezone-offset"><span class="timezone-value">${f.id}</span>${on ? `<span class="parse-more">${lang === 'zh' ? '▾ 查看示例' : '▾ examples'}</span>` : `<span class="parse-more">${lang === 'zh' ? '▸ 查看示例' : '▸ examples'}</span>`}</div>
        <div class="parse-examples">${ex || ''}</div>
      </div>
      <div class="fmt-actions"><span class="tz-check">${on ? '✓' : ''}</span></div>
    </div>`;
  }).join('');
  el.innerHTML = rows || `<div class="empty-tip">${t('noMatch')}</div>`;
  bindDateParseList(el);
}
function bindDateParseList(el) {
  el.querySelectorAll('.timezone-item').forEach(item => {
    const id = item.dataset.parseId;
    if (!id) return;
    const more = item.querySelector('.parse-more');
    if (more) {
      more.addEventListener('click', (e) => {
        e.stopPropagation();
        item.classList.toggle('open');
        const open = item.classList.contains('open');
        more.textContent = lang === 'zh' ? (open ? '▴ 收起' : '▾ 查看示例') : (open ? '▴ collapse' : '▾ examples');
      });
    }
    item.addEventListener('click', () => {
      if (DATE_PARSE_ENABLED.has(id)) {
        if (DATE_PARSE_ENABLED.size <= 1) {
          toast(lang === 'zh' ? '至少保留一个解析格式' : 'Keep at least one format enabled');
          return;
        }
        DATE_PARSE_ENABLED.delete(id);
      } else {
        DATE_PARSE_ENABLED.add(id);
      }
      saveDateParseSettings();
      renderDateParseList();
    });
  });
}
function renderCustomParseRules() {
  const el = $('#custom-parse-list');
  if (!el) return;
  if (!CUSTOM_PARSE_RULES.length) {
    el.innerHTML = `<div class="empty-tip">${t('noCustomParse')}</div>`;
    return;
  }
  el.innerHTML = CUSTOM_PARSE_RULES.map((r, idx) => {
    const on = r.enabled !== false;
    return `<div class="custom-tz-item ${on ? 'selected' : ''}" data-idx="${idx}">
      <div class="timezone-info">
        <div class="timezone-name">${htmlEscape(r.label || r.pattern)}</div>
        <div class="timezone-offset"><span class="timezone-value">${r.type === 'regex' ? (lang === 'zh' ? '正则' : 'regex') : (lang === 'zh' ? '占位符' : 'fmt')}</span></div>
        <div class="parse-examples"><span class="parse-exam">${htmlEscape(r.pattern)}</span></div>
      </div>
      <div class="custom-tz-actions">
        <button class="custom-fmt-toggle" title="${lang === 'zh' ? '启用/停用' : 'Toggle'}">${on ? '✓' : ''}</button>
        <button class="custom-fmt-del" title="${lang === 'zh' ? '删除' : 'Delete'}">✕</button>
      </div>
    </div>`;
  }).join('');
  el.querySelectorAll('.custom-tz-item').forEach(item => {
    const idx = parseInt(item.dataset.idx);
    item.querySelector('.custom-fmt-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      CUSTOM_PARSE_RULES[idx].enabled = CUSTOM_PARSE_RULES[idx].enabled === false ? true : false;
      saveDateParseSettings();
      renderCustomParseRules();
    });
    item.querySelector('.custom-fmt-del').addEventListener('click', (e) => {
      e.stopPropagation();
      CUSTOM_PARSE_RULES.splice(idx, 1);
      saveDateParseSettings();
      renderCustomParseRules();
    });
  });
}
function initCustomParseConfig() {
  const addBtn = $('#custom-parse-add');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const label = ($('#custom-parse-label').value || '').trim();
      const pattern = ($('#custom-parse-input').value || '').trim();
      const type = ($('#custom-parse-input').dataset.type) || 'placeholder';
      if (!pattern) { toast(lang === 'zh' ? '请输入占位符格式或正则' : 'Enter a placeholder format or regex'); return; }
      if (CUSTOM_PARSE_RULES.some(r => r.pattern === pattern && r.type === type)) {
        toast(lang === 'zh' ? '该规则已存在' : 'Rule already exists');
        return;
      }
      if (type === 'placeholder' && !/[YMDHS]/.test(pattern.replace(/[hms]/g, '') ) && !/[YMDHms]/.test(pattern)) {
        // avoid pointless rules; still allow
      }
      CUSTOM_PARSE_RULES.push({ id: 'c' + Date.now().toString(36), label: label || pattern, pattern, type });
      saveDateParseSettings();
      $('#custom-parse-label').value = '';
      $('#custom-parse-input').value = '';
      renderCustomParseRules();
      toast(lang === 'zh' ? '自定义规则已添加' : 'Custom rule added');
    });
  }
  const typeBtns = document.querySelectorAll('#custom-parse-type .tz-filter-btn');
  typeBtns.forEach(b => b.addEventListener('click', () => {
    typeBtns.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    const inp = $('#custom-parse-input');
    if (inp) inp.dataset.type = b.dataset.value;
  }));
}
function initDateParseConfig() {
  const searchEl = dateParseSearchEl;
  if (searchEl) {
    searchEl.addEventListener('input', () => renderDateParseList());
    searchEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') { searchEl.value = ''; renderDateParseList(); } });
  }
  const btnReset = $('#reset-parse-config');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      DATE_PARSE_ENABLED = new Set(DATE_PARSE_FORMATS.map(f => f.id));
      dateParseStyle = 'us';
      saveDateParseSettings();
      renderDateParseList();
      updateParseStyleBtns();
      toast(lang === 'zh' ? '解析已重置' : 'Parsing reset');
    });
  }
  const grp = $('#parse-style');
  if (grp) {
    grp.querySelectorAll('.tz-filter-btn').forEach(b => {
      b.addEventListener('click', () => {
        dateParseStyle = b.dataset.value === 'eu' ? 'eu' : 'us';
        saveDateParseSettings();
        updateParseStyleBtns();
      });
    });
  }
  updateParseStyleBtns();
  renderCustomParseRules();
  initCustomParseConfig();
}
function updateParseStyleBtns() {
  const grp = $('#parse-style');
  if (!grp) return;
  grp.querySelectorAll('.tz-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.value === dateParseStyle));
}
function applyPresetOrder(presetOrderList) {
  const customs = DATE_FMT_ORDER.filter(f => !DATE_FMT_PRESETS.some(p => p.fmt === f));
  DATE_FMT_ORDER = [...presetOrderList, ...customs];
}
function startFmtDrag(e, item, el) {
  if (fmtDrag) return;
  const fmt = item.dataset.fmt;
  const rect = item.getBoundingClientRect();
  const ghost = item.cloneNode(true);
  ghost.classList.add('fmt-drag-ghost');
  ghost.style.width = rect.width + 'px';
  ghost.style.left = rect.left + 'px';
  ghost.style.top = rect.top + 'px';
  document.body.appendChild(ghost);
  el.classList.add('fmt-live-drag');
  item.classList.add('dragging');
  fmtDrag = {
    fmt, el, ghost,
    startY: e.clientY,
    ghostTop: rect.top,
    offsetY: e.clientY - rect.top,
    enabled: DATE_FMT_ENABLED.has(fmt),
    moved: false
  };
  window.addEventListener('mousemove', onFmtDragMove);
  window.addEventListener('mouseup', onFmtDragUp);
}
function onFmtDragMove(ev) {
  const st = fmtDrag;
  if (!st) return;
  st.moved = true;
  st.ghost.style.top = (st.ghostTop + (ev.clientY - st.startY)) + 'px';
  liveReorderFmt(ev.clientY, st);
}
function liveReorderFmt(clientY, st) {
  const items = [...st.el.querySelectorAll('.timezone-item')];
  const draggedRow = items.find(it => it.dataset.fmt === st.fmt);
  if (!draggedRow) return;
  let targetRow = null, placeBefore = true;
  for (const it of items) {
    if (it === draggedRow) continue;
    if (DATE_FMT_ENABLED.has(it.dataset.fmt) !== st.enabled) continue;
    const r = it.getBoundingClientRect();
    if (clientY < r.top + r.height / 2) { targetRow = it; placeBefore = true; break; }
    targetRow = it; placeBefore = false;
  }
  if (!targetRow) return;
  const refIndex = items.indexOf(targetRow);
  const dragIndex = items.indexOf(draggedRow);
  let wantIndex = placeBefore ? refIndex : refIndex + 1;
  if (placeBefore && dragIndex < refIndex) wantIndex = refIndex - 1;
  if (dragIndex === wantIndex) return;
  if (placeBefore) st.el.insertBefore(draggedRow, targetRow);
  else st.el.insertBefore(draggedRow, targetRow.nextSibling);
  applyPresetOrder([...st.el.querySelectorAll('.timezone-item')].map(x => x.dataset.fmt));
  draggedRow.classList.add('dragging');
}
function onFmtDragUp() {
  const st = fmtDrag;
  if (!st) return;
  window.removeEventListener('mousemove', onFmtDragMove);
  window.removeEventListener('mouseup', onFmtDragUp);
  if (st.ghost.parentNode) st.ghost.parentNode.removeChild(st.ghost);
  st.el.classList.remove('fmt-live-drag');
  fmtDrag = null;
  if (st.moved) fmtDragJustMoved = true;
  saveDateFmtConfig();
  renderDateFormatList();
  renderReverse();
}
function renderDateFormatList() {
  const el = $('#date-format-list');
  const searchEl = $('#date-fmt-search');
  if (!el) return;
  const query = searchEl ? searchEl.value.trim().toLowerCase() : '';
  const def = defaultDateFmt();
  normalizeOrder();
  const shown = DATE_FMT_ORDER
    .filter(f => DATE_FMT_PRESETS.some(p => p.fmt === f))
    .filter(f => {
      if (!query) return true;
      if (fmtAlias(f).toLowerCase().includes(query)) return true;
      if (f.toLowerCase().includes(query)) return true;
      return false;
    });
  const enabledShown = shown.filter(f => DATE_FMT_ENABLED.has(f));
  const disabledShown = shown.filter(f => !DATE_FMT_ENABLED.has(f));
  let html = '';
  if (enabledShown.length) {
    if (query && disabledShown.length) html += `<div class="fmt-group-hdr">已选中</div>`;
    html += enabledShown.map(fmt => fmtRow(fmt, def)).join('');
  }
  if (disabledShown.length) {
    if (enabledShown.length) html += `<div class="fmt-group-hdr">未选中</div>`;
    html += disabledShown.map(fmt => fmtRow(fmt, def)).join('');
  }
  el.innerHTML = html || `<div class="empty-tip">${t('noMatch')}</div>`;
  bindFmtList(el);
}
function renderCustomFmtList() {
  const el = $('#custom-fmt-list');
  if (!el) return;
  if (DATE_FMT_CUSTOM.length === 0) {
    el.innerHTML = `<div class="empty-tip" data-i18n="noCustomFmt">暂无自定义格式</div>`;
    applyModalI18n();
    return;
  }
  el.innerHTML = DATE_FMT_CUSTOM.map((c, idx) => {
    if (fmtEditingIndex === idx) {
      return `<div class="custom-tz-item editing" data-index="${idx}">
        <div class="custom-fmt-edit-form">
          <div class="custom-tz-form-row">
            <input type="text" class="edit-label" value="${escapeAttr(c.label)}" placeholder="别名">
            <input type="text" class="edit-fmt" value="${escapeAttr(c.fmt)}" placeholder="格式串">
          </div>
          <div class="custom-tz-form-row">
            <button class="custom-fmt-save">${lang === 'zh' ? '保存' : 'Save'}</button>
            <button class="custom-fmt-cancel">${lang === 'zh' ? '取消' : 'Cancel'}</button>
          </div>
        </div>
      </div>`;
    }
    const alias = htmlEscape(fmtAlias(c.fmt));
    return `<div class="custom-tz-item" data-index="${idx}">
      <div class="timezone-info">
        <div class="timezone-name">${alias}</div>
        <div class="timezone-offset"><span class="timezone-value">${htmlEscape(c.fmt)}</span></div>
      </div>
      <div class="custom-tz-actions">
        <button class="custom-fmt-edit" title="${lang === 'zh' ? '编辑' : 'Edit'}">✎</button>
        <button class="custom-fmt-del" title="${lang === 'zh' ? '删除' : 'Delete'}">✕</button>
      </div>
    </div>`;
  }).join('');
  el.querySelectorAll('.custom-tz-item').forEach(item => {
    if (item.classList.contains('editing')) {
      const idx = parseInt(item.dataset.index);
      item.querySelector('.custom-fmt-save').addEventListener('click', (e) => {
        e.stopPropagation();
        saveEditCustomFormat(idx, item);
      });
      item.querySelector('.custom-fmt-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        fmtEditingIndex = -1;
        renderCustomFmtList();
      });
      return;
    }
    const idx = parseInt(item.dataset.index);
    item.querySelector('.custom-fmt-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      fmtEditingIndex = idx;
      renderCustomFmtList();
    });
    item.querySelector('.custom-fmt-del').addEventListener('click', (e) => {
      e.stopPropagation();
      removeCustomFormat(idx);
    });
  });
}
function saveEditCustomFormat(idx, item) {
  if (idx < 0 || idx >= DATE_FMT_CUSTOM.length) return;
  const c = DATE_FMT_CUSTOM[idx];
  const newLabel = (item.querySelector('.edit-label').value || '').trim();
  const newFmt = (item.querySelector('.edit-fmt').value || '').trim();
  if (!newFmt) { toast(lang === 'zh' ? '格式不能为空' : 'Format is required'); return; }
  if (DATE_FMT_CUSTOM.some((ci, i) => i !== idx && ci.fmt === newFmt) || DATE_FMT_PRESETS.some(p => p.fmt === newFmt)) {
    toast(lang === 'zh' ? '格式已存在' : 'Duplicate format');
    return;
  }
  c.label = newLabel || newFmt;
  c.fmt = newFmt;
  fmtEditingIndex = -1;
  saveDateFmtConfig();
  renderCustomFmtList();
  renderDateFormatList();
  renderReverse();
}
function removeCustomFormat(idx) {
  if (idx < 0 || idx >= DATE_FMT_CUSTOM.length) return;
  const c = DATE_FMT_CUSTOM[idx];
  DATE_FMT_CUSTOM.splice(idx, 1);
  DATE_FMT_ENABLED.delete(c.fmt);
  DATE_FMT_ORDER = DATE_FMT_ORDER.filter(f => f !== c.fmt);
  saveDateFmtConfig();
  renderCustomFmtList();
  renderDateFormatList();
  renderReverse();
}
function fmtRow(fmt, def) {
  const enabled = DATE_FMT_ENABLED.has(fmt);
  const isDefault = fmt === def;
  const custom = DATE_FMT_CUSTOM.some(c => c.fmt === fmt);
  const alias = htmlEscape(fmtAlias(fmt));
  return `<div class="timezone-item ${enabled ? 'selected' : ''}" data-fmt="${htmlEscape(fmt)}">
    <span class="fmt-drag" title="拖动排序">☰</span>
    <div class="timezone-info">
      <div class="timezone-name">${isDefault ? '<span class="fmt-def-badge">默认</span> ' : ''}${alias}</div>
      <div class="timezone-offset"><span class="timezone-value">${htmlEscape(fmt)}</span></div>
    </div>
    <div class="fmt-actions"><span class="tz-check">${enabled ? '✓' : ''}</span></div>
  </div>`;
}
function addCustomFormat() {
  const labelEl = $('#custom-fmt-label');
  const inputEl = $('#custom-fmt-input');
  if (!inputEl) return;
  const fmt = (inputEl.value || '').trim();
  const label = (labelEl && labelEl.value.trim()) || fmt;
  if (!fmt) { toast(lang === 'zh' ? '格式不能为空' : 'Format is required'); return; }
  if (DATE_FMT_CUSTOM.some(c => c.fmt === fmt) || DATE_FMT_PRESETS.some(p => p.fmt === fmt)) {
    toast(lang === 'zh' ? '格式已存在' : 'Duplicate format');
    return;
  }
  DATE_FMT_CUSTOM.push({ label, fmt });
  if (DATE_FMT_ENABLED.size < DATE_FMT_MAX_ENABLED) DATE_FMT_ENABLED.add(fmt);
  DATE_FMT_ORDER.push(fmt);
  saveDateFmtConfig();
  renderCustomFmtList();
  renderDateFormatList();
  if (labelEl) labelEl.value = '';
  if (inputEl) inputEl.value = '';
}
function resetDateFormats() {
  DATE_FMT_ENABLED = new Set(DATE_FMT_PRESETS.map(p => p.fmt));
  DATE_FMT_CUSTOM = [];
  DATE_FMT_ORDER = DATE_FMT_PRESETS.map(p => p.fmt);
  fmtEditingIndex = -1;
  saveDateFmtConfig();
  renderCustomFmtList();
  renderDateFormatList();
  renderReverse();
  toast(lang === 'zh' ? '格式已重置' : 'Formats reset');
}
function initDateFormatConfig() {
  // 使用公共函数库中的事件绑定函数
  if (btnCustomFmtAdd) {
    addEventListener(btnCustomFmtAdd, 'click', addCustomFormat);
    const labelEl = $('#custom-fmt-label');
    const inputEl = $('#custom-fmt-input');
    if (inputEl) {
      addEventListener(inputEl, 'keydown', (e) => { 
        if (e.key === 'Enter') addCustomFormat(); 
      });
    }
    if (labelEl) {
      addEventListener(labelEl, 'keydown', (e) => { 
        if (e.key === 'Enter') addCustomFormat(); 
      });
    }
  }
  
  const searchEl = $('#date-fmt-search');
  if (searchEl) {
    addEventListener(searchEl, 'input', debounce(() => renderDateFormatList(), 150));
  }
  
  if (btnResetFmtConfig) {
    addEventListener(btnResetFmtConfig, 'click', resetDateFormats);
  }
  
  renderCustomFmtList();
}




function updateFracInput() {
  const digits = currentFracDigits();
  fracInputEl.style.display = digits > 0 ? '' : 'none';
  fracInputEl.maxLength = digits || 9;
  fracInputEl.placeholder = t(digits === 9 ? 'fracPlaceholderNs' : digits === 6 ? 'fracPlaceholderUs' : digits ? 'fracPlaceholderMs' : '');
  fracInputEl.size = Math.max(digits, 4);
  if (digits && fracInputEl.value.length > digits) fracInputEl.value = fracInputEl.value.slice(0, digits);
}

function updatePrecisionIndicators() {
  const sysPrecision = SYS_SETTINGS.precision;
  
  document.querySelectorAll('.tab').forEach((tabEl) => {
    const tab = tabEl.dataset.tab;
    const indicator = tabEl.querySelector('.precision-indicator');
    
    if (indicator) {
      // 根据系统精度和当前TAB决定是否显示提示
      let showIndicator = false;
      let text = '';
      
      if (sysPrecision === 'ms') {
        if (tab === 'us' || tab === 'ns') {
          showIndicator = true;
          text = t('tsUnitMs');
        }
      } else if (sysPrecision === 'us') {
        if (tab === 'ns') {
          showIndicator = true;
          text = t('tsUnitUs');
        }
      }
      
      if (showIndicator) {
        indicator.textContent = text;
        indicator.classList.add('show');
      } else {
        indicator.classList.remove('show');
      }
    }
  });
}

function switchTab(tab) {
  currentTab = tab;
  document.body.classList.toggle('tab-sec', tab === 'sec');
  document.body.classList.toggle('tab-ms', tab === 'ms');
  document.body.classList.toggle('tab-us', tab === 'us');
  document.body.classList.toggle('tab-ns', tab === 'ns');
  document.body.classList.toggle('prec-us', precisionGe('us'));
  document.querySelectorAll('.tab').forEach((el) => el.classList.toggle('active', el.dataset.tab === tab));
  
  // 更新精度提示标识
  updatePrecisionIndicators();
  
  if (tab === 'sec') {
    tsInput.placeholder = t('tsPlaceholderSec');
  } else if (tab === 'ms') {
    tsInput.placeholder = t('tsPlaceholderMs');
  } else if (tab === 'us') {
    tsInput.placeholder = t('tsPlaceholderUs');
  } else if (tab === 'ns') {
    tsInput.placeholder = t('tsPlaceholderNs');
  }
  updateFracInput();
  
  timeInputEl.placeholder = t('timePlaceholder');
  reformatTimeInput();
  toggleNowPanel();
  if (calendarEl.classList.contains('open')) renderTimeWheels();
  renderConvert();
  renderReverse();
}
