/**
 * 内存管理模块
 * 
 * 提供内存泄漏检测、事件监听器管理、组件生命周期管理等功能
 * 帮助开发者识别和修复内存泄漏问题，优化内存使用
 * 
 * @module memory-manager
 * @author timestamp-developer
 * @version 1.0.0
 */

/**
 * 内存泄漏检测器
 * 用于检测和报告可能的内存泄漏
 */
export class MemoryLeakDetector {
  constructor() {
    this.monitoredObjects = new WeakMap();
    this.snapshotInterval = null;
    this.changeThreshold = 0.1; // 内存变化阈值
    this.isMonitoring = false;
  }
  
  /**
   * 开始监控内存使用
   * @param {number} interval - 监控间隔（毫秒）
   */
  start(interval = 5000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.takeInitialSnapshot();
    
    this.snapshotInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, interval);
  }
  
  /**
   * 停止监控
   */
  stop() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }
  }
  
  /**
   * 监控对象
   * @param {Object} object - 要监控的对象
   * @param {string} name - 对象名称
   */
  monitor(object, name) {
    if (typeof object !== 'object' || object === null) return;
    
    const info = {
      name,
      references: new WeakMap(),
      createdAt: Date.now(),
      lastChecked: Date.now()
    };
    
    this.monitoredObjects.set(object, info);
    this.takeSnapshot(object);
  }
  
  /**
   * 取消监控对象
   * @param {Object} object - 要取消监控的对象
   */
  unmonitor(object) {
    this.monitoredObjects.delete(object);
  }
  
  /**
   * 取初始快照
   */
  takeInitialSnapshot() {
    this.monitoredObjects.forEach((info, object) => {
      this.takeSnapshot(object);
    });
  }
  
  /**
   * 对象快照
   * @param {Object} object - 对象
   */
  takeSnapshot(object) {
    const info = this.monitoredObjects.get(object);
    if (!info) return;
    
    info.references = this.mapReferences(object);
    info.lastChecked = Date.now();
  }
  
  /**
   * 映射对象引用
   * @param {Object} object - 对象
   * @returns {WeakMap} 引用映射
   */
  mapReferences(object) {
    const references = new WeakMap();
    
    // 简单的引用映射（实际实现可能需要更复杂的逻辑）
    if (object && typeof object === 'object') {
      // 检查是否有事件监听器
      if (object.element && object.eventListeners) {
        references.set('eventListeners', object.eventListeners.length);
      }
      
      // 检查是否有定时器
      if (object.timers) {
        references.set('timers', object.timers.length);
      }
      
      // 检查是否有子组件
      if (object.children) {
        references.set('children', object.children.size);
      }
    }
    
    return references;
  }
  
  /**
   * 检查内存使用
   */
  checkMemoryUsage() {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize;
      const total = performance.memory.totalJSHeapSize;
      const limit = performance.memory.jsHeapSizeLimit;
      
      const usage = used / total;
      
      if (usage > 0.8) {
        console.warn(`内存使用率过高: ${(usage * 100).toFixed(1)}%`);
      }
    }
    
    // 检查监控对象的变化
    this.monitoredObjects.forEach((info, object) => {
      this.checkObjectChanges(object, info);
    });
  }
  
  /**
   * 检查对象变化
   * @param {Object} object - 对象
   * @param {Object} info - 对象信息
   */
  checkObjectChanges(object, info) {
    const currentReferences = this.mapReferences(object);
    const hasSignificantChange = this.detectChanges(info.references, currentReferences);
    
    if (hasSignificantChange) {
      console.warn(`对象 ${info.name} 可能存在内存泄漏`);
      console.log('对象信息:', {
        name: info.name,
        age: Date.now() - info.createdAt,
        changes: this.getChanges(info.references, currentReferences)
      });
    }
    
    this.takeSnapshot(object);
  }
  
  /**
   * 检测引用变化
   * @param {WeakMap} oldReferences - 旧引用
   * @param {WeakMap} newReferences - 新引用
   * @returns {boolean} 是否有显著变化
   */
  detectChanges(oldReferences, newReferences) {
    for (const [key, oldValue] of oldReferences) {
      const newValue = newReferences.get(key);
      if (newValue !== undefined && Math.abs(newValue - oldValue) > this.changeThreshold) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * 获取变化详情
   * @param {WeakMap} oldReferences - 旧引用
   * @param {WeakMap} newReferences - 新引用
   * @returns {Object} 变化详情
   */
  getChanges(oldReferences, newReferences) {
    const changes = {};
    
    oldReferences.forEach((oldValue, key) => {
      const newValue = newReferences.get(key);
      if (newValue !== oldValue) {
        changes[key] = { from: oldValue, to: newValue };
      }
    });
    
    return changes;
  }
  
  /**
   * 获取监控报告
   * @returns {Object} 监控报告
   */
  getReport() {
    const report = {
      totalMonitored: this.monitoredObjects.size,
      objects: [],
      timestamp: Date.now()
    };
    
    this.monitoredObjects.forEach((info, object) => {
      report.objects.push({
        name: info.name,
        age: Date.now() - info.createdAt,
        references: this.mapReferences(object)
      });
    });
    
    return report;
  }
}

/**
 * 事件监听器管理器
 * 用于统一管理事件监听器，确保正确清理
 */
export class EventListenerManager {
  constructor() {
    this.listeners = new WeakMap();
    this.globalListeners = [];
  }
  
  /**
   * 添加事件监听器
   * @param {HTMLElement|Object} target - 目标对象
   * @param {string} event - 事件类型
   * @param {Function} handler - 处理函数
   * @param {Object} options - 事件选项
   * @returns {Object} 监听器信息
   */
  add(target, event, handler, options = {}) {
    const listenerInfo = {
      target,
      event,
      handler,
      options,
      addedAt: Date.now()
    };
    
    // 如果是DOM元素
    if (target instanceof HTMLElement) {
      target.addEventListener(event, handler, options);
      
      if (!this.listeners.has(target)) {
        this.listeners.set(target, []);
      }
      this.listeners.get(target).push(listenerInfo);
    } else {
      // 全局监听器
      this.globalListeners.push(listenerInfo);
    }
    
    return listenerInfo;
  }
  
  /**
   * 移除事件监听器
   * @param {HTMLElement|Object} target - 目标对象
   * @param {string} event - 事件类型
   * @param {Function} handler - 处理函数
   */
  remove(target, event, handler) {
    if (target instanceof HTMLElement) {
      const targetListeners = this.listeners.get(target);
      if (targetListeners) {
        const index = targetListeners.findIndex(l => 
          l.event === event && l.handler === handler
        );
        
        if (index > -1) {
          const listener = targetListeners[index];
          target.removeEventListener(event, handler, listener.options);
          targetListeners.splice(index, 1);
        }
      }
    } else {
      // 移除全局监听器
      const index = this.globalListeners.findIndex(l => 
        l.event === event && l.handler === handler
      );
      
      if (index > -1) {
        this.globalListeners.splice(index, 1);
      }
    }
  }
  
  /**
   * 移除目标的所有事件监听器
   * @param {HTMLElement|Object} target - 目标对象
   */
  removeAll(target) {
    if (target instanceof HTMLElement) {
      const targetListeners = this.listeners.get(target);
      if (targetListeners) {
        targetListeners.forEach(listener => {
          target.removeEventListener(
            listener.event, 
            listener.handler, 
            listener.options
          );
        });
        this.listeners.delete(target);
      }
    }
  }
  
  /**
   * 清理所有监听器
   */
  clearAll() {
    // 清理DOM元素监听器
    this.listeners.forEach((listeners, target) => {
      listeners.forEach(listener => {
        target.removeEventListener(
          listener.event, 
          listener.handler, 
          listener.options
        );
      });
    });
    this.listeners.clear();
    
    // 清理全局监听器
    this.globalListeners = [];
  }
  
  /**
   * 获取监听器统计
   * @returns {Object} 统计信息
   */
  getStats() {
    const stats = {
      totalListeners: 0,
      byTarget: {},
      globalListeners: this.globalListeners.length,
      oldestListener: null,
      newestListener: null
    };
    
    this.listeners.forEach((listeners, target) => {
      const targetKey = target.id || target.className || 'anonymous';
      stats.byTarget[targetKey] = listeners.length;
      stats.totalListeners += listeners.length;
      
      listeners.forEach(listener => {
        if (!stats.oldestListener || listener.addedAt < stats.oldestListener.addedAt) {
          stats.oldestListener = listener;
        }
        if (!stats.newestListener || listener.addedAt > stats.newestListener.addedAt) {
          stats.newestListener = listener;
        }
      });
    });
    
    stats.totalListeners += stats.globalListeners;
    
    return stats;
  }
}

/**
 * 组件生命周期管理器
 * 用于管理组件的创建、更新和销毁
 */
export class ComponentLifecycleManager {
  constructor() {
    this.components = new WeakMap();
    this.componentStack = [];
    this.destroyedComponents = new Set();
  }
  
  /**
   * 注册组件
   * @param {Object} component - 组件实例
   * @param {string} name - 组件名称
   */
  register(component, name) {
    const lifecycle = {
      name,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      state: 'created',
      dependencies: new Set(),
      cleanupTasks: []
    };
    
    this.components.set(component, lifecycle);
    this.componentStack.push(component);
    
    console.log(`组件 ${name} 已创建`);
  }
  
  /**
   * 更新组件
   * @param {Object} component - 组件实例
   */
  update(component) {
    const lifecycle = this.components.get(component);
    if (lifecycle) {
      lifecycle.lastUpdated = Date.now();
      lifecycle.state = 'updated';
    }
  }
  
  /**
   * 销毁组件
   * @param {Object} component - 组件实例
   */
  destroy(component) {
    const lifecycle = this.components.get(component);
    if (!lifecycle) return;
    
    // 执行清理任务
    lifecycle.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('清理任务执行失败:', error);
      }
    });
    
    lifecycle.state = 'destroyed';
    lifecycle.destroyedAt = Date.now();
    this.destroyedComponents.add(component);
    this.components.delete(component);
    
    // 从组件栈中移除
    const index = this.componentStack.indexOf(component);
    if (index > -1) {
      this.componentStack.splice(index, 1);
    }
    
    console.log(`组件 ${lifecycle.name} 已销毁`);
  }
  
  /**
   * 添加依赖关系
   * @param {Object} component - 组件实例
   * @param {Object} dependency - 依赖组件
   */
  addDependency(component, dependency) {
    const lifecycle = this.components.get(component);
    if (lifecycle) {
      lifecycle.dependencies.add(dependency);
    }
  }
  
  /**
   * 添加清理任务
   * @param {Object} component - 组件实例
   * @param {Function} task - 清理任务
   */
  addCleanupTask(component, task) {
    const lifecycle = this.components.get(component);
    if (lifecycle) {
      lifecycle.cleanupTasks.push(task);
    }
  }
  
  /**
   * 检查组件状态
   * @param {Object} component - 组件实例
   * @returns {Object} 组件状态
   */
  checkComponent(component) {
    const lifecycle = this.components.get(component);
    if (!lifecycle) {
      return { state: 'unknown' };
    }
    
    return {
      name: lifecycle.name,
      state: lifecycle.state,
      age: Date.now() - lifecycle.createdAt,
      timeSinceUpdate: Date.now() - lifecycle.lastUpdated,
      dependencies: lifecycle.dependencies.size,
      cleanupTasks: lifecycle.cleanupTasks.length
    };
  }
  
  /**
   * 获取所有组件状态
   * @returns {Array} 组件状态数组
   */
  getAllComponents() {
    const states = [];
    
    this.components.forEach((lifecycle, component) => {
      states.push({
        component,
        ...this.checkComponent(component)
      });
    });
    
    return states;
  }
  
  /**
   * 检查内存泄漏
   * @returns {Array} 可能泄漏的组件
   */
  checkMemoryLeaks() {
    const leaks = [];
    const now = Date.now();
    const oldThreshold = 24 * 60 * 60 * 1000; // 24小时
    
    this.components.forEach((lifecycle, component) => {
      if (lifecycle.state === 'created' && 
          now - lifecycle.createdAt > oldThreshold) {
        leaks.push({
          component,
          name: lifecycle.name,
          age: now - lifecycle.createdAt,
          issue: '长期存在的未更新组件'
        });
      }
    });
    
    return leaks;
  }
}

/**
 * 内存使用监控器
 * 监控内存使用情况，提供内存优化建议
 */
export class MemoryUsageMonitor {
  constructor() {
    this.metrics = {
      used: 0,
      total: 0,
      limit: 0,
      samples: [],
      maxSamples: 100
    };
    this.isMonitoring = false;
    this.monitorInterval = null;
  }
  
  /**
   * 开始监控
   * @param {number} interval - 监控间隔（毫秒）
   */
  start(interval = 1000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitorInterval = setInterval(() => {
      this.collectMetrics();
    }, interval);
  }
  
  /**
   * 停止监控
   */
  stop() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }
  
  /**
   * 收集指标
   */
  collectMetrics() {
    if (performance.memory) {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
      
      this.metrics.used = usedJSHeapSize;
      this.metrics.total = totalJSHeapSize;
      this.metrics.limit = jsHeapSizeLimit;
      
      // 添加样本
      this.metrics.samples.push({
        timestamp: Date.now(),
        used: usedJSHeapSize,
        total: totalJSHeapSize,
        limit: jsHeapSizeLimit
      });
      
      // 限制样本数量
      if (this.metrics.samples.length > this.metrics.maxSamples) {
        this.metrics.samples.shift();
      }
    }
  }
  
  /**
   * 获取当前内存使用情况
   * @returns {Object} 内存使用情况
   */
  getCurrentUsage() {
    const { used, total, limit } = this.metrics;
    const percentage = total > 0 ? (used / total) * 100 : 0;
    
    return {
      used: this.formatBytes(used),
      total: this.formatBytes(total),
      limit: this.formatBytes(limit),
      percentage: percentage.toFixed(2),
      status: this.getStatus(percentage)
    };
  }
  
  /**
   * 获取内存使用趋势
   * @returns {Object} 趋势分析
   */
  getTrend() {
    const samples = this.metrics.samples;
    if (samples.length < 2) {
      return { trend: 'insufficient_data' };
    }
    
    const recent = samples.slice(-10); // 最近10个样本
    const oldest = recent[0];
    const newest = recent[recent.length - 1];
    
    const change = newest.used - oldest.used;
    const trend = change > 0 ? 'increasing' : 'decreasing';
    const rate = change / (newest.timestamp - oldest.timestamp) * 1000; // 每秒增长
    
    return {
      trend,
      rate: this.formatBytes(rate) + '/s',
      change: this.formatBytes(change),
      duration: newest.timestamp - oldest.timestamp
    };
  }
  
  /**
   * 获取内存优化建议
   * @returns {Array} 优化建议
   */
  getOptimizationSuggestions() {
    const suggestions = [];
    const current = this.getCurrentUsage();
    
    if (current.percentage > 80) {
      suggestions.push({
        type: 'critical',
        message: '内存使用率过高，可能导致性能问题',
        action: '清理不必要的对象和缓存'
      });
    } else if (current.percentage > 60) {
      suggestions.push({
        type: 'warning',
        message: '内存使用率较高，建议优化',
        action: '检查是否有内存泄漏'
      });
    }
    
    const trend = this.getTrend();
    if (trend.trend === 'increasing') {
      suggestions.push({
        type: 'warning',
        message: '内存使用持续增长',
        action: '检查是否有未清理的事件监听器或定时器'
      });
    }
    
    return suggestions;
  }
  
  /**
   * 格式化字节数
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的字符串
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * 获取状态
   * @param {number} percentage - 使用率百分比
   * @returns {string} 状态
   */
  getStatus(percentage) {
    if (percentage > 90) return 'critical';
    if (percentage > 80) return 'warning';
    if (percentage > 60) return 'moderate';
    return 'normal';
  }
}

// 创建全局实例
export const memoryLeakDetector = new MemoryLeakDetector();
export const eventListenerManager = new EventListenerManager();
export const componentLifecycleManager = new ComponentLifecycleManager();
export const memoryUsageMonitor = new MemoryUsageMonitor();

// 导出便捷函数
export function startMemoryMonitoring(interval = 5000) {
  memoryLeakDetector.start(interval);
  memoryUsageMonitor.start(1000);
}

export function stopMemoryMonitoring() {
  memoryLeakDetector.stop();
  memoryUsageMonitor.stop();
}

export function monitorComponent(component, name) {
  componentLifecycleManager.register(component, name);
  return component;
}

export function cleanupComponent(component) {
  componentLifecycleManager.destroy(component);
  eventListenerManager.removeAll(component);
  return null;
}

// 初始化内存监控
if (typeof window !== 'undefined') {
  // 页面卸载时清理资源
  window.addEventListener('beforeunload', () => {
    stopMemoryMonitoring();
    eventListenerManager.clearAll();
  });
}