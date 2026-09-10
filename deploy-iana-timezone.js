#!/usr/bin/env node

// ========================================================
// deploy-iana-timezone.js — IANA时区功能部署脚本
// ========================================================

const fs = require('fs');
const path = require('path');

// 部署配置
const DEPLOY_CONFIG = {
  sourceDir: './',
  targetDir: './dist',
  files: [
    'index.html',
    'index.css',
    'js/**/*.js',
    'assets/**/*',
    'IANA-TIMEZONE.md'
  ],
  replacements: {
    'js/datetime.js': 'js/datetime-enhanced.js'
  }
};

// 日志函数
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

// 检查部署环境
function checkEnvironment() {
  log('检查部署环境...', 'info');
  
  // 检查Node.js版本
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 14) {
    log(`Node.js版本过低: ${nodeVersion} (要求 >= 14)`, 'error');
    process.exit(1);
  }
  
  log(`Node.js版本: ${nodeVersion} ✓`, 'success');
  
  // 检查必要文件
  const requiredFiles = [
    'index.html',
    'js/timezone/iana-timezone.js',
    'js/timezone/compatibility-layer.js',
    'js/datetime-enhanced.js'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log(`缺少必要文件: ${file}`, 'error');
      process.exit(1);
    }
  }
  
  log('环境检查完成 ✓', 'success');
}

// 创建目标目录
function createTargetDirectory() {
  log('创建目标目录...', 'info');
  
  if (!fs.existsSync(DEPLOY_CONFIG.targetDir)) {
    fs.mkdirSync(DEPLOY_CONFIG.targetDir, { recursive: true });
    log(`创建目录: ${DEPLOY_CONFIG.targetDir}`, 'success');
  } else {
    log(`目录已存在: ${DEPLOY_CONFIG.targetDir}`, 'info');
  }
}

// 复制文件
function copyFiles() {
  log('复制文件...', 'info');
  
  const { execSync } = require('child_process');
  
  try {
    // 使用rsync进行高效复制
    const rsyncCommand = `rsync -av --delete ${DEPLOY_CONFIG.files.join(' ')} ${DEPLOY_CONFIG.targetDir}/`;
    execSync(rsyncCommand, { stdio: 'inherit' });
    
    log('文件复制完成 ✓', 'success');
  } catch (error) {
    log(`文件复制失败: ${error.message}`, 'error');
    process.exit(1);
  }
}

// 替换文件内容
function replaceFiles() {
  log('替换文件内容...', 'info');
  
  for (const [sourceFile, targetFile] of Object.entries(DEPLOY_CONFIG.replacements)) {
    const sourcePath = path.join(DEPLOY_CONFIG.sourceDir, sourceFile);
    const targetPath = path.join(DEPLOY_CONFIG.targetDir, targetFile);
    
    if (!fs.existsSync(sourcePath)) {
      log(`源文件不存在: ${sourcePath}`, 'warning');
      continue;
    }
    
    try {
      const content = fs.readFileSync(sourcePath, 'utf8');
      fs.writeFileSync(targetPath, content);
      log(`替换文件: ${sourcePath} -> ${targetPath}`, 'success');
    } catch (error) {
      log(`文件替换失败: ${error.message}`, 'error');
    }
  }
}

// 更新HTML文件
function updateHtmlFile() {
  log('更新HTML文件...', 'info');
  
  const htmlPath = path.join(DEPLOY_CONFIG.targetDir, 'index.html');
  
  if (!fs.existsSync(htmlPath)) {
    log(`HTML文件不存在: ${htmlPath}`, 'error');
    return;
  }
  
  try {
    let content = fs.readFileSync(htmlPath, 'utf8');
    
    // 更新脚本引用
    content = content.replace(
      /js\/datetime\.js\?v=\d+/g,
      'js/datetime-enhanced.js?v=' + Date.now()
    );
    
    // 添加IANA时区脚本引用
    const ianaScripts = `
  <!-- IANA时区支持 -->
  <script src="js/timezone/iana-timezone.js"></script>
  <script src="js/timezone/compatibility-layer.js"></script>
    `;
    
    if (!content.includes('iana-timezone.js')) {
      content = content.replace(
        '<script src="js/core.js',
        ianaScripts + '\n  <script src="js/core.js'
      );
    }
    
    fs.writeFileSync(htmlPath, content);
    log('HTML文件更新完成 ✓', 'success');
  } catch (error) {
    log(`HTML文件更新失败: ${error.message}`, 'error');
  }
}

// 生成部署信息
function generateDeployInfo() {
  log('生成部署信息...', 'info');
  
  const deployInfo = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: [
      '完整的IANA时区支持',
      '历史时区数据',
      '增强时区选择器',
      '向后兼容性',
      '性能优化'
    ],
    files: {
      total: 0,
      js: 0,
      css: 0,
      html: 0,
      other: 0
    }
  };
  
  // 统计文件数量
  const files = fs.readdirSync(DEPLOY_CONFIG.targetDir, { recursive: true });
  deployInfo.files.total = files.length;
  
  files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.js') deployInfo.files.js++;
    else if (ext === '.css') deployInfo.files.css++;
    else if (ext === '.html') deployInfo.files.html++;
    else deployInfo.files.other++;
  });
  
  // 保存部署信息
  const infoPath = path.join(DEPLOY_CONFIG.targetDir, 'deploy-info.json');
  fs.writeFileSync(infoPath, JSON.stringify(deployInfo, null, 2));
  
  log(`部署信息已保存: ${infoPath}`, 'success');
  log(`部署统计: ${deployInfo.files.total} 个文件 (JS: ${deployInfo.files.js}, CSS: ${deployInfo.files.css}, HTML: ${deployInfo.files.html})`, 'info');
}

// 验证部署
function validateDeployment() {
  log('验证部署...', 'info');
  
  const requiredFiles = [
    'index.html',
    'js/timezone/iana-timezone.js',
    'js/timezone/compatibility-layer.js',
    'js/datetime-enhanced.js'
  ];
  
  let allValid = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(DEPLOY_CONFIG.targetDir, file);
    
    if (!fs.existsSync(filePath)) {
      log(`缺少文件: ${filePath}`, 'error');
      allValid = false;
    } else {
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        log(`文件为空: ${filePath}`, 'error');
        allValid = false;
      } else {
        log(`文件验证通过: ${filePath} (${stats.size} bytes)`, 'success');
      }
    }
  }
  
  if (allValid) {
    log('部署验证完成 ✓', 'success');
  } else {
    log('部署验证失败 ❌', 'error');
    process.exit(1);
  }
}

// 清理临时文件
function cleanup() {
  log('清理临时文件...', 'info');
  
  const tempFiles = [
    './temp',
    './.tmp',
    './dist/temp',
    './dist/.tmp'
  ];
  
  tempFiles.forEach(tempDir => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      log(`清理临时目录: ${tempDir}`, 'info');
    }
  });
  
  log('清理完成 ✓', 'success');
}

// 主部署函数
async function deploy() {
  try {
    log('开始部署IANA时区功能...', 'info');
    
    // 1. 检查环境
    checkEnvironment();
    
    // 2. 创建目标目录
    createTargetDirectory();
    
    // 3. 复制文件
    copyFiles();
    
    // 4. 替换文件内容
    replaceFiles();
    
    // 5. 更新HTML文件
    updateHtmlFile();
    
    // 6. 生成部署信息
    generateDeployInfo();
    
    // 7. 验证部署
    validateDeployment();
    
    // 8. 清理临时文件
    cleanup();
    
    log('🎉 部署完成！', 'success');
    log('📁 部署目录: ' + path.resolve(DEPLOY_CONFIG.targetDir), 'info');
    log('🚀 IANA时区功能已成功部署', 'success');
    
  } catch (error) {
    log(`部署失败: ${error.message}`, 'error');
    process.exit(1);
  }
}

// 处理命令行参数
function handleArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
IANA时区功能部署脚本

用法:
  node deploy-iana-timezone.js [选项]

选项:
  --help, -h     显示帮助信息
  --version, -v  显示版本信息
  --clean        清理部署目录
  --validate     仅验证部署

示例:
  node deploy-iana-timezone.js          # 执行完整部署
  node deploy-iana-timezone.js --clean # 清理部署目录
  node deploy-iana-timezone.js --validate # 验证部署
    `);
    process.exit(0);
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    console.log('IANA时区功能部署脚本 v1.0.0');
    process.exit(0);
  }
  
  if (args.includes('--clean')) {
    log('清理部署目录...', 'info');
    if (fs.existsSync(DEPLOY_CONFIG.targetDir)) {
      fs.rmSync(DEPLOY_CONFIG.targetDir, { recursive: true, force: true });
      log('清理完成 ✓', 'success');
    }
    process.exit(0);
  }
  
  if (args.includes('--validate')) {
    log('验证部署...', 'info');
    checkEnvironment();
    validateDeployment();
    process.exit(0);
  }
}

// 运行部署
if (require.main === module) {
  handleArgs();
  deploy();
}

module.exports = { deploy, checkEnvironment, validateDeployment };