// 基于现有滚轮实现的时区选择器
function initCustomTzSelector() {
  const hourWheel = $('#tz-hour-wheel');
  const minWheel = $('#tz-min-wheel');
  const inputTz = $('#input-tz');
  const resetBtn = $('#tz-reset-btn');
  
  if (!hourWheel || !minWheel || !inputTz) {
    return;
  }
  
  // 小时数据
  const hours = [-12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  // 分钟数据
  const minutes = ['00', '15', '30', '45'];
  
  // 构建小时滚轮
  function buildHourWheel() {
    
    hourWheel.innerHTML = '';
    hourWheel.style.paddingTop = '3px';
    hourWheel.style.paddingBottom = '3px';
    
    // 添加提示文本
    const hint = document.createElement('div');
    hint.className = 'wheel-hint';
    hint.textContent = '点击滚动';
    hint.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 10px;
      color: var(--dim);
      opacity: 0.6;
      pointer-events: none;
      z-index: 1;
    `;
    hourWheel.appendChild(hint);
    
    for (let i = 0; i < hours.length; i++) {
      const item = document.createElement('div');
      item.className = 'wheel-item';
      item.textContent = hours[i] >= 0 ? '+' + hours[i] : hours[i];
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        // 移除提示
        const hintEl = hourWheel.querySelector('.wheel-hint');
        if (hintEl) hintEl.remove();
        selectWheelValue(hourWheel, i, (selectedIndex) => {
          updateHourFromWheel(hours[selectedIndex]);
        });
      });
      hourWheel.appendChild(item);
    }
    
    
    // 打印第一个 wheel-item 的信息
    if (hourWheel.children.length > 1) { // 第一个是 hint
      const firstItem = hourWheel.children[1];
    }
    
    // 设置初始选中值
    const currentTz = inputTz.value;
    if (currentTz) {
      const mins = offsetMinutes(new Date(), currentTz);
      const hour = Math.floor(Math.abs(mins) / 60) * (mins >= 0 ? 1 : -1);
      const hourIndex = hours.indexOf(hour);
      if (hourIndex >= 0) {
        selectWheelValue(hourWheel, hourIndex, (selectedIndex) => {
          updateHourFromWheel(hours[selectedIndex]);
        });
      }
    }
    
    // 添加滚轮事件
    hourWheel.addEventListener('wheel', (e) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      const ni = clampWheel(hourWheel._sel + dir, hours.length - 1);
      if (ni === hourWheel._sel) return;
      hourWheel._sel = ni;
      highlightWheel(hourWheel, ni);
      hourWheel._suspend = true;
      hourWheel.scrollTop = ni * 34;
      if (typeof setTimeout !== 'undefined') setTimeout(() => { hourWheel._suspend = false; }, 220);
      updateHourFromWheel(hours[ni]);
    }, { passive: false });
    
    hourWheel.addEventListener('scroll', () => {
      if (hourWheel._suspend) return;
      const idx = wheelIndexFromScrollTop(hourWheel);
      if (idx !== hourWheel._sel) { 
        hourWheel._sel = idx; 
        highlightWheel(hourWheel, idx); 
        updateHourFromWheel(hours[idx]); 
      }
    });
  }
  
  // 构建分钟滚轮
  function buildMinWheel() {
    
    minWheel.innerHTML = '';
    minWheel.style.paddingTop = '3px';
    minWheel.style.paddingBottom = '3px';
    
    // 添加提示文本
    const hint = document.createElement('div');
    hint.className = 'wheel-hint';
    hint.textContent = '点击滚动';
    hint.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 10px;
      color: var(--dim);
      opacity: 0.6;
      pointer-events: none;
      z-index: 1;
    `;
    minWheel.appendChild(hint);
    
    for (let i = 0; i < minutes.length; i++) {
      const item = document.createElement('div');
      item.className = 'wheel-item';
      item.textContent = minutes[i];
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        // 移除提示
        const hintEl = minWheel.querySelector('.wheel-hint');
        if (hintEl) hintEl.remove();
        selectWheelValue(minWheel, i, (selectedIndex) => {
          updateMinFromWheel(minutes[selectedIndex]);
        });
      });
      minWheel.appendChild(item);
    }
    
    
    // 打印第一个 wheel-item 的信息
    if (minWheel.children.length > 1) { // 第一个是 hint
      const firstItem = minWheel.children[1];
    }
    
    // 设置初始选中值
    const currentTz = inputTz.value;
    if (currentTz) {
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
      }
    }
    
    // 添加滚轮事件
    minWheel.addEventListener('wheel', (e) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      const ni = clampWheel(minWheel._sel + dir, minutes.length - 1);
      if (ni === minWheel._sel) return;
      minWheel._sel = ni;
      highlightWheel(minWheel, ni);
      minWheel._suspend = true;
      minWheel.scrollTop = ni * 34;
      if (typeof setTimeout !== 'undefined') setTimeout(() => { minWheel._suspend = false; }, 220);
      updateMinFromWheel(minutes[ni]);
    }, { passive: false });
    
    minWheel.addEventListener('scroll', () => {
      if (minWheel._suspend) return;
      const idx = wheelIndexFromScrollTop(minWheel);
      if (idx !== minWheel._sel) { 
        minWheel._sel = idx; 
        highlightWheel(minWheel, idx); 
        updateMinFromWheel(minutes[idx]); 
      }
    });
  }
  
  // 从小时滚轮更新时区
  function updateHourFromWheel(hour) {
    const matchingTz = TIMEZONES.find(tz => {
      if (!tz.value || tz.value === 'UTC' || tz.value === '') return false;
      const tzMins = offsetMinutes(new Date(), tz.value);
      const tzHour = Math.floor(Math.abs(tzMins) / 60) * (tzMins >= 0 ? 1 : -1);
      return tzHour === hour;
    });
    
    if (matchingTz) {
      inputTz.value = matchingTz.value;
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
      renderConvert();
    }
  }
  
  // 重置功能
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      inputTz.value = timezoneEl.value;
      
      // 重新构建滚轮以反映新的时区
      const mins = offsetMinutes(new Date(), inputTz.value);
      const hour = Math.floor(Math.abs(mins) / 60) * (mins >= 0 ? 1 : -1);
      const min = (Math.abs(mins) % 60);
      
      const hourIndex = hours.indexOf(hour);
      const closestMin = minutes.reduce((prev, curr) => {
        return Math.abs(curr - min) < Math.abs(prev - min) ? curr : prev;
      });
      const minIndex = minutes.indexOf(closestMin);
      
      if (hourIndex >= 0) selectWheelValue(hourWheel, hourIndex);
      if (minIndex >= 0) selectWheelValue(minWheel, minIndex);
      
      renderConvert();
      toast(lang === 'zh' ? '已重置为全局时区' : 'Reset to global timezone');
    });
  }
  
  // 监听原始选择器变化
  inputTz.addEventListener('change', () => {
    const mins = offsetMinutes(new Date(), inputTz.value);
    const hour = Math.floor(Math.abs(mins) / 60) * (mins >= 0 ? 1 : -1);
    const min = (Math.abs(mins) % 60);
    
    const hourIndex = hours.indexOf(hour);
    const closestMin = minutes.reduce((prev, curr) => {
      return Math.abs(curr - min) < Math.abs(prev - min) ? curr : prev;
    });
    const minIndex = minutes.indexOf(closestMin);
    
    if (hourIndex >= 0) selectWheelValue(hourWheel, hourIndex);
    if (minIndex >= 0) selectWheelValue(minWheel, minIndex);
  });
  
  // 初始化滚轮
  buildHourWheel();
  buildMinWheel();
  
}