/**
 * 组件基类
 */

import { EventManager } from '../utils/event-manager.js';

/**
 * 组件基类
 * 
 * 提供组件的基础功能，包括事件管理、子组件管理、数据状态管理等
 * 所有自定义组件都应该继承这个基类，以获得统一的生命周期管理
 * 
 * @class BaseComponent
 * @author timestamp-developer
 * @version 1.0.0
 * 
 * @example
 * class MyComponent extends BaseComponent {
 *   constructor(element) {
 *     super(element);
 *     this.init();
 *   }
 *   
 *   init() {
 *     // 初始化组件
 *   }
 *   
 *   update() {
 *     // 更新UI
 *   }
 *   
 *   destroy() {
 *     super.destroy();
 *     // 清理资源
 *   }
 * }
 */
export class BaseComponent {
/**
    * 构造函数
    * @param {HTMLElement} element - 组件根DOM元素
    * 
    * @example
    * const element = document.getElementById('my-component');
    * const component = new BaseComponent(element);
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
    * 将子组件添加到当前组件的子组件集合中
    * 子组件会在父组件销毁时自动销毁
    * 
    * @param {BaseComponent} child - 要添加的子组件
    * 
    * @example
    * const child = new ChildComponent(childElement);
    * parent.addChild(child);
    */
  addChild(child) {
    this.children.add(child);
  }
  
/**
    * 移除子组件
    * 从当前组件的子组件集合中移除指定子组件
    * 并自动调用子组件的 destroy() 方法进行清理
    * 
    * @param {BaseComponent} child - 要移除的子组件
    * 
    * @example
    * parent.removeChild(child);
    */
  removeChild(child) {
    this.children.delete(child);
    child.destroy();
  }
  
/**
    * 添加事件监听器
    * 使用 EventManager 管理事件监听器，便于统一清理
    * 支持所有标准 DOM 事件类型
    * 
    * @param {string} event - 事件类型（如 'click', 'change', 'input'）
    * @param {Function} handler - 事件处理函数
    * @param {Object} [options] - 事件监听器选项
    * @param {boolean} [options.capture=false] - 是否在捕获阶段监听
    * @param {boolean} [options.passive=false] - 是否为被动事件监听器
    * 
    * @example
    * this.on('click', this.handleClick.bind(this));
    * this.on('input', this.handleInput.bind(this), { passive: true });
    */
  on(event, handler, options = {}) {
    this.eventManager.add(this.element, event, handler, options);
  }
  
/**
    * 移除事件监听器
    * 使用 EventManager 移除指定的事件监听器
    * 确保事件监听器被正确清理，避免内存泄漏
    * 
    * @param {string} event - 事件类型
    * @param {Function} handler - 要移除的事件处理函数
    * 
    * @example
    * this.off('click', this.handleClick);
    */
  off(event, handler) {
    this.eventManager.remove(this.element, event, handler);
  }
  
/**
    * 触发自定义事件
    * 在组件元素上触发自定义事件，支持传递数据
    * 事件会冒泡到父元素，可以在组件间通信
    * 
    * @param {string} event - 自定义事件类型
    * @param {Object} [data={}] - 事件数据对象，会通过 event.detail 传递
    * 
    * @example
    * this.emit('custom-event', { message: 'Hello World' });
    * 
    * // 在其他组件中监听：
    * element.addEventListener('custom-event', (e) => {
    *   console.log(e.detail.message); // 'Hello World'
    * });
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
    * 设置组件数据
    * 更新组件的数据对象，并触发 update() 方法
    * 数据变更会触发组件的重新渲染
    * 
    * @param {Object} data - 要更新的数据对象
    * @param {string} data.* - 数据键值对
    * 
    * @example
    * this.setData({ name: '张三', age: 25 });
    * this.setData({ age: 26 }); // 只更新age，保留其他数据
    */
  setData(data) {
    this.data = { ...this.data, ...data };
    this.update();
  }
  
/**
    * 获取组件数据
    * 获取指定键的数据值，如果未指定键则返回整个数据对象
    * 
    * @param {string} [key] - 数据键名，可选
    * @returns {any|Object} 如果指定键名，返回对应的数据值；
    *                        如果未指定键名，返回整个数据对象
    * 
    * @example
    * this.setData({ name: '张三', age: 25 });
    * this.getData('name'); // '张三'
    * this.getData(); // { name: '张三', age: 25 }
    */
  getData(key) {
    return this.data[key];
  }
  
/**
    * 设置组件状态
    * 更新组件的状态对象，并触发 update() 方法
    * 状态用于管理组件的内部状态，通常不会直接反映到UI上
    * 
    * @param {Object} state - 要更新的状态对象
    * @param {string} state.* - 状态键值对
    * 
    * @example
    * this.setState({ isLoading: true, error: null });
    * this.setState({ isLoading: false });
    */
  setState(state) {
    this.state = { ...this.state, ...state };
    this.update();
  }
  
/**
    * 获取组件状态
    * 获取指定键的状态值，如果未指定键则返回整个状态对象
    * 
    * @param {string} [key] - 状态键名，可选
    * @returns {any|Object} 如果指定键名，返回对应的状态值；
    *                        如果未指定键名，返回整个状态对象
    * 
    * @example
    * this.setState({ isLoading: true, error: null });
    * this.getState('isLoading'); // true
    * this.getState(); // { isLoading: true, error: null }
    */
  getState(key) {
    return this.state[key];
  }
  
/**
    * 更新组件
    * 抽象方法，子类必须实现具体的更新逻辑
    * 当数据或状态发生变化时自动调用
    * 
    * @example
    * class MyComponent extends BaseComponent {
    *   update() {
    *     // 更新UI的具体实现
    *     this.element.textContent = this.data.name;
    *   }
    * }
    */
  update() {
    // 子类实现具体的更新逻辑
  }
  
/**
    * 显示组件
    * 将组件的 display 样式设置为空值，恢复显示
    * 
    * @example
    * this.hide(); // 隐藏组件
    * this.show(); // 显示组件
    */
  show() {
    this.element.style.display = '';
  }
  
/**
    * 隐藏组件
    * 将组件的 display 样式设置为 'none'，隐藏组件
    * 组件仍然占据文档流空间，只是不可见
    * 
    * @example
    * this.hide(); // 隐藏组件
    * this.show(); // 显示组件
    */
  hide() {
    this.element.style.display = 'none';
  }
  
/**
    * 启用组件
    * 将组件的 disabled 属性设置为 false，恢复交互功能
    * 主要用于表单元素（按钮、输入框等）
    * 
    * @example
    * this.disable(); // 禁用组件
    * this.enable(); // 启用组件
    */
  enable() {
    this.element.disabled = false;
  }
  
/**
    * 禁用组件
    * 将组件的 disabled 属性设置为 true，禁用交互功能
    * 主要用于表单元素（按钮、输入框等）
    * 
    * @example
    * this.disable(); // 禁用组件
    * this.enable(); // 启用组件
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
    * 防止重复销毁组件，确保组件生命周期的完整性
    * 
    * @returns {boolean} 组件是否已经被销毁
    * 
    * @example
    * if (component.isDestroyedComponent()) {
    *   console.log('组件已被销毁');
    * }
    */
  isDestroyedComponent() {
    return this.isDestroyed;
  }
  
/**
    * 获取组件根元素
    * 返回组件绑定的DOM元素
    * 
    * @returns {HTMLElement} 组件的根DOM元素
    * 
    * @example
    * const element = component.getElement();
    * element.classList.add('active');
    */
  getElement() {
    return this.element;
  }
  
/**
    * 获取组件内的子元素
    * 在组件的根元素内查找匹配选择器的第一个子元素
    * 
    * @param {string} selector - CSS选择器
    * @returns {HTMLElement|null} 找到的子元素，未找到返回null
    * 
    * @example
    * const button = component.getChildElement('.submit-btn');
    * if (button) button.click();
    */
  getChildElement(selector) {
    return this.element.querySelector(selector);
  }
  
/**
    * 获取组件内的所有子元素
    * 在组件的根元素内查找匹配选择器的所有子元素
    * 
    * @param {string} selector - CSS选择器
    * @returns {NodeList} 找到的子元素列表
    * 
    * @example
    * const items = component.getAllChildElements('.list-item');
    * items.forEach(item => item.classList.add('active'));
    */
  getAllChildElements(selector) {
    return this.element.querySelectorAll(selector);
  }
  
/**
    * 设置组件DOM属性
    * 批量设置组件根元素的HTML属性
    * 
    * @param {Object} attributes - 属性对象，键为属性名，值为属性值
    * @param {string} attributes.* - 属性名和值
    * 
    * @example
    * component.setAttributes({
    *   'data-id': '123',
    *   'aria-label': '提交按钮',
    *   'tabindex': '0'
    * });
    */
  setAttributes(attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      this.element.setAttribute(key, value);
    }
  }
  
/**
    * 设置组件样式
    * 批量设置组件根元素的CSS样式
    * 
    * @param {Object} styles - 样式对象，键为CSS属性名，值为CSS属性值
    * @param {string} styles.* - CSS属性名和值
    * 
    * @example
    * component.setStyles({
    *   'backgroundColor': '#f0f0f0',
    *   'color': '#333',
    *   'borderRadius': '4px'
    * });
    */
  setStyles(styles) {
    for (const [property, value] of Object.entries(styles)) {
      this.element.style[property] = value;
    }
  }
  
/**
    * 设置组件文本内容
    * 设置组件根元素的textContent，会自动转义HTML标签
    * 
    * @param {string} text - 文本内容
    * 
    * @example
    * component.setText('Hello World');
    * component.setText('<script>alert("xss")</script>'); // 会被转义
    */
  setText(text) {
    this.element.textContent = text;
  }
  
/**
    * 设置组件HTML内容
    * 设置组件根元素的innerHTML，支持HTML标签
    * ⚠️ 注意：直接设置HTML可能存在XSS安全风险，请确保内容可信
    * 
    * @param {string} html - HTML内容字符串
    * 
    * @example
    * component.setHTML('<div class="card">Hello World</div>');
    * component.setHTML('<script>alert("xss")</script>'); // ⚠️ 有安全风险
    */
  setHTML(html) {
    this.element.innerHTML = html;
  }
  
/**
    * 获取组件文本内容
    * 获取组件根元素的textContent，返回纯文本内容
    * 
    * @returns {string} 组件的文本内容
    * 
    * @example
    * const text = component.getText();
    * console.log(text); // 'Hello World'
    */
  getText() {
    return this.element.textContent;
  }
  
/**
    * 获取组件HTML内容
    * 获取组件根元素的innerHTML，返回HTML字符串
    * 
    * @returns {string} 组件的HTML内容
    * 
    * @example
    * const html = component.getHTML();
    * console.log(html); // '<div class="card">Hello World</div>'
    */
  getHTML() {
    return this.element.innerHTML;
  }
  
/**
    * 清空组件内容
    * 清空组件根元素的所有子节点，保留元素本身
    * 
    * @example
    * component.clearContent();
    * // 组件元素存在，但内部内容已清空
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