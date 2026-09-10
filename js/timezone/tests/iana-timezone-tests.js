// ========================================================
// js/timezone/tests/iana-timezone-tests.js — IANA时区功能测试
// ========================================================

import IanaTimezone from '../iana-timezone.js';

// 测试配置
const TEST_CONFIG = {
  verbose: true,
  timeout: 10000
};

// 测试结果统计
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 日志函数
function log(message, type = 'info') {
  if (TEST_CONFIG.verbose) {
    console[type](`[Test] ${message}`);
  }
}

// 开始测试
async function runTests() {
  log('开始IANA时区功能测试...', 'info');
  
  try {
    // 测试1：加载Luxon库
    await test1_LoadLuxon();
    
    // 测试2：时区偏移计算
    await test2_TzOffset();
    
    // 测试3：时区格式化
    await test3_TzFormatting();
    
    // 测试4：历史数据支持
    await test4_HistoricalData();
    
    // 测试5：时区信息获取
    await test5_TzInfo();
    
    // 测试6：边界情况处理
    await test6_EdgeCases();
    
    // 测试7：性能测试
    await test7_Performance();
    
    // 输出测试结果
    printTestResults();
    
  } catch (error) {
    log(`测试过程中发生错误: ${error.message}`, 'error');
    testResults.errors.push(error);
    printTestResults();
  }
}

// 测试1：加载Luxon库
async function test1_LoadLuxon() {
  log('测试1：加载Luxon库...', 'info');
  
  try {
    const startTime = performance.now();
    await IanaTimezone.loadLuxon();
    const endTime = performance.now();
    
    if (window.luxon && window.luxon.DateTime) {
      log(`✓ Luxon库加载成功，耗时: ${(endTime - startTime).toFixed(2)}ms`, 'success');
      testResults.passed++;
    } else {
      log('✗ Luxon库加载失败', 'error');
      testResults.failed++;
    }
  } catch (error) {
    log(`✗ Luxon库加载失败: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(error);
  }
  
  testResults.total++;
}

// 测试2：时区偏移计算
async function test2_TzOffset() {
  log('测试2：时区偏移计算...', 'info');
  
  try {
    const testDate = new Date('2023-01-01T00:00:00Z');
    const testTimezones = ['UTC', 'Asia/Shanghai', 'America/New_York', 'Europe/London'];
    
    for (const tz of testTimezones) {
      const offset = IanaTimezone.getTzOffset(testDate, tz);
      log(`时区 ${tz} 偏移: ${offset} 分钟`, 'info');
      
      // 验证偏移值在合理范围内
      if (offset < -720 || offset > 840) {
        log(`✗ 时区 ${tz} 偏移值异常: ${offset}`, 'error');
        testResults.failed++;
      } else {
        log(`✓ 时区 ${tz} 偏移值正常: ${offset}`, 'success');
        testResults.passed++;
      }
    }
  } catch (error) {
    log(`✗ 时区偏移计算测试失败: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(error);
  }
  
  testResults.total++;
}

// 测试3：时区格式化
async function test3_TzFormatting() {
  log('测试3：时区格式化...', 'info');
  
  try {
    const testDate = new Date('2023-01-01T12:00:00Z');
    const testTimezones = ['UTC', 'Asia/Shanghai', 'America/New_York'];
    const formats = ['yyyy-MM-dd HH:mm:ss', 'yyyy/MM/dd HH:mm:ss', 'yyyy年MM月dd日 HH:mm:ss'];
    
    for (const tz of testTimezones) {
      for (const format of formats) {
        const formatted = IanaTimezone.formatTzDate(testDate, tz, format);
        log(`时区 ${tz} 格式 ${format}: ${formatted}`, 'info');
        
        // 验证格式化结果不为空
        if (!formatted || formatted.length === 0) {
          log(`✗ 时区 ${tz} 格式 ${format} 失败`, 'error');
          testResults.failed++;
        } else {
          log(`✓ 时区 ${tz} 格式 ${format} 成功`, 'success');
          testResults.passed++;
        }
      }
    }
  } catch (error) {
    log(`✗ 时区格式化测试失败: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(error);
  }
  
  testResults.total++;
}

// 测试4：历史数据支持
async function test4_HistoricalData() {
  log('测试4：历史数据支持...', 'info');
  
  try {
    const testTimezones = ['Asia/Shanghai', 'America/New_York', 'UTC'];
    const testYears = [1200, 1900, 1950, 2023];
    
    for (const tz of testTimezones) {
      const supportsHistorical = IanaTimezone.supportsHistoricalData(tz);
      log(`时区 ${tz} 历史数据支持: ${supportsHistorical}`, 'info');
      
      if (supportsHistorical) {
        for (const year of testYears) {
          const historicalInfo = IanaTimezone.getTzHistoricalInfo(tz, year);
          log(`时区 ${tz} ${year}年历史信息: ${JSON.stringify(historicalInfo)}`, 'info');
          
          if (historicalInfo.hasHistoricalData) {
            log(`✓ 时区 ${tz} ${year}年历史数据获取成功`, 'success');
            testResults.passed++;
          } else {
            log(`- 时区 ${tz} ${year}年无历史数据`, 'info');
          }
        }
      } else {
        log(`- 时区 ${tz} 不支持历史数据`, 'info');
      }
    }
  } catch (error) {
    log(`✗ 历史数据支持测试失败: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(error);
  }
  
  testResults.total++;
}

// 测试5：时区信息获取
async function test5_TzInfo() {
  log('测试5：时区信息获取...', 'info');
  
  try {
    const testDate = new Date('2023-01-01T12:00:00Z');
    const testTimezones = ['UTC', 'Asia/Shanghai', 'America/New_York'];
    
    for (const tz of testTimezones) {
      const tzInfo = IanaTimezone.getTzInfo(testDate, tz);
      log(`时区 ${tz} 信息: ${JSON.stringify(tzInfo)}`, 'info');
      
      // 验证时区信息结构
      if (tzInfo && typeof tzInfo.offset === 'number' && tzInfo.name) {
        log(`✓ 时区 ${tz} 信息获取成功`, 'success');
        testResults.passed++;
      } else {
        log(`✗ 时区 ${tz} 信息获取失败`, 'error');
        testResults.failed++;
      }
    }
  } catch (error) {
    log(`✗ 时区信息获取测试失败: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(error);
  }
  
  testResults.total++;
}

// 测试6：边界情况处理
async function test6_EdgeCases() {
  log('测试6：边界情况处理...', 'info');
  
  try {
    // 测试无效时区
    const invalidTz = 'Invalid/Timezone';
    const offset = IanaTimezone.getTzOffset(new Date(), invalidTz);
    log(`无效时区偏移: ${offset}`, 'info');
    
    // 测试空时区
    const emptyTz = '';
    const emptyOffset = IanaTimezone.getTzOffset(new Date(), emptyTz);
    log(`空时区偏移: ${emptyOffset}`, 'info');
    
    // 测试极端日期
    const extremeDate = new Date('0001-01-01T00:00:00Z');
    const extremeOffset = IanaTimezone.getTzOffset(extremeDate, 'Asia/Shanghai');
    log(`极端日期偏移: ${extremeOffset}`, 'info');
    
    log(`✓ 边界情况处理测试完成`, 'success');
    testResults.passed++;
  } catch (error) {
    log(`✗ 边界情况处理测试失败: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(error);
  }
  
  testResults.total++;
}

// 测试7：性能测试
async function test7_Performance() {
  log('测试7：性能测试...', 'info');
  
  try {
    const testDate = new Date('2023-01-01T12:00:00Z');
    const testTimezones = ['Asia/Shanghai', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
    const iterations = 100;
    
    // 测试时区偏移计算性能
    const startTime = performance.now();
    for (let i = 0; i < iterations; i++) {
      for (const tz of testTimezones) {
        IanaTimezone.getTzOffset(testDate, tz);
      }
    }
    const endTime = performance.now();
    
    const avgTime = (endTime - startTime) / (iterations * testTimezones.length);
    log(`平均时区偏移计算时间: ${avgTime.toFixed(4)}ms`, 'info');
    
    // 测试时区格式化性能
    const formatStartTime = performance.now();
    for (let i = 0; i < iterations; i++) {
      for (const tz of testTimezones) {
        IanaTimezone.formatTzDate(testDate, tz, 'yyyy-MM-dd HH:mm:ss');
      }
    }
    const formatEndTime = performance.now();
    
    const formatAvgTime = (formatEndTime - formatStartTime) / (iterations * testTimezones.length);
    log(`平均时区格式化时间: ${formatAvgTime.toFixed(4)}ms`, 'info');
    
    // 验证性能在可接受范围内
    if (avgTime < 1 && formatAvgTime < 2) {
      log(`✓ 性能测试通过`, 'success');
      testResults.passed++;
    } else {
      log(`✗ 性能测试未达标`, 'warning');
      testResults.failed++;
    }
  } catch (error) {
    log(`✗ 性能测试失败: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(error);
  }
  
  testResults.total++;
}

// 打印测试结果
function printTestResults() {
  log('\n=== 测试结果 ===', 'info');
  log(`总测试数: ${testResults.total}`, 'info');
  log(`通过: ${testResults.passed}`, 'success');
  log(`失败: ${testResults.failed}`, 'error');
  
  if (testResults.errors.length > 0) {
    log('\n错误详情:', 'error');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.message}`, 'error');
    });
  }
  
  const successRate = (testResults.passed / testResults.total * 100).toFixed(2);
  log(`成功率: ${successRate}%`, successRate >= 90 ? 'success' : 'warning');
}

// 自动运行测试
if (typeof window !== 'undefined') {
  window.runIanaTimezoneTests = runTests;
  
  // 页面加载完成后自动运行测试
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTests);
  } else {
    runTests();
  }
}

export { runTests, testResults };