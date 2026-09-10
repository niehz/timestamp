/**
 * 性能监控模块
 * 
 * 提供全面的性能监控功能，包括加载性能、运行时性能、用户交互性能等
 * 帮助开发者识别性能瓶颈，优化用户体验
 * 
 * @module performance-monitor
 * @author timestamp-developer
 * @version 1.0.0
 */

/**
 * 性能指标收集器
 * 收集各种性能指标数据
 */
export class PerformanceMetrics {
  constructor() {
    this.metrics = {
      // 页面加载性能
      navigation: {},
      resources: [],
      paint: {},
      
      // 运行时性能
      memory: [],
      frames: [],
      longTasks: [],
      
      // 用户交互性能
      interactions: [],
      animations: [],
      
      // 自定义指标
      custom: []
    };
    
    this.isCollecting = false;
    this.startTime = 0;
    this.thresholds = {
      // 性能阈值配置
      fcp: 2000,        // First Contentful Paint
      lcp: 4000,        // Largest Contentful Paint
      fid: 100,         // First Input Delay
      cls: 0.1,         // Cumulative Layout Shift
      longTask: 50,     // 长任务阈值（毫秒）
      memoryWarning: 0.8 // 内存警告阈值
    };
  }
  
  /**
   * 开始收集性能指标
   */
  start() {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    this.startTime = performance.now();
    
    // 初始化性能监控
    this.initNavigationTiming();
    this.initResourceTiming();
    this.initPaintTiming();
    this.initLongTasks();
    this.initMemoryMonitoring();
    this.initFrameMonitoring();
    this.initInteractionMonitoring();
    
    console.log('性能监控已启动');
  }
  
  /**
   * 停止收集性能指标
   */
  stop() {
    if (!this.isCollecting) return;
    
    this.isCollecting = false;
    
    // 收集最终指标
    this.collectFinalMetrics();
    
    console.log('性能监控已停止');
  }
  
  /**
   * 初始化导航时间监控
   */
  initNavigationTiming() {
    if (performance.timing) {
      const timing = performance.timing;
      this.metrics.navigation = {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        request: timing.responseStart - timing.requestStart,
        response: timing.responseEnd - timing.responseStart,
        dom: timing.domInteractive - timing.domLoading,
        load: timing.loadEventEnd - timing.navigationStart,
        firstPaint: timing.responseStart - timing.navigationStart
      };
    }
  }
  
  /**
   * 初始化资源时间监控
   */
  initResourceTiming() {
    if (performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource');
      this.metrics.resources = resources.map(resource => ({
        name: resource.name,
        type: resource.initiatorType,
        duration: resource.duration,
        size: resource.transferSize,
        startTime: resource.startTime
      }));
    }
  }
  
  /**
   * 初始化绘制时间监控
   */
  initPaintTiming() {
    if (performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        this.metrics.paint[entry.name] = entry.startTime;
      });
    }
  }
  
  /**
   * 初始化长任务监控
   */
  initLongTasks() {
    if ('PerformanceLongTaskTiming' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.metrics.longTasks.push({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            attribution: entry.attribution
          });
        });
      });
      
      observer.observe({ type: 'longtask', buffered: true });
    }
  }
  
  /**
   * 初始化内存监控
   */
  initMemoryMonitoring() {
    if (performance.memory) {
      const collectMemory = () => {
        if (!this.isCollecting) return;
        
        const memory = performance.memory;
        this.metrics.memory.push({
          timestamp: Date.now(),
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        });
        
        // 限制内存样本数量
        if (this.metrics.memory.length > 100) {
          this.metrics.memory.shift();
        }
        
        setTimeout(collectMemory, 1000);
      };
      
      collectMemory();
    }
  }
  
  /**
   * 初始化帧监控
   */
  initFrameMonitoring() {
    let lastFrameTime = performance.now();
    let frameCount = 0;
    
    const monitorFrames = () => {
      if (!this.isCollecting) return;
      
      const now = performance.now();
      const delta = now - lastFrameTime;
      
      if (delta >= 1000) {
        const fps = Math.round((frameCount * 1000) / delta);
        
        this.metrics.frames.push({
          timestamp: now,
          fps: fps,
          droppedFrames: frameCount < 55 ? 55 - frameCount : 0
        });
        
        frameCount = 0;
        lastFrameTime = now;
      }
      
      frameCount++;
      requestAnimationFrame(monitorFrames);
    };
    
    monitorFrames();
  }
  
  /**
   * 初始化交互监控
   */
  initInteractionMonitoring() {
    if ('PerformanceEventTiming' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.duration > 0) {
            this.metrics.interactions.push({
              type: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
              processingTime: entry.processingEnd - entry.processingStart
            });
          }
        });
      });
      
      observer.observe({ type: 'event', buffered: true });
    }
  }
  
  /**
   * 收集最终性能指标
   */
  collectFinalMetrics() {
    // 计算汇总指标
    this.metrics.summary = this.calculateSummary();
    
    // 检查性能问题
    this.metrics.issues = this.checkPerformanceIssues();
  }
  
  /**
   * 计算汇总指标
   * @returns {Object} 汇总指标
   */
  calculateSummary() {
    const summary = {
      // 页面加载性能
      loadTime: this.metrics.navigation.load || 0,
      firstPaint: this.metrics.navigation.firstPaint || 0,
      firstContentfulPaint: this.metrics.paint['first-contentful-paint'] || 0,
      largestContentfulPaint: this.metrics.paint['largest-contentful-paint'] || 0,
      
      // 运行时性能
      averageFPS: this.calculateAverageFPS(),
      droppedFrames: this.calculateDroppedFrames(),
      memoryUsage: this.calculateMemoryUsage(),
      
      // 用户交互性能
      averageInteractionDelay: this.calculateAverageInteractionDelay(),
      
      // 资源加载
      totalResources: this.metrics.resources.length,
      averageResourceLoadTime: this.calculateAverageResourceLoadTime()
    };
    
    return summary;
  }
  
  /**
   * 检查性能问题
   * @returns {Array} 性能问题列表
   */
  checkPerformanceIssues() {
    const issues = [];
    
    // 检查页面加载性能
    if (this.metrics.summary.loadTime > this.thresholds.fcp) {
      issues.push({
        type: 'page_load',
        severity: 'warning',
        message: '页面加载时间过长',
        details: `加载时间: ${this.metrics.summary.loadTime}ms`
      });
    }
    
    // 检查FPS
    if (this.metrics.summary.averageFPS < 30) {
      issues.push({
        type: 'frame_rate',
        severity: 'critical',
        message: '帧率过低，可能影响用户体验',
        details: `平均FPS: ${this.metrics.summary.averageFPS}`
      });
    }
    
    // 检查内存使用
    if (this.metrics.summary.memoryUsage > this.thresholds.memoryWarning) {
      issues.push({
        type: 'memory',
        severity: 'warning',
        message: '内存使用率过高',
        details: `使用率: ${(this.metrics.summary.memoryUsage * 100).toFixed(1)}%`
      });
    }
    
    // 检查长任务
    if (this.metrics.longTasks.length > 0) {
      issues.push({
        type: 'long_task',
        severity: 'warning',
        message: '检测到长任务，可能阻塞主线程',
        details: `长任务数量: ${this.metrics.longTasks.length}`
      });
    }
    
    return issues;
  }
  
  /**
   * 计算平均FPS
   * @returns {number} 平均FPS
   */
  calculateAverageFPS() {
    if (this.metrics.frames.length === 0) return 0;
    
    const totalFPS = this.metrics.frames.reduce((sum, frame) => sum + frame.fps, 0);
    return totalFPS / this.metrics.frames.length;
  }
  
  /**
   * 计算掉帧数
   * @returns {number} 总掉帧数
   */
  calculateDroppedFrames() {
    return this.metrics.frames.reduce((sum, frame) => sum + frame.droppedFrames, 0);
  }
  
  /**
   * 计算内存使用率
   * @returns {number} 内存使用率
   */
  calculateMemoryUsage() {
    if (this.metrics.memory.length === 0) return 0;
    
    const latest = this.metrics.memory[this.metrics.memory.length - 1];
    return latest.used / latest.total;
  }
  
  /**
   * 计算平均交互延迟
   * @returns {number} 平均交互延迟
   */
  calculateAverageInteractionDelay() {
    if (this.metrics.interactions.length === 0) return 0;
    
    const totalDelay = this.metrics.interactions.reduce((sum, interaction) => 
      sum + interaction.duration, 0);
    return totalDelay / this.metrics.interactions.length;
  }
  
  /**
   * 计算平均资源加载时间
   * @returns {number} 平均资源加载时间
   */
  calculateAverageResourceLoadTime() {
    if (this.metrics.resources.length === 0) return 0;
    
    const totalTime = this.metrics.resources.reduce((sum, resource) => 
      sum + resource.duration, 0);
    return totalTime / this.metrics.resources.length;
  }
  
  /**
   * 添加自定义性能指标
   * @param {string} name - 指标名称
   * @param {number} value - 指标值
   * @param {Object} metadata - 元数据
   */
  addCustomMetric(name, value, metadata = {}) {
    this.metrics.custom.push({
      name,
      value,
      timestamp: Date.now(),
      metadata
    });
  }
  
  /**
   * 测量函数执行时间
   * @param {Function} fn - 要测量的函数
   * @param {string} name - 函数名称
   * @returns {Function} 包装后的函数
   */
  measureFunction(fn, name) {
    return (...args) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      this.addCustomMetric(`${name}_execution_time`, end - start, {
        function: name
      });
      
      return result;
    };
  }
  
  /**
   * 获取性能报告
   * @returns {Object} 性能报告
   */
  getReport() {
    return {
      metrics: this.metrics,
      summary: this.metrics.summary || {},
      issues: this.metrics.issues || [],
      thresholds: this.thresholds,
      collectionTime: Date.now(),
      duration: Date.now() - this.startTime
    };
  }
  
  /**
   * 导出性能数据
   * @param {string} format - 导出格式 ('json', 'csv')
   * @returns {string} 导出的数据
   */
  exportData(format = 'json') {
    const data = this.getReport();
    
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }
  
  /**
   * 转换为CSV格式
   * @param {Object} data - 性能数据
   * @returns {string} CSV格式数据
   */
  convertToCSV(data) {
    const lines = [];
    
    // 添加标题行
    lines.push('Metric,Value,Unit,Timestamp');
    
    // 添加汇总指标
    Object.entries(data.summary).forEach(([key, value]) => {
      lines.push(`${key},${value},${this.getUnit(key)},${Date.now()}`);
    });
    
    // 添加问题
    data.issues.forEach(issue => {
      lines.push(`issue_${issue.type},${issue.severity},${issue.message},${Date.now()}`);
    });
    
    return lines.join('\n');
  }
  
  /**
   * 获取指标单位
   * @param {string} metric - 指标名称
   * @returns {string} 单位
   */
  getUnit(metric) {
    const units = {
      loadTime: 'ms',
      firstPaint: 'ms',
      firstContentfulPaint: 'ms',
      largestContentfulPaint: 'ms',
      averageFPS: 'fps',
      droppedFrames: 'count',
      memoryUsage: 'ratio',
      averageInteractionDelay: 'ms',
      totalResources: 'count',
      averageResourceLoadTime: 'ms'
    };
    
    return units[metric] || 'unknown';
  }
}

/**
 * 性能监控面板
 * 提供可视化的性能监控界面
 */
export class PerformancePanel {
  constructor(container) {
    this.container = container;
    this.metrics = null;
    this.updateInterval = null;
    this.isVisible = false;
  }
  
  /**
   * 显示性能面板
   */
  show() {
    if (this.isVisible) return;
    
    this.isVisible = true;
    this.createPanel();
    this.startUpdating();
  }
  
  /**
   * 隐藏性能面板
   */
  hide() {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    this.stopUpdating();
    this.container.style.display = 'none';
  }
  
  /**
   * 创建面板
   */
  createPanel() {
    this.container.innerHTML = `
      <div class="performance-panel">
        <div class="panel-header">
          <h3>性能监控面板</h3>
          <button class="close-btn">✕</button>
        </div>
        <div class="panel-content">
          <div class="metrics-grid">
            <div class="metric-card">
              <h4>帧率 (FPS)</h4>
              <div class="metric-value" id="fps-value">--</div>
            </div>
            <div class="metric-card">
              <h4>内存使用</h4>
              <div class="metric-value" id="memory-value">--</div>
            </div>
            <div class="metric-card">
              <h4>加载时间</h4>
              <div class="metric-value" id="load-value">--</div>
            </div>
            <div class="metric-card">
              <h4>交互延迟</h4>
              <div class="metric-value" id="interaction-value">--</div>
            </div>
          </div>
          <div class="issues-section">
            <h4>性能问题</h4>
            <div class="issues-list" id="issues-list"></div>
          </div>
        </div>
      </div>
    `;
    
    // 添加样式
    this.addStyles();
    
    // 绑定事件
    this.bindEvents();
    
    // 显示面板
    this.container.style.display = 'block';
  }
  
  /**
   * 添加样式
   */
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .performance-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        border-radius: 8px;
        padding: 16px;
        font-family: monospace;
        z-index: 10000;
        max-height: 80vh;
        overflow-y: auto;
      }
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      
      .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
      }
      
      .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
      
      .metrics-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .metric-card {
        background: rgba(255, 255, 255, 0.1);
        padding: 12px;
        border-radius: 6px;
        text-align: center;
      }
      
      .metric-card h4 {
        margin: 0 0 8px 0;
        font-size: 12px;
        color: #ccc;
      }
      
      .metric-value {
        font-size: 20px;
        font-weight: bold;
        color: #4CAF50;
      }
      
      .metric-value.warning {
        color: #FF9800;
      }
      
      .metric-value.error {
        color: #F44336;
      }
      
      .issues-section {
        margin-top: 16px;
      }
      
      .issues-section h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #ccc;
      }
      
      .issues-list {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        padding: 8px;
        max-height: 200px;
        overflow-y: auto;
      }
      
      .issue-item {
        padding: 8px;
        margin-bottom: 4px;
        border-radius: 4px;
        font-size: 12px;
      }
      
      .issue-item.critical {
        background: rgba(244, 67, 54, 0.2);
        border-left: 3px solid #F44336;
      }
      
      .issue-item.warning {
        background: rgba(255, 152, 0, 0.2);
        border-left: 3px solid #FF9800;
      }
      
      .issue-item.info {
        background: rgba(33, 150, 243, 0.2);
        border-left: 3px solid #2196F3;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * 绑定事件
   */
  bindEvents() {
    const closeBtn = this.container.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => this.hide());
  }
  
  /**
   * 开始更新
   */
  startUpdating() {
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
    }, 1000);
  }
  
  /**
   * 停止更新
   */
  stopUpdating() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  /**
   * 更新指标显示
   */
  updateMetrics() {
    if (!this.metrics) return;
    
    // 更新FPS
    const fpsElement = document.getElementById('fps-value');
    if (fpsElement) {
      const fps = this.metrics.summary.averageFPS || 0;
      fpsElement.textContent = fps.toFixed(1);
      fpsElement.className = fps < 30 ? 'metric-value error' : 
                            fps < 50 ? 'metric-value warning' : 'metric-value';
    }
    
    // 更新内存使用
    const memoryElement = document.getElementById('memory-value');
    if (memoryElement) {
      const memory = this.metrics.summary.memoryUsage || 0;
      memoryElement.textContent = `${(memory * 100).toFixed(1)}%`;
      memoryElement.className = memory > 0.8 ? 'metric-value error' : 
                              memory > 0.6 ? 'metric-value warning' : 'metric-value';
    }
    
    // 更新加载时间
    const loadElement = document.getElementById('load-value');
    if (loadElement) {
      const loadTime = this.metrics.summary.loadTime || 0;
      loadElement.textContent = `${loadTime.toFixed(0)}ms`;
      loadElement.className = loadTime > 3000 ? 'metric-value error' : 
                             loadTime > 2000 ? 'metric-value warning' : 'metric-value';
    }
    
    // 更新交互延迟
    const interactionElement = document.getElementById('interaction-value');
    if (interactionElement) {
      const interaction = this.metrics.summary.averageInteractionDelay || 0;
      interactionElement.textContent = `${interaction.toFixed(0)}ms`;
      interactionElement.className = interaction > 100 ? 'metric-value error' : 
                                   interaction > 50 ? 'metric-value warning' : 'metric-value';
    }
    
    // 更新问题列表
    this.updateIssues();
  }
  
  /**
   * 更新问题列表
   */
  updateIssues() {
    const issuesList = document.getElementById('issues-list');
    if (!issuesList) return;
    
    issuesList.innerHTML = '';
    
    this.metrics.issues.forEach(issue => {
      const issueElement = document.createElement('div');
      issueElement.className = `issue-item ${issue.severity}`;
      issueElement.innerHTML = `
        <div><strong>${issue.type}</strong></div>
        <div>${issue.message}</div>
        <div style="font-size: 11px; color: #999;">${issue.details}</div>
      `;
      issuesList.appendChild(issueElement);
    });
  }
  
  /**
   * 设置性能数据
   * @param {Object} metrics - 性能指标
   */
  setMetrics(metrics) {
    this.metrics = metrics;
    this.updateMetrics();
  }
}

// 创建全局实例
export const performanceMetrics = new PerformanceMetrics();

// 创建性能面板
let performancePanel = null;
export function createPerformancePanel(container) {
  performancePanel = new PerformancePanel(container);
  return performancePanel;
}

// 导出便捷函数
export function startPerformanceMonitoring() {
  performanceMetrics.start();
}

export function stopPerformanceMonitoring() {
  performanceMetrics.stop();
}

export function getPerformanceReport() {
  return performanceMetrics.getReport();
}

export function exportPerformanceData(format = 'json') {
  return performanceMetrics.exportData(format);
}

export function measurePerformance(name, fn) {
  return performanceMetrics.measureFunction(fn, name);
}

// 初始化性能监控
if (typeof window !== 'undefined') {
  // 页面加载完成后自动开始监控
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startPerformanceMonitoring();
    });
  } else {
    startPerformanceMonitoring();
  }
  
  // 页面卸载前停止监控
  window.addEventListener('beforeunload', () => {
    stopPerformanceMonitoring();
  });
}