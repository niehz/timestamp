# IANA时区支持功能

## 概述

本功能为时间戳转换器插件提供了完整的IANA时区支持，包括历史时区偏移数据。通过集成Luxon时区库，系统能够正确处理历史日期的时区转换，确保时间计算的准确性。

## 功能特性

### 1. 完整的IANA时区支持
- 支持333个IANA时区
- 自动处理时区历史偏移
- 支持夏令时规则

### 2. 历史时区数据
- **Asia/Shanghai** 在1901年前使用UTC+08:05:43
- **Europe/London** 有复杂的夏令时历史
- **America/New_York** 有多个历史偏移变更
- 自动检测和使用正确的历史偏移

### 3. 增强的用户界面
- 可视化时区选择器
- 实时时区信息显示
- 历史数据支持标识
- 智能搜索和过滤

### 4. 向后兼容
- 保持原有API兼容性
- 渐进式升级路径
- 自动降级处理

## 技术实现

### 核心组件

#### 1. IANA时区处理核心 (`js/timezone/iana-timezone.js`)
- 使用Luxon库提供完整的时区支持
- 实现历史偏移计算
- 提供时区信息查询接口

#### 2. 兼容层 (`js/timezone/compatibility-layer.js`)
- 保持向后兼容的API
- 自动降级处理
- 缓存机制优化性能

#### 3. 增强时区选择器 (`js/timezone/enhanced-tzselector.js`)
- 可视化时区选择界面
- 支持历史数据展示
- 实时搜索和过滤

#### 4. 增强时区配置 (`js/timezone/enhanced-tz-config.js`)
- 完整的时区配置界面
- 历史数据管理
- 批量时区选择

### 数据流

```
用户输入 → 时区选择 → IANA处理 → 历史偏移计算 → 时间转换 → 结果展示
```

## 使用方法

### 1. 基本使用

```javascript
// 加载IANA时区支持
await IanaTimezone.loadLuxon();

// 获取时区偏移（支持历史数据）
const offset = IanaTimezone.getTzOffset(date, 'Asia/Shanghai');

// 格式化时区日期
const formatted = IanaTimezone.formatTzDate(date, 'Asia/Shanghai', 'yyyy-MM-dd HH:mm:ss');

// 获取时区信息
const info = IanaTimezone.getTzInfo(date, 'Asia/Shanghai');
```

### 2. 历史数据查询

```javascript
// 检查时区是否支持历史数据
const supportsHistorical = IanaTimezone.supportsHistoricalData('Asia/Shanghai');

// 获取特定年份的历史信息
const historical = IanaTimezone.getTzHistoricalInfo('Asia/Shanghai', 1200);
```

### 3. 增强时区选择器

```javascript
// 创建增强时区选择器
const selector = new EnhancedTimezoneSelector('#container', {
  showHistoricalInfo: true,
  showOffsetInfo: true,
  enableSearch: true
});

// 监听选择事件
selector.on('selectionChange', (data) => {
  console.log('选择的时区:', data.selected);
});
```

### 4. 增强时区配置

```javascript
// 创建增强时区配置界面
const config = new EnhancedTzConfig('#config-container', {
  showHistoricalInfo: true,
  enableSearch: true
});

// 监听配置事件
config.on('selectionApplied', (data) => {
  console.log('应用的时区:', data.selected);
});
```

## 配置选项

### IANA时区配置

```javascript
const config = {
  enableHistoricalData: true,      // 启用历史数据支持
  showTzOffsetInfo: true,          // 显示时区偏移信息
  performanceMode: 'balanced',     // 性能模式: 'balanced' | 'fast' | 'accurate'
  cacheSize: 100                   // 缓存大小
};
```

### 兼容层配置

```javascript
const compatConfig = {
  enableHistoricalData: true,      // 启用历史数据支持
  fallbackToLegacy: true,          // 启用降级处理
  verboseLogging: false            // 详细日志
};
```

### 时区选择器配置

```javascript
const selectorConfig = {
  showHistoricalInfo: true,        // 显示历史信息
  showOffsetInfo: true,           // 显示偏移信息
  enableSearch: true,              // 启用搜索
  enableFilter: true,              // 启用过滤
  maxResults: 50,                  // 最大结果数
  debounceTime: 150                // 防抖时间
};
```

## 性能优化

### 1. 缓存机制
- 时区信息缓存
- 格式化结果缓存
- 智能缓存清理

### 2. 懒加载
- 按需加载Luxon库
- 延迟初始化时区数据
- 异步处理复杂计算

### 3. 性能监控
- 计算时间统计
- 内存使用监控
- 性能阈值警告

## 测试

### 1. 单元测试
```bash
# 运行IANA时区测试
node test-iana-timezone.js
```

### 2. 集成测试
```bash
# 运行所有测试
npm test
```

### 3. 性能测试
```bash
# 运行性能测试
npm run test:performance
```

### 4. 手动测试
打开 `test-iana-timezone.html` 进行手动测试。

## 兼容性

### 浏览器支持
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### 环境要求
- 支持ES6+语法
- 支持Promise
- 支持Intl API

## 故障排除

### 1. Luxon库加载失败
- 检查网络连接
- 确认CDN可用性
- 使用本地备用库

### 2. 历史数据不准确
- 确认时区名称正确
- 检查日期范围
- 查看控制台日志

### 3. 性能问题
- 调整缓存大小
- 启用性能模式
- 检查内存使用

## 示例场景

### 1. 历史日期转换
```javascript
// 1200年1月1日，上海时间
const historicalDate = new Date('1200-01-01T00:00:00Z');
const shanghaiTime = IanaTimezone.formatTzDate(historicalDate, 'Asia/Shanghai', 'yyyy-MM-dd HH:mm:ss');
// 结果: 1200-01-01 08:05:43 (使用LMT偏移)
```

### 2. 时区信息查询
```javascript
// 查询当前时区信息
const now = new Date();
const tzInfo = IanaTimezone.getTzInfo(now, 'Asia/Shanghai');
console.log('当前偏移:', tzInfo.offset);
console.log('是否夏令时:', tzInfo.isDst);
```

### 3. 批量时区处理
```javascript
// 处理多个时区
const timezones = ['Asia/Shanghai', 'America/New_York', 'Europe/London'];
const date = new Date('2023-01-01T12:00:00Z');

timezones.forEach(tz => {
  const formatted = IanaTimezone.formatTzDate(date, tz, 'yyyy-MM-dd HH:mm:ss');
  const offset = IanaTimezone.getTzOffset(date, tz);
  console.log(`${tz}: ${formatted} (${offset}分钟)`);
});
```

## 更新日志

### v1.0.0 (当前版本)
- 初始版本发布
- 完整的IANA时区支持
- 历史时区数据支持
- 增强用户界面
- 向后兼容性

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 相关链接

- [Luxon 官方文档](https://moment.github.io/luxon/)
- [IANA 时区数据库](https://www.iana.org/time-zones)
- [时区历史数据](https://en.wikipedia.org/wiki/History_of_time_zones)