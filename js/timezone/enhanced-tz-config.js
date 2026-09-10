// ========================================================
// js/timezone/enhanced-tz-config.js — 增强时区配置界面
// 提供完整的IANA时区配置和管理功能
// ========================================================

import TimezoneCompatibility from './compatibility-layer.js';

// 时区配置界面类
class EnhancedTzConfig {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      showHistoricalInfo: true,
      showOffsetInfo: true,
      enableSearch: true,
      enableFilter: true,
      maxResults: 100,
      ...options
    };
    
    this.selectedTimezones = new Set();
    this.searchQuery = '';
    this.currentFilter = 'all';
    this.init();
  }

  init() {
    if (!this.container) {
      console.error('Container element not found');
      return;
    }

    this.createUI();
    this.bindEvents();
    this.loadTimezones();
  }

  createUI() {
    this.container.innerHTML = `
      <div class="enhanced-tzconfig">
        <div class="tzconfig-header">
          <h3>时区配置</h3>
          <div class="tzconfig-actions">
            <button class="btn btn-primary" id="tzconfig-apply">应用选择</button>
            <button class="btn btn-secondary" id="tzconfig-reset">重置默认</button>
          </div>
        </div>
        
        <div class="tzconfig-search">
          <div class="search-input-group">
            <input type="text" id="tzconfig-search" placeholder="搜索时区...">
            <div class="search-filters">
              <button class="filter-btn active" data-filter="all">全部</button>
              <button class="filter-btn" data-filter="historical">支持历史</button>
              <button class="filter-btn" data-filter="current">仅当前</button>
              <button class="filter-btn" data-filter="custom">自定义</button>
            </div>
          </div>
        </div>
        
        <div class="tzconfig-content">
          <div class="tzconfig-main">
            <div class="tzconfig-list" id="tzconfig-list"></div>
          </div>
          
          <div class="tzconfig-sidebar">
            <div class="tzconfig-info">
              <h4>时区信息</h4>
              <div class="tzinfo-details">
                <div class="tzinfo-item">
                  <span class="tzinfo-label">当前时区:</span>
                  <span class="tzinfo-value" id="tzinfo-current">-</span>
                </div>
                <div class="tzinfo-item">
                  <span class="tzinfo-label">偏移信息:</span>
                  <span class="tzinfo-value" id="tzinfo-offset">-</span>
                </div>
                <div class="tzinfo-item">
                  <span class="tzinfo-label">历史数据:</span>
                  <span class="tzinfo-value" id="tzinfo-historical">-</span>
                </div>
                <div class="tzinfo-item">
                  <span class="tzinfo-label">说明:</span>
                  <span class="tzinfo-value" id="tzinfo-description">-</span>
                </div>
              </div>
            </div>
            
            <div class="tzconfig-help">
              <h4>使用说明</h4>
              <div class="help-content">
                <p><strong>• 支持历史数据的时区</strong></p>
                <p>这些时区在历史年份会有不同的偏移量，例如：</p>
                <ul>
                  <li>Asia/Shanghai 在1901年前使用 UTC+08:05:43</li>
                  <li>Europe/London 有夏令时变化</li>
                  <li>America/New_York 历史上有多个偏移变更</li>
                </ul>
                
                <p><strong>• 时区选择</strong></p>
                <ul>
                  <li>点击时区名称选择/取消选择</li>
                  <li>使用搜索框快速查找时区</li>
                  <li>使用过滤器筛选特定类型的时区</li>
                </ul>
                
                <p><strong>• 历史数据影响</strong></p>
                <p>当转换历史日期时，系统会自动使用正确的时区偏移，确保时间转换的准确性。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 获取DOM元素
    this.elements = {
      searchInput: this.container.querySelector('#tzconfig-search'),
      filterBtns: this.container.querySelectorAll('.filter-btn'),
      configList: this.container.querySelector('#tzconfig-list'),
      applyBtn: this.container.querySelector('#tzconfig-apply'),
      resetBtn: this.container.querySelector('#tzconfig-reset'),
      currentTz: this.container.querySelector('#tzinfo-current'),
      offsetInfo: this.container.querySelector('#tzinfo-offset'),
      historicalInfo: this.container.querySelector('#tzinfo-historical'),
      description: this.container.querySelector('#tzinfo-description')
    };
  }

  bindEvents() {
    // 搜索输入
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', this.debounce((e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderResults();
      }, 150));
    }

    // 过滤按钮
    if (this.elements.filterBtns) {
      this.elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.elements.filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentFilter = btn.dataset.filter;
          this.renderResults();
        });
      });
    }

    // 应用按钮
    if (this.elements.applyBtn) {
      this.elements.applyBtn.addEventListener('click', () => {
        this.applySelection();
      });
    }

    // 重置按钮
    if (this.elements.resetBtn) {
      this.elements.resetBtn.addEventListener('click', () => {
        this.resetSelection();
      });
    }

    // 配置列表点击事件
    if (this.elements.configList) {
      this.elements.configList.addEventListener('click', (e) => {
        const item = e.target.closest('.tzconfig-item');
        if (item) {
          this.toggleTimezone(item.dataset.timezone);
        }
      });
    }
  }

  async loadTimezones() {
    try {
      // 获取增强的时区列表
      this.timezones = await TimezoneCompatibility.getIanaTimezone().getEnhancedTzList();
      
      // 加载已选择的时区
      this.loadSelectedTimezones();
      
      // 渲染结果
      this.renderResults();
      
    } catch (error) {
      console.error('Failed to load timezones:', error);
      this.showError('加载时区数据失败');
    }
  }

  loadSelectedTimezones() {
    try {
      const saved = localStorage.getItem('tz_selected');
      if (saved) {
        const ids = JSON.parse(saved);
        this.selectedTimezones = new Set(ids);
      }
    } catch (e) {
      console.error('Failed to load selected timezones:', e);
    }
  }

  renderResults() {
    if (!this.timezones) return;

    let filtered = this.timezones;

    // 应用搜索过滤
    if (this.searchQuery) {
      filtered = filtered.filter(tz => {
        return tz.label.toLowerCase().includes(this.searchQuery) ||
               tz.labelEn.toLowerCase().includes(this.searchQuery) ||
               tz.value.toLowerCase().includes(this.searchQuery) ||
               (tz.currentOffsetFormatted && tz.currentOffsetFormatted.toLowerCase().includes(this.searchQuery));
      });
    }

    // 应用类型过滤
    if (this.currentFilter === 'historical') {
      filtered = filtered.filter(tz => tz.supportsHistorical);
    } else if (this.currentFilter === 'current') {
      filtered = filtered.filter(tz => !tz.supportsHistorical);
    } else if (this.currentFilter === 'custom') {
      filtered = filtered.filter(tz => tz.custom);
    }

    // 限制结果数量
    if (filtered.length > this.options.maxResults) {
      filtered = filtered.slice(0, this.options.maxResults);
    }

    // 渲染结果列表
    this.renderTimezoneList(filtered);
  }

  renderTimezoneList(timezones) {
    if (!this.elements.configList) return;

    if (timezones.length === 0) {
      this.elements.configList.innerHTML = '<div class="tzconfig-empty">没有找到匹配的时区</div>';
      return;
    }

    const html = timezones.map(tz => this.createTimezoneItem(tz)).join('');
    this.elements.configList.innerHTML = html;
  }

  createTimezoneItem(tz) {
    const isSelected = this.selectedTimezones.has(tz.value);
    const hasHistorical = tz.supportsHistorical && this.options.showHistoricalInfo;
    const offsetInfo = tz.currentOffsetFormatted || 'UTC+00:00';

    return `
      <div class="tzconfig-item ${isSelected ? 'selected' : ''}" data-timezone="${tz.value}">
        <div class="tzconfig-main">
          <div class="tzconfig-info">
            <div class="tzconfig-name">
              <span class="tzconfig-label">${tz.label}</span>
              <span class="tzconfig-en">${tz.labelEn}</span>
              ${hasHistorical ? '<span class="tzconfig-badge historical">历史支持</span>' : ''}
              ${tz.custom ? '<span class="tzconfig-badge custom">自定义</span>' : ''}
            </div>
            <div class="tzconfig-offset">
              <span class="tzconfig-offset-value">${offsetInfo}</span>
              <span class="tzconfig-offset-name">${tz.value}</span>
            </div>
          </div>
          <div class="tzconfig-actions">
            <button class="tzconfig-select" title="${isSelected ? '取消选择' : '选择'}">
              ${isSelected ? '✓' : '+'}
            </button>
          </div>
        </div>
        ${hasHistorical ? this.createHistoricalInfo(tz) : ''}
      </div>
    `;
  }

  createHistoricalInfo(tz) {
    const historical = tz.historicalInfo;
    if (!historical || !historical.hasHistoricalData) return '';

    return `
      <div class="tzconfig-historical">
        <div class="tzconfig-historical-title">历史数据信息</div>
        <div class="tzconfig-historical-content">
          <div class="tzconfig-historical-item">
            <span class="tzconfig-historical-label">当前偏移:</span>
            <span class="tzconfig-historical-value">${tz.currentOffsetFormatted}</span>
          </div>
          ${historical.historicalOffset !== tz.currentOffset ? `
          <div class="tzconfig-historical-item">
            <span class="tzconfig-historical-label">历史偏移:</span>
            <span class="tzconfig-historical-value">${TimezoneCompatibility.formatOffset(historical.historicalOffset)}</span>
          </div>
          ` : ''}
          <div class="tzconfig-historical-item">
            <span class="tzconfig-historical-label">说明:</span>
            <span class="tzconfig-historical-note">${historical.notes}</span>
          </div>
        </div>
      </div>
    `;
  }

  toggleTimezone(timezone) {
    if (this.selectedTimezones.has(timezone)) {
      this.selectedTimezones.delete(timezone);
    } else {
      this.selectedTimezones.add(timezone);
    }

    // 重新渲染结果
    this.renderResults();

    // 更新侧边栏信息
    this.updateSidebarInfo(timezone);
  }

  updateSidebarInfo(timezone) {
    if (!timezone) {
      this.clearSidebarInfo();
      return;
    }

    try {
      const tzInfo = TimezoneCompatibility.getIanaTimezone().getTzInfo(new Date(), timezone);
      const historical = TimezoneCompatibility.getIanaTimezone().getTzHistoricalInfo(timezone, new Date().getFullYear());

      if (this.elements.currentTz) {
        this.elements.currentTz.textContent = timezone;
      }

      if (this.elements.offsetInfo) {
        this.elements.offsetInfo.textContent = TimezoneCompatibility.formatOffset(tzInfo.offset);
      }

      if (this.elements.historicalInfo) {
        this.elements.historicalInfo.textContent = historical.hasHistoricalData ? '支持' : '不支持';
      }

      if (this.elements.description) {
        this.elements.description.textContent = historical.notes;
      }

    } catch (error) {
      console.error('Failed to update sidebar info:', error);
      this.clearSidebarInfo();
    }
  }

  clearSidebarInfo() {
    if (this.elements.currentTz) {
      this.elements.currentTz.textContent = '-';
    }
    if (this.elements.offsetInfo) {
      this.elements.offsetInfo.textContent = '-';
    }
    if (this.elements.historicalInfo) {
      this.elements.historicalInfo.textContent = '-';
    }
    if (this.elements.description) {
      this.elements.description.textContent = '-';
    }
  }

  applySelection() {
    try {
      const selected = Array.from(this.selectedTimezones);
      localStorage.setItem('tz_selected', JSON.stringify(selected));
      
      // 触发应用事件
      this.emit('selectionApplied', {
        selected: selected,
        count: selected.length
      });
      
      // 显示成功消息
      this.showSuccess(`已选择 ${selected.length} 个时区`);
      
    } catch (error) {
      console.error('Failed to apply selection:', error);
      this.showError('应用选择失败');
    }
  }

  resetSelection() {
    try {
      localStorage.removeItem('tz_selected');
      this.selectedTimezones.clear();
      
      // 重新加载时区列表
      this.loadTimezones();
      
      // 清空侧边栏信息
      this.clearSidebarInfo();
      
      // 触发重置事件
      this.emit('selectionReset');
      
      // 显示成功消息
      this.showSuccess('已重置为默认选择');
      
    } catch (error) {
      console.error('Failed to reset selection:', error);
      this.showError('重置选择失败');
    }
  }

  showError(message) {
    this.showMessage(message, 'error');
  }

  showSuccess(message) {
    this.showMessage(message, 'success');
  }

  showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `tzconfig-message tzconfig-message-${type}`;
    messageDiv.textContent = message;
    
    this.container.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  emit(event, data) {
    if (this.options.onEvent) {
      this.options.onEvent(event, data);
    }
  }

  // 公共方法
  getSelectedTimezones() {
    return Array.from(this.selectedTimezones);
  }

  setSelectedTimezones(timezones) {
    this.selectedTimezones.clear();
    timezones.forEach(tz => this.selectedTimezones.add(tz));
    this.renderResults();
  }

  clearSelection() {
    this.selectedTimezones.clear();
    this.renderResults();
  }

  refresh() {
    this.loadTimezones();
  }
}

// 创建增强时区配置的工厂函数
function createEnhancedTzConfig(container, options = {}) {
  return new EnhancedTzConfig(container, options);
}

// 全局导出
if (typeof window !== 'undefined') {
  window.EnhancedTzConfig = EnhancedTzConfig;
  window.createEnhancedTzConfig = createEnhancedTzConfig;
}

export default EnhancedTzConfig;