/**
 * DOM操作优化模块
 * 
 * 提供高性能的DOM操作工具，包括文档片段、事件委托、虚拟滚动等功能
 * 优化DOM操作性能，减少重绘和回流，提升用户体验
 * 
 * @module dom-optimizer
 * @author timestamp-developer
 * @version 1.0.0
 */

/**
 * 文档片段工具类
 * 用于批量DOM操作，减少重绘和回流
 */
export class FragmentBuilder {
  constructor() {
    this.fragment = document.createDocumentFragment();
    this.elements = [];
  }
  
  /**
   * 创建元素并添加到片段
   * @param {string} tag - 标签名
   * @param {Object} attributes - 属性对象
   * @param {string} text - 文本内容
   * @param {string} className - CSS类名
   * @returns {HTMLElement} 创建的元素
   */
  createElement(tag, attributes = {}, text = '', className = '') {
    const element = document.createElement(tag);
    
    if (className) {
      element.className = className;
    }
    
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
    
    if (text) {
      element.textContent = text;
    }
    
    this.fragment.appendChild(element);
    this.elements.push(element);
    
    return element;
  }
  
  /**
   * 添加现有元素到片段
   * @param {HTMLElement} element - 要添加的元素
   * @returns {HTMLElement} 添加的元素
   */
  appendElement(element) {
    this.fragment.appendChild(element);
    this.elements.push(element);
    return element;
  }
  
  /**
   * 批量添加元素
   * @param {Array} elements - 元素数组
   */
  appendElements(elements) {
    elements.forEach(element => {
      this.appendElement(element);
    });
  }
  
  /**
   * 获取所有创建的元素
   * @returns {Array} 元素数组
   */
  getElements() {
    return this.elements;
  }
  
  /**
   * 获取文档片段
   * @returns {DocumentFragment} 文档片段
   */
  getFragment() {
    return this.fragment;
  }
  
  /**
   * 清空片段
   */
  clear() {
    this.fragment = document.createDocumentFragment();
    this.elements = [];
  }
  
  /**
   * 将片段插入到指定容器
   * @param {HTMLElement} container - 容器元素
   * @param {string} position - 插入位置 ('beforebegin', 'afterbegin', 'beforeend', 'afterend')
   * @returns {Array} 插入的元素数组
   */
  appendTo(container, position = 'beforeend') {
    container.insertAdjacentElement(position, this.fragment);
    return this.elements;
  }
}

/**
 * 事件委托管理器
 * 用于高效处理动态元素的事件
 */
export class EventDelegator {
  constructor() {
    this.handlers = new Map();
    this.delegatedElements = new WeakMap();
  }
  
  /**
   * 添加事件委托
   * @param {HTMLElement} container - 容器元素
   * @param {string} selector - 选择器
   * @param {string} event - 事件类型
   * @param {Function} handler - 事件处理函数
   * @param {Object} options - 事件选项
   */
  delegate(container, selector, event, handler, options = {}) {
    const key = `${selector}:${event}`;
    
    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }
    
    this.handlers.get(key).push({ container, selector, event, handler, options });
    
    // 如果容器还没有委托事件，添加事件监听器
    if (!this.delegatedElements.has(container)) {
      this.delegatedElements.set(container, new Set());
      container.addEventListener(event, this.handleDelegatedEvent.bind(this), options);
    }
    
    this.delegatedElements.get(container).add(key);
  }
  
  /**
   * 移除事件委托
   * @param {HTMLElement} container - 容器元素
   * @param {string} selector - 选择器
   * @param {string} event - 事件类型
   * @param {Function} handler - 事件处理函数
   */
  undelegate(container, selector, event, handler) {
    const key = `${selector}:${event}`;
    const handlers = this.handlers.get(key);
    
    if (handlers) {
      const index = handlers.findIndex(h => 
        h.container === container && 
        h.handler === handler
      );
      
      if (index > -1) {
        handlers.splice(index, 1);
        
        // 如果没有更多处理器，移除事件监听器
        if (handlers.length === 0) {
          this.handlers.delete(key);
          const delegatedKeys = this.delegatedElements.get(container);
          if (delegatedKeys) {
            delegatedKeys.delete(key);
            if (delegatedKeys.size === 0) {
              container.removeEventListener(event, this.handleDelegatedEvent.bind(this));
              this.delegatedElements.delete(container);
            }
          }
        }
      }
    }
  }
  
  /**
   * 处理委托事件
   * @param {Event} event - 原始事件
   */
  handleDelegatedEvent(event) {
    const delegatedKeys = this.delegatedElements.get(event.currentTarget);
    if (!delegatedKeys) return;
    
    delegatedKeys.forEach(key => {
      const handlers = this.handlers.get(key);
      if (!handlers) return;
      
      const { selector, handler } = handlers[0]; // 使用第一个处理器的配置
      
      const target = event.target.closest(selector);
      if (target && target !== event.currentTarget) {
        // 创建合成事件，保持原始事件特性
        const syntheticEvent = {
          ...event,
          currentTarget: target,
          target: event.target,
          originalEvent: event
        };
        
        try {
          handler.call(target, syntheticEvent);
        } catch (error) {
          console.error('Event handler error:', error);
        }
      }
    });
  }
  
  /**
   * 清除所有委托事件
   * @param {HTMLElement} container - 容器元素
   */
  clear(container) {
    const delegatedKeys = this.delegatedElements.get(container);
    if (!delegatedKeys) return;
    
    delegatedKeys.forEach(key => {
      const { event } = this.handlers.get(key)[0];
      container.removeEventListener(event, this.handleDelegatedEvent.bind(this));
    });
    
    this.delegatedElements.delete(container);
    delegatedKeys.forEach(key => {
      this.handlers.delete(key);
    });
  }
}

/**
 * 虚拟滚动管理器
 * 用于处理大量数据的滚动性能
 */
export class VirtualScroller {
  constructor(container, itemHeight, options = {}) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.options = {
      bufferSize: 5, // 缓冲区大小
      ...options
    };
    
    this.items = [];
    this.visibleItems = [];
    this.scrollTop = 0;
    this.containerHeight = 0;
    
    this.init();
  }
  
  /**
   * 初始化虚拟滚动
   */
  init() {
    this.containerHeight = this.container.clientHeight;
    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';
    
    // 创建占位元素
    this.placeholder = document.createElement('div');
    this.placeholder.style.position = 'absolute';
    this.placeholder.style.top = '0';
    this.placeholder.style.left = '0';
    this.placeholder.style.right = '0';
    this.placeholder.style.pointerEvents = 'none';
    
    // 创建内容容器
    this.content = document.createElement('div');
    this.content.style.position = 'absolute';
    this.content.style.top = '0';
    this.content.style.left = '0';
    this.content.style.right = '0';
    
    this.container.appendChild(this.placeholder);
    this.container.appendChild(this.content);
    
    // 监听滚动事件
    this.container.addEventListener('scroll', this.handleScroll.bind(this));
  }
  
  /**
   * 设置项目数据
   * @param {Array} items - 项目数据
   */
  setItems(items) {
    this.items = items;
    this.update();
  }
  
  /**
   * 更新虚拟滚动
   */
  update() {
    const totalHeight = this.items.length * this.itemHeight;
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(this.containerHeight / this.itemHeight) + this.options.bufferSize,
      this.items.length
    );
    
    // 更新占位元素高度
    this.placeholder.style.height = `${totalHeight}px`;
    
    // 计算内容容器位置
    const offsetY = startIndex * this.itemHeight;
    this.content.style.transform = `translateY(${offsetY}px)`;
    
    // 渲染可见项目
    this.renderVisibleItems(startIndex, endIndex);
  }
  
  /**
   * 渲染可见项目
   * @param {number} startIndex - 起始索引
   * @param {number} endIndex - 结束索引
   */
  renderVisibleItems(startIndex, endIndex) {
    // 清空现有项目
    this.content.innerHTML = '';
    
    // 创建文档片段进行批量操作
    const fragment = document.createDocumentFragment();
    
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.items[i];
      const element = this.createItemElement(item, i);
      fragment.appendChild(element);
    }
    
    this.content.appendChild(fragment);
  }
  
  /**
   * 创建项目元素
   * @param {Object} item - 项目数据
   * @param {number} index - 项目索引
   * @returns {HTMLElement} 项目元素
   */
  createItemElement(item, index) {
    const element = document.createElement('div');
    element.style.height = `${this.itemHeight}px`;
    element.style.position = 'absolute';
    element.style.top = `${index * this.itemHeight}px`;
    element.style.left = '0';
    element.style.right = '0';
    
    // 子类可以重写此方法来自定义元素创建
    return element;
  }
  
  /**
   * 处理滚动事件
   * @param {Event} event - 滚动事件
   */
  handleScroll(event) {
    this.scrollTop = this.container.scrollTop;
    this.update();
  }
  
  /**
   * 销毁虚拟滚动
   */
  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll.bind(this));
    this.container.innerHTML = '';
  }
}

/**
 * 批量DOM操作工具
 */
export class BatchDOM {
  /**
   * 批量创建元素
   * @param {Array} configs - 元素配置数组
   * @returns {Array} 创建的元素数组
   */
  static createElements(configs) {
    const fragment = document.createDocumentFragment();
    const elements = [];
    
    configs.forEach(config => {
      const element = document.createElement(config.tag);
      
      if (config.className) {
        element.className = config.className;
      }
      
      if (config.attributes) {
        for (const [key, value] of Object.entries(config.attributes)) {
          element.setAttribute(key, value);
        }
      }
      
      if (config.text) {
        element.textContent = config.text;
      }
      
      if (config.children) {
        config.children.forEach(child => {
          element.appendChild(child);
        });
      }
      
      fragment.appendChild(element);
      elements.push(element);
    });
    
    return elements;
  }
  
  /**
   * 批量添加样式
   * @param {Array} elements - 元素数组
   * @param {Object} styles - 样式对象
   */
  static addStyles(elements, styles) {
    elements.forEach(element => {
      for (const [property, value] of Object.entries(styles)) {
        element.style[property] = value;
      }
    });
  }
  
  /**
   * 批量添加类名
   * @param {Array} elements - 元素数组
   * @param {string} className - 类名
   */
  static addClass(elements, className) {
    elements.forEach(element => {
      element.classList.add(className);
    });
  }
  
  /**
   * 批量移除类名
   * @param {Array} elements - 元素数组
   * @param {string} className - 类名
   */
  static removeClass(elements, className) {
    elements.forEach(element => {
      element.classList.remove(className);
    });
  }
  
  /**
   * 批量设置属性
   * @param {Array} elements - 元素数组
   * @param {Object} attributes - 属性对象
   */
  static setAttributes(elements, attributes) {
    elements.forEach(element => {
      for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
      }
    });
  }
}

/**
 * 性能监控工具
 */
export class DOMPerformance {
  constructor() {
    this.metrics = {
      renderTime: 0,
      scrollTime: 0,
      interactionTime: 0
    };
    this.isMonitoring = false;
  }
  
  /**
   * 开始监控
   */
  start() {
    this.isMonitoring = true;
    this.startTime = performance.now();
  }
  
  /**
   * 停止监控
   * @returns {Object} 性能指标
   */
  stop() {
    this.isMonitoring = false;
    this.endTime = performance.now();
    
    return {
      totalTime: this.endTime - this.startTime,
      ...this.metrics
    };
  }
  
  /**
   * 测量渲染时间
   * @param {Function} renderFunction - 渲染函数
   * @returns {number} 渲染时间
   */
  measureRender(renderFunction) {
    const start = performance.now();
    renderFunction();
    const end = performance.now();
    
    return end - start;
  }
  
  /**
   * 测量滚动性能
   * @param {HTMLElement} element - 滚动元素
   * @param {Function} scrollFunction - 滚动函数
   * @returns {number} 滚动时间
   */
  measureScroll(element, scrollFunction) {
    const start = performance.now();
    scrollFunction();
    const end = performance.now();
    
    return end - start;
  }
}

// 创建全局实例
export const fragmentBuilder = new FragmentBuilder();
export const eventDelegator = new EventDelegator();
export const domPerformance = new DOMPerformance();

// 导出便捷函数
export function createFragment() {
  return new FragmentBuilder();
}

export function delegateEvent(container, selector, event, handler, options = {}) {
  eventDelegator.delegate(container, selector, event, handler, options);
}

export function createVirtualScroller(container, itemHeight, options = {}) {
  return new VirtualScroller(container, itemHeight, options);
}

export function batchCreateElements(configs) {
  return BatchDOM.createElements(configs);
}