# 问题清单 - 按严重程度分类

## 🔴 严重问题 (Critical) - 必须立即修复

### C1: CSS文件过大
- **文件**: `index.css` (44KB)
- **影响**: 加载性能、用户体验
- **原因**: 所有样式集中在单一文件
- **修复**: 拆分为多个模块化CSS文件

### C2: 输入验证漏洞
- **文件**: `js/core.js`, `js/utils/validators.js`
- **影响**: 安全性、数据完整性
- **问题**: 时间戳验证不严格，可能存在注入风险
- **修复**: 加强输入验证逻辑

### C3: 内存泄漏风险
- **文件**: `js/utils/memory-manager.js`
- **影响**: 应用稳定性
- **问题**: 事件监听器可能未正确清理
- **修复**: 实现统一的资源清理机制

### C4: 加载测试失败 — `bindEvents is not defined`
- **文件**: `dev/scripts/load-test.mjs` + `js/events.js`
- **影响**: `npm run test:load` / `npm run verify` 全部失败（CI 阻断）
- **根因**: `load-test.mjs` 的沙箱中 `window` 是普通对象，不等于 vm 上下文全局对象；`core.js` 用 `Object.assign(window, commonUtils)` 绑定 `bindEvents` 后，沙箱全局词法作用域仍解析不到 `bindEvents`，导致 `events.js:21` 抛 `ReferenceError`
- **验证**: `npm run test:load` 输出 `ReferenceError: bindEvents is not defined at plugin.js:4076`
- **修复**: 让沙箱的 `window/self/globalThis` 指向 vm 上下文全局（模拟真实浏览器），或让 `core.js` 同时绑定到 `globalThis`
- **状态**: ✅ 已修复（修改 `load-test.mjs`：`loadModules()` 内先 `vm.createContext(sandbox)`，再令 `window/self/globalThis` 指向沙箱全局；另为 `makeEl`/`documentStub` proxy 补充 `Symbol.toPrimitive` 处理，解决计算属性键转换问题）

### C5: i18n 检查失败 — `No i18n source file found`
- **文件**: `dev/scripts/validate.mjs` + `i18n/` 目录
- **影响**: `npm run check:i18n` / `npm run lint` / `npm run verify` 失败
- **根因**: `checkI18n()` 只在 `js/i18n.js` 与根 `index.js` 中查找 I18N 源，但真实 I18N 定义在 `js/core.js` 的 `const I18N = {...}`；而 `i18n/` 目录下的 `index.js`（ESM+require 混写）是未集成到主代码的另一套方案
- **验证**: `npm run check:i18n` 输出 `❌ [i18n:source] No i18n source file found`
- **修复**: 在源查找列表中加入 `js/core.js`
- **状态**: ✅ 已修复（`validate.mjs` 的 `checkI18n()` 源查找列表改为 `['js/core.js', 'js/i18n.js', 'index.js']`）

### C6: index.html 引用 ESM 语法脚本 — 浏览器 SyntaxError
- **文件**: `index.html:404` → `js/utils/performance-monitor.js`
- **影响**: 该脚本在浏览器中完全无法解析执行（`Unexpected token 'export'`），其功能（性能监控）形同虚设；若后续代码依赖它初始化则直接报错
- **根因**: `performance-monitor.js` 使用 `export class PerformanceMetrics` 等 ESM 语法，而 `index.html` 用普通 `<script>`（非 `type="module"`）加载
- **验证**: `grep "^export" js/utils/performance-monitor.js` 返回 9 处 ESM 导出
- **修复**: 从 `index.html` 移除该引用（主代码从未调用它；属开发/监控工具死代码）
- **状态**: ✅ 已修复（已从 `index.html` 移除 `<script src="js/utils/performance-monitor.js">`，页面不再加载 ESM 语法脚本）

---

## 🟠 高优先级问题 (High) - 近期修复

### H1: 测试覆盖不足
- **文件**: `dev/tests/`
- **影响**: 代码质量、可维护性
- **问题**: 只有2个测试文件，缺少边界条件测试
- **修复**: 增加单元测试、集成测试

### H2: 错误处理不一致
- **文件**: 多个JS文件
- **影响**: 用户体验、调试难度
- **问题**: 错误处理方式不统一
- **修复**: 统一错误处理标准和日志格式

### H3: 代码重复
- **文件**: `js/core.js`, `js/utils/validators.js`, `js/utils/common.js`
- **影响**: 维护成本
- **问题**: 验证逻辑在多处重复定义
- **修复**: 抽取公共验证函数到独立模块

### H4: 国际化不完整
- **文件**: `js/core.js` (I18N对象)
- **影响**: 用户体验
- **问题**: 部分文本未国际化处理
- **修复**: 完善所有用户可见文本的多语言支持

### H5: 性能监控开销
- **文件**: `js/utils/performance-monitor.js`
- **影响**: 应用性能
- **问题**: 性能监控可能影响实际性能
- **修复**: 优化监控配置，减少采样频率

---

## 🟡 中优先级问题 (Medium) - 计划修复

### M1: 响应式设计不完善
- **文件**: `index.css`
- **影响**: 不同设备体验
- **问题**: 响应式断点有限，小屏幕适配不完美
- **修复**: 增加响应式断点，优化移动端布局

### M2: 可访问性缺失
- **文件**: `index.html`, `index.css`
- **影响**: 无障碍访问
- **问题**: 缺少ARIA标签、键盘导航支持不完善
- **修复**: 添加ARIA属性，完善键盘导航

### M3: 浏览器兼容性
- **文件**: 所有JS/CSS文件
- **影响**: 跨平台使用
- **问题**: 未进行完整的跨浏览器测试
- **修复**: 添加浏览器兼容性测试和polyfill

### M4: 缓存机制缺失
- **文件**: `js/core.js`
- **影响**: 性能
- **问题**: 重复计算未缓存
- **修复**: 实现计算结果缓存机制

### M5: 事件委托不足
- **文件**: `js/events.js`
- **影响**: 性能、内存使用
- **问题**: 大量单独的事件绑定
- **修复**: 使用事件委托减少监听器数量

---

## 🟢 低优先级问题 (Low) - 长期优化

### L1: 文档不完善
- **影响**: 开发效率
- **问题**: 缺少API文档、开发指南
- **修复**: 补充完整的技术文档

### L2: 版本管理混乱
- **文件**: `package.json`, `plugin.json`
- **影响**: 发布管理
- **问题**: 版本号不一致
- **修复**: 统一版本管理策略

### L3: 工具函数分散
- **文件**: `js/utils/*.js`
- **影响**: 代码组织
- **问题**: 工具函数分布在多个文件中
- **修复**: 重新组织工具函数结构

### L4: 配置硬编码
- **文件**: `index.html`, `index.css`
- **影响**: 可配置性
- **问题**: 部分配置硬编码在文件中
- **修复**: 提取配置到独立配置文件

### L5: 缺少类型定义
- **文件**: 所有JS文件
- **影响**: 代码质量
- **问题**: 无TypeScript类型定义
- **修复**: 添加JSDoc或迁移到TypeScript

### L6: HTML缩进格式混乱
- **文件**: `index.html:117`
- **影响**: 可读性
- **问题**: `date-field` 闭合 `</div>` 缩进异常（30个空格），与同级兄弟 `custom-tz-selector`（118行）缩进不一致；DOM层级实际平衡（custom-tz-selector 是 date-input-row 的子元素），但格式严重影响阅读
- **修复**: 重新格式化该区域缩进
- **状态**: ⏳ 待修复（低优先级，不影响功能）

### L7: index.html 缓存版本号硬编码
- **文件**: `index.html`（所有 `?v=1789670000000`）
- **影响**: 发布后浏览器缓存旧资源
- **问题**: 版本号以固定时间戳硬编码，每次发布需手工修改，容易遗忘导致用户加载旧版本脚本
- **修复**: 改为构建时自动生成的版本号，或移除 `?v=` 参数
- **状态**: ⏳ 待修复（低优先级）

### L8: i18n 双体系并存（死代码）
- **文件**: `i18n/` 目录 + `js/core.js` I18N 对象
- **影响**: 维护成本、混淆
- **问题**: `i18n/index.js`（ESM+`require()`混写）、`zh-CN.json`、`en-US.json` 是独立但未集成到主代码的另一套方案；主代码实际使用 `js/core.js` 中的 `I18N` 对象与全局 `t()` 函数。两套体系长期并存导致后续修改可能改错地方
- **修复**: 明确以 `js/core.js` 为唯一 I18N 源，删除或归档 `i18n/` 目录（或反向迁移）
- **状态**: ⏳ 待修复（低优先级）

### L9: utils 目录 ESM 工具库为死代码
- **文件**: `js/utils/*.js`（除 `performance-monitor.js` 已移除引用外，其余 8 个文件全部使用 `export`）
- **影响**: 包体积、维护成本
- **问题**: `common.js`, `validators.js`, `formatters.js`, `helpers.js`, `error-handler.js`, `event-manager.js`, `memory-manager.js`, `dom-optimizer.js` 均为 ESM 模块，但页面用普通 `<script>` 加载（无法解析 `export`），也没有打包器/`type="module"` 引用 → 这些文件是死代码；且与主代码中 core.js/convert.js 自带的相同工具函数（`addEventListener`, `validateTimestamp` 等）重复
- **修复**: 统一方案——要么把主代码工具函数迁移到这些模块并用 `type="module"` + export 接入，要么删除这些未用文件避免混淆
- **状态**: ⏳ 待修复（低优先级）

---

## 问题统计

| 严重程度 | 数量 | 占比 |
|---------|------|------|
| 严重 (Critical) | 6 | 24% |
| 高 (High) | 5 | 20% |
| 中 (Medium) | 5 | 20% |
| 低 (Low) | 9 | 36% |
| **总计** | **25** | **100%** |

> 注：严重问题中的 C4/C5/C6 已在本次审计中修复，并通过 `npm run verify` 全部验证通过。

---

## 修复时间估算

| 严重程度 | 预计工时 | 优先级 |
|---------|---------|--------|
| 严重 (Critical) | 8-12小时 | 立即 |
| 高 (High) | 12-16小时 | 本周 |
| 中 (Medium) | 16-20小时 | 本月 |
| 低 (Low) | 12-16小时 | 下季度 |
| **总计** | **48-64小时** | - |
