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
      if (SYS_SETTINGS.autoPrecisionTab) switchTab(fracToTab(pe));
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

// 创建时区偏移选项
function createTzOffsetOptions() {
  const offsets = new Set();
  TIMEZONES.forEach(tz => {
    if (tz.value && tz.value !== 'UTC' && tz.value !== '') {
      const mins = offsetMinutes(new Date(), tz.value);
      const offsetStr = currentOffsetStr(tz.value);
      offsets.add(offsetStr);
    }
  });
  
  return Array.from(offsets).sort((a, b) => {
    const aMin = parseInt(a.replace(/[+:-]/g, ''));
    const bMin = parseInt(b.replace(/[+:-]/g, ''));
    return aMin - bMin;
  });
}

// 基于现有滚轮实现的时区选择器
function initCustomTzSelector() {
  
  // 获取DOM元素
  const hourWheel = $('#tz-hour-wheel');
  const minWheel = $('#tz-min-wheel');
  const inputTz = $('#input-tz');
  const resetBtn = $('#tz-reset-btn');
  
  // 确保全局时区选择器有默认值
  if (timezoneEl && !timezoneEl.value) {
    timezoneEl.value = 'Asia/Shanghai';
  }
  
  // 确保输入时区选择器与全局时区选择器同步
  if (inputTz && timezoneEl && inputTz.value !== timezoneEl.value) {
    inputTz.value = timezoneEl.value;
  }
  
  if (!hourWheel || !minWheel || !inputTz) {
    return;
  }
  
  // 小时数据 - 改为 +08 格式
  const hours = [
    '-12', '-11', '-10', '-09', '-08', '-07', '-06', '-05', '-04', '-03', '-02', '-01', 
    '+00', '+01', '+02', '+03', '+04', '+05', '+06', '+07', '+08', '+09', '+10', '+11', '+12', '+13', '+14'
  ];
  
  // 分钟数据
  const minutes = ['00', '15', '30', '45'];
  let tzWheelsReady = false;
  
    // 构建小时滚轮
    function buildHourWheel() {
      
      hourWheel.innerHTML = '';
      hourWheel.style.paddingTop = '3px';
      hourWheel.style.paddingBottom = '3px';
      hourWheel._step = 34;
      
      for (let i = 0; i < hours.length; i++) {
        const item = document.createElement('div');
        item.className = 'wheel-item';
        item.textContent = hours[i];
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          selectWheelValue(hourWheel, i, (selectedIndex) => {
            updateHourFromWheel(hours[selectedIndex]);
          });
        });
        hourWheel.appendChild(item);
      }
    
    // 设置初始选中值 - 默认使用全局时区
    
    const currentTz = inputTz.value || timezoneEl.value || 'UTC';
    
    try {
      const mins = offsetMinutes(new Date(), currentTz);
      
      const hour = Math.floor(Math.abs(mins) / 60) * (mins >= 0 ? 1 : -1);
      
      // 将小时转换为 +08 格式
      const hourStr = hour >= 0 ? '+' + hour.toString().padStart(2, '0') : hour.toString();
      
      const hourIndex = hours.indexOf(hourStr);
      
      if (hourIndex >= 0) {
        selectWheelValue(hourWheel, hourIndex, (selectedIndex) => {
          updateHourFromWheel(hours[selectedIndex]);
        });
      } else {
        // 如果计算失败，默认选择UTC (+00)
        selectWheelValue(hourWheel, 12, (selectedIndex) => {
          updateHourFromWheel(hours[selectedIndex]);
        });
      }
    } catch (error) {
      // 默认选择UTC (+00)
      selectWheelValue(hourWheel, 12, (selectedIndex) => {
        updateHourFromWheel(hours[selectedIndex]);
      });
    }
    
    // 添加滚轮事件 - 实现真正的循环滚动
    hourWheel.addEventListener('wheel', (e) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      
      
      // 计算新的索引
      let ni = hourWheel._sel + dir;
      
      // 处理循环逻辑
      if (ni < 0) {
        // 向上循环：从-12跳到+12
        ni = hours.length - 1; // 24 = +12
      } else if (ni >= hours.length) {
        // 向下循环：从+12跳到-12
        ni = 0; // 0 = -12
      }
      
      
      if (ni === hourWheel._sel) {
        return;
      }
      
      // 强制设置滚动位置到目标
      const targetScrollTop = ni * 34;
      
      // 立即设置滚动位置
      hourWheel.scrollTop = targetScrollTop;
      
      // 立即设置选中状态
      hourWheel._sel = ni;
      highlightWheel(hourWheel, ni);
      
      // 滚动锁定
      hourWheel._suspend = true;
      
      // 验证滚动设置
      setTimeout(() => {
        if (hourWheel.scrollTop !== targetScrollTop) {
          hourWheel.scrollTop = targetScrollTop;
        }
        hourWheel._suspend = false;
      }, 50);
      
      // 更新时区
      updateHourFromWheel(hours[ni]);
    }, { passive: false });
    
    // 恢复原有的滚动监听器
    hourWheel.addEventListener('scroll', () => {
      if (hourWheel._suspend) {
        return;
      }
      
      const idx = wheelIndexFromScrollTop(hourWheel);
      
      if (idx !== hourWheel._sel) { 
        hourWheel._sel = idx; 
        highlightWheel(hourWheel, idx); 
        updateHourFromWheel(hours[idx]); 
      } else {
      }
    });
  }
  
    // 构建分钟滚轮
    function buildMinWheel() {
      
      minWheel.innerHTML = '';
      minWheel.style.paddingTop = '3px';
      minWheel.style.paddingBottom = '3px';
      minWheel._step = 34;
      
      for (let i = 0; i < minutes.length; i++) {
        const item = document.createElement('div');
        item.className = 'wheel-item';
        item.textContent = minutes[i];
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          selectWheelValue(minWheel, i, (selectedIndex) => {
            updateMinFromWheel(minutes[selectedIndex]);
          });
        });
        minWheel.appendChild(item);
      }
    
    // 设置初始选中值 - 默认使用全局时区
    
    const currentTz = inputTz.value || timezoneEl.value || 'UTC';
    
    try {
      const mins = offsetMinutes(new Date(), currentTz);
      
      const min = (mins % 60);
      
      const closestMin = minutes.reduce((prev, curr) => {
        return Math.abs(curr - min) < Math.abs(prev - min) ? curr : prev;
      });
      
      const minIndex = minutes.indexOf(closestMin);
      
      if (minIndex >= 0) {
        selectWheelValue(minWheel, minIndex, (selectedIndex) => {
          updateMinFromWheel(minutes[selectedIndex]);
        });
      } else {
        // 如果计算失败，默认选择00
        selectWheelValue(minWheel, 0, (selectedIndex) => {
          updateMinFromWheel(minutes[selectedIndex]);
        });
      }
    } catch (error) {
      // 默认选择00
      selectWheelValue(minWheel, 0, (selectedIndex) => {
        updateMinFromWheel(minutes[selectedIndex]);
      });
    }
    
    // 添加滚轮事件 - 实现真正的循环滚动
    minWheel.addEventListener('wheel', (e) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      
      
      // 计算新的索引
      let ni = minWheel._sel + dir;
      
      // 处理循环逻辑
      if (ni < 0) {
        // 向上循环：从00跳到45
        ni = minutes.length - 1; // 3 = 45
      } else if (ni >= minutes.length) {
        // 向下循环：从45跳到00
        ni = 0; // 0 = 00
      }
      
      
      if (ni === minWheel._sel) {
        return;
      }
      
      // 强制设置滚动位置到目标
      const targetScrollTop = ni * 34;
      
      // 立即设置滚动位置
      minWheel.scrollTop = targetScrollTop;
      
      // 立即设置选中状态
      minWheel._sel = ni;
      highlightWheel(minWheel, ni);
      
      // 滚动锁定
      minWheel._suspend = true;
      
      // 验证滚动设置
      setTimeout(() => {
        if (minWheel.scrollTop !== targetScrollTop) {
          minWheel.scrollTop = targetScrollTop;
        }
        minWheel._suspend = false;
      }, 50);
      
      // 更新时区
      updateMinFromWheel(minutes[ni]);
    }, { passive: false });
    
    // 恢复原有的滚动监听器
    minWheel.addEventListener('scroll', () => {
      if (minWheel._suspend) {
        return;
      }
      
      const idx = wheelIndexFromScrollTop(minWheel);
      
      if (idx !== minWheel._sel) { 
        minWheel._sel = idx; 
        highlightWheel(minWheel, idx); 
        updateMinFromWheel(minutes[idx]); 
      } else {
      }
    });
  }
  
  // 从小时滚轮更新时区
  function updateHourFromWheel(hourStr) {
    // 解析小时字符串，如 "+08" -> 8
    const hour = parseInt(hourStr);
    const matchingTz = TIMEZONES.find(tz => {
      if (!tz.value || tz.value === 'UTC' || tz.value === '') return false;
      const tzMins = offsetMinutes(new Date(), tz.value);
      const tzHour = Math.floor(Math.abs(tzMins) / 60) * (tzMins >= 0 ? 1 : -1);
      return tzHour === hour;
    });
    
    if (matchingTz) {
      inputTz.value = matchingTz.value;
      if (tzWheelsReady) {
        inputTzCustom = inputTz.value !== timezoneEl.value;
        updateDateToTsTitle();
      }
      renderConvert();
    }
  }
  
  // 从分钟滚轮更新时区
  function updateMinFromWheel(min) {
    const matchingTz = TIMEZONES.find(tz => {
      if (!tz.value || tz.value === 'UTC' || tz.value === '') return false;
      const tzMins = offsetMinutes(new Date(), tz.value);
      const tzMin = (tzMins % 60);
      return Math.abs(tzMin - parseInt(min)) <= 15;
    });
    
    if (matchingTz) {
      inputTz.value = matchingTz.value;
      if (tzWheelsReady) {
        inputTzCustom = inputTz.value !== timezoneEl.value;
        updateDateToTsTitle();
      }
      renderConvert();
    }
  }
  
  // 重置功能
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const globalTz = timezoneEl.value || 'UTC';
      inputTz.value = globalTz;
      inputTzCustom = false;
      updateDateToTsTitle();
      
      // 重置时间校准
      lastUpdateTime = 0;
      updateNow();
      
      try {
        // 重新构建滚轮以反映新的时区
        const mins = offsetMinutes(new Date(), globalTz);
        const hour = Math.floor(Math.abs(mins) / 60) * (mins >= 0 ? 1 : -1);
        const min = (Math.abs(mins) % 60);
        
        // 将小时转换为 +08 格式
        const hourStr = hour >= 0 ? '+' + hour.toString().padStart(2, '0') : hour.toString();
        const hourIndex = hours.indexOf(hourStr);
        const closestMin = minutes.reduce((prev, curr) => {
          return Math.abs(curr - min) < Math.abs(prev - min) ? curr : prev;
        });
        const minIndex = minutes.indexOf(closestMin);
        
        
        if (hourIndex >= 0) selectWheelValue(hourWheel, hourIndex);
        if (minIndex >= 0) selectWheelValue(minWheel, minIndex);
      } catch (error) {
        // 出错时重置到UTC
        selectWheelValue(hourWheel, 12); // +00 = UTC
        selectWheelValue(minWheel, 0);   // 00
      }
      
      renderConvert();
      toast(lang === 'zh' ? '已重置为全局时区' : 'Reset to global timezone');
    });
  }
  
  // 监听原始选择器变化
  inputTz.addEventListener('change', () => {
    const targetTz = inputTz.value || timezoneEl.value || 'UTC';
    
    try {
      const mins = offsetMinutes(new Date(), targetTz);
      const hour = Math.floor(Math.abs(mins) / 60) * (mins >= 0 ? 1 : -1);
      const min = (Math.abs(mins) % 60);
      
      // 将小时转换为 +08 格式
      const hourStr = hour >= 0 ? '+' + hour.toString().padStart(2, '0') : hour.toString();
      const hourIndex = hours.indexOf(hourStr);
      const closestMin = minutes.reduce((prev, curr) => {
        return Math.abs(curr - min) < Math.abs(prev - min) ? curr : prev;
      });
      const minIndex = minutes.indexOf(closestMin);
      
      
      if (hourIndex >= 0) selectWheelValue(hourWheel, hourIndex);
      if (minIndex >= 0) selectWheelValue(minWheel, minIndex);
    } catch (error) {
      // 出错时重置到UTC
      selectWheelValue(hourWheel, 12); // +00 = UTC
      selectWheelValue(minWheel, 0);   // 00
    }
    renderConvert();
  });
  
  // 初始化滚轮
  
  buildHourWheel();
  buildMinWheel();
  tzWheelsReady = true;
  inputTzCustom = inputTz.value !== timezoneEl.value;
  updateDateToTsTitle();
  
  
}

function updateTsToDateTitle() {
  const el = document.querySelector('[data-i18n="tsToDate"]');
  if (!el) return;
  const value = timezoneEl.value || 'UTC';
  const z = lookupZone(value);
  const city = z
    ? (lang === 'zh' ? z.label.split(/[／（( ]/)[0] : z.labelEn)
    : value;
  el.textContent = lang === 'zh'
    ? `${t('tsToDate')}(${city})`
    : `${t('tsToDate')} (${city})`;
}

function updateDateToTsTitle() {
  const el = document.querySelector('[data-i18n="dateToTs"]');
  if (!el) return;
  let suffix;
  if (inputTzEl.value && inputTzEl.value !== timezoneEl.value) {
    suffix = t('customTag');
  } else {
    const value = timezoneEl.value || 'UTC';
    const z = lookupZone(value);
    suffix = z
      ? (lang === 'zh' ? z.label.split(/[／（( ]/)[0] : z.labelEn)
      : value;
  }
  el.textContent = lang === 'zh'
    ? `${t('dateToTs')}(${suffix})`
    : `${t('dateToTs')} (${suffix})`;
}

function applyLang() {
  btnLang.textContent = lang === 'zh' ? 'EN' : '中';
  if (document.documentElement) document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  
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
  $('#cal-now').textContent = t('now');
  $('#cal-ok').textContent = t('ok');
  const weekNames = lang === 'zh'
    ? { Su: '日', Mo: '一', Tu: '二', We: '三', Th: '四', Fr: '五', Sa: '六' }
    : { Su: 'Su', Mo: 'Mo', Tu: 'Tu', We: 'We', Th: 'Th', Fr: 'Fr', Sa: 'Sa' };
  document.querySelectorAll('.cal-week span').forEach((el) => { el.textContent = weekNames[el.dataset.w] || el.textContent; });
  renderCalendar();
}
