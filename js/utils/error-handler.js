/**
 * 错误处理模块
 * 
 * 提供统一的错误处理机制，包括错误捕获、日志记录、用户友好的错误提示等
 * 支持不同类型的错误处理，包括运行时错误、网络错误、用户输入错误等
 * 
 * @module error-handler
 * @author timestamp-developer
 * @version 1.0.0
 */

// 错误类型枚举
export const ErrorType = {
  RUNTIME: 'RUNTIME',           // 运行时错误
  NETWORK: 'NETWORK',           // 网络错误
  VALIDATION: 'VALIDATION',     // 验证错误
  PERMISSION: 'PERMISSION',     // 权限错误
  STORAGE: 'STORAGE',           // 存储错误
  TIMEZONE: 'TIMEZONE',         // 时区错误
  CONVERSION: 'CONVERSION',     // 转换错误
  UI: 'UI',                     // UI错误
  UNKNOWN: 'UNKNOWN'            // 未知错误
};

// 错误严重级别
export const ErrorSeverity = {
  LOW: 'LOW',           // 低：不影响主要功能
  MEDIUM: 'MEDIUM',     // 中：影响部分功能
  HIGH: 'HIGH',         // 高：严重影响功能
  CRITICAL: 'CRITICAL'  // 严重：系统无法正常运行
};

// 错误日志配置
const LOG_CONFIG = {
  enabled: true,
  maxLogs: 1000,
  logLevel: 'INFO', // DEBUG, INFO, WARN, ERROR
  persistToStorage: true,
  storageKey: 'timestamp_error_logs'
};

// 错误日志存储
let errorLogs = [];

/**
 * 错误类
 * 自定义错误类型，包含错误信息和元数据
 */
export class TimestampError extends Error {
  /**
   * 构造函数
   * @param {string} message - 错误信息
   * @param {Object} options - 错误选项
   * @param {string} options.type - 错误类型
   * @param {string} options.severity - 错误严重级别
   * @param {Object} options.details - 错误详细信息
   * @param {number} options.timestamp - 错误发生时间戳
   * @param {string} options.stack - 错误堆栈
   */
  constructor(message, options = {}) {
    super(message);
    this.name = 'TimestampError';
    this.type = options.type || ErrorType.UNKNOWN;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.details = options.details || {};
    this.timestamp = options.timestamp || Date.now();
    this.stack = options.stack || this.stack;
    
    // 添加错误ID用于追踪
    this.errorId = this.generateErrorId();
  }
  
  /**
   * 生成错误ID
   * @returns {string} 错误ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 获取错误信息对象
   * @returns {Object} 错误信息对象
   */
  toJSON() {
    return {
      errorId: this.errorId,
      message: this.message,
      type: this.type,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * 错误处理器类
 * 提供统一的错误处理接口
 */
export class ErrorHandler {
  constructor() {
    this.errorCallbacks = new Map();
    this.globalHandlers = [];
    this.isHandlingError = false;
  }
  
  /**
   * 注册错误类型回调
   * @param {string} type - 错误类型
   * @param {Function} callback - 错误处理回调
   */
  on(type, callback) {
    if (!this.errorCallbacks.has(type)) {
      this.errorCallbacks.set(type, []);
    }
    this.errorCallbacks.get(type).push(callback);
  }
  
  /**
   * 移除错误类型回调
   * @param {string} type - 错误类型
   * @param {Function} callback - 错误处理回调
   */
  off(type, callback) {
    if (this.errorCallbacks.has(type)) {
      const callbacks = this.errorCallbacks.get(type);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  /**
   * 添加全局错误处理器
   * @param {Function} handler - 错误处理器
   */
  addGlobalHandler(handler) {
    this.globalHandlers.push(handler);
  }
  
  /**
   * 移除全局错误处理器
   * @param {Function} handler - 错误处理器
   */
  removeGlobalHandler(handler) {
    const index = this.globalHandlers.indexOf(handler);
    if (index > -1) {
      this.globalHandlers.splice(index, 1);
    }
  }
  
  /**
   * 处理错误
   * @param {Error|TimestampError} error - 错误对象
   * @param {Object} context - 错误上下文
   */
  handle(error, context = {}) {
    if (this.isHandlingError) {
      // 防止错误处理循环
      console.error('Error handling loop detected:', error);
      return;
    }
    
    this.isHandlingError = true;
    
    try {
      // 确保错误是TimestampError类型
      if (!(error instanceof TimestampError)) {
        error = new TimestampError(error.message, {
          type: ErrorType.RUNTIME,
          details: { originalError: error, context }
        });
      }
      
      // 添加上下文信息
      error.details.context = context;
      
      // 记录错误日志
      this.logError(error);
      
      // 调用全局处理器
      this.globalHandlers.forEach(handler => {
        try {
          handler(error);
        } catch (e) {
          console.error('Global error handler failed:', e);
        }
      });
      
      // 调用特定类型的处理器
      const callbacks = this.errorCallbacks.get(error.type) || [];
      callbacks.forEach(callback => {
        try {
          callback(error);
        } catch (e) {
          console.error('Error type handler failed:', e);
        }
      });
      
      // 显示用户友好的错误提示
      this.showUserFriendlyError(error);
      
    } catch (e) {
      console.error('Error in error handler:', e);
    } finally {
      this.isHandlingError = false;
    }
  }
  
  /**
   * 记录错误日志
   * @param {TimestampError} error - 错误对象
   */
  logError(error) {
    if (!LOG_CONFIG.enabled) return;
    
    const logEntry = {
      ...error.toJSON(),
      timestamp: new Date(error.timestamp).toISOString()
    };
    
    errorLogs.push(logEntry);
    
    // 限制日志数量
    if (errorLogs.length > LOG_CONFIG.maxLogs) {
      errorLogs = errorLogs.slice(-LOG_CONFIG.maxLogs);
    }
    
    // 持久化到本地存储
    if (LOG_CONFIG.persistToStorage) {
      try {
        localStorage.setItem(LOG_CONFIG.storageKey, JSON.stringify(errorLogs));
      } catch (e) {
        console.error('Failed to persist error logs:', e);
      }
    }
    
    // 根据严重级别输出到控制台
    if (this.shouldLogToConsole(error.severity)) {
      this.logToConsole(error);
    }
  }
  
  /**
   * 判断是否应该输出到控制台
   * @param {string} severity - 错误严重级别
   * @returns {boolean} 是否应该输出
   */
  shouldLogToConsole(severity) {
    const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    const currentLevel = levels[LOG_CONFIG.logLevel] || 1;
    const errorLevel = levels[severity.toUpperCase()] || 1;
    return errorLevel >= currentLevel;
  }
  
  /**
   * 输出到控制台
   * @param {TimestampError} error - 错误对象
   */
  logToConsole(error) {
    const logMethod = error.severity === 'ERROR' ? 'error' : 
                     error.severity === 'WARN' ? 'warn' : 'log';
    
    console[logMethod](`[${error.type}] ${error.message}`, error.details);
    
    if (error.severity === 'ERROR' && error.stack) {
      console.error(error.stack);
    }
  }
  
  /**
   * 显示用户友好的错误提示
   * @param {TimestampError} error - 错误对象
   */
  showUserFriendlyError(error) {
    // 根据错误类型和严重级别显示不同的提示
    const messages = this.getUserFriendlyMessages(error);
    
    // 使用uTools的提示功能或自定义提示
    if (window.utools) {
      utools.showNotification({
        title: messages.title,
        content: messages.content,
        type: error.severity === 'CRITICAL' ? 'error' : 'warning'
      });
    } else {
      // 备用提示方式
      alert(`${messages.title}\n\n${messages.content}`);
    }
  }
  
  /**
   * 获取用户友好的错误消息
   * @param {TimestampError} error - 错误对象
   * @returns {Object} 错误消息对象
   */
  getUserFriendlyMessages(error) {
    const messages = {
      [ErrorType.RUNTIME]: {
        title: '系统错误',
        content: '系统遇到了一个错误，请稍后重试。'
      },
      [ErrorType.NETWORK]: {
        title: '网络错误',
        content: '网络连接失败，请检查您的网络设置。'
      },
      [ErrorType.VALIDATION]: {
        title: '输入错误',
        content: '输入的格式不正确，请检查您的输入。'
      },
      [ErrorType.PERMISSION]: {
        title: '权限错误',
        content: '您没有足够的权限执行此操作。'
      },
      [ErrorType.STORAGE]: {
        title: '存储错误',
        content: '无法保存数据，请检查浏览器存储权限。'
      },
      [ErrorType.TIMEZONE]: {
        title: '时区错误',
        content: '时区数据加载失败，将使用默认时区。'
      },
      [ErrorType.CONVERSION]: {
        title: '转换错误',
        content: '数据转换失败，请检查输入格式。'
      },
      [ErrorType.UI]: {
        title: '界面错误',
        content: '界面显示异常，请刷新页面重试。'
      },
      [ErrorType.UNKNOWN]: {
        title: '未知错误',
        content: '发生了未知错误，请联系开发者。'
      }
    };
    
    return messages[error.type] || messages[ErrorType.UNKNOWN];
  }
  
  /**
   * 获取错误日志
   * @param {number} limit - 日志数量限制
   * @returns {Array} 错误日志数组
   */
  getErrorLogs(limit = 50) {
    return errorLogs.slice(-limit);
  }
  
  /**
   * 清空错误日志
   */
  clearErrorLogs() {
    errorLogs = [];
    if (LOG_CONFIG.persistToStorage) {
      try {
        localStorage.removeItem(LOG_CONFIG.storageKey);
      } catch (e) {
        console.error('Failed to clear error logs from storage:', e);
      }
    }
  }
  
  /**
   * 获取错误统计
   * @returns {Object} 错误统计信息
   */
  getErrorStats() {
    const stats = {
      total: errorLogs.length,
      byType: {},
      bySeverity: {},
      recent24h: 0
    };
    
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    
    errorLogs.forEach(log => {
      // 按类型统计
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      
      // 按严重级别统计
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
      
      // 最近24小时统计
      if (log.timestamp > dayAgo) {
        stats.recent24h++;
      }
    });
    
    return stats;
  }
}

// 创建全局错误处理器实例
export const errorHandler = new ErrorHandler();

// 全局错误处理
window.addEventListener('error', (event) => {
  const error = new TimestampError(event.message, {
    type: ErrorType.RUNTIME,
    details: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    }
  });
  errorHandler.handle(error);
});

// 全局Promise错误处理
window.addEventListener('unhandledrejection', (event) => {
  const error = new TimestampError(event.reason.message || 'Unhandled Promise Rejection', {
    type: ErrorType.RUNTIME,
    details: {
      reason: event.reason,
      promise: event.promise
    }
  });
  errorHandler.handle(error);
});

// 导出便捷的错误处理函数
export function handleError(error, type = ErrorType.RUNTIME, context = {}) {
  const timestampError = new TimestampError(error.message || error, {
    type,
    details: { originalError: error, ...context }
  });
  errorHandler.handle(timestampError);
}

export function withErrorHandling(fn, type = ErrorType.RUNTIME, context = {}) {
  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      handleError(error, type, context);
      return null;
    }
  };
}

export function createError(message, type = ErrorType.RUNTIME, details = {}) {
  return new TimestampError(message, { type, details });
}

// 初始化错误日志
export function initErrorHandler() {
  try {
    // 从本地存储加载错误日志
    if (LOG_CONFIG.persistToStorage) {
      const stored = localStorage.getItem(LOG_CONFIG.storageKey);
      if (stored) {
        errorLogs = JSON.parse(stored);
      }
    }
  } catch (e) {
    console.error('Failed to initialize error handler:', e);
  }
}

// 初始化
initErrorHandler();