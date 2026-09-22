// ========================================================
// js/fields.js — 解析结果套入表单、快捷建议
// Extracted from index.js (lines 1520-1806) by
// dev/scripts/split.mjs. Loaded from index.html in this order:
// core → datetime → fields → calendar → convert → tzselector → events
// ========================================================

function peWallStr(pe, tz) {
  if (!pe) return null;
  if (pe.mode === 'parts') return toDateStr(pe.y, pe.mo, pe.d, pe.h, pe.mi, pe.s);
  const p = tzParts(new Date(pe.abs), tz);
  return p ? toDateStr(p.y, p.mo, p.d, p.h, p.mi, p.se) : null;
}
function peSrcName(id) {
  const f = DATE_PARSE_FORMATS.find(x => x.id === id);
  return f ? (lang === 'zh' ? f.label : f.labelEn) : id;
}
function applyParsedToFields(pe) {
  if (!pe) return;
  if (pe.tz != null) applyParsedTz(pe.tz);
  const tz = inputTzEl.value || timezoneEl.value;
  if (pe.mode === 'parts') {
    setDateFields(pe.y, pe.mo, pe.d, pe.h, pe.mi, pe.s, pe.ms || 0, pe.us || 0, pe.ns || 0);
  } else {
    const p = tzParts(new Date(pe.abs), tz);
    if (!p) return;
    setDateFields(p.y, p.mo, p.d, p.h, p.mi, p.se, p.ms, 0, 0);
  }
}

const ZONE_ABBR = {
  GMT: 0, UTC: 0,
  WET: 0, WEST: 60,
  CET: 60, CEST: 120,
  EET: 120, EEST: 180,
  MSK: 180, EAT: 180,
  BRT: -180, ART: -180, AST: -240, ADT: -180,
  CST: 480, CDT: -300,
  IST: 330, BST: 60,
  JST: 540, KST: 540,
  HKT: 480, SGT: 480, AWST: 480, WITA: 480,
  WIB: 420, VST: 420,
  PKT: 300, NPT: 345, SLST: 330,
  EST: -300, EDT: -240,
  MST: -420, MDT: -360,
  PST: -480, PDT: -420,
  AKST: -540, AKDT: -480,
  HST: -600, SST: -660,
  NST: -210, NDT: -150,
  ACST: 570, ACDT: 630, AEST: 600, AEDT: 660,
  NZST: 720, NZDT: 780, CHST: 600,
};
function fixedZoneValue(mins) {
  const sign = mins >= 0 ? '+' : '-';
  const a = Math.abs(mins);
  return `FIXED:${sign}${pad(Math.floor(a / 60))}${pad(a % 60)}`;
}
function splitZone(str) {
  const s = str.trim();
  // 组合区令牌："UTC+08:00" / "UTC+8" / "GMT-5:30" / "Z+02:00"。
  // 必须先于单令牌匹配：否则尾部数值偏移被拆走后，残留 "UTC" 会被 iso 的
  // Date.parse 捷径当作“纯 UTC 瞬时”解释，外偏移被静默丢弃（如 12:00 UTC+08:00
  // 会错算成 12:00Z 而非 04:00Z）。
  let m = /(UTC|GMT|UT|Z)([+-]\d{1,2}(?::?\d{2})?)$/i.exec(s);
  if (m) {
    const om = /^([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(m[2]);
    const hr = +om[2], mn = +(om[3] || 0);
    if (hr <= 23 && mn <= 59) {
      const mins = (hr * 60 + mn) * (om[1] === '-' ? -1 : 1);
      return { base: s.slice(0, m.index).trim(), tz: { label: `${om[1]}${pad(hr)}:${pad(mn)}`, offset: mins, value: fixedZoneValue(mins) } };
    }
  }
  m = /([+-]\d{2}:?\d{2}|Z|[A-Z]{1,5})$/i.exec(s);
  if (!m) return { base: s, tz: null };
  const tok = m[1].toUpperCase();
  // AM/PM 不是时区：剥离会静默丢掉 12 小时语义，保留原文交给解析层处理
  if (tok === 'AM' || tok === 'PM') return { base: s, tz: null };
  const base = s.slice(0, m.index).trim();
  let tz = null;
  if (tok === 'Z' || tok === 'GMT' || tok === 'UTC') {
    tz = { label: 'UTC', value: 'UTC', offset: 0 };
  } else if (/^[+-]\d{2}:?\d{2}$/.test(tok)) {
    const om = /^([+-])(\d{2}):?(\d{2})$/.exec(tok);
    const mins = (+om[2] * 60 + +om[3]) * (om[1] === '-' ? -1 : 1);
    tz = { label: `${om[1]}${om[2]}:${om[3]}`, offset: mins, value: `FIXED:${om[1]}${om[2]}${om[3]}` };
  } else if (tok in ZONE_ABBR) {
    tz = { label: tok, offset: ZONE_ABBR[tok], value: fixedZoneValue(ZONE_ABBR[tok]) };
  }
  return { base, tz };
}
function tzFromDateString(s) {
  return splitZone(s).tz;
}

function toDateStr(y, mo, d, h, mi, se) {
  return `${formatYear(y)}-${pad(mo)}-${pad(d)} ${pad(h)}:${pad(mi)}:${pad(se)}`;
}

function parseTimeBoxValue(v) {
  const s = String(v || '').trim();
  const m = s.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.\d{1,9})?)?$/);
  if (!m) return null;
  const h = +m[1], mi = +m[2], se = m[3] != null ? +m[3] : 0;
  if (h > 23 || mi > 59 || se > 59) return null;
  return { h, mi, se };
}

function timeBoxSubstitute(wallStr, tbp, mode) {
  if (!wallStr || mode !== 'parts') return { wall: wallStr, keep: false };
  const m = wallStr.match(/^(-?\d{4,6}-\d{2}-\d{2}) 00:00:00$/);
  if (!m) return { wall: wallStr, keep: false };
  return { wall: `${m[1]} ${pad(tbp.h)}:${pad(tbp.mi)}:${pad(tbp.se)}`, keep: true };
}

const FRAC_DIGITS_BY_TAB = { sec: 0, ms: 3, us: 6, ns: 9 };

function currentFracDigits() {
  const n = FRAC_DIGITS_BY_TAB[currentTab] || 0;
  if (!n) return 0;
  
  // 根据系统配置的精度调整显示
  const sysPrecision = SYS_SETTINGS.precision;
  
  // 如果系统配置精度是秒级，所有高精度输入框都显示为秒级（不显示）
  if (sysPrecision === 'sec') {
    return 0;
  }
  
  // 如果系统配置精度是毫秒级，微秒和纳秒输入框显示为毫秒级
  if (sysPrecision === 'ms') {
    if (n >= 6 && currentTab !== 'ms') return 3; // 微秒和纳秒TAB显示为毫秒级
    if (n >= 9 && currentTab === 'ns') return 3; // 纳秒TAB显示为毫秒级
  }
  
  // 如果系统配置精度是微秒级，纳秒输入框显示为微秒级
  if (sysPrecision === 'us') {
    if (n >= 9 && currentTab === 'ns') return 6; // 纳秒TAB显示为微秒级
  }
  
  // 原有逻辑，确保权限检查
  if (n >= 9 && !precisionGe('ns')) return 6;
  if (n >= 6 && !precisionGe('us')) return 3;
  if (!precisionGe('ms')) return 0;
  
  return n;
}

function fracToParts(str, digits) {
  const f = (str || '').padEnd(Math.max(digits || 9, 9), '0').slice(0, 9);
  return {
    ms: +f.slice(0, 3) || 0,
    us: +f.slice(3, 6) || 0,
    ns: +f.slice(6, 9) || 0
  };
}

function partsToFrac(ms, us, ns, digits) {
  const seg = (d) => (typeof d === 'number' && d > 0 ? String(d).padStart(3, '0') : '000');
  return (seg(ms) + seg(us) + seg(ns)).slice(0, Math.min(digits || 9, 9));
}

// —— frac 输入框每 3 位分组显示 ——
// 值内插入普通空格做视觉分组（如 123 456 789），所有读取端先剥空格再解析。
function stripFracSpaces(str) {
  return String(str == null ? '' : str).replace(/[\s,'\u00A0\u202F\u2009\u200B\u2060\uFEFF]/g, '');
}
function groupFracDigits(str) {
  const d = stripFracSpaces(str).replace(/\D/g, '').slice(0, 9);
  // frac 是「毫秒3 + 微秒3 + 纳秒3」的固定段结构，分组从左侧每 3 位一断（如 123 45）
  return d.replace(/(\d{3})(?=\d)/g, '$1 ');
}
function setFracValue(raw, digits) {
  invalidateFracCache();
  const n = digits || currentFracDigits();
  const d = stripFracSpaces(raw).replace(/\D/g, '').slice(0, n);
  fracInputEl.value = groupFracDigits(d);
  return fracInputEl.value;
}

// —— frac 精度切换缓存 ——
// 切换到低精度页时显示层截断，但把完整值缓存在内存；切回高精度页且期间未编辑则恢复，
// 避免 ns→us→ns 导航造成纳秒位丢失。任何“新数据写入”都使缓存失效。
let fracCache = '';
let fracCachePrefix = '';

function invalidateFracCache() {
  fracCache = '';
  fracCachePrefix = '';
}

// 按 digits 精度“显示层”写入 frac 输入框（含分组）；
// 发生截断时缓存最长完整值；digits 回到 9 且当前值仍是缓存前缀（未被编辑）→ 恢复完整值。
function setFracDisplay(raw, digits) {
  const n = digits || currentFracDigits();
  const full = stripFracSpaces(raw).replace(/\D/g, '').slice(0, 9);
  if (!n || !full) {
    fracInputEl.value = '';
    invalidateFracCache();
    return fracInputEl.value;
  }
  if (full.length > n) {
    // 降级截断：保留完整值（跨层级保留最长全精度），写截断显示
    if (fracCache.length < full.length) fracCache = full;
    fracCachePrefix = full.slice(0, n);
    fracInputEl.value = groupFracDigits(full.slice(0, n));
  } else if (n >= 9 && fracCache && fracCachePrefix && full === fracCachePrefix) {
    // 导航恢复：切回高精度页且期间未编辑，还原完整值
    fracInputEl.value = groupFracDigits(fracCache);
    invalidateFracCache();
  } else {
    // 未截断（可能正从更低级升回）：按当前值显示。
    // 若当前值仍是缓存前缀的有效延续（纯导航、未编辑），保留缓存待高精度页恢复；
    // 否则视为新数据，作废缓存。
    fracInputEl.value = groupFracDigits(full);
    if (!(fracCache && fracCachePrefix && full.length <= fracCachePrefix.length && fracCache.startsWith(full))) {
      invalidateFracCache();
    }
  }
  return fracInputEl.value;
}

// frac 输入光标映射：raw=当前值，caret=旧光标下标，digits=当前位数
// 返回分组显示值 + 光标在新值中的位置（append 落在末尾，中间编辑锚定插入点）。
function fracInputState(raw, caret, digits) {
  const n = digits || currentFracDigits();
  const d = stripFracSpaces(raw).replace(/\D/g, '').slice(0, n);
  const value = groupFracDigits(d);
  let k = 0;
  for (const ch of String(raw).slice(0, caret)) if (ch >= '0' && ch <= '9') k++;
  k = Math.min(k, d.length);
  // 左对齐分组（每 3 位一断）：光标前每攒满 3 位数字就多 1 个分隔空格
  const spaces = k > 0 ? Math.floor((k - 1) / 3) : 0;
  return { value, caret: k + spaces };
}

function setDateFields(y, mo, d, h, mi, se, ms, us, ns) {
  invalidateFracCache();
  dateInput.value = `${formatYear(y)}-${pad(mo)}-${pad(d)}`;
  timeInputEl.value = `${pad(h)}:${pad(mi)}:${pad(se)}`;
  fracInputEl.value = groupFracDigits(partsToFrac(ms, us, ns, currentFracDigits()));
  
  syncClearBtns();
}

function syncClearBtns() {
  if (btnDateClear) btnDateClear.classList.toggle('show', !!(dateInput.value.trim() || timeInputEl.value.trim() || fracInputEl.value.trim()));
  if (btnTsClear) btnTsClear.classList.toggle('show', !!tsInput.value.trim());
}

function setDateToNow() {
  const seq = new Date();
  setDateFields(seq.getFullYear(), seq.getMonth() + 1, seq.getDate(), seq.getHours(), seq.getMinutes(), seq.getSeconds(), seq.getMilliseconds(),
    Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000));
}

function applyFullDateStr(str) {
  const m = str.match(/^(-?\d{4,6})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}):(\d{2}))?$/);
  if (!m) return;
  if (m[4] != null) {
    setDateFields(+m[1], +m[2], +m[3], +m[4], +m[5], +m[6], 0, 0, 0);
  } else {
    dateInput.value = `${formatYear(+m[1])}-${pad(+m[2])}-${pad(+m[3])}`;
    timeInputEl.value = '';
    fracInputEl.value = '';
    syncClearBtns();
  }
}
function applyDateOnly(str) {
  const m = str.match(/^(-?\d{4,6})-(\d{2})-(\d{2})(?: \d{2}:\d{2}:\d{2})?$/);
  if (!m) return;
  dateInput.value = `${m[1]}-${m[2]}-${m[3]}`;
  syncClearBtns();
}
function readDateSelection() {
  const base = dateInput.value.trim();
  const timeText = timeInputEl.value.trim();
  const fracText = stripFracSpaces(fracInputEl.value);
  if (!base && !timeText && !fracText) return { empty: true };
  if (!base) return { err: true };
  const parsed = parseDateEx(base);
  if (!parsed) return { err: true };
  if (parsed.mode === 'abs') {
    applyParsedTz(parsed.tz);
    return { kind: 'abs', ms: parsed.abs };
  }
  if (parsed.tz != null) applyParsedTz(parsed.tz);
  let h = parsed.h, mi = parsed.mi, se = parsed.s, msF = 0, usF = 0, nsF = 0, hasFrac = false;
  if (timeText) {
    const tm = timeText.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.(\d{1,9}))?)?$/);
    if (!tm) return { err: true };
    h = +tm[1]; mi = +tm[2]; se = tm[3] != null ? +tm[3] : 0;
    if (h > 23 || mi > 59 || se > 59) return { err: true };
    if (tm[4]) {
      const p = fracToParts(stripFracSpaces(tm[4]), 9);
      msF = p.ms; usF = p.us; nsF = p.ns;
      hasFrac = true;
    }
  }
  let ms, us, ns;
  if (fracText) {
    if (!/^\d{1,9}$/.test(fracText)) return { err: true };
    // 系统精度降级时 frac 输入框隐藏但值可能残留：此时按 0 取读，避免旧值复活
    const digits = currentFracDigits();
    const p = fracToParts(digits > 0 ? fracText.slice(0, digits) : '', 9);
    ms = p.ms; us = p.us; ns = p.ns;
  } else if (hasFrac) {
    ms = msF; us = usF; ns = nsF;
  } else {
    ms = parsed.ms || 0; us = parsed.us || calTime.us || 0; ns = parsed.ns || calTime.ns || 0;
  }
  return { y: parsed.y, mo: parsed.mo, d: parsed.d, h, mi, se, ms, us, ns };
}

function applyParsedTz(tzInfo) {
  if (!tzInfo || !tzInfo.value || inputTzEl.value === tzInfo.value) return;
  const apply = () => {
    inputTzCustom = inputTzEl.value !== timezoneEl.value;
    updateDateToTsTitle();
    try { inputTzEl.dispatchEvent(new Event('change')); } catch (e) {}
  };
  if (tzInfo.value === 'UTC') { inputTzEl.value = 'UTC'; apply(); return; }
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
    apply();
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

  // 日期类建议：文本无显式时间且时间框已有值时，带回时间框时间，点击不再把时间归零
  const hasTextTime = /\d:\d/.test(s);
  const tbp = parseTimeBoxValue(timeInputEl.value);
  const defT = tbp && !hasTextTime ? { h: tbp.h, mi: tbp.mi, se: tbp.se, keep: true } : { h: 0, mi: 0, se: 0, keep: false };

  const m = s.match(/^(-?\d{4,6})(?:[-/年](\d{1,2}))?(?:[-/月](\d{1,2})(?:日)?)?(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (m) {
    const y = +m[1];
    const mo = m[2] != null ? +m[2] : 0;
    const d = m[3] != null ? +m[3] : 0;
    const h = m[4] != null ? +m[4] : 0;
    const mi = m[5] != null ? +m[5] : 0;
    const se = m[6] != null ? +m[6] : 0;
    if (mo >= 1 && mo <= 12) {
      const dim = daysInMonthPro(y, mo);
      if (d >= 1 && d <= dim) {
        const tm = m[4] != null ? { h, mi, se, keep: false } : defT;
        out.push({ date: toDateStr(y, mo, d, tm.h, tm.mi, tm.se), desc: t('useDate'), keepTime: tm.keep });
      } else if (d === 0) {
        out.push({
          month: `${y}-${mo - 1}`,
          date: toDateStr(y, mo, 1, 0, 0, 0),
          desc: `${y}-${pad(mo)} · ${t('quick')}`,
        });
        out.push({ date: toDateStr(y, mo, 15, defT.h, defT.mi, defT.se), desc: `${y}-${pad(mo)}-15`, keepTime: defT.keep });
        out.push({ date: toDateStr(y, mo, dim, defT.h, defT.mi, defT.se), desc: `${y}-${pad(mo)}-${pad(dim)}`, keepTime: defT.keep });
      }
    } else if (mo === 0) {
      out.push({ date: toDateStr(y, 1, 1, defT.h, defT.mi, defT.se), desc: `${y}-01-01`, keepTime: defT.keep });
      out.push({ date: toDateStr(y, now.getMonth() + 1, now.getDate(), defT.h, defT.mi, defT.se), desc: `${y}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} (${t('today')})`, keepTime: defT.keep });
    }
  }

  const pe = parseDateEx(s);
  if (pe) {
    let wallStr = peWallStr(pe, inputTzEl.value || timezoneEl.value);
    let keepTime = false;
    if (wallStr && tbp && !hasTextTime) {
      const sub = timeBoxSubstitute(wallStr, tbp, pe.mode);
      if (sub.wall) wallStr = sub.wall;
      keepTime = sub.keep;
    }
    if (wallStr && !out.some(i => i.date === wallStr)) {
      out.push({ date: wallStr, desc: t('useDate') + ' · ' + peSrcName(pe.src) + (pe.tz ? ' ' + pe.tz.label : ''), keepTime });
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
  dateSuggestEl.innerHTML = items.map((it) => {
    const monthAttr = it.month ? ` data-month="${escapeAttr(it.month)}"` : '';
    const keepAttr = it.keepTime ? ' data-keep-time="1"' : '';
    return `<div class="sg-item" data-date="${escapeAttr(it.date)}"${monthAttr}${keepAttr}>
      <span class="sg-desc">${escapeAttr(it.desc)}</span>
      <span class="sg-date">${escapeAttr(it.date)}</span>
    </div>`;
  }).join('');
  dateSuggestEl.classList.add('open');
  dateSuggestEl.dataset.monthMark = items.some((i) => i.month) ? '1' : '';
}

function hideSuggestions() { dateSuggestEl.classList.remove('open'); }
