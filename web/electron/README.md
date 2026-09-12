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
npm run dist          # electron-builder → nsis(x64) + zip，输出至 release/
npm start             # 开发运行（加载 ../build）
```

- Electron 二进制经 `electronDownload.mirror`（npmmirror）下载，打包需联网。
- `node_modules/` 与 `release/` 均为可再生物，不入库。
- 修改根目录前端源码后，先同步 `web/build` 再打包，否则桌面产物界面会停留在旧版本。