# 版本发布流程（Release Runbook）

完整的上线步骤清单，供每次发版（如 `v1.0.3` → `v1.0.4`）逐条执行。

- 命令速查见 `dev/COMMANDS.md`；商店资料与版本说明归档见 `store/`（含 `store/README.md`）。
- 环境前提：根目录脚本纯 Node（≥18）；Windows PowerShell 用 **`npm.cmd`** 代替 `npm`。
- 规范速记：分支名与 tag 均用 `vX.Y.Z`；发布动作全部在**发布分支**上完成。

---

## 1. 分支与开发

1. 从 `main`（或上一版本 tag）切发布分支：
   ```powershell
   git checkout -b v1.0.4 main
   git push -u origin v1.0.4
   ```
2. 功能开发在各功能分支上进行，通过 PR / 合并把代码合入发布分支：
   ```
   head=功能分支  base=v1.0.4
   gh pr create --base v1.0.4 --head <功能分支> --title ... --body ...
   gh pr merge <编号> --merge
   ```
3. 合并完成后切到发布分支并拉取最新：
   ```powershell
   git checkout v1.0.4
   git pull
   ```

## 2. 发布前验收（硬门槛）

1. 一键验收必须全绿：
   ```powershell
   npm.cmd run verify
   ```
   （= 静态校验 lint + 模块加载冒烟 test:load + 单元测试 test；当前 151 项）
2. 可选穷尽精度校验：`npm.cmd run test:accuracy`（支持断点续跑，见 `dev/COMMANDS.md` §4）。
3. 手工 UI 冒烟清单（对照上一版本 tag，确认无回归）：
   - 秒/毫秒/微秒/纳秒四档精度 TAB 切换，输入/粘贴/清空、分组空格显示、低精度切换后升回值不丢失
   - 正负时间戳、超长与极边界值（BigInt）、千分位与噪声剥离
   - IANA 时区 / 自定义偏移 / 别名 / LMT 秒分量 / 夏令时回退与跳空提示
   - 日历与农历、节假日与调休角标（2024–2026）
   - 自定义格式 / 正则规则、中英双语切换、三态主题、剪贴板预填

## 3. 提升版本号（先于构建，一次改 4 处）

| 文件 | 改动 |
|---|---|
| `plugin.json` | `"version": "1.0.3"` → `"1.0.4"` |
| `package.json` | `"version": "1.0.3"` → `"1.0.4"` |
| `js/core.js` | `const BUILD = 'v1.0.3';` → `'v1.0.4'`（界面角标显示） |
| `web/electron/package.json` + `package-lock.json` | `"version": "1.0.3"` → `"1.0.4"` |

> 顺序约束：**必须先升版本再构建**——插件包文件名取自 `plugin.json.version`（`dist/timestamp-toolkit-v<v>.zip`），界面角标取自 `BUILD`，二者变更会触发 `build:web` 自动刷新 `?v=` 缓存戳。

## 4. 构建与打包

1. 同步桌面壳/PWA 镜像（内容变更自动刷新缓存戳）：
   ```powershell
   npm.cmd run build:web
   ```
2. 重建 uTools 投稿目录并打插件包：
   ```powershell
   npm.cmd run build:utools:zip
   ```
   - 产出：`dist/utools/`（每次全量重建的固定投稿目录）+ `dist/timestamp-toolkit-v1.0.4.zip`（带版本命名，不覆盖旧版）。
3. （可选，仅当发布桌面壳）Electron 打包：
   ```powershell
   npm.cmd run dist:win   # 出 web/electron/release/ 下 exe + blockmap + win.zip
   ```
   先 `cd web/electron && npm ci`。Linux/mac 产物见 `dev/COMMANDS.md` §5。
4. 说明：`dist/`、`web/build/`、`web/electron/release/` 均在 `.gitignore`，**产物不入库**，靠 GitHub Release assets 外传。

## 5. 商店资料（store 归档）

1. 新建版本目录并写更新说明：
   ```
   store/v1.0.4/release-notes.md   # 本版本新增/修复/质量说明
   store/v1.0.4/images/            # 新功能/新界面截图若干
   ```
   参考现有格式：`store/v1.0.3/release-notes.md`。
2. 更新 `store/README.md` 头部：
   - 「当前版本」改为 `v1.0.4`；
   - 「应用介绍」按本版本能力增减同步；
   - 提示：`release-notes.md` 可**直接复用为 GitHub Release 正文**（一个源两处用）。

## 6. 提交与打 tag（在发布分支上）

1. 提交全部变更（版本号 + 构建产物戳 + store 资料）：
   ```powershell
   git add -A
   git commit -m "chore(release): v1.0.4"
   ```
   > 注意：构建产物（dist/、web/build/ 等）在 gitignore 中不会进提交；提交的只是源码、版本号与 `store/` 资料。
2. 推送分支与 tag：
   ```powershell
   git push origin v1.0.4
   git tag v1.0.4
   git push origin v1.0.4
   ```
   > tag 必须打在发布分支的 release commit（版本号已升、store 已提交）上。

## 7. GitHub Release（含 Assets）

1. 建 Release（正文复用 store 说明）：
   ```powershell
   gh release create v1.0.4 --title "v1.0.4 正式版" --notes-file store/v1.0.4/release-notes.md
   ```
2. 上传产物：
   ```powershell
   gh release upload v1.0.4 dist/timestamp-toolkit-v1.0.4.zip `
                        web/electron/release/timestamp-converter-setup-1.0.4.exe `
                        web/electron/release/timestamp-converter-setup-1.0.4.exe.blockmap `
                        "web/electron/release/Timestamp Converter-1.0.4-win.zip"
   ```
   （桌面壳三项为可选项，跳过时删除对应行即可）
3. 校验：`gh release view v1.0.4`，确认 tag、正文、assets 齐全。

## 8. 商店上传与实机验证（外部手动）

1. uTools 开发者后台：插件版本上传选 **`dist/utools/`** 目录，填写版本说明（复用 `release-notes.md`），提交审核。
2. 审核通过后，实机安装一次验证：唤起、四档精度、粘贴清洗、时区/农历切换正常。

## 9. 收尾

1. **main 回流**：把发布分支上的「版本号 + store + 文档」提交合并回 `main`，避免版本号在两条线漂移。main 是保护分支，**只能走 PR**：
   ```powershell
   # 发布分支已推送的前提下
   gh pr create --base main --head v1.0.4 --title "chore(release): v1.0.4 回流 main" --body ...
   gh pr merge <编号> --squash
   ```
2. 本地切回日常工作分支；可顺手更新宣传物料（如 `公众号宣传稿.md`）。

---

## 速查表（v1.0.3 → v1.0.4 最小命令序列）

```powershell
# §1 分支
git checkout -b v1.0.4 main; git push -u origin v1.0.4
# …功能分支 PR 合并后…
git checkout v1.0.4; git pull
# §2 验收
npm.cmd run verify
# §3 升版本（改 4 处：plugin.json / package.json / js/core.js BUILD / web/electron 双文件）
# §4 构建
npm.cmd run build:web
npm.cmd run build:utools:zip
# （可选）cd web/electron; npm ci; npm run dist:win
# §5 商店资料（写 store/v1.0.4/release-notes.md + images/，改 store/README.md）
# §6 提交与打标
git add -A; git commit -m "chore(release): v1.0.4"
git push origin v1.0.4; git tag v1.0.4; git push origin v1.0.4
# §7 Release
gh release create v1.0.4 --title "v1.0.4 正式版" --notes-file store/v1.0.4/release-notes.md
gh release upload v1.0.4 dist/timestamp-toolkit-v1.0.4.zip
# §8 商店上传 dist/utools → 实机验证
# §9 main 回流（main 为保护分支，只收 PR）
gh pr create --base main --head v1.0.4 --title "chore(release): v1.0.4 回流 main"
gh pr merge <编号> --squash
```