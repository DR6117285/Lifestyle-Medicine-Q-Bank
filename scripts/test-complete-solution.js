#!/usr/bin/env node

/**
 * LMQB Complete Solution Test Script
 * Tests all components of the database refresh solution in dry-run mode
 * 
 * Features:
 * - Tests all major scripts and functionality
 * - Validates configuration and environment
 * - Checks source data integrity
 * - Verifies script interactions
 * - Generates comprehensive test report
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { spawn } from 'child_process';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:8000',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  questionsDir: path.join(__dirname, '../data/questions'),
  
  verbose: process.argv.includes('--verbose'),
  skipConnectionTests: process.argv.includes('--skip-connection'),
  skipFileTests: process.argv.includes('--skip-files'),
  skipScriptTests: process.argv.includes('--skip-scripts')
};

// Test results tracking
const testResults = {
  startTime: Date.now(),
  environment: {
    passed: 0,
    failed: 0,
    issues: []
  },
  sourceData: {
    passed: 0,
    failed: 0,
    issues: []
  },
  scripts: {
    passed: 0,
    failed: 0,
    issues: []
  },
  integration: {
    passed: 0,
    failed: 0,
    issues: []
  }
};

// Logging utility
const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, error ? error.message || error : '');
    if (config.verbose && error?.stack) {
      console.error(error.stack);
    }
  },
  verbose: (message, data = null) => {
    if (config.verbose) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [VERBOSE] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  success: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SUCCESS] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  test: (category, testName, passed, details = null) => {
    const result = passed ? 'PASS' : 'FAIL';
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} [${category.toUpperCase()}] ${testName}: ${result}`);
    
    if (details && (!passed || config.verbose)) {
      console.log(`   Details: ${details}`);
    }
    
    if (passed) {
      testResults[category].passed++;
    } else {
      testResults[category].failed++;
      testResults[category].issues.push({ testName, details });
    }
  }
};

/**
 * Test environment configuration
 */
async function testEnvironment() {
  logger.info('Testing environment configuration...');
  
  // Test required environment variables
  logger.test('environment', 'SUPABASE_URL defined', 
    !!config.supabaseUrl, 
    config.supabaseUrl ? 'Found' : 'Missing SUPABASE_URL or VITE_SUPABASE_URL'
  );
  
  logger.test('environment', 'Database credentials available', 
    !!(config.supabaseServiceKey || config.supabaseAnonKey),
    config.supabaseServiceKey ? 'Service role key found' : 
    config.supabaseAnonKey ? 'Anonymous key found' : 'No credentials found'
  );
  
  // Test Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  logger.test('environment', 'Node.js version >= 18', 
    majorVersion >= 18,
    `Current version: ${nodeVersion}`
  );
  
  // Test directory structure
  try {
    await fs.access(__dirname);
    logger.test('environment', 'Scripts directory accessible', true, __dirname);
  } catch (error) {
    logger.test('environment', 'Scripts directory accessible', false, error.message);
  }
  
  try {
    await fs.access(config.questionsDir);
    logger.test('environment', 'Questions directory accessible', true, config.questionsDir);
  } catch (error) {
    logger.test('environment', 'Questions directory accessible', false, error.message);
  }
  
  // Test required scripts exist
  const requiredScripts = [
    'cleanup-database.js',
    'batch-import-questions.js', 
    'complete-refresh.js',
    'validate-integrity.js',
    'rollback-import.js'
  ];
  
  for (const script of requiredScripts) {
    try {
      await fs.access(path.join(__dirname, script));
      logger.test('environment', `Script ${script} exists`, true);
    } catch (error) {
      logger.test('environment', `Script ${script} exists`, false, error.message);
    }
  }
  
  // Test database connection if not skipped
  if (!config.skipConnectionTests) {
    await testDatabaseConnection();
  }
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  logger.verbose('Testing database connection...');
  
  try {
    const supabase = createClient(
      config.supabaseUrl, 
      config.supabaseServiceKey || config.supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (error) {
      logger.test('environment', 'Database connection', false, error.message);
    } else {
      logger.test('environment', 'Database connection', true, 'Connected successfully');
      
      // Test basic query performance
      const start = Date.now();
      await supabase.from('questions').select('id').limit(10);
      const duration = Date.now() - start;
      
      logger.test('environment', 'Query performance acceptable', 
        duration < 5000,
        `Query took ${duration}ms`
      );
    }
    
  } catch (error) {
    logger.test('environment', 'Database connection', false, error.message);
  }
}

/**
 * Test source data integrity
 */
async function testSourceData() {
  if (config.skipFileTests) {
    logger.info('Skipping source data tests');
    return;
  }
  
  logger.info('Testing source data integrity...');
  
  try {
    const files = await fs.readdir(config.questionsDir);
    const jsonFiles = files.filter(file => 
      file.endsWith('.json') && 
      !file.startsWith('.') && 
      file !== 'q_check.py'
    );
    
    logger.test('sourceData', 'JSON files found', 
      jsonFiles.length > 0,
      `Found ${jsonFiles.length} JSON files`
    );
    
    let totalQuestions = 0;
    let validFiles = 0;
    let invalidFiles = [];
    
    // Test file naming convention
    for (const file of jsonFiles) {
      const nameWithoutExt = file.replace('.json', '');
      const dashIndex = nameWithoutExt.indexOf(' - ');
      const hasValidFormat = dashIndex !== -1 && 
        nameWithoutExt.substring(dashIndex + 3).match(/^\d*\.\s*.+$/);
      
      if (!hasValidFormat) {
        logger.test('sourceData', `File naming format: ${file}`, false,
          'Should follow format: [Category] - [Number]. [Section Name].json'
        );
      }
    }
    
    // Test JSON validity and content (sample first 5 files)
    const testFiles = jsonFiles.slice(0, 5);
    
    for (const file of testFiles) {
      try {
        const filePath = path.join(config.questionsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Test JSON parsing
        let questions;
        try {
          questions = JSON.parse(content);
          logger.test('sourceData', `JSON valid: ${file}`, true);
        } catch (parseError) {
          logger.test('sourceData', `JSON valid: ${file}`, false, parseError.message);
          invalidFiles.push(file);
          continue;
        }
        
        // Test array format
        const isArray = Array.isArray(questions);
        logger.test('sourceData', `Array format: ${file}`, isArray, 
          isArray ? `Contains ${questions.length} items` : 'Not an array'
        );
        
        if (!isArray) {
          invalidFiles.push(file);
          continue;
        }
        
        totalQuestions += questions.length;
        
        // Test question structure (first question only)
        if (questions.length > 0) {
          const firstQuestion = questions[0];
          const hasRequiredFields = 
            firstQuestion.question_text && 
            firstQuestion.correct_answer && 
            Array.isArray(firstQuestion.options) &&
            firstQuestion.options.length >= 2;
          
          logger.test('sourceData', `Question structure: ${file}`, hasRequiredFields,
            hasRequiredFields ? 'Has required fields' : 'Missing required fields'
          );
          
          if (hasRequiredFields) {
            validFiles++;
          } else {
            invalidFiles.push(file);
          }
        }
        
      } catch (error) {
        logger.test('sourceData', `File readable: ${file}`, false, error.message);
        invalidFiles.push(file);
      }
    }
    
    logger.test('sourceData', 'Estimated total questions', 
      totalQuestions > 0,
      `Estimated ${totalQuestions} questions from ${testFiles.length} files`
    );
    
    logger.test('sourceData', 'Valid file ratio', 
      invalidFiles.length === 0,
      `${validFiles}/${testFiles.length} files valid, ${invalidFiles.length} issues`
    );
    
  } catch (error) {
    logger.test('sourceData', 'Source data directory access', false, error.message);
  }
}

/**
 * Run a script and capture results
 */
function runScript(scriptName, args = []) {
  return new Promise((resolve) => {
    logger.verbose(`Running: node ${scriptName} ${args.join(' ')}`);
    
    const child = spawn('node', [scriptName, ...args], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        exitCode: code,
        stdout,
        stderr,
        success: code === 0
      });
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      child.kill();
      resolve({
        exitCode: -1,
        stdout,
        stderr: stderr + '\nTimeout after 30 seconds',
        success: false
      });
    }, 30000);
  });
}

/**
 * Test individual scripts
 */
async function testScripts() {
  if (config.skipScriptTests) {
    logger.info('Skipping script tests');
    return;
  }
  
  logger.info('Testing individual scripts...');
  
  // Test help commands work
  const scriptsToTest = [
    { script: 'cleanup-database.js', args: ['--help'] },
    { script: 'batch-import-questions.js', args: ['--help'] },
    { script: 'complete-refresh.js', args: ['--help'] },
    { script: 'validate-integrity.js', args: ['--help'] },
    { script: 'rollback-import.js', args: ['--help'] }
  ];
  
  for (const { script, args } of scriptsToTest) {
    const result = await runScript(script, args);
    logger.test('scripts', `${script} help command`, 
      result.success && result.stdout.includes('Usage:'),
      result.success ? 'Help displayed successfully' : result.stderr
    );
  }
  
  // Test dry-run functionality (if connection available)
  if (!config.skipConnectionTests) {
    // Test validation script
    const validationResult = await runScript('validate-integrity.js', ['--verbose']);
    logger.test('scripts', 'validate-integrity.js execution', 
      validationResult.success,
      validationResult.success ? 'Validation completed' : validationResult.stderr
    );
    
    // Only test others if we have database access
    if (validationResult.success) {
      // Test complete refresh dry run
      const refreshResult = await runScript('complete-refresh.js', ['--dry-run', '--force']);
      logger.test('scripts', 'complete-refresh.js dry-run', 
        refreshResult.success,
        refreshResult.success ? 'Dry run completed' : refreshResult.stderr
      );
    }
  }
}

/**
 * Test script integration
 */
async function testIntegration() {
  logger.info('Testing script integration...');
  
  // Test that scripts can import each other's modules
  try {
    // Try to import the main functions (this tests ES module compatibility)
    const { parseFilename } = await import('./batch-import-questions.js');
    
    if (typeof parseFilename === 'function') {
      logger.test('integration', 'Module imports work', true, 'Functions can be imported');
      
      // Test filename parsing function
      try {
        const result = parseFilename('General - 1. Introduction to Lifestyle Medicine.json');
        const isValid = result.category === 'General' && 
                        result.sectionName === 'Introduction to Lifestyle Medicine' &&
                        result.sectionNumber === '1';
        
        logger.test('integration', 'Filename parsing function', isValid,
          isValid ? 'Parsed correctly' : `Got: ${JSON.stringify(result)}`
        );
      } catch (error) {
        logger.test('integration', 'Filename parsing function', false, error.message);
      }
    } else {
      logger.test('integration', 'Module imports work', false, 'parseFilename not found');
    }
  } catch (error) {
    logger.test('integration', 'Module imports work', false, error.message);
  }
  
  // Test package.json scripts configuration
  try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    
    const expectedScripts = [
      'import', 'import:batch', 'cleanup', 'refresh', 
      'validate', 'rollback'
    ];
    
    const hasAllScripts = expectedScripts.every(script => 
      packageJson.scripts && packageJson.scripts[script]
    );
    
    logger.test('integration', 'Package.json scripts configured', hasAllScripts,
      hasAllScripts ? 'All npm scripts available' : 'Missing script configurations'
    );
    
  } catch (error) {
    logger.test('integration', 'Package.json scripts configured', false, error.message);
  }
  
  // Test documentation exists
  try {
    await fs.access(path.join(__dirname, 'DATABASE_REFRESH_GUIDE.md'));
    logger.test('integration', 'Documentation available', true, 'Guide found');
  } catch (error) {
    logger.test('integration', 'Documentation available', false, 'Guide not found');
  }
}

/**
 * Generate test report
 */
function generateTestReport() {
  const duration = (Date.now() - testResults.startTime) / 1000;
  
  console.log('\n' + '='.repeat(80));
  console.log('                     LMQB SOLUTION TEST REPORT                      ');
  console.log('='.repeat(80));
  
  console.log('\n📊 TEST SUMMARY');
  console.log(`Test Duration: ${duration.toFixed(2)} seconds`);
  console.log(`Node.js Version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  
  // Calculate totals
  const totalPassed = Object.values(testResults).reduce((sum, category) => 
    sum + (category.passed || 0), 0);
  const totalFailed = Object.values(testResults).reduce((sum, category) => 
    sum + (category.failed || 0), 0);
  const totalTests = totalPassed + totalFailed;
  const successRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : '0.0';
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Success Rate: ${successRate}%`);
  
  // Category breakdown
  console.log('\n🔍 RESULTS BY CATEGORY');
  
  for (const [category, results] of Object.entries(testResults)) {
    if (typeof results.passed !== 'number') continue;
    
    const total = results.passed + results.failed;
    const rate = total > 0 ? (results.passed / total * 100).toFixed(0) : '0';
    const status = results.failed === 0 ? '✅' : '❌';
    
    console.log(`${status} ${category.padEnd(15)} ${results.passed}/${total} (${rate}%)`);
    
    if (results.issues.length > 0) {
      results.issues.slice(0, 3).forEach(issue => {
        console.log(`   🔴 ${issue.testName}: ${issue.details}`);
      });
      if (results.issues.length > 3) {
        console.log(`   ... and ${results.issues.length - 3} more issues`);
      }
    }
  }
  
  // Overall status
  console.log('\n🎯 OVERALL STATUS');
  
  if (totalFailed === 0) {
    console.log('🎉 ALL TESTS PASSED - Solution is ready for use');
  } else if (successRate >= 80) {
    console.log('⚠️  MOSTLY WORKING - Minor issues detected, review failures');
  } else {
    console.log('❌ CRITICAL ISSUES - Major problems detected, requires attention');
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  
  if (testResults.environment.failed > 0) {
    console.log('🔴 Fix environment configuration issues before using scripts');
  }
  
  if (testResults.sourceData.failed > 0) {
    console.log('🟡 Review and fix source data issues for better import results');
  }
  
  if (testResults.scripts.failed > 0) {
    console.log('🔴 Script issues detected - check error messages above');
  }
  
  if (testResults.integration.failed > 0) {
    console.log('🟡 Integration issues may affect script coordination');
  }
  
  if (totalFailed === 0) {
    console.log('✅ Solution is ready - you can safely run:');
    console.log('   npm run refresh -- --dry-run --verbose');
  }
  
  console.log('='.repeat(80));
  
  return totalFailed === 0;
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
LMQB Complete Solution Test Script

Tests all components of the database refresh solution to ensure they work correctly.

Usage: node test-complete-solution.js [options]

Options:
  --verbose               Enable detailed test output
  --skip-connection       Skip database connection tests
  --skip-files            Skip source file validation tests
  --skip-scripts          Skip individual script execution tests
  --help                  Show this help message

Test Categories:
  - Environment: Configuration, credentials, and system requirements
  - Source Data: JSON file validation and structure checks
  - Scripts: Individual script functionality and help commands
  - Integration: Module imports and package configuration

This script runs entirely in safe mode - it only performs read operations
and dry-run tests. No data is modified during testing.

Examples:
  node test-complete-solution.js                    # Run all tests
  node test-complete-solution.js --verbose          # Detailed output
  node test-complete-solution.js --skip-connection  # Skip DB tests
`);
}

/**
 * Main test function
 */
async function main() {
  try {
    console.log('\n🧪 LMQB Complete Solution Test Suite');
    console.log('Testing all components of the database refresh solution...\n');
    
    // Show help if requested
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      printUsage();
      return;
    }
    
    // Run all test suites
    await testEnvironment();
    await testSourceData();
    await testScripts();
    await testIntegration();
    
    // Generate final report
    const allTestsPassed = generateTestReport();
    
    // Exit with appropriate code
    process.exit(allTestsPassed ? 0 : 1);
    
  } catch (error) {
    logger.error('Test suite failed:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise);
  logger.error('Reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the test suite
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };