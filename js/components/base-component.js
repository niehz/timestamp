/**
 * 组件基类
 */

import { EventManager } from '../utils/event-manager.js';

/**
 * 组件基类
 */
export class BaseComponent {
  /**
   * 构造函数
   * @param {HTMLElement} element - 组件根元素
   */
  constructor(element) {
    this.element = element;
    this.eventManager = new EventManager();
    this.children = new Set();
    this.isDestroyed = false;
    this.data = {};
    this.state = {};
  }
  
  /**
   * 添加子组件
   * @param {BaseComponent} child - 子组件
   */
  addChild(child) {
    this.children.add(child);
  }
  
  /**
   * 移除子组件
   * @param {BaseComponent} child - 子组件
   */
  removeChild(child) {
    this.children.delete(child);
    child.destroy();
  }
  
  /**
   * 添加事件监听器
   * @param {string} event - 事件类型
   * @param {Function} handler - 处理函数
   * @param {Object} options - 选项
   */
  on(event, handler, options = {}) {
    this.eventManager.add(this.element, event, handler, options);
  }
  
  /**
   * 移除事件监听器
   * @param {string} event - 事件类型
   * @param {Function} handler - 处理函数
   */
  off(event, handler) {
    this.eventManager.remove(this.element, event, handler);
  }
  
  /**
   * 触发事件
   * @param {string} event - 事件类型
   * @param {Object} data - 事件数据
   */
  emit(event, data = {}) {
    const customEvent = new CustomEvent(event, {
      detail: data,
      bubbles: true,
      cancelable: true
    });
    this.element.dispatchEvent(customEvent);
  }
  
  /**
   * 设置数据
   * @param {Object} data - 数据对象
   */
  setData(data) {
    this.data = { ...this.data, ...data };
    this.update();
  }
  
  /**
   * 获取数据
   * @param {string} key - 数据键名
   * @returns {any} 数据值
   */
  getData(key) {
    return this.data[key];
  }
  
  /**
   * 设置状态
   * @param {Object} state - 状态对象
   */
  setState(state) {
    this.state = { ...this.state, ...state };
    this.update();
  }
  
  /**
   * 获取状态
   * @param {string} key - 状态键名
   * @returns {any} 状态值
   */
  getState(key) {
    return this.state[key];
  }
  
  /**
   * 更新组件
   */
  update() {
    // 子类实现具体的更新逻辑
  }
  
  /**
   * 显示组件
   */
  show() {
    this.element.style.display = '';
  }
  
  /**
   * 隐藏组件
   */
  hide() {
    this.element.style.display = 'none';
  }
  
  /**
   * 启用组件
   */
  enable() {
    this.element.disabled = false;
  }
  
  /**
   * 禁用组件
   */
  disable() {
    this.element.disabled = true;
  }
  
  /**
   * 销毁组件
   */
  destroy() {
    if (this.isDestroyed) return;
    
    // 销毁所有子组件
    this.children.forEach(child => child.destroy());
    this.children.clear();
    
    // 清理事件监听器
    this.eventManager.clear();
    
    // 从DOM中移除元素
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    this.isDestroyed = true;
  }
  
  /**
   * 检查组件是否已销毁
   * @returns {boolean} 是否已销毁
   */
  isDestroyedComponent() {
    return this.isDestroyed;
  }
  
  /**
   * 获取组件根元素
   * @returns {HTMLElement} 根元素
   */
  getElement() {
    return this.element;
  }
  
  /**
   * 获取组件子元素
   * @param {string} selector - 选择器
   * @returns {HTMLElement|null} 子元素
   */
  getChildElement(selector) {
    return this.element.querySelector(selector);
  }
  
  /**
   * 获取组件所有子元素
   * @param {string} selector - 选择器
   * @returns {NodeList} 子元素列表
   */
  getAllChildElements(selector) {
    return this.element.querySelectorAll(selector);
  }
  
  /**
   * 设置组件属性
   * @param {Object} attributes - 属性对象
   */
  setAttributes(attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      this.element.setAttribute(key, value);
    }
  }
  
  /**
   * 设置组件样式
   * @param {Object} styles - 样式对象
   */
  setStyles(styles) {
    for (const [property, value] of Object.entries(styles)) {
      this.element.style[property] = value;
    }
  }
  
  /**
   * 设置组件文本内容
   * @param {string} text - 文本内容
   */
  setText(text) {
    this.element.textContent = text;
  }
  
  /**
   * 设置组件HTML内容
   * @param {string} html - HTML内容
   */
  setHTML(html) {
    this.element.innerHTML = html;
  }
  
  /**
   * 获取组件文本内容
   * @returns {string} 文本内容
   */
  getText() {
    return this.element.textContent;
  }
  
  /**
   * 获取组件HTML内容
   * @returns {string} HTML内容
   */
  getHTML() {
    return this.element.innerHTML;
  }
  
  /**
   * 清空组件内容
   */
  clearContent() {
    this.element.innerHTML = '';
  }
  
  /**
   * 添加类名
   * @param {string} className - 类名
   */
  addClass(className) {
    this.element.classList.add(className);
  }
  
  /**
   * 移除类名
   * @param {string} className - 类名
   */
  removeClass(className) {
    this.element.classList.remove(className);
  }
  
  /**
   * 切换类名
   * @param {string} className - 类名
   */
  toggleClass(className) {
    this.element.classList.toggle(className);
  }
  
  /**
   * 检查是否包含类名
   * @param {string} className - 类名
   * @returns {boolean} 是否包含类名
   */
  hasClass(className) {
    return this.element.classList.contains(className);
  }
  
  /**
   * 获取组件位置
   * @returns {Object} 位置信息
   */
  getPosition() {
    const rect = this.element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    };
  }
  
  /**
   * 获取组件尺寸
   * @returns {Object} 尺寸信息
   */
  getSize() {
    return {
      width: this.element.offsetWidth,
      height: this.element.offsetHeight
    };
  }
  
  /**
   * 设置组件尺寸
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  setSize(width, height) {
    this.element.style.width = width + 'px';
    this.element.style.height = height + 'px';
  }
  
  /**
   * 聚焦组件
   */
  focus() {
    this.element.focus();
  }
  
  /**
   * 取消聚焦组件
   */
  blur() {
    this.element.blur();
  }
  
  /**
   * 检查组件是否可见
   * @returns {boolean} 是否可见
   */
  isVisible() {
    return this.element.offsetParent !== null;
  }
  
  /**
   * 检查组件是否在视口中
   * @param {Object} options - 选项
   * @returns {boolean} 是否在视口中
   */
  isInViewport(options = {}) {
    const rect = this.element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    const {
      top = 0,
      left = 0,
      bottom = windowHeight,
      right = windowWidth
    } = options;
    
    return (
      rect.left <= right &&
      rect.top <= bottom &&
      rect.right >= left &&
      rect.bottom >= top
    );
  }
  
  /**
   * 滚动到组件
   * @param {Object} options - 滚动选项
   */
  scrollTo(options = {}) {
    const {
      behavior = 'smooth',
      block = 'start',
      inline = 'nearest'
    } = options;
    
    this.element.scrollIntoView({
      behavior,
      block,
      inline
    });
  }
  
  /**
   * 等待组件渲染完成
   * @returns {Promise} 渲染完成的Promise
   */
  async waitForRender() {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
  }
  
  /**
   * 克隆组件
   * @returns {BaseComponent} 克隆的组件
   */
  clone() {
    const clonedElement = this.element.cloneNode(true);
    return new this.constructor(clonedElement);
  }
  
  /**
   * 转换为字符串
   * @returns {string} 字符串表示
   */
  toString() {
    return `[${this.constructor.name}]`;
  }
  
  /**
   * 转换为JSON
   * @returns {Object} JSON对象
   */
  toJSON() {
    return {
      type: this.constructor.name,
      data: this.data,
      state: this.state,
      children: Array.from(this.children).map(child => child.toJSON())
    };
  }
}