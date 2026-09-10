# 具体代码修复方案

本文档提供审计报告中发现的具体问题的实际代码修复方案。

## 1. 输入验证加强

### 问题
`js/utils/validators.js` 中的时间戳验证不够严格，直接返回 `Number.isFinite()` 判断。

### 修复方案

**文件**: `js/utils/validators.js`

```javascript
// 修改前
export function validateTimestamp(timestamp) {
  const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  if (typeof ts !== 'number' || !Number.isInteger(ts)) return false;
  return ts >= MIN_TS && ts <= MAX_TS;
}

// 修改后 - 增加 BigInt 支持，处理超出 Number 安全整数范围的时间戳
export function validateTimestamp(timestamp, precision = 'ms') {
  // 支持 BigInt 或 Number 类型
  let ts;
  try {
    ts = typeof timestamp === 'string' ? BigInt(timestamp) : BigInt(timestamp);
  } catch (e) {
    return false;
  }
  
  // 根据精度验证范围
  const ranges = {
    sec: [-8640000000000n, 8640000000000n],
    ms: [-8640000000000000n, 8640000000000000n],
    us: [-8640000000000000000n, 8640000000000000000n],
    ns: [-8640000000000000000000n, 8640000000000000000000n]
  };
  
  const [min, max] = ranges[precision] || ranges.ms;
  return ts >= min && ts <= max;
}
```

### 附加修复：输入清理

**文件**: `js/utils/validators.js` (新增)

```javascript
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  // 移除HTML标签
  return input.replace(/<[^>]*>/g, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '')
              .trim();
}

export function validateInputLength(input, maxLength = 50) {
  return input.length <= maxLength;
}
```

---

## 2. 代码重复消除

### 问题
`validateTimestamp` 在 `js/core.js`, `js/utils/common.js`, `js/utils/validators.js` 中都有定义。

### 修复方案

**目标**: 统一所有验证函数到 `js/utils/validators.js`

**文件**: `js/utils/validators.js` (作为唯一来源)

```javascript
// 唯一的时间戳常量定义
export const MIN_TS_SEC = -8640000000000;
export const MAX_TS_SEC = 8640000000000;
export const MIN_TS_MS = -8640000000000000;
export const MAX_TS_MS = 8640000000000000;

export function validateTimestamp(ts, precision = 'ms') {
  // ...统一实现
}

export function validateSecTimestamp(sec) {
  return Number.isFinite(sec) && sec >= MIN_TS_SEC && sec <= MAX_TS_SEC;
}

export function validateMsTimestamp(ms) {
  return validateTimestamp(ms, 'ms');
}

export function validateUsTimestamp(us) {
  return Number.isFinite(us) && us >= MIN_TS_MS * 1000 && us <= MAX_TS_MS * 1000;
}

export function validateNsTimestamp(ns) {
  return Number.isFinite(ns) && ns >= MIN_TS_MS * 1000000 && ns <= MAX_TS_MS * 1000000;
}
```

**文件**: `js/core.js` (修改)

```javascript
// 移除本地的 validateTimestamp 定义
// 引入统一的验证函数
import { validateTimestamp, validateSecTimestamp, validateMsTimestamp } from './utils/validators.js';
// 或使用全局变量访问
```

---

## 3. 错误处理统一

### 问题
代码中存在多种错误处理方式：`console.error()`, `handleError()`, `toast()`, 直接 throw。

### 修复方案

**文件**: 新建 `js/utils/error-handler.js` (统一接口)

```javascript
export class ErrorReporter {
  constructor() {
    this.handlers = new Map();
    this.logBuffer = [];
    this.maxLogs = 100;
  }

  /**
   * 统一错误处理入口
   */
  report(error, context = {}) {
    // 记录日志
    this.logError(error, context);
    
    // 通知所有处理器
    this.notifyHandlers(error, context);
    
    // 用户提示
    this.notifyUser(error, context);
  }

  /**
   * 统一错误日志格式
   */
  logError(error, context) {
    const entry = {
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack || '',
      context,
      type: error.type || 'UNKNOWN',
      severity: error.severity || 'MEDIUM'
    };

    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxLogs) {
      this.logBuffer.shift();
    }

    // 统一输出格式
    console.error(`[TimestampPlugin] ${entry.severity}: ${entry.message}`, {
      timestamp: entry.timestamp,
      context,
      stack: entry.stack
    });
  }

  /**
   * 注册错误处理器
   */
  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type).push(handler);
  }

  /**
   * 通知用户
   */
  notifyUser(error, context) {
    const message = this.getUserFriendlyMessage(error);
    if (typeof toast === 'function') {
      toast(message);
    }
  }

  /**
   * 获取用户友好的错误信息
   */
  getUserFriendlyMessage(error) {
    // 根据错误类型返回用户友好的信息
    const messages = {
      VALIDATION: '输入格式不正确，请检查后重试',
      TIMEZONE: '时区无效，请重新选择',
      CONVERSION: '转换失败，请检查输入',
      STORAGE: '存储操作失败，请检查存储空间',
      RUNTIME: '程序运行出错，请刷新重试'
    };
    return messages[error.type] || '发生未知错误，请重试';
  }
}

// 全局错误处理器
export const errorReporter = new ErrorReporter();

// 全局未捕获异常处理器
export function setupGlobalErrorHandler() {
  window.addEventListener('unhandledrejection', (event) => {
    errorReporter.report(event.reason, { 
      location: 'unhandledrejection',
      type: 'PROMISE'
    });
  });

  window.addEventListener('error', (event) => {
    errorReporter.report(event.error || new Error(event.message), {
      location: event.filename,
      line: event.lineno,
      column: event.colno,
      type: 'RUNTIME'
    });
  });
}
```

**使用方式**: 在 `index.html` 中引入并初始化。

```html
<script src="js/utils/error-handler.js"></script>
<script>
  setupGlobalErrorHandler();
</script>
```

---

## 4. 国际化完善

### 问题
部分用户可见文本未包含在 I18N 对象中，存在硬编码。

### 修复方案

**文件**: `js/core.js`

```
方法：
1. 搜索所有 textContent、innerHTML、placeholder、title 赋值
2. 检查是否有对应的 i18n key
3. 补充缺失的 key
4. 使用 scan-i18n 工具验证覆盖
```

**具体修改**:

```javascript
// 补充缺失的 i18n 条目

// 中文
zh: {
  // ... 已有条目
  // 新增补条目
  searchPlaceholder: '搜索时区名称...',
  emptyResult: '无匹配结果',
  confirmDelete: '确定要删除吗？',
  clearConfirm: '确定要清空吗？',
  copySuccess: '复制成功',
  copyFail: '复制失败',
  dateInvalid: '日期格式无效',
  dateOutOfRange: '日期超出可表示范围',
  timezoneInvalid: '无效的时区',
  tzNotFound: '未找到该时区',
  parseSuccess: '解析成功',
  parseFail: '解析失败',
  calendarOpen: '打开日历',
  calendarClose: '关闭日历'
},

// 英文
en: {
  // ... 已有条目
  // 新增补条目
  searchPlaceholder: 'Search timezones...',
  emptyResult: 'No results found',
  confirmDelete: 'Are you sure you want to delete?',
  clearConfirm: 'Are you sure you want to clear?',
  copySuccess: 'Copied successfully',
  copyFail: 'Copy failed',
  dateInvalid: 'Invalid date format',
  dateOutOfRange: 'Date out of range',
  timezoneInvalid: 'Invalid timezone',
  tzNotFound: 'Timezone not found',
  parseSuccess: 'Parse successful',
  parseFail: 'Parse failed',
  calendarOpen: 'Open calendar',
  calendarClose: 'Close calendar'
}
```

---

## 5. 性能优化：计算结果缓存

### 问题
`formatWithTokens`, `tzParts`, `offsetMinutes` 等函数每次调用都重新计算。

### 修复方案

**文件**: `js/datetime.js`

```javascript
// 修改前
function tzParts(date, tz) {
  // 每次调用重新计算
}

// 修改后 - 添加缓存
const tzPartsCache = new Map();
const CACHE_TTL = 60000; // 1分钟缓存

function tzParts(date, tz) {
  const cacheKey = `${tz}_${date.getTime()}`;
  
  if (tzPartsCache.has(cacheKey)) {
    const cached = tzPartsCache.get(cacheKey);
    if (Date.now() - cached.time < CACHE_TTL) {
      return cached.value;
    }
  }
  
  // 原有计算逻辑
  // ...
  
  // 存入缓存
  if (tzPartsCache.size > 100) {
    // 缓存清理：删除过期项
    for (const [key, val] of tzPartsCache) {
      if (Date.now() - val.time > CACHE_TTL) {
        tzPartsCache.delete(key);
      }
    }
  }
  
  tzPartsCache.set(cacheKey, { value: result, time: Date.now() });
  return result;
}
```

同样优化 `formatWithTokens`:

```javascript
const fmtCache = new Map();

function formatWithTokens(ms, tz, fmt) {
  const cacheKey = `${ms}_${tz}_${fmt}`;
  if (fmtCache.has(cacheKey)) return fmtCache.get(cacheKey);
  
  // 原有逻辑
  const result = /* ...计算... */;
  
  if (fmtCache.size > 200) fmtCache.clear();
  fmtCache.set(cacheKey, result);
  return result;
}
```

---

## 6. 内存泄漏修复

### 问题
- 动态创建的元素事件监听器未清理
- 定时器未正确管理

### 修复方案

**文件**: 新建 `js/utils/resource-manager.js`

```javascript
export class ResourceManager {
  constructor() {
    this.timers = new Map();
    this.listeners = [];
    this.observers = [];
  }
  
  /**
   * 注册定时器
   */
  setInterval(callback, ms, id = null) {
    const timerId = setInterval(callback, ms);
    const key = id || `interval_${Date.now()}`;
    this.timers.set(key, { type: 'interval', id: timerId });
    return key;
  }
  
  setTimeout(callback, ms, id = null) {
    const timerId = setTimeout(() => {
      this.timers.delete(id || timerId);
      callback();
    }, ms);
    const key = id || `timeout_${Date.now()}`;
    this.timers.set(key, { type: 'timeout', id: timerId });
    return key;
  }
  
  /**
   * 注册事件监听器
   */
  addEventListener(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    this.listeners.push({ element, event, handler, options });
  }
  
  /**
   * 清理所有资源
   */
  cleanup() {
    // 清理定时器
    this.timers.forEach(({ type, id }) => {
      if (type === 'interval') clearInterval(id);
      else clearTimeout(id);
    });
    this.timers.clear();
    
    // 清理事件监听器
    this.listeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.listeners = [];
    
    // 清理观察者
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const resourceManager = new ResourceManager();
```

---

## 7. 响应式设计优化

### 问题
只有基础响应式断点，移动端体验不佳。

### 修复方案

**文件**: `index.css` (在文件末尾添加)

```css
/* 优化响应式断点 */
@media (max-width: 768px) {
  .card-inner {
    grid-template-columns: 1fr !important;
  }
  .header {
    flex-wrap: wrap;
  }
  .tabs {
    width: 100%;
    overflow-x: auto;
  }
}

@media (max-width: 480px) {
  :root {
    --font-size-base: 14px;
  }
  .card {
    padding: 12px;
  }
  .date-input-row {
    flex-direction: column;
    align-items: stretch;
  }
  .date-input-row .cal-btn {
    position: static;
    transform: none;
    margin-top: 8px;
  }
}

/* 触摸设备优化 */
@media (pointer: coarse) {
  .wheel-item {
    height: 44px;
    line-height: 44px;
  }
  .tz-hour-wheel,
  .tz-min-wheel {
    height: 44px !important;
  }
  .cal-btn,
  .clear-btn {
    min-width: 44px;
    min-height: 44px;
  }
}
```

---

## 8. 可访问性增强

### 问题
缺少 ARIA 标签、键盘导航不完善。

### 修复方案

**文件**: `index.html`

```html
<!-- 修复前 -->
<button class="cal-btn" id="btn-calendar" title="打开日历">🕒</button>

<!-- 修复后 - 添加ARIA标签 -->
<button class="cal-btn" id="btn-calendar" 
        title="打开日历" 
        aria-label="打开日历"
        aria-haspopup="dialog"
        aria-expanded="false"
        aria-controls="calendar">
  🕒
</button>
```

**文件**: `js/core.js`

```javascript
// 在日历开/关时更新ARIA状态
function openCalendar() {
  calendarEl.classList.add('open');
  const btn = document.getElementById('btn-calendar');
  if (btn) btn.setAttribute('aria-expanded', 'true');
  // 将焦点移到日历
  const firstFocusable = calendarEl.querySelector('button, input');
  if (firstFocusable) firstFocusable.focus();
}

function closeCalendar() {
  calendarEl.classList.remove('open');
  const btn = document.getElementById('btn-calendar');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  // 焦点返回到按钮
  btn.focus();
}

// 添加键盘导航支持 (在 events.js 中添加)
const calendarEl = document.getElementById('calendar');
calendarEl.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCalendar();
    e.preventDefault();
  }
});
```

---

## 9. 版本管理和发布流程

### 问题
- package.json 和 plugin.json 版本不一致
- 无发布流程

### 修复方案

**文件**: 新建 `dev/scripts/version-bump.mjs`

```javascript
#!/usr/bin/env node
// 统一版本号到 plugin.json 和 package.json
import { readFileSync, writeFileSync } from 'node:fs';

const [_, __, newVersion] = process.argv;
if (!newVersion) {
  console.error('Usage: node dev/scripts/version-bump.mjs <version>');
  process.exit(1);
}

// 更新 plugin.json
const pluginPath = 'plugin.json';
const plugin = JSON.parse(readFileSync(pluginPath, 'utf8'));
plugin.version = newVersion;
writeFileSync(pluginPath, JSON.stringify(plugin, null, 2) + '\n');

// 更新 package.json
const pkgPath = 'package.json';
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`版本已更新到 ${newVersion}`);
```

运算方式:
```json
// package.json scripts 添加
{
  "scripts": {
    "version:bump": "node dev/scripts/version-bump.mjs"
  }
}
```

---

## 检查清单

修复完成后运行以下检查:

```bash
# 运行所有检查
npm run lint
npm run test:load
npm test

# 手动验证
- [ ] 打开 index.html
- [ ] 测试所有核心功能
- [ ] 测试所有配置项
- [ ] 测试国际化切换
- [ ] 测试主题切换
- [ ] 测试不同浏览器
```