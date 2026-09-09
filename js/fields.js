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
    setDateFields(pe.y, pe.mo, pe.d, pe.h, pe.mi, pe.s, pe.ms, 0, 0);
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
  const m = /([+-]\d{2}:?\d{2}|Z|[A-Z]{1,5})$/i.exec(s);
  if (!m) return { base: s, tz: null };
  const base = s.slice(0, m.index).trim();
  const tok = m[1].toUpperCase();
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
  return `${y}-${pad(mo)}-${pad(d)} ${pad(h)}:${pad(mi)}:${pad(se)}`;
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

function setDateFields(y, mo, d, h, mi, se, ms, us, ns) {
  dateInput.value = `${pad(y)}-${pad(mo)}-${pad(d)}`;
  timeInputEl.value = `${pad(h)}:${pad(mi)}:${pad(se)}`;
  fracInputEl.value = partsToFrac(ms, us, ns, currentFracDigits());
  
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
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}):(\d{2}))?$/);
  if (!m) return;
  if (m[4] != null) {
    setDateFields(+m[1], +m[2], +m[3], +m[4], +m[5], +m[6], 0, 0, 0);
  } else {
    dateInput.value = `${pad(+m[1])}-${pad(+m[2])}-${pad(+m[3])}`;
    timeInputEl.value = '';
    fracInputEl.value = '';
    syncClearBtns();
  }
}
function readDateSelection() {
  const base = dateInput.value.trim();
  const timeText = timeInputEl.value.trim();
  const fracText = fracInputEl.value.trim();
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
      const p = fracToParts(tm[4], 9);
      msF = p.ms; usF = p.us; nsF = p.ns;
      hasFrac = true;
    }
  }
  let ms, us, ns;
  if (fracText) {
    if (!/^\d{1,9}$/.test(fracText)) return { err: true };
    const p = fracToParts(fracText.slice(0, currentFracDigits() || 9), 9);
    ms = p.ms; us = p.us; ns = p.ns;
  } else if (hasFrac) {
    ms = msF; us = usF; ns = nsF;
  } else {
    ms = parsed.ms || 0; us = calTime.us || 0; ns = calTime.ns || 0;
  }
  return { y: parsed.y, mo: parsed.mo, d: parsed.d, h, mi, se, ms, us, ns };
}

function applyParsedTz(tzInfo) {
  if (!tzInfo || !tzInfo.value) return;
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

  const pe = parseDateEx(s);
  if (pe) {
    const wallStr = peWallStr(pe, inputTzEl.value || timezoneEl.value);
    if (wallStr && !out.some(i => i.date === wallStr)) {
      out.push({ date: wallStr, desc: t('useDate') + ' · ' + peSrcName(pe.src) + (pe.tz ? ' ' + pe.tz.label : '') });
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
