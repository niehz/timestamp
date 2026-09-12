# 桌面壳（Electron）

Web 前端的时间戳转换器桌面版外壳：托盘后台运行、`Ctrl+Alt+T` 全局快捷键、关闭确认（后台运行 / 退出 / 取消）、开机自启与快捷键设置持久化，复用 `web/build` 前端界面作为负载。

## 结构

- `main.js` —— Electron 主进程（单实例、托盘、全局快捷键、设置存取、加载前端）。
- `preload.js` —— 注入 `window.utools` shim 与 `window.tsShell`（快捷键设置 API），复用根目录 uTools 版前端的复制/呼出逻辑。
- `package.json` —— 工程与 electron-builder 配置（`build` 字段）。
- `package-lock.json` —— 依赖锁定，支持 `npm ci` 复现。
- `../build/` —— 前端负载，打包时经 `extraResources` 拷贝进 `resources/webui`；未打包（`npm start`）时直接加载该目录。

## 打包

```bash
npm ci
npm run dist          # 当前主机平台：electron-builder → nsis(x64)+zip / AppImage+deb / dmg+zip
npm run dist:win      # 仅 Windows 目标（nsis + zip）
npm run dist:linux    # 仅 Linux 目标（AppImage + deb）
npm run dist:mac      # 仅 macOS 目标（dmg + zip）
npm start             # 开发运行（加载 ../build）
```

- `dist.cjs` 为纯 Node 入口，Windows / macOS / Linux 均可直接执行；`--win` `--linux` `--mac` 参数透传给 electron-builder（`node dist.cjs --win --dir` 等方式追加参数）。
- `dist` 脚本自动注入国内镜像环境变量（`ELECTRON_MIRROR`、`ELECTRON_BUILDER_BINARIES_MIRROR`，均指向 npmmirror），规避 GitHub 下载超时；已设置同名环境变量时以环境变量为准。已在 Windows 主机实测可拉取 Linux 版 Electron 并产出 `linux-unpacked`。
- **各平台打包位置限制**（electron-builder 对齐）：
  - macOS（dmg/zip）：只能在 macOS 主机上打包（Apple 工具链 + 签名）。
  - Linux（AppImage/deb/rpm）：建议在 Linux 主机打包；Windows 主机仅能产出 dir/zip 等目标。
  - Windows（nsis）：Windows 主机原生打包；Linux/macOS 主机上 nsis 需 `wine`，zip 无需。
- Electron 二进制经 `electronDownload.mirror`（npmmirror）下载，打包需联网；NSIS / winCodeSign 等二进制同样经由上面两个镜像下载。
- `node_modules/` 与 `release/` 均为可再生物，不入库。
- 修改根目录前端源码后，先同步 `web/build` 再打包，否则产物界面会停留在旧版本。