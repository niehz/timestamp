/**
 * 国际化管理模块
 */
export const I18N = {
  currentLang: 'zh-CN',
  
  /**
   * 设置语言
   * @param {string} lang - 语言代码
   */
  setLanguage(lang) {
    this.currentLang = lang;
    document.documentElement.lang = lang;
    this.updateAllText();
  },
  
  /**
   * 获取当前语言
   * @returns {string} 语言代码
   */
  getCurrentLanguage() {
    return this.currentLang;
  },
  
  /**
   * 更新所有文本
   */
  updateAllText() {
    const translations = this.getTranslations();
    
    // 更新所有带有data-i18n属性的元素
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (translations[key]) {
        el.textContent = translations[key];
      }
    });
    
    // 更新所有带有data-i18n-title属性的元素
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle;
      if (translations[key]) {
        el.title = translations[key];
      }
    });
  },
  
  /**
   * 获取翻译文本
   * @param {string} key - 键名
   * @returns {string} 翻译文本
   */
  t(key) {
    const translations = this.getTranslations();
    return translations[key] || key;
  },
  
  /**
   * 获取当前语言的翻译
   * @returns {Object} 翻译对象
   */
  getTranslations() {
    try {
      // 动态导入翻译文件
      const translations = require(`./${this.currentLang}.json`);
      return translations;
    } catch (e) {
      console.error(`Failed to load translations for ${this.currentLang}:`, e);
      // 回退到中文
      return require('./zh-CN.json');
    }
  },
  
  /**
   * 切换语言
   */
  toggleLanguage() {
    const newLang = this.currentLang === 'zh-CN' ? 'en-US' : 'zh-CN';
    this.setLanguage(newLang);
  },
  
  /**
   * 获取所有支持的语言
   * @returns {Array} 语言代码数组
   */
  getSupportedLanguages() {
    return ['zh-CN', 'en-US'];
  },
  
  /**
   * 检查语言是否支持
   * @param {string} lang - 语言代码
   * @returns {boolean} 是否支持
   */
  isLanguageSupported(lang) {
    return this.getSupportedLanguages().includes(lang);
  },
  
  /**
   * 从URL参数获取语言
   * @returns {string|null} 语言代码
   */
  getLanguageFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang');
    return lang && this.isLanguageSupported(lang) ? lang : null;
  },
  
  /**
   * 设置URL语言参数
   * @param {string} lang - 语言代码
   */
  setLanguageInURL(lang) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('lang', lang);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({}, '', newUrl);
  },
  
  /**
   * 初始化语言设置
   */
  init() {
    // 从URL获取语言
    const urlLang = this.getLanguageFromURL();
    
    // 从本地存储获取语言
    const storedLang = localStorage.getItem('preferred_language');
    
    // 从浏览器设置获取语言
    const browserLang = navigator.language;
    
    // 确定使用的语言
    let lang = 'zh-CN'; // 默认中文
    
    if (urlLang) {
      lang = urlLang;
    } else if (storedLang && this.isLanguageSupported(storedLang)) {
      lang = storedLang;
    } else if (browserLang) {
      const supportedBrowserLang = browserLang.startsWith('zh') ? 'zh-CN' : 
                                 browserLang.startsWith('en') ? 'en-US' : 'zh-CN';
      lang = supportedBrowserLang;
    }
    
    // 设置语言
    this.setLanguage(lang);
    
    // 保存到本地存储
    localStorage.setItem('preferred_language', lang);
    
    // 更新URL
    this.setLanguageInURL(lang);
  },
  
  /**
   * 添加语言变更监听器
   * @param {Function} callback - 回调函数
   */
  onLanguageChange(callback) {
    document.addEventListener('languageChange', callback);
  },
  
  /**
   * 移除语言变更监听器
   * @param {Function} callback - 回调函数
   */
  offLanguageChange(callback) {
    document.removeEventListener('languageChange', callback);
  },
  
  /**
   * 触发语言变更事件
   */
  emitLanguageChange() {
    const event = new CustomEvent('languageChange', {
      detail: { language: this.currentLang }
    });
    document.dispatchEvent(event);
  },
  
  /**
   * 格式化日期
   * @param {Date} date - 日期对象
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date, options = {}) {
    const formatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      ...options
    };
    
    return new Intl.DateTimeFormat(this.currentLang, formatOptions).format(date);
  },
  
  /**
   * 格式化数字
   * @param {number} num - 数字
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的数字字符串
   */
  formatNumber(num, options = {}) {
    const formatOptions = {
      style: options.style || 'decimal',
      minimumFractionDigits: options.minimumFractionDigits || 0,
      maximumFractionDigits: options.maximumFractionDigits || 2,
      ...options
    };
    
    return new Intl.NumberFormat(this.currentLang, formatOptions).format(num);
  },
  
  /**
   * 格式化货币
   * @param {number} amount - 金额
   * @param {string} currency - 货币代码
   * @returns {string} 格式化后的货币字符串
   */
  formatCurrency(amount, currency = 'CNY') {
    return new Intl.NumberFormat(this.currentLang, {
      style: 'currency',
      currency: currency
    }).format(amount);
  },
  
  /**
   * 格式化相对时间
   * @param {Date} date - 日期对象
   * @param {Object} options - 格式化选项
   * @returns {string} 相对时间字符串
   */
  formatRelativeTime(date, options = {}) {
    const formatOptions = {
      numeric: 'auto',
      style: 'long',
      ...options
    };
    
    return new Intl.RelativeTimeFormat(this.currentLang, formatOptions).format(
      (date - new Date()) / (1000 * 60 * 60 * 24),
      'day'
    );
  },
  
  /**
   * 格式化列表
   * @param {Array} items - 项目数组
   * @returns {string} 格式化后的列表字符串
   */
  formatList(items) {
    return new Intl.ListFormat(this.currentLang, {
      style: 'long',
      type: 'conjunction'
    }).format(items);
  },
  
  /**
   * 格式化单位
   * @param {number} value - 数值
   * @param {string} unit - 单位
   * @returns {string} 格式化后的字符串
   */
  formatUnit(value, unit) {
    const formatter = new Intl.NumberFormat(this.currentLang, {
      style: 'unit',
      unit: unit,
      unitDisplay: 'short'
    });
    
    return formatter.format(value);
  },
  
  /**
   * 获取语言特定的排序函数
   * @param {Function} compareFn - 比较函数
   * @returns {Function} 排序函数
   */
  getCollator(compareFn) {
    return new Intl.Collator(this.currentLang, {
      sensitivity: 'base',
      numeric: true
    });
  },
  
  /**
   * 获取语言特定的日期解析函数
   * @param {string} dateString - 日期字符串
   * @returns {Date|null} 解析后的日期对象
   */
  parseDate(dateString) {
    try {
      return new Date(dateString);
    } catch (e) {
      return null;
    }
  },
  
  /**
   * 获取语言特定的数字解析函数
   * @param {string} numberString - 数字字符串
   * @returns {number|null} 解析后的数字
   */
  parseNumber(numberString) {
    try {
      return parseFloat(numberString);
    } catch (e) {
      return null;
    }
  },
  
  /**
   * 获取语言特定的正则表达式
   * @param {string} pattern - 正则表达式模式
   * @returns {RegExp} 正则表达式对象
   */
  getRegExp(pattern) {
    try {
      return new RegExp(pattern);
    } catch (e) {
      return null;
    }
  },
  
  /**
   * 获取语言特定的验证函数
   * @param {string} type - 验证类型
   * @returns {Function} 验证函数
   */
  getValidator(type) {
    switch (type) {
      case 'date':
        return (value) => {
          const date = this.parseDate(value);
          return date && !isNaN(date.getTime());
        };
      case 'number':
        return (value) => {
          return this.parseNumber(value) !== null;
        };
      case 'email':
        return (value) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        };
      case 'phone':
        return (value) => {
          const phoneRegex = /^[\d\s\-\+\(\)]+$/;
          return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
        };
      default:
        return () => true;
    }
  },
  
  /**
   * 获取语言特定的错误消息
   * @param {string} type - 错误类型
   * @returns {string} 错误消息
   */
  getErrorMessage(type) {
    const messages = {
      required: this.t('errorRequired'),
      invalid: this.t('errorInvalid'),
      min: this.t('errorMin'),
      max: this.t('errorMax'),
      pattern: this.t('errorPattern'),
      custom: this.t('errorCustom')
    };
    
    return messages[type] || this.t('errorUnknown');
  },
  
  /**
   * 获取语言特定的占位符文本
   * @param {string} type - 占位符类型
   * @returns {string} 占位符文本
   */
  getPlaceholder(type) {
    const placeholders = {
      date: this.t('placeholderDate'),
      time: this.t('placeholderTime'),
      email: this.t('placeholderEmail'),
      phone: this.t('placeholderPhone'),
      number: this.t('placeholderNumber'),
      text: this.t('placeholderText')
    };
    
    return placeholders[type] || '';
  },
  
  /**
   * 获取语言特定的提示文本
   * @param {string} type - 提示类型
   * @returns {string} 提示文本
   */
  getHint(type) {
    const hints = {
      date: this.t('hintDate'),
      time: this.t('hintTime'),
      email: this.t('hintEmail'),
      phone: this.t('hintPhone'),
      number: this.t('hintNumber'),
      text: this.t('hintText')
    };
    
    return hints[type] || '';
  }
};

// 导出单例实例
export default I18N;