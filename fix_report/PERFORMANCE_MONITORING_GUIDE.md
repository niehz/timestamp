# 性能监控工具使用指南

> **文档版本**: v1.0.0  
> **最后更新**: 2026-09-09  
> **作者**: timestamp-developer

## 📋 概述

性能监控工具提供全面的性能监控功能，包括加载性能、运行时性能、用户交互性能等，帮助开发者识别性能瓶颈，优化用户体验。

## 🎯 主要特性

- **页面加载性能**: 监控DNS、TCP、请求、响应等加载指标
- **运行时性能**: 监控帧率、内存使用、长任务等运行时指标
- **用户交互性能**: 监控交互延迟、动画性能等用户体验指标
- **性能问题检测**: 自动检测性能问题并提供优化建议
- **可视化面板**: 提供实时性能监控面板
- **数据导出**: 支持JSON和CSV格式的性能数据导出

## 🚀 快速开始

### 基本使用

```javascript
import {
    startPerformanceMonitoring,
    stopPerformanceMonitoring,
    getPerformanceReport
} from './performance-monitor.js';

// 开始性能监控
startPerformanceMonitoring();

// 执行需要监控的操作
function heavyOperation() {
    // 模拟 heavy operation
    const data = new Array(100000).fill('data');
    return data.length;
}

const result = heavyOperation();

// 停止监控并获取报告
stopPerformanceMonitoring();
const report = getPerformanceReport();
console.log('性能报告:', report);
```

### 函数性能测量

```javascript
import { measurePerformance } from './js/utils/performance-monitor.js';

// 测量函数执行时间
const optimizedFunction = measurePerformance('optimizedFunction', () => {
  // 优化的函数逻辑
  return heavyCalculation();
});

const result = optimizedFunction(); // 自动测量执行时间

const unoptimizedFunction = measurePerformance('unoptimizedFunction', () => {
  // 未优化的函数逻辑
  return heavyCalculation();
});

const result2 = unoptimizedFunction(); // 自动测量执行时间
```

### 性能监控面板

```javascript
import { createPerformancePanel } from './js/utils/performance-monitor.js';

// 创建性能面板
const panelContainer = document.createElement('div');
document.body.appendChild(panelContainer);

const panel = createPerformancePanel(panelContainer);

// 显示面板
panel.show();

// 隐藏面板
// panel.hide();
```

## 📚 详细API

### PerformanceMetrics 类

```javascript
class PerformanceMetrics {
  // 开始收集性能指标
  start()
  
  // 停止收集性能指标
  stop()
  
  // 添加自定义性能指标
  addCustomMetric(name, value, metadata = {})
  
  // 测量函数执行时间
  measureFunction(fn, name)
  
  // 获取性能报告
  getReport()
  
  // 导出性能数据
  exportData(format = 'json')
}
```

### PerformancePanel 类

```javascript
class PerformancePanel {
  constructor(container)
  
  // 显示性能面板
  show()
  
  // 隐藏性能面板
  hide()
  
  // 设置性能数据
  setMetrics(metrics)
}
```

### 便捷函数

```javascript
// 开始性能监控
function startPerformanceMonitoring()

// 停止性能监控
function stopPerformanceMonitoring()

// 获取性能报告
function getPerformanceReport()

// 导出性能数据
function exportPerformanceData(format = 'json')

// 测量函数性能
function measurePerformance(name, fn)
```

## 📝 使用示例

### 1. 完整的性能监控

```javascript
import { 
  startPerformanceMonitoring, 
  stopPerformanceMonitoring,
  getPerformanceReport,
  measurePerformance 
} from './js/utils/performance-monitor.js';

// 开始监控
startPerformanceMonitoring();

// 创建需要监控的函数
const processData = measurePerformance('dataProcessing', () => {
  const data = generateLargeDataset();
  const processed = data.map(item => ({
    ...item,
    processed: true,
    timestamp: Date.now()
  }));
  return processed;
});

const renderUI = measurePerformance('uiRendering', () => {
  const container = document.getElementById('app');
  container.innerHTML = '';
  
  // 模拟UI渲染
  for (let i = 0; i < 1000; i++) {
    const element = document.createElement('div');
    element.textContent = `Item ${i}`;
    container.appendChild(element);
  }
});

// 执行操作
const data = processData();
renderUI();

// 停止监控并获取报告
stopPerformanceMonitoring();
const report = getPerformanceReport();

console.log('性能报告:', report);
console.log('自定义指标:', report.metrics.custom);
```

### 2. 实时性能监控

```javascript
import { startPerformanceMonitoring, createPerformancePanel } from './js/utils/performance-monitor.js';

// 开始监控
startPerformanceMonitoring();

// 创建性能面板
const panelContainer = document.createElement('div');
panelContainer.id = 'performance-panel';
document.body.appendChild(panelContainer);

const panel = createPerformancePanel(panelContainer);
panel.show();

// 模拟持续操作
let counter = 0;
setInterval(() => {
  // 模拟用户交互
  const start = performance.now();
  
  // 模拟工作
  const data = new Array(1000).fill('').map((_, i) => ({
    id: i,
    value: Math.random()
  }));
  
  const end = performance.now();
  
  // 添加自定义指标
  performanceMetrics.addCustomMetric('user_interaction', end - start, {
    type: 'click',
    counter: counter++
  });
  
  // 更新面板
  panel.setMetrics(performanceMetrics.getReport());
  
}, 2000);
```

### 3. 性能优化分析

```javascript
import { measurePerformance } from './js/utils/performance-monitor.js';

// 比较不同实现方式的性能
function testPerformance() {
  const iterations = 10000;
  
  // 测试实现1
  const impl1 = measurePerformance('implementation1', () => {
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += i * 2;
    }
    return result;
  });
  
  const result1 = impl1();
  
  // 测试实现2
  const impl2 = measurePerformance('implementation2', () => {
    const n = iterations - 1;
    return n * (n + 1); // 使用数学公式
  });
  
  const result2 = impl2();
  
  // 比较结果
  console.log('实现1结果:', result1, '时间:', performanceMetrics.getReport().metrics.custom[0].value);
  console.log('实现2结果:', result2, '时间:', performanceMetrics.getReport().metrics.custom[1].value);
}

testPerformance();
```

### 4. 内存使用监控

```javascript
import { startPerformanceMonitoring, stopPerformanceMonitoring } from './js/utils/performance-monitor.js';

startPerformanceMonitoring();

// 模拟内存使用
function simulateMemoryUsage() {
  const data = [];
  
  // 分配内存
  for (let i = 0; i < 100000; i++) {
    data.push({
      id: i,
      value: new Array(100).fill('data')
    });
  }
  
  console.log('数据已分配，大小:', data.length);
  
  // 清理部分内存
  data.splice(0, 50000);
  
  console.log('数据已清理，大小:', data.length);
  
  return data.length;
}

const remaining = simulateMemoryUsage();

// 停止监控并查看内存使用情况
stopPerformanceMonitoring();
const report = getPerformanceReport();

console.log('内存使用情况:');
console.log('- 平均使用率:', (report.summary.memoryUsage * 100).toFixed(1) + '%');
console.log('- 内存样本数:', report.metrics.memory.length);
console.log('- 最终内存使用:', report.metrics.memory[report.metrics.memory.length - 1]);
```

### 5. 长任务检测

```javascript
import { startPerformanceMonitoring, stopPerformanceMonitoring } from './js/utils/performance-monitor.js';

startPerformanceMonitoring();

// 模拟长任务
function simulateLongTask() {
  console.log('开始长任务...');
  
  // 阻塞主线程
  const start = performance.now();
  while (performance.now() - start < 100) {
    // 模拟工作
    Math.random();
  }
  
  console.log('长任务完成');
}

simulateLongTask();

// 停止监控并查看长任务
stopPerformanceMonitoring();
const report = getPerformanceReport();

console.log('长任务检测:');
console.log('- 长任务数量:', report.metrics.longTasks.length);
console.log('- 长任务详情:', report.metrics.longTasks);
```

## 📊 性能指标说明

### 页面加载性能

| 指标 | 描述 | 阈值 | 优化建议 |
|------|------|------|----------|
| DNS | DNS解析时间 | < 100ms | 使用DNS预加载 |
| TCP | TCP连接时间 | < 100ms | 使用HTTP/2 |
| Request | 请求时间 | < 500ms | 优化服务器响应 |
| Response | 响应时间 | < 1000ms | 压缩资源 |
| Load | 页面加载时间 | < 3000ms | 优化资源加载顺序 |

### 运行时性能

| 指标 | 描述 | 阈值 | 优化建议 |
|------|------|------|----------|
| FPS | 帧率 | > 30fps | 使用requestAnimationFrame |
| Dropped Frames | 掉帧数 | < 10% | 减少重绘和回流 |
| Memory Usage | 内存使用率 | < 80% | 及时清理内存 |
| Long Tasks | 长任务数量 | 0 | 避免阻塞主线程 |

### 用户交互性能

| 指标 | 描述 | 阈值 | 优化建议 |
|------|------|------|----------|
| Interaction Delay | 交互延迟 | < 100ms | 使用防抖和节流 |
| Animation FPS | 动画帧率 | > 30fps | 使用CSS动画 |
| Input Response | 输入响应 | < 50ms | 优化事件处理 |

## 🛠️ 最佳实践

### 1. 监控时机

```javascript
// ✅ 推荐：在关键操作前后监控
function optimizedFunction() {
  startPerformanceMonitoring();
  
  // 执行关键操作
  const result = heavyOperation();
  
  stopPerformanceMonitoring();
  const report = getPerformanceReport();
  
  // 分析性能
  if (report.summary.averageFPS < 30) {
    console.warn('性能警告：帧率过低');
  }
  
  return result;
}

// ❌ 不推荐：长时间持续监控
function badFunction() {
  startPerformanceMonitoring();
  // 执行操作
  heavyOperation();
  heavyOperation();
  heavyOperation();
  // 没有及时停止监控
}
```

### 2. 函数测量

```javascript
// ✅ 推荐：测量关键函数性能
const criticalFunction = measurePerformance('criticalFunction', () => {
  // 关键业务逻辑
  return processData();
});

// ❌ 不推荐：测量所有函数
function measureEverything() {
  const func1 = measurePerformance('func1', () => simpleOperation());
  const func2 = measurePerformance('func2', () => anotherOperation());
  // 测量过多非关键函数
}
```

### 3. 性能问题处理

```javascript
// ✅ 推荐：根据性能指标优化
function analyzeAndOptimize() {
  const report = getPerformanceReport();
  
  if (report.summary.averageFPS < 30) {
    console.log('优化建议：减少DOM操作');
    optimizeDOMOperations();
  }
  
  if (report.summary.memoryUsage > 0.8) {
    console.log('优化建议：清理内存');
    cleanupMemory();
  }
}

// ❌ 不推荐：盲目优化
function optimizeBlindly() {
  // 不分析性能问题就进行优化
  optimizeEverything();
}
```

## 🔍 性能优化建议

### 1. DOM操作优化

```javascript
// ✅ 推荐：批量DOM操作
function optimizedDOMUpdate() {
  const fragment = document.createDocumentFragment();
  
  for (let i = 0; i < 1000; i++) {
    const element = document.createElement('div');
    element.textContent = `Item ${i}`;
    fragment.appendChild(element);
  }
  
  document.getElementById('container').appendChild(fragment);
}

// ❌ 不推荐：频繁DOM操作
function badDOMUpdate() {
  for (let i = 0; i < 1000; i++) {
    const element = document.createElement('div');
    element.textContent = `Item ${i}`;
    document.getElementById('container').appendChild(element);
  }
}
```

### 2. 内存管理优化

```javascript
// ✅ 推荐：及时清理内存
function optimizedMemoryUsage() {
  const data = new Array(100000).fill('data');
  
  // 使用数据
  processData(data);
  
  // 及时清理
  data.length = 0;
}

// ❌ 不推荐：内存泄漏
function badMemoryUsage() {
  const data = new Array(100000).fill('data');
  
  // 使用数据但不清理
  processData(data);
  
  // data 仍然在内存中
}
```

### 3. 事件处理优化

```javascript
// ✅ 推荐：使用事件委托
function optimizedEventHandling() {
  document.getElementById('container').addEventListener('click', (e) => {
    if (e.target.matches('.item')) {
      handleItemClick(e.target);
    }
  });
}

// ❌ 不推荐：为每个元素添加事件监听器
function badEventHandling() {
  const items = document.querySelectorAll('.item');
  items.forEach(item => {
    item.addEventListener('click', () => handleItemClick(item));
  });
}
```

## 📈 性能监控面板使用

### 创建和显示面板

```javascript
import { createPerformancePanel } from './js/utils/performance-monitor.js';

// 创建面板容器
const panelContainer = document.createElement('div');
panelContainer.style.position = 'fixed';
panelContainer.style.top = '10px';
panelContainer.style.right = '10px';
panelContainer.style.zIndex = '9999';
document.body.appendChild(panelContainer);

// 创建并显示面板
const panel = createPerformancePanel(panelContainer);
panel.show();

// 添加控制按钮
const toggleBtn = document.createElement('button');
toggleBtn.textContent = 'Toggle Performance Panel';
toggleBtn.style.position = 'fixed';
toggleBtn.style.top = '10px';
toggleBtn.style.right = '350px';
toggleBtn.style.zIndex = '10000';
toggleBtn.addEventListener('click', () => {
  if (panel.isVisible) {
    panel.hide();
  } else {
    panel.show();
  }
});
document.body.appendChild(toggleBtn);
```

### 面板功能说明

1. **实时指标显示**
   - 帧率 (FPS)
   - 内存使用率
   - 加载时间
   - 交互延迟

2. **性能问题检测**
   - 自动检测性能问题
   - 按严重程度分类
   - 提供优化建议

3. **交互功能**
   - 显示/隐藏面板
   - 实时更新数据
   - 可拖拽定位

## 🚨 注意事项

1. **性能开销**: 性能监控会带来一定的性能开销，生产环境谨慎使用
2. **隐私保护**: 避免监控敏感用户数据
3. **浏览器兼容性**: 某些性能API可能不被所有浏览器支持
4. **数据量控制**: 避免收集过多性能数据
5. **定期清理**: 定期清理性能数据，避免内存占用过高

## 📊 性能基准

| 指标 | 优秀 | 良好 | 需要优化 | 差 |
|------|------|------|----------|------|
| FPS | > 60 | 30-60 | 20-30 | < 20 |
| 内存使用 | < 50% | 50-70% | 70-90% | > 90% |
| 加载时间 | < 1s | 1-3s | 3-5s | > 5s |
| 交互延迟 | < 50ms | 50-100ms | 100-200ms | > 200ms |
| 长任务 | 0 | 1-2 | 3-5 | > 5 |

## 🔄 版本历史

- v1.0.0 (2026-09-09): 初始版本，支持基本性能监控功能