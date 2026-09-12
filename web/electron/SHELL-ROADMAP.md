# 桌面壳：外层配置现状与完善清单

> 本文件记录 Electron 桌面壳（`web/electron/`）与 Web/PWA 壳（`web/build/`）的**外壳层配置**现状（不涉及转换器程序本身的业务功能），供后续按需完善。状态图例：✅ 已具备 · ◐ 部分/可增强 · ❌ 未做。更新此文档时请同步核对 `main.js` / `package.json(build)` / `web/build`。

## 一、运行时壳（`web/electron/main.js`）

| 配置项 | 状态 | 说明 / 完善建议 |
|---|---|---|
| 本地化菜单栏（File/Edit/View/Window/Help 中英切换） | ✅ | 语言默认跟随系统区域；`文件/File` 内含「语言」子菜单、快捷键设置入口；macOS 叠加 App 菜单 |
| 菜单语言 ⇄ 前端界面语言双向联动 | ✅ | 单一来源 `settings.json#uiLang`；新增 IPC `ts:uiLang:changed` + `tsShell.onUiLangChanged`、前端 `setAppLang`，界面 EN/中 按钮回写 |
| 托盘（图标/单击呼出/菜单本地化/显示当前快捷键） | ✅ | 图标取自 webui `logo.png` 缩放 16×16 |
| 可配置全局快捷键 | ✅ | 系统设置页录制/启用停用/重置；初始默认 `Ctrl+Alt+T`，冲突自动回滚；禁用态显示 |
| 开机自启 | ✅ | 托盘菜单开关，`setLoginItemSettings` |
| 关闭确认对话框（后台/退出/取消） | ✅ | 文案随语言 |
| 「关于」对话框 | ✅ | 帮助菜单，显示版本号 |
| 单实例锁 + 二次唤起 `--payload=` | ✅ | `requestSingleInstanceLock` + `second-instance` |
| 应用用户模型 ID（任务栏分组/通知） | ✅ | `setAppUserModelId('com.timestamp.converter')` |
| 窗口记忆位置/大小 | ◐ | 当前固定 960×720；可加 `bounds` 保存/恢复 |
| 窗口最小尺寸 / 置顶 / 开始隐藏 | ❌ | 可加 `minWidth/minHeight`、`alwaysOnTop`、`show:false`+托盘唤起 |
| 主题（跟随系统/深色/浅色）联动壳层 | ◐ | 前端已有主题设置；壳窗口 `backgroundColor`/`nativeTheme` 未联动，切换时可能白闪 |
| 外链打开限制（安全） | ❌ | 未拦截 `setWindowOpenHandler`/`will-navigate`；建议外部链接走 `shell.openExternal` 白名单 |
| 自动隐藏菜单栏 / 菜单栏可见性 | ✅ | `setMenuBarVisibility(true)`，Windows 常显菜单栏 |
| 深链协议（`ts-converter://xx`） | ❌ | 命令行 `--payload=` 已支持，但未注册 OS 协议；需要 OS 层唯一性多实例唤起 |
| 打开时自动读取剪贴板 / 唤起聚焦输入框 | ✅ | `ts:summon` → `initTimestampInput` 聚焦 |

## 二、打包配置（`web/electron/package.json` → `build`）

| 配置项 | 状态 | 说明 / 完善建议 |
|---|---|---|
| Windows 目标（NSIS 安装包 + zip） | ✅ | 中文安装向导、可选安装目录、桌面/开始菜单快捷方式、`artifactName` |
| Linux 目标（AppImage + deb） | ✅ | 需 Linux 主机；Windows 主机用 `npm run dist:linux:portable` 出 zip |
| macOS 目标（dmg + zip） | ✅配置/❌验证 | 只能在 macOS 主机打包（未在真实 mac 实测） |
| 应用图标（win exe/安装器/Linux/mac） | ❌ | 当前用默认 Electron 图标；win 需 ≥256×256 `.ico`，linux/mac 需 512×512 png/icns（源 logo 为 128×128） |
| exe 元数据（公司名/文件描述/版本信息） | ◐ | 可补 `companyName`（仅 NSIS 快捷方式归属用），完善 VersionInfo 需 `nsis.installerIcon`/`win.icon` 等 |
| 代码签名（SmartScreen 消除“未知发布者”） | ❌ | Windows 需 signtool + 证书；证书可用自签测试 |
| macOS 公证（notarization） | ❌ | 须配合开发者证书 + Apple ID |
| Linux 签名 / OBS 等商店分发 | ❌ | 可选 |
| 自动更新（electron-updater + 已生成 blockmap 差分更新） | ◐ | blockmap 已随 NSIS 生成但未接；需发布源（generic/FTP/GitHub Releases）与 `latest.yml` |
| 文件关联（双击自定义扩展名打开） | ❌ | `fileAssociations` 未配 |
| 协议注册 / 命令行唤起 | ◐ | `--payload=` 已解析；OS 协议注册未做（见运行时表） |
| 只打包必要文件 / 前端负载外置 | ✅ | `files:[main.js, preload.js]` 进 asar；`extraResources: ../build → webui` |
| 镜像/离线构建支持 | ✅ | `dist.cjs` 注入 `ELECTRON_MIRROR` + `ELECTRON_BUILDER_BINARIES_MIRROR`（npmmirror） |
| 构建复现（lockfile） | ✅ | `package-lock.json` 已提交，`npm ci` 复现 |

## 三、Web / PWA 壳（`web/build/`）

| 配置项 | 状态 | 说明 / 完善建议 |
|---|---|---|
| 双模式入口（Electron + Web 深链 `?ts=` / `?payload=`） | ✅ | `web-boot.js`；Electron 下注入 `#sys-hotkey` 区块并联动语言 |
| SW 离线缓存（`sw.js`） | ✅ | 已配 |
| manifest 图标 512×512 | ❌ | manifest 声明 512 但源 `logo.png` 仅 128×128，PWA 安装图标不达标 |
| manifest 名称/短名称/主题色 | ◐ | 短名称与主题色可取应用名/配色微调 |
| 桌面壳与根源码镜像同步 | ◐ | 改动根目录 `index.html/css/js/*` 后需手动 `Copy-Item` 到 `web/build`；可加自动同步脚本 |

## 四、待完善优先级建议

1. **高**：应用图标（win ico + linux 512 png）— 影响所有平台可感知度
2. **高**：外链打开限制（安全基线）
3. **中**：窗口位置/大小记忆（体验）
4. **中**：manifest 512 图标 + 主题色（PWA 达标）
5. **低**：自动更新接入（需发布源）、深链协议注册、Windows 代码签名