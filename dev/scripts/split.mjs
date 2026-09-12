#!/usr/bin/env node
// split.mjs — one-time refactor tool: slices index.js into js/ modules.
// Boundaries chosen so every top-level-executed statement's dependencies
// live in the same or an earlier file; order within files is preserved.
// Usage: node dev/scripts/split.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const SRC = resolve(ROOT, 'index.js');
if (!existsSync(SRC)) {
  console.log('index.js not found — split already done?');
  process.exit(1);
}

const lines = readFileSync(SRC, 'utf8').split(/\r?\n/);

const MODULES = [
  { file: 'js/core.js',         from: 1,   to: 1141, role: '基础工具/常量、i18n 数据、系统设置、时区数据与配置 UI' },
  { file: 'js/datetime.js',     from: 1143, to: 1519, role: '时间/时区格式化、日期解析引擎（纯逻辑）' },
  { file: 'js/fields.js',       from: 1520, to: 1806, role: '解析结果套入表单、快捷建议' },
  { file: 'js/calendar.js',     from: 1807, to: 2325, role: '日历、时间滚轮、通用视图工具、实时时钟' },
  { file: 'js/convert.js',      from: 2326, to: 3101, role: '转换渲染、日期格式/解析配置、精度与 TAB 切换' },
  { file: 'js/tzselector.js',   from: 3102, to: 3685, role: '自定义时区选择器、语言(i18n)应用' },
  { file: 'js/events.js',       from: 3686, to: 4053, role: '全局事件绑定、剪贴板/滚动条、启动引导' },
];

mkdirSync(resolve(ROOT, 'js'), { recursive: true });

for (const mod of MODULES) {
  const slice = lines.slice(mod.from - 1, mod.to);
  const body = slice.join('\n').replace(/^\s*\n+|\s*\n+$/g, '').trimEnd();
  const header = [
    `// ========================================================`,
    `// ${mod.file} — ${mod.role}`,
    `// Extracted from index.js (lines ${mod.from}-${mod.to}) by`,
    `// dev/scripts/split.mjs. Loaded from index.html in this order:`,
    `// core → datetime → fields → calendar → convert → tzselector → events`,
    `// ========================================================`,
    '',
    '',
  ].join('\n');
  const dst = resolve(ROOT, mod.file);
  writeFileSync(dst, header + body + '\n');
  console.log(`wrote ${mod.file} (${slice.length} original lines -> ${body.split('\n').length} kept)`);
}

console.log('done');