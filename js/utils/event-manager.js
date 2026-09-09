/**
 * 事件管理器 - 统一管理事件监听器
 */

/**
 * 事件管理器类
 */
export class EventManager {
  constructor() {
    this.listeners = new Map();
  }
  
  /**
   * 添加事件监听器
   * @param {Element} element - 元素
   * @param {string} event - 事件类型
   * @param {Function} handler - 处理函数
   * @param {Object} options - 选项
   */
  add(element, event, handler, options = {}) {
    const key = `${event}_${handler.name || 'anonymous'}`;
    
    // 如果已经存在相同的监听器，先移除
    if (this.listeners.has(key)) {
      this.remove(element, event, handler);
    }
    
    // 添加新监听器
    element.addEventListener(event, handler, options);
    
    // 保存监听器信息
    this.listeners.set(key, {
      element,
      event,
      handler,
      options
    });
  }
  
  /**
   * 移除事件监听器
   * @param {Element} element - 元素
   * @param {string} event - 事件类型
   * @param {Function} handler - 处理函数
   */
  remove(element, event, handler) {
    const key = `${event}_${handler.name || 'anonymous'}`;
    
    if (this.listeners.has(key)) {
      const { element: savedElement, event: savedEvent, handler: savedHandler } = this.listeners.get(key);
      if (savedElement === element && savedEvent === event && savedHandler === handler) {
        element.removeEventListener(event, handler);
        this.listeners.delete(key);
      }
    }
  }
  
  /**
   * 移除元素的所有事件监听器
   * @param {Element} element - 元素
   */
  removeAll(element) {
    for (const [key, listener] of this.listeners) {
      if (listener.element === element) {
        listener.element.removeEventListener(listener.event, listener.handler);
        this.listeners.delete(key);
      }
    }
  }
  
  /**
   * 清理所有事件监听器
   */
  clear() {
    for (const [key, listener] of this.listeners) {
      listener.element.removeEventListener(listener.event, listener.handler);
    }
    this.listeners.clear();
  }
  
  /**
   * 获取监听器数量
   * @returns {number} 监听器数量
   */
  size() {
    return this.listeners.size;
  }
  
  /**
   * 检查是否包含特定监听器
   * @param {Element} element - 元素
   * @param {string} event - 事件类型
   * @param {Function} handler - 处理函数
   * @returns {boolean} 是否包含
   */
  has(element, event, handler) {
    const key = `${event}_${handler.name || 'anonymous'}`;
    return this.listeners.has(key) && 
           this.listeners.get(key).element === element &&
           this.listeners.get(key).event === event &&
           this.listeners.get(key).handler === handler;
  }
  
  /**
   * 获取元素的所有监听器
   * @param {Element} element - 元素
   * @returns {Array} 监听器数组
   */
  getElementListeners(element) {
    const listeners = [];
    for (const [key, listener] of this.listeners) {
      if (listener.element === element) {
        listeners.push({
          key,
          event: listener.event,
          handler: listener.handler,
          options: listener.options
        });
      }
    }
    return listeners;
  }
  
  /**
   * 获取事件的所有监听器
   * @param {string} event - 事件类型
   * @returns {Array} 监听器数组
   */
  getEventListeners(event) {
    const listeners = [];
    for (const [key, listener] of this.listeners) {
      if (listener.event === event) {
        listeners.push({
          key,
          element: listener.element,
          handler: listener.handler,
          options: listener.options
        });
      }
    }
    return listeners;
  }
  
  /**
   * 获取处理函数的所有监听器
   * @param {Function} handler - 处理函数
   * @returns {Array} 监听器数组
   */
  getHandlerListeners(handler) {
    const listeners = [];
    for (const [key, listener] of this.listeners) {
      if (listener.handler === handler) {
        listeners.push({
          key,
          element: listener.element,
          event: listener.event,
          options: listener.options
        });
      }
    }
    return listeners;
  }
  
  /**
   * 统计监听器信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const stats = {
      total: this.listeners.size,
      byElement: {},
      byEvent: {},
      byHandler: {}
    };
    
    for (const [key, listener] of this.listeners) {
      // 按元素统计
      const elementKey = listener.element.tagName || 'unknown';
      stats.byElement[elementKey] = (stats.byElement[elementKey] || 0) + 1;
      
      // 按事件统计
      stats.byEvent[listener.event] = (stats.byEvent[listener.event] || 0) + 1;
      
      // 按处理函数统计
      const handlerKey = listener.handler.name || 'anonymous';
      stats.byHandler[handlerKey] = (stats.byHandler[handlerKey] || 0) + 1;
    }
    
    return stats;
  }
  
  /**
   * 调试信息
   * @returns {Object} 调试信息
   */
  debug() {
    return {
      listeners: Array.from(this.listeners.entries()),
      stats: this.getStats()
    };
  }
}

/**
 * 全局事件管理器实例
 */
export const globalEventManager = new EventManager();

/**
 * 事件监听器装饰器
 * @param {string} event - 事件类型
 * @param {Object} options - 选项
 * @returns {Function} 装饰器函数
 */
export function eventListener(event, options = {}) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(element, ...args) {
      const handler = (...eventArgs) => {
        return originalMethod.apply(this, [...eventArgs, ...args]);
      };
      
      // 保存原始方法名用于调试
      handler.name = `eventListener:${propertyKey}`;
      
      // 使用事件管理器添加监听器
      globalEventManager.add(element, event, handler, options);
      
      // 返回处理函数以便后续移除
      return handler;
    };
  };
}

/**
 * 一次性事件监听器
 * @param {Element} element - 元素
 * @param {string} event - 事件类型
 * @param {Function} handler - 处理函数
 * @param {Object} options - 选项
 */
export function once(element, event, handler, options = {}) {
  const onceHandler = (...args) => {
    handler(...args);
    globalEventManager.remove(element, event, onceHandler);
  };
  
  globalEventManager.add(element, event, onceHandler, options);
}

/**
 * 事件委托管理器
 */
export class EventDelegator {
  constructor(container) {
    this.container = container;
    this.handlers = new Map();
    this.eventManager = new EventManager();
  }
  
  /**
   * 添加委托事件监听器
   * @param {string} event - 事件类型
   * @param {string} selector - 选择器
   * @param {Function} handler - 处理函数
   * @param {Object} options - 选项
   */
  on(event, selector, handler, options = {}) {
    const wrappedHandler = (e) => {
      const target = e.target.closest(selector);
      if (target) {
        handler.call(target, e, target);
      }
    };
    
    const key = `${event}_${selector}`;
    this.handlers.set(key, { selector, handler, wrappedHandler });
    
    this.eventManager.add(this.container, event, wrappedHandler, options);
  }
  
  /**
   * 移除委托事件监听器
   * @param {string} event - 事件类型
   * @param {string} selector - 选择器
   * @param {Function} handler - 处理函数
   */
  off(event, selector, handler) {
    const key = `${event}_${selector}`;
    const { wrappedHandler } = this.handlers.get(key) || {};
    
    if (wrappedHandler) {
      this.eventManager.remove(this.container, event, wrappedHandler);
      this.handlers.delete(key);
    }
  }
  
  /**
   * 清理所有委托事件监听器
   */
  clear() {
    this.eventManager.clear();
    this.handlers.clear();
  }
}

/**
 * 创建事件总线
 * @returns {Object} 事件总线
 */
export function createEventBus() {
  const listeners = new Map();
  
  return {
    /**
     * 监听事件
     * @param {string} event - 事件类型
     * @param {Function} handler - 处理函数
     */
    on(event, handler) {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event).push(handler);
    },
    
    /**
     * 移除事件监听
     * @param {string} event - 事件类型
     * @param {Function} handler - 处理函数
     */
    off(event, handler) {
      if (listeners.has(event)) {
        const handlers = listeners.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    },
    
    /**
     * 触发事件
     * @param {string} event - 事件类型
     * @param {...any} args - 参数
     */
    emit(event, ...args) {
      if (listeners.has(event)) {
        listeners.get(event).forEach(handler => handler(...args));
      }
    },
    
    /**
     * 一次性监听
     * @param {string} event - 事件类型
     * @param {Function} handler - 处理函数
     */
    once(event, handler) {
      const onceHandler = (...args) => {
        handler(...args);
        this.off(event, onceHandler);
      };
      this.on(event, onceHandler);
    },
    
    /**
     * 移除所有监听器
     * @param {string} event - 事件类型
     */
    removeAllListeners(event) {
      if (event) {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
    },
    
    /**
     * 获取事件监听器数量
     * @param {string} event - 事件类型
     * @returns {number} 数量
     */
    listenerCount(event) {
      if (listeners.has(event)) {
        return listeners.get(event).length;
      }
      return 0;
    },
    
    /**
     * 获取所有事件类型
     * @returns {Array} 事件类型数组
     */
    eventNames() {
      return Array.from(listeners.keys());
    }
  };
}

/**
 * 全局事件总线
 */
export const globalEventBus = createEventBus();

/**
 * 事件发布者
 */
export class EventEmitter {
  constructor() {
    this.eventBus = createEventBus();
  }
  
  /**
   * 监听事件
   * @param {string} event - 事件类型
   * @param {Function} handler - 处理函数
   */
  on(event, handler) {
    this.eventBus.on(event, handler);
  }
  
  /**
   * 移除事件监听
   * @param {string} event - 事件类型
   * @param {Function} handler - 处理函数
   */
  off(event, handler) {
    this.eventBus.off(event, handler);
  }
  
  /**
   * 触发事件
   * @param {string} event - 事件类型
   * @param {...any} args - 参数
   */
  emit(event, ...args) {
    this.eventBus.emit(event, ...args);
  }
  
  /**
   * 一次性监听
   * @param {string} event - 事件类型
   * @param {Function} handler - 处理函数
   */
  once(event, handler) {
    this.eventBus.once(event, handler);
  }
  
  /**
   * 移除所有监听器
   * @param {string} event - 事件类型
   */
  removeAllListeners(event) {
    this.eventBus.removeAllListeners(event);
  }
  
  /**
   * 获取事件监听器数量
   * @param {string} event - 事件类型
   * @returns {number} 数量
   */
  listenerCount(event) {
    return this.eventBus.listenerCount(event);
  }
  
  /**
   * 获取所有事件类型
   * @returns {Array} 事件类型数组
   */
  eventNames() {
    return this.eventBus.eventNames();
  }
}