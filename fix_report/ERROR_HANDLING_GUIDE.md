# 错误处理系统使用指南

> **文档版本**: v1.0.0  
> **最后更新**: 2026-09-09  
> **作者**: timestamp-developer

## 📋 概述

错误处理系统为时间戳转换插件提供统一的错误处理机制，包括错误捕获、日志记录、用户友好的错误提示等功能。

## 🎯 主要特性

- **统一错误处理**: 所有错误都通过统一的错误处理器处理
- **错误分类**: 支持多种错误类型（运行时、网络、验证等）
- **错误级别**: 支持不同严重级别的错误
- **日志记录**: 自动记录错误日志，支持持久化存储
- **用户友好**: 提供用户友好的错误提示
- **全局监控**: 监听全局错误和未处理的Promise拒绝

## 🚀 快速开始

### 基本使用

```javascript
import {handleError, createError, ErrorType} from './error-handler.js';

// 捕获并处理错误
try {
    // 可能出错的代码
    const result = riskyOperation();
} catch (error) {
    handleError(error, ErrorType.VALIDATION, {operation: 'riskyOperation'});
}

// 创建自定义错误
const customError = createError('用户名已存在', ErrorType.VALIDATION, {
    field: 'username',
    value: 'john_doe'
});
handleError(customError);
```

### 使用错误包装器

```javascript
import { withErrorHandling, ErrorType } from './js/utils/error-handler.js';

// 包装可能出错的函数
const safeOperation = withErrorHandling(riskyOperation, ErrorType.CONVERSION, {
  context: 'data conversion'
});

// 使用包装后的函数
const result = safeOperation();
if (result === null) {
  // 操作失败，错误已被处理
}
```

### 注册错误处理器

```javascript
import { errorHandler, ErrorType } from './js/utils/error-handler.js';

// 监听特定类型的错误
errorHandler.on(ErrorType.VALIDATION, (error) => {
  console.log('验证错误:', error.message);
  // 可以在这里添加特定的错误处理逻辑
});

// 添加全局错误处理器
errorHandler.addGlobalHandler((error) => {
  console.log('全局错误:', error);
  // 可以在这里添加日志上报等逻辑
});
```

## 📊 错误类型

系统定义了以下错误类型：

| 错误类型 | 枚举值 | 描述 |
|---------|--------|------|
| 运行时错误 | `RUNTIME` | 程序运行时的错误 |
| 网络错误 | `NETWORK` | 网络请求失败 |
| 验证错误 | `VALIDATION` | 输入数据验证失败 |
| 权限错误 | `PERMISSION` | 权限不足 |
| 存储错误 | `STORAGE` | 本地存储失败 |
| 时区错误 | `TIMEZONE` | 时区处理错误 |
| 转换错误 | `CONVERSION` | 数据转换失败 |
| UI错误 | `UI` | 界面相关错误 |
| 未知错误 | `UNKNOWN` | 未知类型的错误 |

## 🎚️ 错误级别

| 级别 | 枚举值 | 描述 |
|------|--------|------|
| 低 | `LOW` | 不影响主要功能 |
| 中 | `MEDIUM` | 影响部分功能 |
| 高 | `HIGH` | 严重影响功能 |
| 严重 | `CRITICAL` | 系统无法正常运行 |

## 🔧 API 参考

### TimestampError 类

```javascript
class TimestampError extends Error {
  constructor(message, options = {})
}
```

**参数:**
- `message` (string): 错误信息
- `options` (Object): 错误选项
  - `type` (string): 错误类型
  - `severity` (string): 错误严重级别
  - `details` (Object): 错误详细信息
  - `timestamp` (number): 错误发生时间戳
  - `stack` (string): 错误堆栈

### ErrorHandler 类

```javascript
class ErrorHandler {
  // 注册错误类型回调
  on(type, callback)
  
  // 移除错误类型回调
  off(type, callback)
  
  // 添加全局错误处理器
  addGlobalHandler(handler)
  
  // 处理错误
  handle(error, context = {})
  
  // 获取错误日志
  getErrorLogs(limit = 50)
  
  // 获取错误统计
  getErrorStats()
  
  // 清空错误日志
  clearErrorLogs()
}
```

### 便捷函数

```javascript
// 处理错误
function handleError(error, type = ErrorType.RUNTIME, context = {})

// 错误包装器
function withErrorHandling(fn, type = ErrorType.RUNTIME, context = {})

// 创建错误
function createError(message, type = ErrorType.RUNTIME, details = {})
```

## 📝 使用示例

### 1. 表单验证错误

```javascript
import { handleError, ErrorType } from './js/utils/error-handler.js';

function validateUserForm(formData) {
  const errors = [];
  
  if (!formData.username) {
    errors.push({
      field: 'username',
      message: '用户名不能为空'
    });
  }
  
  if (!formData.email || !isValidEmail(formData.email)) {
    errors.push({
      field: 'email',
      message: '邮箱格式不正确'
    });
  }
  
  if (errors.length > 0) {
    const error = new Error('表单验证失败');
    error.details = { errors };
    handleError(error, ErrorType.VALIDATION);
    return false;
  }
  
  return true;
}
```

### 2. API请求错误

```javascript
import { handleError, ErrorType, withErrorHandling } from './js/utils/error-handler.js';

async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    handleError(error, ErrorType.NETWORK, { userId });
    return null;
  }
}

// 使用包装器
const safeFetchUserData = withErrorHandling(fetchUserData, ErrorType.NETWORK);
const user = await safeFetchUserData(123);
```

### 3. 数据转换错误

```javascript
import { handleError, ErrorType } from './js/utils/error-handler.js';

function parseTimestamp(timestampStr) {
  try {
    const timestamp = parseInt(timestampStr, 10);
    
    if (isNaN(timestamp)) {
      throw new Error('无效的时间戳格式');
    }
    
    if (timestamp < -8640000000000000 || timestamp > 8640000000000000) {
      throw new Error('时间戳超出范围');
    }
    
    return timestamp;
  } catch (error) {
    handleError(error, ErrorType.CONVERSION, { input: timestampStr });
    return null;
  }
}
```

### 4. 组件错误处理

```javascript
import { errorHandler, ErrorType } from './js/utils/error-handler.js';

class TimestampConverter {
  constructor() {
    // 注册组件特定的错误处理器
    errorHandler.on(ErrorType.CONVERSION, this.handleConversionError.bind(this));
  }
  
  handleConversionError(error) {
    // 显示用户友好的错误提示
    this.showErrorToast(error.message);
    
    // 记录错误用于分析
    this.logError(error);
  }
  
  showErrorToast(message) {
    // 使用uTools或其他UI库显示错误提示
    if (window.utools) {
      utools.showNotification({
        title: '转换错误',
        content: message,
        type: 'warning'
      });
    }
  }
  
  logError(error) {
    // 可以将错误发送到服务器进行分析
    console.log('Component error:', error);
  }
}
```

## 🔍 错误日志

系统自动记录所有错误，可以通过以下方式访问：

```javascript
import { errorHandler } from './js/utils/error-handler.js';

// 获取最近的错误日志
const recentErrors = errorHandler.getErrorLogs(10);

// 获取错误统计
const stats = errorHandler.getErrorStats();
console.log('错误统计:', stats);

// 清空错误日志
errorHandler.clearErrorLogs();
```

### 错误日志格式

```javascript
{
  errorId: 'err_1634567890_abc123',
  message: '时间戳转换失败',
  type: 'CONVERSION',
  severity: 'MEDIUM',
  details: {
    input: 'invalid_timestamp',
    context: { operation: 'parseTimestamp' }
  },
  timestamp: '2023-12-25T15:30:45.000Z',
  stack: 'Error: 时间戳转换失败\n    at parseTimestamp...'
}
```

## 🛠️ 最佳实践

### 1. 错误类型选择

```javascript
// 使用合适的错误类型
handleError(error, ErrorType.VALIDATION, { field: 'email' }); // 验证错误
handleError(error, ErrorType.NETWORK, { url: '/api/data' }); // 网络错误
handleError(error, ErrorType.CONVERSION, { input: data }); // 转换错误
```

### 2. 错误上下文

```javascript
// 提供足够的上下文信息
try {
  const result = await convertTimestamp(timestamp);
  return result;
} catch (error) {
  handleError(error, ErrorType.CONVERSION, {
    input: timestamp,
    operation: 'convertTimestamp',
    userId: getCurrentUserId()
  });
}
```

### 3. 错误恢复

```javascript
function safeConvert(timestamp) {
  const result = withErrorHandling(
    () => convertTimestamp(timestamp),
    ErrorType.CONVERSION,
    { operation: 'safeConvert' }
  );
  
  if (result === null) {
    // 提供默认值或恢复逻辑
    return getDefaultTimestamp();
  }
  
  return result;
}
```

### 4. 错误监控

```javascript
// 添加全局错误监控
errorHandler.addGlobalHandler((error) => {
  // 发送错误到监控系统
  if (window.sentry) {
    window.sentry.captureException(error);
  }
  
  // 记录错误到本地存储
  console.log('Global error:', error);
});
```

## 🚨 注意事项

1. **避免错误处理循环**: 确保错误处理器不会抛出新的错误
2. **性能考虑**: 错误日志会占用存储空间，定期清理
3. **敏感信息**: 不要在错误信息中包含敏感数据
4. **用户体验**: 对用户显示友好的错误信息，不要显示技术细节
5. **错误分类**: 使用合适的错误类型，便于后续处理和分析

## 📈 性能优化

- 错误日志数量限制（默认1000条）
- 按严重级别控制日志输出
- 支持本地存储持久化
- 异步错误处理，不阻塞主线程

## 🔄 版本历史

- v1.0.0 (2026-09-09): 初始版本，支持基本错误处理功能