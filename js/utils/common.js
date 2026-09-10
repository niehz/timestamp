// ========================================================
// js/utils/common.js — 公共函数库，抽取重复代码模式
// 用于优化时间戳转换项目中的重复代码
// ========================================================

/**
 * 1. 事件绑定工具函数 - 统一addEventListener模式
 */

/**
 * 统一的事件绑定函数，简化重复的addEventListener调用
 * @param {string|Element} selector - CSS选择器或DOM元素
 * @param {string} event - 事件类型
 * @param {Function} handler - 事件处理函数
 * @param {Object} [options] - 事件选项
 */
function addEventListener(selector, event, handler, options) {
  const element = typeof selector === 'string' ? $(selector) : selector;
  if (element) {
    element.addEventListener(event, handler, options);
  }
  return element;
}

/**
 * 批量事件绑定函数，减少重复代码
 * @param {Object} bindings - 事件绑定配置对象
 * @example
 * bindEvents({
 *   '#myElement': {
 *     'click': handleClick,
 *     'mouseenter': handleMouseEnter
 *   },
 *   '#anotherElement': {
 *     'input': handleInput
 *   }
 * });
 */
function bindEvents(bindings) {
  Object.entries(bindings).forEach(([selector, events]) => {
    Object.entries(events).forEach(([event, handler]) => {
      addEventListener(selector, event, handler);
    });
  });
}

/**
 * 2. 时间戳验证工具函数 - 统一验证逻辑
 */

/**
 * 验证时间戳是否在有效范围内
 * @param {number} ms - 毫秒级时间戳
 * @returns {boolean} 是否有效
 */
function validateTimestamp(ms) {
  return Number.isFinite(ms) && ms >= MIN_TS && ms <= MAX_TS;
}

/**
 * 验证秒级时间戳
 * @param {number} sec - 秒级时间戳
 * @returns {boolean} 是否有效
 */
function validateSecTimestamp(sec) {
  return Number.isFinite(sec) && sec >= Math.floor(MIN_TS / 1000) && sec <= Math.floor(MAX_TS / 1000);
}

/**
 * 验证毫秒级时间戳
 * @param {number} ms - 毫秒级时间戳
 * @returns {boolean} 是否有效
 */
function validateMsTimestamp(ms) {
  return validateTimestamp(ms);
}

/**
 * 验证微秒级时间戳
 * @param {number} us - 微秒级时间戳
 * @returns {boolean} 是否有效
 */
function validateUsTimestamp(us) {
  return Number.isFinite(us) && us >= MIN_TS * 1000 && us <= MAX_TS * 1000;
}

/**
 * 验证纳秒级时间戳
 * @param {number} ns - 纳秒级时间戳
 * @returns {boolean} 是否有效
 */
function validateNsTimestamp(ns) {
  return Number.isFinite(ns) && ns >= MIN_TS * 1000000 && ns <= MAX_TS * 1000000;
}

/**
 * 根据当前精度级别验证时间戳
 * @param {string|number} value - 时间戳值
 * @param {string} precision - 精度级别 ('sec', 'ms', 'us', 'ns')
 * @returns {boolean} 是否有效
 */
function validateTimestampByPrecision(value, precision) {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  
  const num = typeof value === 'string' ? BigInt(value) : BigInt(Math.floor(value));
  
  switch (precision) {
    case 'sec':
      return validateSecTimestamp(Number(num));
    case 'ms':
      return validateMsTimestamp(Number(num));
    case 'us':
      return validateUsTimestamp(Number(num));
    case 'ns':
      return validateNsTimestamp(Number(num));
    default:
      return false;
  }
}

/**
 * 3. 日期格式化工具函数 - 统一格式化逻辑
 */

/**
 * 统一的日期格式化函数
 * @param {Date|number} date - 日期对象或时间戳
 * @param {string} format - 格式字符串
 * @param {string} [timezone] - 时区
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date, format, timezone) {
  if (typeof date === 'number') {
    date = new Date(date);
  }
  
  // 如果没有指定时区，使用本地时区
  if (!timezone) {
    return formatWithTokens(date.getTime(), '', format);
  }
  
  return formatWithTokens(date.getTime(), timezone, format);
}

/**
 * 格式化本地日期
 * @param {Date|number} date - 日期对象或时间戳
 * @returns {string} 格式化后的本地日期字符串
 */
function formatLocalDate(date) {
  if (typeof date === 'number') {
    date = new Date(date);
  }
  return formatLocal(date);
}

/**
 * 格式化时间戳为指定格式
 * @param {string|number} timestamp - 时间戳
 * @param {string} format - 格式字符串
 * @param {string} [timezone] - 时区
 * @param {string} [precision] - 精度级别
 * @returns {string} 格式化后的字符串
 */
function formatTimestamp(timestamp, format, timezone, precision) {
  const ms = convertToMs(timestamp, precision);
  if (!validateTimestamp(ms)) {
    return t('invalidTs');
  }
  return formatDate(ms, format, timezone);
}

/**
 * 将不同精度的时间戳转换为毫秒
 * @param {string|number} timestamp - 时间戳
 * @param {string} precision - 精度级别
 * @returns {number} 毫秒级时间戳
 */
function convertToMs(timestamp, precision) {
  if (typeof timestamp !== 'string' && typeof timestamp !== 'number') return null;
  
  const num = typeof timestamp === 'string' ? BigInt(timestamp) : BigInt(Math.floor(timestamp));
  
  switch (precision) {
    case 'sec':
      return Number(num * 1000n);
    case 'ms':
      return Number(num);
    case 'us':
      return Number(bigFloorDiv(num, 1000n));
    case 'ns':
      return Number(bigFloorDiv(num, 1000000n));
    default:
      return Number(num);
  }
}

/**
 * 4. DOM操作工具函数 - 统一DOM操作逻辑
 */

/**
 * 安全的DOM元素选择器
 * @param {string} selector - CSS选择器
 * @param {Element} [context=document] - 上下文元素
 * @returns {Element|null} 匹配的元素
 */
function safeQuerySelector(selector, context = document) {
  try {
    return context.querySelector(selector);
  } catch (e) {
    console.error(`DOM选择器错误: ${selector}`, e);
    return null;
  }
}

/**
 * 批量DOM元素选择
 * @param {string} selector - CSS选择器
 * @param {Element} [context=document] - 上下文元素
 * @returns {NodeList} 匹配的元素列表
 */
function querySelectorAll(selector, context = document) {
  try {
    return context.querySelectorAll(selector);
  } catch (e) {
    console.error(`DOM选择器错误: ${selector}`, e);
    return [];
  }
}

/**
 * 安全地设置元素HTML内容
 * @param {string|Element} selector - CSS选择器或DOM元素
 * @param {string} html - HTML内容
 */
function safeSetHtml(selector, html) {
  const element = typeof selector === 'string' ? $(selector) : selector;
  if (element) {
    try {
      element.innerHTML = html;
    } catch (e) {
      console.error(`设置HTML内容错误: ${selector}`, e);
    }
  }
}

/**
 * 安全地设置元素文本内容
 * @param {string|Element} selector - CSS选择器或DOM元素
 * @param {string} text - 文本内容
 */
function safeSetText(selector, text) {
  const element = typeof selector === 'string' ? $(selector) : selector;
  if (element) {
    try {
      element.textContent = text;
    } catch (e) {
      console.error(`设置文本内容错误: ${selector}`, e);
    }
  }
}

/**
 * 切换元素类名
 * @param {string|Element} selector - CSS选择器或DOM元素
 * @param {string} className - 类名
 * @param {boolean} [force] - 是否强制添加或移除
 */
function toggleClass(selector, className, force) {
  const element = typeof selector === 'string' ? $(selector) : selector;
  if (element) {
    element.classList.toggle(className, force);
  }
}

/**
 * 5. 错误处理工具函数 - 统一错误处理模式
 */

/**
 * 统一的错误处理函数
 * @param {Error} error - 错误对象
 * @param {string} [message] - 自定义错误消息
 * @param {boolean} [logToConsole=true] - 是否输出到控制台
 */
function handleError(error, message = '', logToConsole = true) {
  if (logToConsole) {
    console.error('错误:', error);
    if (message) {
      console.error('消息:', message);
    }
  }
  
  // 显示用户友好的错误提示
  const userMessage = message || t('invalidTs');
  toast(userMessage);
}

/**
 * 带错误处理的异步函数包装器
 * @param {Function} fn - 要包装的函数
 * @param {string} [errorMessage] - 错误消息
 * @returns {Function} 包装后的函数
 */
function withErrorHandling(fn, errorMessage) {
  return function(...args) {
    try {
      return fn.apply(this, args);
    } catch (error) {
      handleError(error, errorMessage);
      return null;
    }
  };
}

/**
 * 安全执行函数，捕获所有错误
 * @param {Function} fn - 要执行的函数
 * @param {...any} args - 函数参数
 * @returns {*} 函数执行结果
 */
function safeExecute(fn, ...args) {
  try {
    return fn(...args);
  } catch (error) {
    handleError(error);
    return null;
  }
}

/**
 * 6. 其他通用工具函数
 */

/**
 * 防抖函数
 * @param {Function} fn - 要防抖的函数
 * @param {number} ms - 防抖时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, ms) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * 节流函数
 * @param {Function} fn - 要节流的函数
 * @param {number} ms - 节流时间（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(fn, ms) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      return fn(...args);
    }
  };
}

/**
 * 数字补零
 * @param {number} n - 数字
 * @param {number} [width=2] - 总宽度
 * @returns {string} 补零后的字符串
 */
function padZero(n, width = 2) {
  return String(n).padStart(width, '0');
}

/**
 * 检查值是否为空
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为空
 */
function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * 深拷贝对象
 * @param {*} obj - 要拷贝的对象
 * @returns {*} 拷贝后的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
  return obj;
}

// 导出所有公共函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    addEventListener,
    bindEvents,
    validateTimestamp,
    validateSecTimestamp,
    validateMsTimestamp,
    validateUsTimestamp,
    validateNsTimestamp,
    validateTimestampByPrecision,
    formatDate,
    formatLocalDate,
    formatTimestamp,
    convertToMs,
    safeQuerySelector,
    querySelectorAll,
    safeSetHtml,
    safeSetText,
    toggleClass,
    handleError,
    withErrorHandling,
    safeExecute,
    debounce,
    throttle,
    padZero,
    isEmpty,
    deepClone
  };
}