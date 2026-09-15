# uTools 商店发布资料

本目录保存 uTools 商店投稿所需的应用介绍、版本说明与投稿图片。按版本归档，后续每次发布新建 `vX.Y.Z/` 子目录并更新本文件。

## 插件信息

| 字段 | 值 |
|---|---|
| 插件名 | timestamp-tool ／ 时间戳转换器 |
| 开发者 | timestamp-developer |
| 当前版本 | v1.0.3（首次上架） |
| 上传目录 | `dist/utools`（`npm run build:utools` 生成） |
| 关键词 | 时间戳、时间戳转换、timestamp、时间、日期、时区、农历、节假日 |

## 应用介绍

秒 / 毫秒 / 微秒 / 纳秒时间戳与日期双向转换，输入即转换、点击即复制、唤起即用。

- **四档精度互转**：按位数自动识别切换，超大值 BigInt 无损换算
- **真实时区**：完整 IANA 时区 + 历史偏移（夏令时 / LMT 秒分量 / 公元前），支持自定义偏移、别名、绑定真实时区
- **智能解析**：ISO、RFC 2822、中文、相对日期（今天/明天/昨天）、部分日期建议、美欧月日歧义、自定义格式与正则规则
- **夏令时兜底**：回退重叠小时展示全部候选，跳空不存在时间明确提示
- **日历与农历**：日/月/年三级视图 + 时分秒滚轮；农历（1900–2100）与节日标注
- **节假日标注**：2024–2026 法定节假日 / 调休班（橙"休"红"班"角标）
- **顺手**：正则匹配自动转换、剪贴板预填、粘贴自动清洗、ESC 逐层回退、中英双语、三态主题

适用于开发者、运维、测试、数据分析等高频时间戳处理场景。纯本地计算，无网络请求，数据仅存本地。

**英文简介**：A fast timestamp converter (s/ms/us/ns) with real IANA timezone offsets, smart date parsing, lunar calendar and public-holiday marks — bilingual, local & private.

## 项目技术简档

- 形态：一套前端三种载体（uTools 插件 / Electron 桌面壳 / 浏览器直开），零依赖、零构建
- 技术栈：原生 HTML/CSS/JS（11 模块按序加载）、双语 i18n（164 键）、node:test 136 项单测
- 质量：`npm run verify` 一键验收（静态校验 + 加载冒烟 + 单测）
- 版本轨迹：v1.0.0 基础转换 → v1.0.1 桌面壳/IANA/歧义修复 → v1.0.2 农历/历元加固 → v1.0.3 节假日标注 + 角标配色（首次上架）

## 版本说明

各版本说明见 `vX.Y.Z/release-notes.md`（发布时也可直接复用为 GitHub Release notes 正文）。

## 发布新版本流程

1. 升版本（plugin.json、package.json、js/core.js BUILD、web/electron/package.json+lock）
2. `npm run build:web` → `npm run build:utools:zip` → `npm run verify`
3. 新建 `store/vX.Y.Z/`：写 `release-notes.md`，新截图放 `store/vX.Y.Z/images/`
4. 更新本文件头部「当前版本」与「应用介绍」（如有能力增减）
5. 提交、打 tag、发 GitHub Release 并上传产物，商店上传 `dist/utools`