/**
 * 工具函数模块 - 通用助手
 * 
 * 提供通用的 DOM 操作、事件处理、数据操作等辅助函数
 * 这些函数被设计为可重用的工具函数，简化常见操作
 * 
 * @module helpers
 * @author timestamp-developer
 * @version 1.0.0
 */

import { debounce, throttle } from './validators.js';

/**
 * 创建DOM元素
 * 便捷的DOM元素创建函数，支持设置类名、文本内容和属性
 * 避免重复的 document.createElement 和属性设置代码
 * 
 * @param {string} tag - 标签名（如 'div', 'span', 'button'）
 * @param {string} className - CSS类名（可选）
 * @param {string} text - 文本内容（可选）
 * @param {Object} attributes - 属性对象键值对（可选）
 * @returns {HTMLElement} 创建的DOM元素
 * 
 * @example
 * createElement('div', 'card', 'Hello World', {id: 'my-div'});
 * // 创建：<div class="card" id="my-div">Hello World</div>
 * 
 * createElement('button', 'btn-primary'); 
 * // 创建：<button class="btn-primary"></button>
 */
export function createElement(tag, className = '', text = '', attributes = {}) {
  const element = document.createElement(tag);
  
  if (className) {
    element.className = className;
  }
  
  if (text) {
    element.textContent = text;
  }
  
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  
  return element;
}

/**
 * 查找DOM元素
 * 封装 document.querySelector，支持指定上下文元素
 * 
 * @param {string} selector - CSS选择器
 * @param {HTMLElement|Document} context - 查找上下文（默认document）
 * @returns {HTMLElement|null} 找到的元素，未找到返回null
 * 
 * @example
 * findElement('.my-class'); // 在document中查找
 * findElement('#my-id', container); // 在container元素中查找
 */
export function findElement(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * 查找所有DOM元素
 * 封装 document.querySelectorAll，支持指定上下文元素
 * 
 * @param {string} selector - CSS选择器
 * @param {HTMLElement|Document} context - 查找上下文（默认document）
 * @returns {NodeList} 找到的元素列表
 * 
 * @example
 * findAllElements('.my-class'); // 在document中查找所有
 * findAllElements('div.card', container); // 在container中查找div.card
 */
export function findAllElements(selector, context = document) {
  return context.querySelectorAll(selector);
}

/**
 * 添加事件监听器
 * @param {HTMLElement} element - 元素
 * @param {string} event - 事件类型
 * @param {Function} handler - 处理函数
 * @param {Object} options - 选项
 */
export function addEventListener(element, event, handler, options = {}) {
  element.addEventListener(event, handler, options);
}

/**
 * 移除事件监听器
 * @param {HTMLElement} element - 元素
 * @param {string} event - 事件类型
 * @param {Function} handler - 处理函数
 */
export function removeEventListener(element, event, handler) {
  element.removeEventListener(event, handler);
}

/**
 * 触发自定义事件
 * @param {HTMLElement} element - 元素
 * @param {string} eventName - 事件名称
 * @param {Object} detail - 事件详情
 */
export function triggerEvent(element, eventName, detail = {}) {
  const event = new CustomEvent(eventName, {
    detail: detail,
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(event);
}

/**
 * 显示元素
 * @param {HTMLElement} element - 元素
 */
export function showElement(element) {
  element.style.display = '';
}

/**
 * 隐藏元素
 * @param {HTMLElement} element - 元素
 */
export function hideElement(element) {
  element.style.display = 'none';
}

/**
 * 切换元素显示状态
 * @param {HTMLElement} element - 元素
 */
export function toggleElement(element) {
  element.style.display = element.style.display === 'none' ? '' : 'none';
}

/**
 * 添加类名
 * @param {HTMLElement} element - 元素
 * @param {string} className - 类名
 */
export function addClass(element, className) {
  element.classList.add(className);
}

/**
 * 移除类名
 * @param {HTMLElement} element - 元素
 * @param {string} className - 类名
 */
export function removeClass(element, className) {
  element.classList.remove(className);
}

/**
 * 切换类名
 * @param {HTMLElement} element - 元素
 * @param {string} className - 类名
 */
export function toggleClass(element, className) {
  element.classList.toggle(className);
}

/**
 * 检查是否包含类名
 * @param {HTMLElement} element - 元素
 * @param {string} className - 类名
 * @returns {boolean} 是否包含类名
 */
export function hasClass(element, className) {
  return element.classList.contains(className);
}

/**
 * 设置元素属性
 * @param {HTMLElement} element - 元素
 * @param {Object} attributes - 属性对象
 */
export function setAttributes(element, attributes) {
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
}

/**
 * 获取元素属性
 * @param {HTMLElement} element - 元素
 * @param {string} attribute - 属性名
 * @returns {string} 属性值
 */
export function getAttribute(element, attribute) {
  return element.getAttribute(attribute);
}

/**
 * 设置元素样式
 * @param {HTMLElement} element - 元素
 * @param {Object} styles - 样式对象
 */
export function setStyles(element, styles) {
  for (const [property, value] of Object.entries(styles)) {
    element.style[property] = value;
  }
}

/**
 * 获取元素样式
 * @param {HTMLElement} element - 元素
 * @param {string} property - 样式属性
 * @returns {string} 样式值
 */
export function getStyle(element, property) {
  return element.style[property];
}

/**
 * 获取元素位置
 * @param {HTMLElement} element - 元素
 * @returns {Object} 位置信息
 */
export function getElementPosition(element) {
  const rect = element.getBoundingClientRect();
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
 * 获取元素尺寸
 * @param {HTMLElement} element - 元素
 * @returns {Object} 尺寸信息
 */
export function getElementSize(element) {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight
  };
}

/**
 * 设置元素尺寸
 * @param {HTMLElement} element - 元素
 * @param {number} width - 宽度
 * @param {number} height - 高度
 */
export function setSize(element, width, height) {
  element.style.width = width + 'px';
  element.style.height = height + 'px';
}

/**
 * 获取元素文本内容
 * @param {HTMLElement} element - 元素
 * @returns {string} 文本内容
 */
export function getText(element) {
  return element.textContent;
}

/**
 * 设置元素文本内容
 * @param {HTMLElement} element - 元素
 * @param {string} text - 文本内容
 */
export function setText(element, text) {
  element.textContent = text;
}

/**
 * 获取元素HTML内容
 * @param {HTMLElement} element - 元素
 * @returns {string} HTML内容
 */
export function getHTML(element) {
  return element.innerHTML;
}

/**
 * 设置元素HTML内容
 * @param {HTMLElement} element - 元素
 * @param {string} html - HTML内容
 */
export function setHTML(element, html) {
  element.innerHTML = html;
}

/**
 * 清空元素内容
 * @param {HTMLElement} element - 元素
 */
export function clearContent(element) {
  element.innerHTML = '';
}

/**
 * 复制元素
 * @param {HTMLElement} element - 元素
 * @returns {HTMLElement} 复制的元素
 */
export function cloneElement(element) {
  return element.cloneNode(true);
}

/**
 * 移动元素
 * @param {HTMLElement} element - 元素
 * @param {HTMLElement} target - 目标元素
 */
export function moveElement(element, target) {
  target.appendChild(element);
}

/**
 * 插入元素
 * @param {HTMLElement} element - 元素
 * @param {HTMLElement} target - 目标元素
 * @param {HTMLElement} reference - 参考元素
 */
export function insertElement(element, target, reference) {
  target.insertBefore(element, reference);
}

/**
 * 删除元素
 * @param {HTMLElement} element - 元素
 */
export function removeElement(element) {
  if (element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * 创建文档片段
 * @returns {DocumentFragment} 文档片段
 */
export function createFragment() {
  return document.createDocumentFragment();
}

/**
 * 创建文本节点
 * @param {string} text - 文本内容
 * @returns {Text} 文本节点
 */
export function createTextNode(text) {
  return document.createTextNode(text);
}

/**
 * 检查元素是否可见
 * @param {HTMLElement} element - 元素
 * @returns {boolean} 是否可见
 */
export function isElementVisible(element) {
  return element.offsetParent !== null;
}

/**
 * 检查元素是否在视口中
 * @param {HTMLElement} element - 元素
 * @param {Object} options - 选项
 * @returns {boolean} 是否在视口中
 */
export function isElementInViewport(element, options = {}) {
  const rect = element.getBoundingClientRect();
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
 * 滚动到元素
 * @param {HTMLElement} element - 元素
 * @param {Object} options - 滚动选项
 */
export function scrollToElement(element, options = {}) {
  const {
    behavior = 'smooth',
    block = 'start',
    inline = 'nearest'
  } = options;
  
  element.scrollIntoView({
    behavior,
    block,
    inline
  });
}

/**
 * 滚动到顶部
 * @param {Object} options - 滚动选项
 */
export function scrollToTop(options = {}) {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: options.behavior || 'smooth'
  });
}

/**
 * 滚动到底部
 * @param {Object} options - 滚动选项
 */
export function scrollToBottom(options = {}) {
  window.scrollTo({
    top: document.body.scrollHeight,
    left: 0,
    behavior: options.behavior || 'smooth'
  });
}

/**
 * 获取URL参数
 * @param {string} name - 参数名
 * @returns {string|null} 参数值
 */
export function getUrlParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * 设置URL参数
 * @param {string} name - 参数名
 * @param {string} value - 参数值
 */
export function setUrlParam(name, value) {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set(name, value);
  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
  window.history.pushState({}, '', newUrl);
}

/**
 * 获取Cookie
 * @param {string} name - Cookie名称
 * @returns {string|null} Cookie值
 */
export function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * 设置Cookie
 * @param {string} name - Cookie名称
 * @param {string} value - Cookie值
 * @param {Object} options - 选项
 */
export function setCookie(name, value, options = {}) {
  const {
    expires,
    path = '/',
    domain,
    secure,
    sameSite
  } = options;
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  if (expires) {
    const date = new Date(expires);
    cookieString += `; expires=${date.toUTCString()}`;
  }
  
  if (path) {
    cookieString += `; path=${path}`;
  }
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }
  
  if (secure) {
    cookieString += '; secure';
  }
  
  if (sameSite) {
    cookieString += `; samesite=${sameSite}`;
  }
  
  document.cookie = cookieString;
}

/**
 * 删除Cookie
 * @param {string} name - Cookie名称
 * @param {Object} options - 选项
 */
export function deleteCookie(name, options = {}) {
  setCookie(name, '', {
    expires: new Date(0),
    ...options
  });
}

/**
 * 本地存储操作
 */
export const storage = {
  /**
   * 设置本地存储
   * @param {string} key - 键名
   * @param {any} value - 值
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to set localStorage:', e);
    }
  },
  
  /**
   * 获取本地存储
   * @param {string} key - 键名
   * @param {any} defaultValue - 默认值
   * @returns {any} 存储的值
   */
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
      console.error('Failed to get localStorage:', e);
      return defaultValue;
    }
  },
  
  /**
   * 删除本地存储
   * @param {string} key - 键名
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to remove localStorage:', e);
    }
  },
  
  /**
   * 清空本地存储
   */
  clear() {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  }
};

/**
 * 会话存储操作
 */
export const sessionStorage = {
  /**
   * 设置会话存储
   * @param {string} key - 键名
   * @param {any} value - 值
   */
  set(key, value) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to set sessionStorage:', e);
    }
  },
  
  /**
   * 获取会话存储
   * @param {string} key - 键名
   * @param {any} defaultValue - 默认值
   * @returns {any} 存储的值
   */
  get(key, defaultValue = null) {
    try {
      const value = window.sessionStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
      console.error('Failed to get sessionStorage:', e);
      return defaultValue;
    }
  },
  
  /**
   * 删除会话存储
   * @param {string} key - 键名
   */
  remove(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to remove sessionStorage:', e);
    }
  },
  
  /**
   * 清空会话存储
   */
  clear() {
    try {
      window.sessionStorage.clear();
    } catch (e) {
      console.error('Failed to clear sessionStorage:', e);
    }
  }
};

/**
 * 防抖包装器
 * @param {Function} fn - 函数
 * @param {number} delay - 延迟时间
 * @returns {Function} 防抖函数
 */
export function createDebouncedFn(fn, delay) {
  return debounce(fn, delay);
}

/**
 * 节流包装器
 * @param {Function} fn - 函数
 * @param {number} delay - 延迟时间
 * @returns {Function} 节流函数
 */
export function createThrottledFn(fn, delay) {
  return throttle(fn, delay);
}

/**
 * 创建异步函数
 * @param {Function} fn - 函数
 * @returns {Function} 异步函数
 */
export function createAsyncFn(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Async function error:', error);
      throw error;
    }
  };
}

/**
 * 创建重试函数
 * @param {Function} fn - 函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delay - 重试延迟
 * @returns {Function} 重试函数
 */
export function createRetryFn(fn, maxRetries = 3, delay = 1000) {
  return async (...args) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  };
}

/**
 * 创建缓存函数
 * @param {Function} fn - 函数
 * @param {number} ttl - 缓存时间（毫秒）
 * @returns {Function} 缓存函数
 */
export function createCachedFn(fn, ttl = 60000) {
  const cache = new Map();
  
  return async (...args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }
    
    const value = await fn(...args);
    cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    return value;
  };
}

/**
 * 创建单例函数
 * @param {Function} fn - 函数
 * @returns {Function} 单例函数
 */
export function createSingletonFn(fn) {
  let instance = null;
  
  return (...args) => {
    if (!instance) {
      instance = fn(...args);
    }
    return instance;
  };
}

/**
 * 创建工厂函数
 * @param {Function} fn - 构造函数
 * @returns {Function} 工厂函数
 */
export function createFactoryFn(fn) {
  return (...args) => new fn(...args);
}

/**
 * 创建观察者函数
 * @param {Function} fn - 观察函数
 * @returns {Object} 观察者对象
 */
export function createObserver(fn) {
  const observers = [];
  
  return {
    subscribe(observer) {
      observers.push(observer);
    },
    
    unsubscribe(observer) {
      const index = observers.indexOf(observer);
      if (index > -1) {
        observers.splice(index, 1);
      }
    },
    
    notify(...args) {
      observers.forEach(observer => observer(...args));
    },
    
    invoke(...args) {
      fn(...args);
      this.notify(...args);
    }
  };
}

/**
 * 创建发布者函数
 * @param {Function} fn - 发布函数
 * @returns {Object} 发布者对象
 */
export function createPublisher(fn) {
  const subscribers = new Map();
  
  return {
    subscribe(event, handler) {
      if (!subscribers.has(event)) {
        subscribers.set(event, []);
      }
      subscribers.get(event).push(handler);
    },
    
    unsubscribe(event, handler) {
      if (subscribers.has(event)) {
        const handlers = subscribers.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    },
    
    publish(event, ...args) {
      if (subscribers.has(event)) {
        subscribers.get(event).forEach(handler => handler(...args));
      }
      fn(event, ...args);
    }
  };
}

/**
 * 创建事件总线
 * @returns {Object} 事件总线
 */
export function createEventBus() {
  const listeners = new Map();
  
  return {
    on(event, handler) {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event).push(handler);
    },
    
    off(event, handler) {
      if (listeners.has(event)) {
        const handlers = listeners.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    },
    
    emit(event, ...args) {
      if (listeners.has(event)) {
        listeners.get(event).forEach(handler => handler(...args));
      }
    },
    
    once(event, handler) {
      const onceHandler = (...args) => {
        handler(...args);
        this.off(event, onceHandler);
      };
      this.on(event, onceHandler);
    },
    
    removeAllListeners(event) {
      if (event) {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
    }
  };
}