# 代码审查记录（Review Checklist）

> 项目：timestamp（uTools 时间戳转换插件）
> 审查日期：2026-09-09
> 审查范围：`index.js`（全文 4001 行）、`index.html`（390 行）、`index.css`（512 行）、`plugin.json`、`preload.js`、`README.md`、`PLAN-date-parsing.md`、辅助脚本
> 审查轮次：5 轮（配置结构 → 核心逻辑 → UI/交互 → 样式/主题 → i18n/错误处理/安全性）

## 状态说明

| 状态 | 含义 |
| ---- | ---- |
| ⬜ 未解决 | 尚未处理 |
| ✅ 已解决 | 已修复并确认 |
| 🕓 部分解决 | 已处理一部分，仍有残留 |
| ⏸ 暂不处理 | 评估后决定不做 / 有意保留 |

---

## 一、高优先级（应修复）

| # | 问题 | 位置 | 状态 | 处理备注 |
| - | ---- | ---- | ---- | ---- |
| 1 | **XSS：自定义内容渲染未转义**。`escapeAttr` 只用于编辑表单，展示路径全部裸插：自定义时区名/别名/格式别名可注入 HTML | `index.js:742-756`、`index.js:892-905`、`index.js:3575-3602`、`index.js:2844` | ✅ 已解决 | 2026-09-09 修复：4 处渲染点改用 `htmlEscape`/`escapeAttr`；文案区转义文本，属性区转义 `& " < >`，`data-value`/`option value` 转义后 `dataset.value` 由浏览器自动解码，逻辑不受影响 |
| 2 | **非 uTools（浏览器直接打开）环境下输入时区不可用**。`#input-tz` 原生 select 被 `style="display:none"` 隐藏，双滚轮只在 `window.utools` 分支初始化 | `index.html:126`、`index.js:3992-3997` | ✅ 已解决 | 2026-09-09 修复：`initCustomTzSelector()` 移出 `window.utools` 分支全局初始化；该函数不依赖任何 utools API，浏览器模式可用 |
| 3 | **微秒/纳秒时间戳为随机拼接**，与毫秒显示失联，复制值不真实 | `index.js:2246-2252` | ✅ 已解决 | 2026-09-09 修复：新增系统设置「微秒/纳秒显示方式」，默认「与毫秒推算一致」（微秒＝秒×1e6＋毫秒×1e3、纳秒＝秒×1e9＋毫秒×1e6，与毫秒严格同步），可切「随机」 |
| 4 | **plugin.json 缺少 16 位（微秒）/19 位（纳秒）正则 feature**，与 `onPluginEnter` 已支持的分支不一致 | `plugin.json:26-50`、`index.js:3973-3974` | ✅ 已解决 | 2026-09-09 修复：`timestamp-regex` 新增 16/19 位 regex cmds（minLength/maxLength 16、19），JSON 校验通过 |
| 5 | **CSS 变量自引用循环**：`--scrollbar-hover: var(--scrollbar-hover)`，深色主题滚动条 hover 样式失效 | `index.css:25` | ✅ 已解决 | 2026-09-09 修复：深色主题定义为 `#5d6480`（与 `--muted` 协调） |
| 6 | **无效 CSS `background:#white`**，浅色主题下收款码缺白底 | `index.css:412` | ✅ 已解决 | 2026-09-09 修复：改为 `background:#fff` |
| 7 | **`formatOffset(0)` 返回 `UTC±00:00`**，0 偏移时区显示多余 `±` | `index.js:1214` | ✅ 已解决 | 2026-09-09 修复：`mins===0` 改为 `UTC+00:00`；验证 `UTC+08:00`/`UTC-05:30` 正常 |
| 8 | **日历年份输入 1~3 位数字被错误补位**：`99`→9900、`25`→2500 | `index.js:1900-1908`、`index.js:1941-1945` | ✅ 已解决 | 2026-09-09 修复：两位年按 19xx（99→1999）、一位保留 1900+、三位保留原值；Enter 确认路径同步支持 |

---

## 二、中优先级（建议修复）

| # | 问题 | 位置 | 状态 | 处理备注 |
| - | ---- | ---- | ---- | ---- |
| 9 | **i18n 遗漏（英文界面仍显中文）**：`toast('无效年份')`、`toast('超出时间戳范围')`、精度提示「毫秒/微秒/纳秒」、`暂无匹配格式`、头部按钮 `title` | `index.js:1960,1972,1977`、`index.js:3010-3034`、`index.js:2844`、`index.html:32,54` | ✅ 已解决 | 2026-09-09 修复：toast 改用 `t()`；`updatePrecisionIndicators` 用 `t('tsUnitMs'/'tsUnitUs')` 并移除死代码 `precisionText`；空态改 `t('noMatch')`；新增 12 个 i18n 键 + `[data-i18n-title]` 通用 title 翻译机制，11 处静态 title 接入，语言切换时刷新 |
| 10 | **`currentOffsetStr` 重复定义**（同名覆盖） | `index.js:1233`、`index.js:3131` | ✅ 已解决 | 2026-09-09 修复：删除 `index.js:1233` 处死代码副本，保留唯一实现；确认仅剩 1 处定义、3 处调用 |
| 11 | **负值微秒/纳秒用 BigInt 整除丢精度**（`-1` ns → `0` ms） | `index.js:2416,2418`、`index.js:2456,2458` | ✅ 已解决 | 2026-09-09 修复：新增 `bigFloorDiv`（BigInt 向下取整除法），`renderReverse` 与 `currentT2dMs` 共 4 处 /1000n、/1000000n 改用；验证 `-1ns→-1ms`、`-999us→-1ms`、`-123456789ns→-124ms` |
| 12 | **`dateToMs` 用单次 guess 算偏移**，DST 切换当晚可能差 1 小时 | `index.js:1247-1254` | ✅ 已解决 | 2026-09-09 修复：改为不动点迭代（基推测重复取偏移直至稳定，上限 8 次，正常 1 次收敛）；验证 NY 春季跳变日 03:30→03:30 EDT、秋季回拨/无 DST 时区正常 |
| 13 | **剪贴板初始化不按位数切 tab**，与 `onPluginEnter` 行为不一致 | `index.js:3123-3147` | ✅ 已解决 | 2026-09-09 修复：`initTimestampInput` 数字分支按 10/13/16/19 位镜像 `onPluginEnter` 切 tab（前缀 `-` 保留，负数仍支持），并避免双重渲染 |
| 14 | **日期正则 `minLength:10` 与 `\d{1,2}` 冲突**：`2026-9-7` 等 8 位输入无法经 uTools 唤起 | `plugin.json:48-53` | ✅ 已解决 | 2026-09-09 修复：`minLength` 10→8；验证 `2026-9-7`(8)✓、`2026-10-31 23:59:59`(19)✓、`2026-123`✗ |
| 15 | **文档过时**：`PLAN-date-parsing.md` 记载的「填不回」Bug 已修复未更新；README 目录结构/功能描述滞后 | `PLAN-date-parsing.md`、`README.md` | ✅ 已解决 | 2026-09-09 更新：PLAN 加「已实现」状态头并说明原结论进度；README 精度描述补全微秒/纳秒、16/19 位正则唤起、剪贴板日期字符串识别、新设置项 |
| 16 | **非法 HTML**：`id="precision-indicator"` 重复 4 次；`<html lang="zh-CN">` 不随语言切换 | `index.html:15,19,23,27`、`index.html:2` | ✅ 已解决 | 2026-09-09 修复：移除 4 处重复 id（CSS/JS 本就按 class 引用）；`applyLang` 同步 `document.documentElement.lang=zh-CN/en`；验证全文 102 个 id 无重复 |
| 17 | **CSS 注释乱码**（UTF-8 截断残留） | `index.css:442,502` | ✅ 已解决 | 2026-09-09 修复：恢复「自定义时区样式」「兼容 utools WebView」 |
| 18 | **`applyFullDateStr` 仅日期分支不清空小数输入框** | `index.js:1664-1672` | ✅ 已解决 | 2026-09-09 修复：日期分支补清 `timeInputEl`/`fracInputEl` 并 `syncClearBtns()`，避免残留小数混入转换 |

---

## 三、低优先级（代码质量/可选）

| # | 问题 | 位置 | 状态 | 处理备注 |
| - | ---- | ---- | ---- | ---- |
| 19 | **调试残留/死代码**：空 `if` 块、未使用变量 `tsInputComputed`/`inputBoxComputed`、从未生效的 `timeOffset` 校准、`WHEEL_VIEW` 与 CSS 不一致 | `index.js:570-572,2109-2112,2267-2269,3183-3186,3306-3309,553,2025` | ✅ 已解决 | 2026-09-09 修复：删除调试注释+未用变量、2 处「打印 wheel-item」空 if 块、重复注释；移除恒为 0 的 `timeOffset`（声明/读/2 处复位共 4 点）；`WHEEL_VIEW` 132→128 对齐 CSS 并改用 `el.clientHeight` 计算居中内边距 |
| 20 | **`inputTz` change 事件重复处理**（双滚轮与全局各绑一次） | `index.js:3526`、`index.js:3688` | ✅ 已解决 | 2026-09-09 修复：合并为单一 change 监听（滚轮同步 + `renderConvert()`），删除全局重复绑定；wheel 路径本就直调 `renderConvert` 不发事件，行为等价 |
| 21 | **`.cal-day` 点击不实时更新输入框**，需再点「确定」（设计取舍） | `index.js:1977-1980` | ⏸ 暂不处理 | |
| 22 | **时区分钟滚轮仅 00/15/30/45 四档**，加德满都等时区只能近似 | `index.js:3158` | ⏸ 暂不处理 | |
| 23 | **`navigator.clipboard.readText` 失败被静默吞掉**，浏览器 `file://` 下无降级提示 | `index.js:3124-3131` | ✅ 已解决 | 2026-09-09 修复：读取失败时记录并 toast（仅非 uTools 环境，uTools 保持静默）；新增 `clipboardFail` i18n 键 |
| 24 | **时区/解析列表每次输入全量重建+绑定事件**，建议防抖 | `index.js:1073,3012` | ✅ 已解决 | 2026-09-09 修复：新增通用 `debounce` 工具，时区搜索与格式搜索 input 均包裹 150ms 防抖 |
| 25 | **调试/素材文件混入根目录**（`analyze_tz.js`、`tz_wheel_temp.js`、`test_colors.html`、`donate_wechat.png`），建议归入 `dev/`/`assets/` | 根目录 | ✅ 已解决 | 2026-09-09 修复：`dev/`（analyze_tz.js、tz_wheel_temp.js、test_colors.html）、`assets/`（donate_wechat.png）；`index.html:389` 图片引用同步改 `assets/donate_wechat.png`；`logo.png`/`preload.js`/`plugin.json` 等 uTools 依赖保留根目录 |

---

## 四、总体评估

| 维度 | 评价 |
| ---- | ---- |
| 功能完整性 | ★★★★★ 四精度双向转换 + 双时区 + 日历滚轮 + 智能解析，远超同类工具 |
| 可维护性 | ★★★☆☆ 单文件 4001 行集中全部逻辑，重复与死代码多，建议逐步拆分（parser/calendar/tz/ui） |
| 健壮性 | ★★★☆☆ 边界（负值/跨年/浏览器模式）与 XSS 转义需加固 |
| 工程化 | ★★★☆☆ 无构建 / 无 lint / 无测试，依赖手动验证 |

**建议修复顺序**：#1（XSS 转义）→ #2（浏览器模式时区）→ #3（微纳秒真实值）→ #4（plugin.json 正则）→ #5-8（CSS/显示 bug）→ 中低优先级清理与文档更新。