# Tauri 桌面壳

把时间戳工具封装为桌面应用（Rust + 系统 WebView）。

> 需要 Rust 工具链（rustc、cargo）与 Node.js。构建用 Node 生成 `build/` 自包含镜像，再交给 Tauri 打包，不污染共享文件，也不把 dev/、三个报告目录打进桌面包。

## 构建

```bash
# 1) 在 web/tauri/src-tauri 安装依赖并启动开发模式
cd web/tauri/src-tauri
cargo tauri dev            # 开发热更新（需 tauri-cli）

# 2) 或直接构建正式安装包
cargo tauri build          # 产物在 src-tauri/target/release/
```

- `beforeBuildCommand` 会自动运行 `node ../../scripts/build-standalone.mjs` 生成 `web/build/`。
- 产物 `.msi` / `.exe` 大小约 5–20MB。

## 生成 jar / 其它包的备选

- `web/build/` 是可以直接双击 `index.html` 或放到任意静态服务器的自包含副本。