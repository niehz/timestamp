# Timestamp Web 外层封装（多入口）

时间戳工具以纯粹的 HTML/CSS/JS 编写，其核心 js/css/assets 与 uTools 插件完全共享。
本目录提供多种将它们封装为独立应用的入口；uTools 离线包与发布流程不受任何影响。

## 入口一览

| 入口 | 启动方式 | 说明 |
|------|----------|------|
| 静态 Web / PWA | `node web/serve.mjs --open` | 零依赖 Node 静态服务，浏览器打开即用，可离线缓存 |
| 本地文件直开 | 双击 `index.html` | 直接在浏览器打开（无需服务；HTTPS 下的 Service Worker 不生效） |
| Electron 桌面壳 | `cd web/electron && npm i && npm start` | 托盘后台运行 + 全局快捷键 + 可打包安装 |
| Tauri 桌面壳 | `cd web/tauri/src-tauri && cargo tauri build` | 体积小、性能好；需要 Rust 工具链 |
| 自包含镜像 | `node web/scripts/build-standalone.mjs` | 生成 `web/build/`，供纯离线部署 / Tauri 打包 |

## 桌面壳特性（Electron）

- **托盘后台运行**：启动即在系统托盘驻留；点关闭按钮会询问「后台运行 / 退出程序 / 取消」，
  最小化仍保留在任务栏。托盘菜单含「显示主窗口 / 开机自启 / 退出」。
- **全局快捷键**：默认 `Ctrl+Alt+T` 任意位置呼出窗口并自动读取剪贴板预填。可在
  系统设置 → 全局快捷键 自定义（点录制框后按新组合）、启用/禁用、恢复默认（仅 Electron 显示）。
- **多实例保护**：重复启动会聚焦已运行窗口。
- **语言设置**：系统设置新增「界面语言」（中文 / English），持久化保存；
  首次运行按系统语言自动选择，顶部 TAB 页随之切换。

## 快速开始

```bash
# 方式一：本地静态服务（推荐）
node web/serve.mjs --open

# 方式二：Electron（需先安装）
cd web/electron
npm i
npm start

# 方式三：自包含镜像（Tauri / 离线部署用）
node web/scripts/build-standalone.mjs
```

## URL 参数（等价 uTools 入口 payload）

`index.html` / Web 部署支持 `?payload=...` 或 `?ts=...`，复用与 uTools 完全相同的入口解析
（秒/毫秒/微秒/纳秒时间戳转日期、日期字符串识别等）。例如：

```
http://127.0.0.1:8787/?payload=1735689600
http://127.0.0.1:8787/?ts=2025-08-31
```

## 目录结构

```
web/
├─ index.html               统一 Web 入口（引用 ../index.css、../js/*、../assets/*）
├─ web-boot.js              解析 ?payload=?ts= 并调用 handleEnterPayload()
├─ serve.mjs                零依赖静态服务（serve 仓库根）
├─ manifest.webmanifest     PWA 清单
├─ sw.js                    离线缓存（仅 https 生效）
├─ scripts/
│  └─ build-standalone.mjs  生成 web/build/ 自包含镜像
├─ electron/                Electron 桌面壳（main.js / preload.js / package.json）
├─ tauri/                    Tauri 桌面壳（tauri.conf.json / Cargo.toml / src/main.rs）
└─ build/                    自包含镜像（运行 build-standalone.mjs 生成，可忽略）
```

## 说明

- 核心 `js/`、`index.css`、`assets/` 为 uTools 与 Web 共享；同步增强（不破坏既有行为）：
  `js/events.js` 把 `onPluginEnter` 入口逻辑抽成顶层函数 `handleEnterPayload(payload)` 供 Web 复用；
  `js/core.js`/`js/i18n.js` 增加语言持久化与「界面语言」系统设置项（uTools 同样受益）。
- 配置持久化走 `localStorage`，浏览器与 uTools 通用；剪贴板读写在浏览器自动回退到
  `navigator.clipboard`。Electron 全局快捷键等桌面能力由主进程管理，网页/浏览器模式不受影响。
- Electron 已在本机验证可运行（托盘/快捷键为交互功能，建议安装包实际体验确认）；
  Tauri 依赖 Rust 工具链，仅交付文件与命令。