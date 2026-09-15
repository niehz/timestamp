# 命令速查（Timestamp Converter）

项目全部可执行命令与效果说明，换环境 / 忘记用法时查这里。

环境前提：

- 根目录脚本为纯 Node，**无需安装依赖**，机器有 Node.js 即可（建议 ≥18）。
- 桌面壳打包需先装依赖：`cd web/electron && npm ci`。
- Windows PowerShell 下以 **`npm.cmd`** 代替 `npm` 使用。

## 1. 一键验收

| 命令 | 效果 |
|---|---|
| `npm run verify` | 完整验收 = 静态校验(`lint`) + 模块加载冒烟(`test:load`) + 单元测试(`test`) |
| `npm run lint` | 仅静态校验（见 §2，共 5 项） |
| `npm test` | 仅单元测试（当前 136 项，node:test） |

## 2. 静态校验（validate.mjs）

`npm run check:*` 均为 `node dev/scripts/validate.mjs --checks=<name>`。

| 脚本 | 校验内容 |
|---|---|
| `check:plugin` | plugin.json 可解析（JSON 合法） |
| `check:js` | 全部 js 文件语法 OK（vm 编译） |
| `check:html` | HTML：id 唯一、本地引用(id href)可解析 |
| `check:i18n` | 中英文键对称、HTML 内全部 `data-i18n` / `t()` 引用的键存在 |
| `check:build` | web/build 镜像与根目录同步（含缓存戳一致） |

validate.mjs 通用用法：

```
node dev/scripts/validate.mjs [--checks=js,plugin,html,i18n,split,build] [--json] [--verbose]
```

`--checks` 不传时默认全含 `split`（index.js 拆分遗留结构约束）与 `build`。`lint` 不含 `split`。

## 3. 构建产出

| 命令 | 效果 |
|---|---|
| `npm run build:web` | 白名单前端产物 → `web/build`（Electron/PWA 镜像）。引用内容有变则自动把根与 build 两处 `index.html` 的 `?v=` 缓存戳统一刷新；同步状态记入 `dev/scripts/.sync-state.json`（gitignore） |
| `npm run build:utools` | uTools 投稿干净目录全量重建 → `dist/utools/`（每次先清空；只含运行必需文件，无 `.git`/`web`/`dev`/文档；自检 index.html+plugin.json 引用资源是否齐全，缺失即失败） |
| `npm run build:utools:zip` | 在 `build:utools` 基础上打 `dist/timestamp-toolkit-<插件版本>.zip`（内置 STORE zip，跨平台一致） |

`sync-build.mjs` 直用：`node dev/scripts/sync-build.mjs [--check]`。
`build-utools.mjs` 直用：`node dev/scripts/build-utools.mjs [--zip] [--verbose]`。

发布目录约定：

- `web/build` 供桌面壳与 PWA；`dist/utools` 仅供 uTools 商店上传；两者均不入库（gitignore）。
- 发布产物文件名规则：`timestamp-toolkit-v<plugin.json.version>.zip`。

## 4. 测试

| 脚本 | 效果 |
|---|---|
| `npm run test:load` | 冒烟：按 `index.html` 加载顺序(<constants→timezones→i18n→error-handler→storage→core→datetime→lunar→holidays→fields→calendar→convert→tzselector→events)串联 js/ 模块，无加载时报错；同时是单测的装载 harness |
| `npm run test:repro` | 四项极边界回归（DST 回退歧义 / 极边界壁钟不可表示 / ICU 裁剪毛刺），`0`=符合预期、`1`=回归 |
| `npm run test:accuracy` | 穷尽式精度校验：默认全量时区（上千个）较慢；支持断点续跑与子集（见下） |

单跑某个用例文件：`node --test dev/tests/<file>.test.mjs`。
测试载体：`dev/tests/harness.mjs`（`createFresh` 装载模块工厂）。

`test:accuracy` 可用环境变量：

- `ACC_ZONES=all|tool|<N>` 时区范围（全量 / 仅工具内置 / 抽样 N 个）
- `ACC_ONLY=all|core|boundary` 套件范围（核心 / 仅边界探测）
- `ACC_RANDOM_PER_ZONE=<n>` 每时区随机漫游样本数
- `ACC_DST_YEARS=2020-2025` DST 突变发现年份区间
- `ACC_SEED=<number>` 确定性随机种子（复现相同报告）

## 5. 桌面壳（web/electron）

先 `cd web/electron && npm ci`。

| 命令 | 效果 |
|---|---|
| `npm run start` | 本地调试运行（`electron .`） |
| `npm run dist` | 当前主机平台打包（win=nsis+zip；linux=AppImage+deb；mac=dmg+zip，mac 须 macOS 主机） |
| `npm run dist:win` | 仅 Windows（`timestamp-converter-setup-<v>.exe` + `.blockmap` + `<Product>-<v>-win.zip`） |
| `npm run dist:linux` | 仅 Linux（AppImage+deb；Windows 主机只能出未打包目录 dir） |
| `npm run dist:linux:portable` | 仅 Linux 便携 zip |
| `npm run dist:mac` | 仅 macOS（dmg+zip） |

产出目录：`web/electron/release/`。

`dist.cjs` 通用方式：`node dist.cjs [electron-builder 参数]`，自动注入国内镜像环境变量（Electron 本体 / NSIS / winCodeSign 走 npmmirror），规避 GitHub 下载超时。

## 6. 发布完整流程（v1.0.3 起）

```
变更代码 / 升版本（plugin.json、package.json、js/core.js 的 BUILD、web/electron/package.json+lock）
  → npm run build:web            # 同步桌面壳镜像（内容变则刷新缓存戳）
  → npm run build:utools:zip     # 重建投稿目录 + 打插件包 dist/timestamp-toolkit-<v>.zip
  → npm run verify               # lint + 加载冒烟 + 136 单测
  → 更新商店资料 store/（新建 store/vX.Y.Z/：release-notes.md + images/，并改 store/README.md 头部版本）
  → git 提交 → 打 tag vX.Y.Z → 推送 main 与 tag
  → gh release create vX.Y.Z --notes-file <body.md>
  → gh release upload vX.Y.Z dist/timestamp-toolkit-v<v>.zip \\
                              web/electron/release/timestamp-converter-setup-<v>.exe \\
                              web/electron/release/timestamp-converter-setup-<v>.exe.blockmap \\
                              "web/electron/release/Timestamp Converter-<v>-win.zip"
```

uTools 商店上传：选 `dist/utools/` 目录（内含 .git 检查的是该目录本身，不含仓库 .git；打包也只会打进这 20 个文件）。应用介绍 / 版本说明 / 投稿截图在 `store/`（按版本归档）。

## 7. 一次性 / 内部工具（一般不用）

| 脚本 | 说明 |
|---|---|
| `node dev/scripts/split.mjs` | 历史重构：index.js → js/ 模块拆分；**已完工，勿再运行** |
| `dev/scripts/.sync-state.json` | build:web 的缓存戳/哈希同步状态（gitignore） |
| 根目录 `test-*.html` / 各 `FIX-SUMMARY*.md` 等 | 历史调试页与分析文档，gitignore 中不入库，忽略即可 |