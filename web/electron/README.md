# 桌面壳（Electron）

Web 前端的时间戳转换器桌面版外壳：托盘后台运行、本地化菜单栏、可配置全局快捷键、关闭确认（后台运行 / 退出 / 取消）、开机自启与设置持久化，复用 `web/build` 前端界面作为负载。

## 功能

- **本地化菜单栏**：File/Edit/View/Window/Help 中英切换（默认跟随系统区域），`文件/File` 内含「语言」子菜单与快捷键设置入口；托盘菜单同样随语言切换。
- **语言双向联动**：菜单切换语言 ⇄ 前端界面 EN/中 按钮同步切换；以 `settings.json#uiLang` 为单一事实来源，并推送前端 `applyLang`。
- **可配置全局快捷键**：系统设置页顶部可录制组合键 / 启用停用 / 重置默认（初始默认 `Ctrl+Alt+T`），冲突时回滚提示；禁用时输入框显示「已禁用」。
- 其余：托盘（单击/双击呼出、开机自启、显示当前快捷键）、关闭确认、单实例、`--payload=` 二次唤起。

## 结构

- `main.js` —— Electron 主进程（本地化菜单、托盘、全局快捷键、设置存取、语言联动、加载前端）。
- `preload.js` —— 注入 `window.utools` shim 与 `window.tsShell`（快捷键/语言 API：getSettings / setSettings / onSummon / onSettingsChanged / onUiLangChanged）。
- `web-boot.js`（位于 `../build/`）—— 检测到 `tsShell` 时动态注入快捷键设置区块并联动语言。
- `package.json` —— 工程与 electron-builder 配置（`build` 字段）。
- `package-lock.json` —— 依赖锁定，支持 `npm ci` 复现。
- `../build/` —— 前端负载，打包时经 `extraResources` 拷贝进 `resources/webui`；未打包（`npm start`）时直接加载该目录。

## 打包

```bash
npm ci
npm run dist          # 当前主机平台：electron-builder → nsis(x64)+zip / AppImage+deb / dmg+zip
npm run dist:win      # 仅 Windows 目标（nsis + zip）
npm run dist:linux    # Linux 目标（AppImage + deb），仅限 Linux 主机
npm run dist:linux:portable  # Linux 便携 zip（任意主机可出，Windows 实测可用）
npm run dist:mac      # 仅 macOS 目标（dmg + zip），仅限 macOS 主机
npm start             # 开发运行（加载 ../build）
```

- `dist.cjs` 为纯 Node 入口，Windows / macOS / Linux 均可直接执行；`--win` `--linux` `--mac` 参数透传给 electron-builder（`node dist.cjs --win --dir` 等方式追加参数）。
- `dist` 脚本自动注入国内镜像环境变量（`ELECTRON_MIRROR`、`ELECTRON_BUILDER_BINARIES_MIRROR`，均指向 npmmirror），规避 GitHub 下载超时；已设置同名环境变量时以环境变量为准。已在 Windows 主机实测可拉取 Linux 版 Electron 并产出 `linux-unpacked`。
- **各平台打包位置限制**（electron-builder 对齐）：
  - macOS（dmg/zip）：只能在 macOS 主机上打包（Apple 工具链 + 签名）。
  - Linux（AppImage/deb/rpm）：建议在 Linux 主机打包；Windows 主机可用 `dist:linux:portable` 产出 zip 便携包（已实测成功）。
  - Windows（nsis）：Windows 主机原生打包；Linux/macOS 主机上 nsis 需 `wine`，zip 无需。
- Electron 二进制经 `electronDownload.mirror`（npmmirror）下载，打包需联网；NSIS / winCodeSign 等二进制同样经由上面两个镜像下载。
- `node_modules/` 与 `release/` 均为可再生物，不入库。
- 修改根目录前端源码后，先同步 `web/build` 再打包，否则产物界面会停留在旧版本。