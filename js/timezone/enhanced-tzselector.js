// ========================================================
// js/timezone/enhanced-tzselector.js — 增强时区选择器
// 支持IANA时区历史数据展示和选择
// ========================================================

import TimezoneCompatibility from './compatibility-layer.js';

// 时区选择器配置
const SELECTOR_CONFIG = {
  showHistoricalInfo: true,
  showOffsetInfo: true,
  enableSearch: true,
  enableFilter: true,
  maxResults: 50,
  debounceTime: 150
};

// 时区选择器类
class EnhancedTimezoneSelector {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = { ...SELECTOR_CONFIG, ...options };
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
      <div class="enhanced-tzselector">
        <div class="tzselector-header">
          <div class="tzselector-search">
            <input type="text" class="tzsearch-input" placeholder="搜索时区...">
            <div class="tzsearch-filters">
              <button class="tzfilter-btn active" data-filter="all">全部</button>
              <button class="tzfilter-btn" data-filter="historical">支持历史</button>
              <button class="tzfilter-btn" data-filter="current">仅当前</button>
            </div>
          </div>
        </div>
        
        <div class="tzselector-results">
          <div class="tzresults-count"></div>
          <div class="tzresults-list"></div>
        </div>
        
        <div class="tzselector-info">
          <div class="tzinfo-panel">
            <h3>时区信息</h3>
            <div class="tzinfo-content">
              <div class="tzinfo-offset"></div>
              <div class="tzinfo-historical"></div>
              <div class="tzinfo-details"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 获取DOM元素
    this.elements = {
      searchInput: this.container.querySelector('.tzsearch-input'),
      filterBtns: this.container.querySelectorAll('.tzfilter-btn'),
      resultsList: this.container.querySelector('.tzresults-list'),
      resultsCount: this.container.querySelector('.tzresults-count'),
      infoPanel: this.container.querySelector('.tzinfo-panel'),
      infoOffset: this.container.querySelector('.tzinfo-offset'),
      infoHistorical: this.container.querySelector('.tzinfo-historical'),
      infoDetails: this.container.querySelector('.tzinfo-details')
    };
  }

  bindEvents() {
    // 搜索输入
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', this.debounce((e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderResults();
      }, this.options.debounceTime));
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

    // 结果列表点击事件
    if (this.elements.resultsList) {
      this.elements.resultsList.addEventListener('click', (e) => {
        const item = e.target.closest('.tzitem');
        if (item) {
          this.selectTimezone(item.dataset.timezone);
        }
      });
    }
  }

  async loadTimezones() {
    try {
      // 获取增强的时区列表
      this.timezones = TimezoneCompatibility.getIanaTimezone().getEnhancedTzList();
      this.renderResults();
    } catch (error) {
      console.error('Failed to load timezones:', error);
      this.showError('加载时区数据失败');
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
    }

    // 限制结果数量
    if (filtered.length > this.options.maxResults) {
      filtered = filtered.slice(0, this.options.maxResults);
    }

    // 更新结果计数
    if (this.elements.resultsCount) {
      this.elements.resultsCount.textContent = `找到 ${filtered.length} 个时区`;
    }

    // 渲染结果列表
    this.renderTimezoneList(filtered);
  }

  renderTimezoneList(timezones) {
    if (!this.elements.resultsList) return;

    if (timezones.length === 0) {
      this.elements.resultsList.innerHTML = '<div class="tzresults-empty">没有找到匹配的时区</div>';
      return;
    }

    const html = timezones.map(tz => this.createTimezoneItem(tz)).join('');
    this.elements.resultsList.innerHTML = html;
  }

  createTimezoneItem(tz) {
    const isSelected = this.selectedTimezones.has(tz.value);
    const hasHistorical = tz.supportsHistorical && this.options.showHistoricalInfo;
    const offsetInfo = tz.currentOffsetFormatted || 'UTC+00:00';

    return `
      <div class="tzitem ${isSelected ? 'selected' : ''}" data-timezone="${tz.value}">
        <div class="tzitem-main">
          <div class="tzitem-info">
            <div class="tzitem-name">
              <span class="tzitem-label">${tz.label}</span>
              <span class="tzitem-en">${tz.labelEn}</span>
              ${hasHistorical ? '<span class="tzitem-badge historical">历史支持</span>' : ''}
            </div>
            <div class="tzitem-offset">
              <span class="tzitem-offset-value">${offsetInfo}</span>
              <span class="tzitem-offset-name">${tz.value}</span>
            </div>
          </div>
          <div class="tzitem-actions">
            <button class="tzitem-select" title="${isSelected ? '取消选择' : '选择'}">
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
      <div class="tzitem-historical">
        <div class="tzitem-historical-title">历史数据</div>
        <div class="tzitem-historical-content">
          <div class="tzitem-historical-item">
            <span class="tzitem-historical-label">当前偏移:</span>
            <span class="tzitem-historical-value">${tz.currentOffsetFormatted}</span>
          </div>
          ${historical.historicalOffset !== tz.currentOffset ? `
          <div class="tzitem-historical-item">
            <span class="tzitem-historical-label">历史偏移:</span>
            <span class="tzitem-historical-value">${TimezoneCompatibility.formatOffset(historical.historicalOffset)}</span>
          </div>
          ` : ''}
          <div class="tzitem-historical-item">
            <span class="tzitem-historical-label">说明:</span>
            <span class="tzitem-historical-note">${historical.notes}</span>
          </div>
        </div>
      </div>
    `;
  }

  selectTimezone(timezone) {
    if (this.selectedTimezones.has(timezone)) {
      this.selectedTimezones.delete(timezone);
    } else {
      this.selectedTimezones.add(timezone);
    }

    // 重新渲染结果
    this.renderResults();

    // 触发选择事件
    this.emit('selectionChange', {
      selected: Array.from(this.selectedTimezones),
      timezone: timezone
    });
  }

  showTimezoneInfo(timezone) {
    if (!timezone) {
      this.hideTimezoneInfo();
      return;
    }

    try {
      const tzInfo = TimezoneCompatibility.getIanaTimezone().getTzInfo(new Date(), timezone);
      const historical = TimezoneCompatibility.getIanaTimezone().getTzHistoricalInfo(timezone, new Date().getFullYear());

      if (this.elements.infoOffset) {
        this.elements.infoOffset.innerHTML = `
          <div class="tzinfo-offset-item">
            <span class="tzinfo-label">当前偏移:</span>
            <span class="tzinfo-value">${TimezoneCompatibility.formatOffset(tzInfo.offset)}</span>
          </div>
          <div class="tzinfo-offset-item">
            <span class="tzinfo-label">时区名称:</span>
            <span class="tzinfo-value">${tzInfo.name}</span>
          </div>
          <div class="tzinfo-offset-item">
            <span class="tzinfo-label">夏令时:</span>
            <span class="tzinfo-value">${tzInfo.isDst ? '是' : '否'}</span>
          </div>
        `;
      }

      if (this.elements.infoHistorical && this.options.showHistoricalInfo) {
        this.elements.infoHistorical.innerHTML = `
          <div class="tzinfo-historical-item">
            <span class="tzinfo-label">历史支持:</span>
            <span class="tzinfo-value">${historical.hasHistoricalData ? '是' : '否'}</span>
          </div>
          ${historical.hasHistoricalData ? `
          <div class="tzinfo-historical-item">
            <span class="tzinfo-label">历史偏移:</span>
            <span class="tzinfo-value">${TimezoneCompatibility.formatOffset(historical.historicalOffset)}</span>
          </div>
          ` : ''}
        `;
      }

      if (this.elements.infoDetails) {
        this.elements.infoDetails.innerHTML = `
          <div class="tzinfo-details-item">
            <span class="tzinfo-label">时区值:</span>
            <span class="tzinfo-value">${timezone}</span>
          </div>
          <div class="tzinfo-details-item">
            <span class="tzinfo-label">缩写:</span>
            <span class="tzinfo-value">${tzInfo.abbreviation}</span>
          </div>
        `;
      }

      // 显示信息面板
      if (this.elements.infoPanel) {
        this.elements.infoPanel.style.display = 'block';
      }
    } catch (error) {
      console.error('Failed to show timezone info:', error);
      this.hideTimezoneInfo();
    }
  }

  hideTimezoneInfo() {
    if (this.elements.infoPanel) {
      this.elements.infoPanel.style.display = 'none';
    }
  }

  showError(message) {
    if (this.elements.resultsList) {
      this.elements.resultsList.innerHTML = `<div class="tzresults-error">${message}</div>`;
    }
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

// 创建增强时区选择器的工厂函数
function createEnhancedTimezoneSelector(container, options = {}) {
  return new EnhancedTimezoneSelector(container, options);
}

// 全局导出
if (typeof window !== 'undefined') {
  window.EnhancedTimezoneSelector = EnhancedTimezoneSelector;
  window.createEnhancedTimezoneSelector = createEnhancedTimezoneSelector;
}

export default EnhancedTimezoneSelector;