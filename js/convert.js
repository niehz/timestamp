// ========================================================
// js/convert.js — 转换渲染、日期格式/解析配置、精度与 TAB 切换
// Extracted from index.js (lines 2326-3101) by
// dev/scripts/split.mjs. Loaded from index.html in this order:
// core → datetime → fields → calendar → convert → tzselector → events
// ========================================================

// D2T 卡片最近一次计算的候选瞬时（供歧义下拉悬停时重建浮层）。
let lastD2tCandidates = [];

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
  syncClearBtns();
  const isSec = currentTab === 'sec';
  const isMs = currentTab === 'ms';
  const isUs = currentTab === 'us';
  const isNs = currentTab === 'ns';
  const sel = readDateSelection();
  d2tVal.dataset.value = '';
  lastD2tCandidates = [];
  clearD2tAmbig();
  if (sel.empty) {
    setResult(d2tVal, '', 'empty');
    setHint(hintD2t, '', '');
    if (typeof renderOffsetChips === 'function') renderOffsetChips();
    return;
  }
  if (sel.err) {
    setResult(d2tVal, t('invalidDate'), 'err');
    setHint(hintD2t, t('invalidDate'), 'err');
    if (typeof renderOffsetChips === 'function') renderOffsetChips();
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
    if (typeof renderOffsetChips === 'function') renderOffsetChips();
    return;
  }
  // DST 歧义/跳空探测：仅对墙钟输入生效（绝对时刻无歧义）
  const isWall = sel.kind !== 'abs';
  let candidates = null;
  if (isWall) {
    try { candidates = dateToMsCandidates(sel, inputTzEl.value); } catch (e) { candidates = null; }
  }
  lastD2tCandidates = Array.isArray(candidates) ? candidates : [];
  if (isWall && lastD2tCandidates.length === 0) {
    // 跳空：该墙钟不存在（夏令时向前）
    setResult(d2tVal, t('gapNotExist'), 'err');
    setHint(hintD2t, '', '');
    setHint(hintD2tResult, t('gapHint'), 'err');
    renderAmbigPopover();
    if (typeof renderOffsetChips === 'function') renderOffsetChips();
    return;
  }
  const secVal = String(Math.floor(ms / 1000));
  const msVal = String(ms);
  const us = (sel.us || 0) % 1000;
  const ns = (sel.ns || 0) % 1000;
  const { usVal, nsVal } = epochSubFromMs(ms, us, ns);
  
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
  if (lastD2tCandidates.length >= 2) {
    setHint(hintD2tResult, t('ambigHint'), 'ok');
  } else {
    setHint(hintD2tResult, '', '');
  }
  renderAmbigPopover();
  if (typeof renderOffsetChips === 'function') renderOffsetChips();
}

// 清理 D2T 歧义浮层/提示。
function clearD2tAmbig() {
  if (d2tAmbigPopoverEl) d2tAmbigPopoverEl.innerHTML = '';
  if (d2tResultEl) {
    d2tResultEl.classList.remove('ambig');
    d2tResultEl.classList.remove('show-ambig');
  }
  if (hintD2tResult) setHint(hintD2tResult, '', '');
}

// 依据 lastD2tCandidates 重建歧义浮层。<2 个候选时隐藏并清理。
function renderAmbigPopover() {
  const pop = d2tAmbigPopoverEl;
  const block = d2tResultEl;
  if (!pop || !block) return;
  const cands = lastD2tCandidates;
  if (!Array.isArray(cands) || cands.length < 2) {
    pop.innerHTML = '';
    block.classList.remove('ambig');
    block.classList.remove('show-ambig');
    return;
  }
  const tz = activeTz();
  const cur = currentD2tMs();
  pop.innerHTML = cands.map((c) => {
    const isCur = cur !== null && c === cur;
    const tag = c === cands[0] ? t('ambigEarlier') : t('ambigLater');
    const off = offsetLabel(tz, new Date(c));
    const utcWall = formatWithTokens(c, 'UTC', DATE_FMT_DEFAULT_CONST);
    const sub = epochSubFromMs(c, 0, 0);
    let tsText;
    if (currentTab === 'sec') tsText = String(Math.floor(c / 1000)) + ' s';
    else if (currentTab === 'ms') tsText = String(c) + ' ms';
    else if (currentTab === 'us') tsText = sub.usVal + ' us';
    else if (currentTab === 'ns') tsText = sub.nsVal + ' ns';
    else tsText = String(c) + ' ms';
    return `<div class="d2t-ambig-pop-item${isCur ? ' current' : ''}" data-ms="${c}">
      <div class="d2t-ambig-pop-fmt">${htmlEscape(tag)} · ${htmlEscape(off)}${isCur ? ' · ' + htmlEscape(t('ambigCurrent')) : ''}</div>
      <div class="d2t-ambig-pop-val">${htmlEscape(utcWall)} UTC</div>
      <div class="d2t-ambig-pop-ts">${htmlEscape(tsText)}</div>
    </div>`;
  }).join('');
  block.classList.add('ambig');
}

// 用户从歧义浮层选中某一候选：按其毫秒重写 D2T 卡片结果（各单位换算）并刷新芯片。
function selectD2tCandidate(msCand) {
  const isSec = currentTab === 'sec';
  const isMs = currentTab === 'ms';
  const isUs = currentTab === 'us';
  const isNs = currentTab === 'ns';
  const sel = readDateSelection();
  const us = (sel && sel.us) || 0;
  const ns = (sel && sel.ns) || 0;
  const secVal = String(Math.floor(msCand / 1000));
  const msVal = String(msCand);
  const { usVal, nsVal } = epochSubFromMs(msCand, us % 1000, ns % 1000);
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
  setHint(hintD2tResult, t('ambigHint'), 'ok');
  renderAmbigPopover();
  if (typeof renderOffsetChips === 'function') renderOffsetChips();
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
  const tz = activeTz();
  const isSec = currentTab === 'sec';
  const isMs = currentTab === 'ms';
  const isUs = currentTab === 'us';
  const isNs = currentTab === 'ns';
  const raw = tsInput.value.trim();
  t2dVal.dataset.value = '';
  if (!raw) {
    setResult(t2dVal, '', 'empty');
    setHint(hintT2d, '', '');
    if (typeof renderOffsetChips === 'function') renderOffsetChips();
    return;
  }
  const num = raw.match(/^(-?)(\d+)$/);
  if (!num) {
    setResult(t2dVal, t('invalidTs'), 'err');
    setHint(hintT2d, t('invalidTs'), 'err');
    if (typeof renderOffsetChips === 'function') renderOffsetChips();
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
    if (typeof renderOffsetChips === 'function') renderOffsetChips();
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
  if (typeof renderOffsetChips === 'function') renderOffsetChips();
}

function htmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function msFromCardValue(v, tab) {
  if (v === '' || v === undefined) return null;
  if (!/^-?\d+$/.test(v)) return null;
  const n = BigInt(v);
  if (tab === 'sec') {
    return Number(n * 1000n);
  } else if (tab === 'ms') {
    return Number(n);
  } else if (tab === 'us') {
    return Number(bigFloorDiv(n, 1000n));
  } else if (tab === 'ns') {
    return Number(bigFloorDiv(n, 1000000n));
  }
  return Number(n);
}

function currentT2dMs() {
  return msFromCardValue(t2dVal.dataset.value, currentTab);
}

// D2T 卡片当前显示的纪元毫秒，与 renderConvert 使用同一条计算路径。
// 优先读卡片显示值（秒/毫秒/微秒/纳秒按各自单位换算，保证芯片≡卡片）；
// 卡片为空时回退到解析输入。分栏模式（日期/时间/小数）下 ms 字段只是
// 亚秒毫秒，须经 dateToMs 还原完整瞬间。
function currentD2tMs() {
  const fromCard = msFromCardValue(d2tVal.dataset.value, currentTab);
  if (fromCard !== null) return fromCard;
  const sel = readDateSelection();
  if (!sel || sel.empty || sel.err) return null;
  if (sel.kind === 'abs') return sel.ms;
  const ms = dateToMs(sel, inputTzEl.value);
  return validate(ms) ? ms : null;
}

// 解析结果 → 芯片瞬间（纯函数，便于单测）。返回 null 表示无有效瞬间。
function chipInstantFromSel(sel, tz) {
  if (!sel || sel.empty || sel.err) return null;
  if (sel.kind === 'abs' && typeof sel.ms === 'number') return new Date(sel.ms);
  if (typeof sel.y === 'number') {
    const ms = dateToMs(sel, tz);
    return validate(ms) ? new Date(ms) : null;
  }
  return null;
}

// 从纪元毫秒与输入的三段亚秒数字重建精确的微秒/纳秒整数串。
// ms 为整数纪元毫秒（低三位即毫秒分量）；负数亦精确（如 -544ms ＝ -1000+456，
// -544000 µs + 789 µs ＝ -543211 µs 与真实时刻一致），见 dev/tests/chip.test.mjs。
function epochSubFromMs(ms, us, ns) {
  const m = BigInt(ms);
  const u = BigInt((us || 0) % 1000);
  const n = BigInt((ns || 0) % 1000);
  return {
    usVal: (m * 1000n + u).toString(),
    nsVal: (m * 1000000n + u * 1000n + n).toString(),
  };
}

function renderT2dPopover() {
  const ms = currentT2dMs();
  if (ms === null) { t2dPopoverEl.innerHTML = ''; return; }
  const tz = activeTz();
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
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startFmtDrag(e, item, el);
      });
    }
    item.addEventListener('mousedown', (e) => {
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
    item.addEventListener('click', (e) => {
      if (fmtDragJustMoved) { fmtDragJustMoved = false; return; }
      if (e.target.closest('.fmt-drag')) return;
      const fmt = item.dataset.fmt;
      if (DATE_FMT_ENABLED.has(fmt)) DATE_FMT_ENABLED.delete(fmt);
      else {
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
    if (query && disabledShown.length) html += `<div class="fmt-group-hdr">${t('fmtSelected')}</div>`;
    html += enabledShown.map(fmt => fmtRow(fmt, def)).join('');
  }
  if (disabledShown.length) {
    if (enabledShown.length) html += `<div class="fmt-group-hdr">${t('fmtUnselected')}</div>`;
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
            <input type="text" class="edit-label" value="${escapeAttr(c.label)}" placeholder="${t('customFmtLabelPh')}">
            <input type="text" class="edit-fmt" value="${escapeAttr(c.fmt)}" placeholder="${t('customFmtInputPh')}">
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
    <span class="fmt-drag" title="${t('dragSort')}">☰</span>
    <div class="timezone-info">
      <div class="timezone-name">${isDefault ? `<span class="fmt-def-badge">${t('defaultBadge')}</span> ` : ''}${alias}</div>
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
  if (btnCustomFmtAdd) {
    btnCustomFmtAdd.addEventListener('click', addCustomFormat);
    const labelEl = $('#custom-fmt-label');
    const inputEl = $('#custom-fmt-input');
    if (inputEl) inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomFormat(); });
    if (labelEl) labelEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomFormat(); });
  }
  const searchEl = $('#date-fmt-search');
  if (searchEl) searchEl.addEventListener('input', debounce(() => renderDateFormatList(), 150));
  if (btnResetFmtConfig) btnResetFmtConfig.addEventListener('click', resetDateFormats);
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
