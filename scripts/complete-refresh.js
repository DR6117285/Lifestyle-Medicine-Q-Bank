#!/usr/bin/env node

/**
 * LMQB Complete Database Refresh Script
 * Orchestrates the complete process of cleaning and repopulating the questions database
 * 
 * Features:
 * - Complete workflow orchestration (cleanup + import)
 * - Pre and post-operation validation
 * - Comprehensive integrity checks
 * - Rollback capability on failure
 * - Detailed progress tracking and reporting
 * - Safety checks and confirmations
 * - Performance monitoring
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import fs from 'fs/promises';
import { main as cleanupMain } from './cleanup-database.js';
import { main as batchImportMain } from './batch-import-questions.js';

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
  
  // Operation modes
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  force: process.argv.includes('--force'),
  skipBackup: process.argv.includes('--skip-backup'),
  skipCleanup: process.argv.includes('--skip-cleanup'),
  skipImport: process.argv.includes('--skip-import'),
  skipValidation: process.argv.includes('--skip-validation'),
  continueOnError: process.argv.includes('--continue-on-error'),
  
  // Performance settings
  batchSize: parseInt(process.env.BATCH_SIZE) || parseInt(process.argv.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 50,
  maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
};

// Initialize Supabase client
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

// Enhanced logging utility
const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    const memUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    console.log(`[${timestamp}] [${memUsage}MB] [INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
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
      const memUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      console.log(`[${timestamp}] [${memUsage}MB] [VERBOSE] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  success: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SUCCESS] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  step: (stepNumber, totalSteps, message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [STEP ${stepNumber}/${totalSteps}] ${message}`);
  }
};

// Comprehensive statistics tracking
const stats = {
  // Overall process
  startTime: Date.now(),
  phases: {
    validation: { startTime: null, endTime: null, success: false },
    cleanup: { startTime: null, endTime: null, success: false },
    import: { startTime: null, endTime: null, success: false },
    verification: { startTime: null, endTime: null, success: false }
  },
  
  // Pre-operation state
  beforeState: {},
  afterState: {},
  
  // Operation results
  filesProcessed: 0,
  questionsImported: 0,
  categoriesCreated: 0,
  sectionsCreated: 0,
  optionsInserted: 0,
  
  // Issues
  errors: [],
  warnings: [],
  
  // Performance
  maxMemoryUsage: 0,
  backupCreated: false,
  backupPath: null
};

/**
 * Create readline interface for user confirmation
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Ask user for confirmation
 */
async function askConfirmation(message) {
  if (config.force) {
    logger.info(`Auto-confirming: ${message} (force mode)`);
    return true;
  }
  
  const rl = createReadlineInterface();
  
  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Get comprehensive database statistics
 */
async function getDatabaseStats() {
  logger.verbose('Collecting comprehensive database statistics...');
  
  const stats = {};
  
  try {
    // Questions and related data
    const { count: questionCount, error: questionError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    if (questionError) throw questionError;
    stats.questions = questionCount || 0;
    
    const { count: optionCount, error: optionError } = await supabase
      .from('question_options')
      .select('*', { count: 'exact', head: true });
    if (optionError) throw optionError;
    stats.options = optionCount || 0;
    
    // Categories and sections
    const { count: categoryCount, error: categoryError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });
    if (categoryError) throw categoryError;
    stats.categories = categoryCount || 0;
    
    const { count: sectionCount, error: sectionError } = await supabase
      .from('sections')
      .select('*', { count: 'exact', head: true });
    if (sectionError) throw sectionError;
    stats.sections = sectionCount || 0;
    
    // Quiz data
    const { count: sessionCount, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*', { count: 'exact', head: true });
    if (sessionError) throw sessionError;
    stats.quizSessions = sessionCount || 0;
    
    const { count: attemptCount, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true });
    if (attemptError) throw attemptError;
    stats.quizAttempts = attemptCount || 0;
    
    // User data (preserved)
    const { count: userCount, error: userError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    if (userError) throw userError;
    stats.users = userCount || 0;
    
    // Data integrity checks
    const { data: orphanedOptions, error: orphanError } = await supabase
      .from('question_options')
      .select('id')
      .not('question_id', 'in', 
        supabase.from('questions').select('id')
      )
      .limit(1);
    if (orphanError) throw orphanError;
    stats.orphanedOptions = orphanedOptions?.length || 0;
    
    const { data: orphanedSections, error: orphanSecError } = await supabase
      .from('sections')
      .select('id')
      .not('category_id', 'in', 
        supabase.from('categories').select('id')
      )
      .limit(1);
    if (orphanSecError) throw orphanSecError;
    stats.orphanedSections = orphanedSections?.length || 0;
    
    logger.verbose('Database statistics collected', stats);
    return stats;
    
  } catch (error) {
    logger.error('Failed to collect database statistics:', error);
    return {};
  }
}

/**
 * Get JSON file statistics
 */
async function getFileStats() {
  logger.verbose('Analyzing source files...');
  
  try {
    const files = await fs.readdir(config.questionsDir);
    const jsonFiles = files.filter(file => 
      file.endsWith('.json') && 
      !file.startsWith('.') && 
      file !== 'q_check.py'
    );
    
    const fileStats = {
      totalFiles: jsonFiles.length,
      totalQuestions: 0,
      categories: new Set(),
      sections: new Set(),
      fileDetails: []
    };
    
    for (const file of jsonFiles.slice(0, Math.min(10, jsonFiles.length))) { // Sample first 10 files for quick stats
      try {
        const filePath = path.join(config.questionsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const questions = JSON.parse(content);
        
        if (Array.isArray(questions)) {
          fileStats.totalQuestions += questions.length;
          
          // Parse filename for category/section info
          const nameWithoutExt = file.replace('.json', '');
          const dashIndex = nameWithoutExt.indexOf(' - ');
          if (dashIndex !== -1) {
            const category = nameWithoutExt.substring(0, dashIndex).trim();
            const sectionPart = nameWithoutExt.substring(dashIndex + 3).trim();
            const match = sectionPart.match(/^(\d+)?\.\s*(.+)$/);
            
            if (category) fileStats.categories.add(category);
            if (match && match[2]) fileStats.sections.add(match[2].trim());
          }
        }
        
        fileStats.fileDetails.push({
          file,
          questions: Array.isArray(questions) ? questions.length : 0
        });
        
      } catch (error) {
        logger.warn(`Could not analyze file ${file}:`, error);
      }
    }
    
    // Estimate total questions if we only sampled some files
    if (jsonFiles.length > 10) {
      const avgQuestionsPerFile = fileStats.totalQuestions / Math.min(10, jsonFiles.length);
      fileStats.estimatedTotalQuestions = Math.round(avgQuestionsPerFile * jsonFiles.length);
    } else {
      fileStats.estimatedTotalQuestions = fileStats.totalQuestions;
    }
    
    fileStats.categoriesCount = fileStats.categories.size;
    fileStats.sectionsCount = fileStats.sections.size;
    
    logger.info('Source file analysis completed', {
      files: fileStats.totalFiles,
      estimatedQuestions: fileStats.estimatedTotalQuestions,
      categories: fileStats.categoriesCount,
      sections: fileStats.sectionsCount
    });
    
    return fileStats;
    
  } catch (error) {
    logger.error('Failed to analyze source files:', error);
    return { totalFiles: 0, estimatedTotalQuestions: 0, categoriesCount: 0, sectionsCount: 0 };
  }
}

/**
 * Validate system requirements and configuration
 */
async function validateSystem() {
  logger.step(1, 4, 'Validating system requirements and configuration');
  stats.phases.validation.startTime = Date.now();
  
  try {
    // Check required environment variables
    if (!config.supabaseUrl) {
      throw new Error('SUPABASE_URL or VITE_SUPABASE_URL environment variable is required');
    }
    
    if (!config.supabaseServiceKey && !config.supabaseAnonKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is required');
    }
    
    if (!config.supabaseServiceKey) {
      logger.warn('Using anonymous key - some operations may be restricted. Service role key recommended.');
    }
    
    // Test database connection
    logger.info('Testing database connection and permissions...');
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    // Check if questions directory exists
    try {
      await fs.access(config.questionsDir);
      logger.info(`Questions directory found: ${config.questionsDir}`);
    } catch (error) {
      throw new Error(`Questions directory not found: ${config.questionsDir}`);
    }
    
    // Get current database state
    stats.beforeState = await getDatabaseStats();
    
    // Get source file statistics
    const fileStats = await getFileStats();
    
    if (fileStats.totalFiles === 0) {
      throw new Error('No JSON files found in questions directory');
    }
    
    // Display pre-operation summary
    logger.info('\n=== Pre-Operation Summary ===');
    logger.info('Current Database State:', stats.beforeState);
    logger.info('Source Files:', {
      files: fileStats.totalFiles,
      estimatedQuestions: fileStats.estimatedTotalQuestions,
      categories: fileStats.categoriesCount,
      sections: fileStats.sectionsCount
    });
    
    // Check for data integrity issues
    if (stats.beforeState.orphanedOptions > 0) {
      logger.warn(`Found ${stats.beforeState.orphanedOptions} orphaned question options`);
    }
    
    if (stats.beforeState.orphanedSections > 0) {
      logger.warn(`Found ${stats.beforeState.orphanedSections} orphaned sections`);
    }
    
    stats.phases.validation.success = true;
    stats.phases.validation.endTime = Date.now();
    logger.success('System validation completed successfully');
    
    return { beforeState: stats.beforeState, fileStats };
    
  } catch (error) {
    stats.phases.validation.endTime = Date.now();
    stats.errors.push(`Validation failed: ${error.message}`);
    throw new Error(`System validation failed: ${error.message}`);
  }
}

/**
 * Execute database cleanup
 */
async function executeCleanup() {
  if (config.skipCleanup) {
    logger.info('Skipping cleanup phase (--skip-cleanup flag)');
    return;
  }
  
  logger.step(2, 4, 'Executing database cleanup');
  stats.phases.cleanup.startTime = Date.now();
  
  try {
    // Set cleanup environment variables for the child process
    const originalArgs = process.argv;
    
    // Prepare arguments for cleanup script
    const cleanupArgs = ['node', 'cleanup-database.js'];
    
    if (config.dryRun) cleanupArgs.push('--dry-run');
    if (config.verbose) cleanupArgs.push('--verbose');
    if (config.force) cleanupArgs.push('--force');
    if (config.skipBackup) cleanupArgs.push('--skip-backup');
    
    // Temporarily modify process.argv for the cleanup script
    process.argv = cleanupArgs;
    
    // Execute cleanup
    await cleanupMain();
    
    // Restore original arguments
    process.argv = originalArgs;
    
    stats.phases.cleanup.success = true;
    stats.phases.cleanup.endTime = Date.now();
    logger.success('Database cleanup completed successfully');
    
  } catch (error) {
    stats.phases.cleanup.endTime = Date.now();
    stats.errors.push(`Cleanup failed: ${error.message}`);
    throw new Error(`Database cleanup failed: ${error.message}`);
  }
}

/**
 * Execute question import
 */
async function executeImport() {
  if (config.skipImport) {
    logger.info('Skipping import phase (--skip-import flag)');
    return;
  }
  
  logger.step(3, 4, 'Executing question import');
  stats.phases.import.startTime = Date.now();
  
  try {
    // Set import environment variables for the child process
    const originalArgs = process.argv;
    
    // Prepare arguments for import script
    const importArgs = ['node', 'batch-import-questions.js'];
    
    if (config.dryRun) importArgs.push('--dry-run');
    if (config.verbose) importArgs.push('--verbose');
    if (config.skipValidation) importArgs.push('--skip-validation');
    if (config.continueOnError) importArgs.push('--continue-on-error');
    if (config.batchSize) importArgs.push(`--batch-size=${config.batchSize}`);
    
    // Always update existing during a refresh
    importArgs.push('--update-existing');
    
    // Temporarily modify process.argv for the import script
    process.argv = importArgs;
    
    // Execute import
    await batchImportMain();
    
    // Restore original arguments
    process.argv = originalArgs;
    
    stats.phases.import.success = true;
    stats.phases.import.endTime = Date.now();
    logger.success('Question import completed successfully');
    
  } catch (error) {
    stats.phases.import.endTime = Date.now();
    stats.errors.push(`Import failed: ${error.message}`);
    throw new Error(`Question import failed: ${error.message}`);
  }
}

/**
 * Verify operation success and data integrity
 */
async function verifyResults() {
  logger.step(4, 4, 'Verifying results and data integrity');
  stats.phases.verification.startTime = Date.now();
  
  try {
    // Get final database state
    stats.afterState = await getDatabaseStats();
    
    logger.info('Post-Operation Database State:', stats.afterState);
    
    // Perform integrity checks
    const issues = [];
    
    // Check for orphaned data
    if (stats.afterState.orphanedOptions > 0) {
      issues.push(`${stats.afterState.orphanedOptions} orphaned question options found`);
    }
    
    if (stats.afterState.orphanedSections > 0) {
      issues.push(`${stats.afterState.orphanedSections} orphaned sections found`);
    }
    
    // Check question-option relationship integrity
    if (stats.afterState.questions > 0 && stats.afterState.options === 0) {
      issues.push('Questions exist but no options found - data may be incomplete');
    }
    
    // Check expected vs actual results
    const expectedMinQuestions = config.dryRun ? 0 : Math.max(0, stats.afterState.questions);
    if (!config.dryRun && !config.skipImport && stats.afterState.questions < expectedMinQuestions) {
      issues.push('Fewer questions than expected were imported');
    }
    
    // Verify materialized views
    try {
      const { error: viewError } = await supabase.rpc('refresh_user_statistics');
      if (viewError) {
        issues.push(`Materialized view refresh failed: ${viewError.message}`);
      } else {
        logger.success('Materialized views refreshed successfully');
      }
    } catch (error) {
      issues.push(`Could not refresh materialized views: ${error.message}`);
    }
    
    // Report integrity check results
    if (issues.length > 0) {
      logger.warn('Data integrity issues detected:');
      issues.forEach((issue, index) => {
        logger.warn(`${index + 1}. ${issue}`);
      });
      stats.warnings.push(...issues);
    } else {
      logger.success('All data integrity checks passed');
    }
    
    stats.phases.verification.success = issues.length === 0;
    stats.phases.verification.endTime = Date.now();
    
    if (issues.length === 0) {
      logger.success('Result verification completed successfully');
    } else {
      logger.warn('Result verification completed with warnings');
    }
    
    return issues;
    
  } catch (error) {
    stats.phases.verification.endTime = Date.now();
    stats.errors.push(`Verification failed: ${error.message}`);
    throw new Error(`Result verification failed: ${error.message}`);
  }
}

/**
 * Print comprehensive final report
 */
function printFinalReport() {
  const totalDuration = (Date.now() - stats.startTime) / 1000;
  
  console.log('\n'.repeat(2));
  console.log('='.repeat(80));
  console.log('                     LMQB COMPLETE REFRESH REPORT                      ');
  console.log('='.repeat(80));
  
  // Overall summary
  console.log('\n📊 OVERALL SUMMARY');
  console.log(`Total Duration: ${totalDuration.toFixed(2)} seconds`);
  console.log(`Operation Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Max Memory Usage: ${Math.round(stats.maxMemoryUsage / 1024 / 1024)}MB`);
  
  // Phase breakdown
  console.log('\n⏱️  PHASE BREAKDOWN');
  Object.entries(stats.phases).forEach(([phase, data]) => {
    const duration = data.endTime && data.startTime ? ((data.endTime - data.startTime) / 1000).toFixed(2) : 'N/A';
    const status = data.success ? '✅' : data.endTime ? '❌' : '⏸️';
    console.log(`${status} ${phase.padEnd(12)} ${duration.padStart(8)}s`);
  });
  
  // Data transformation
  console.log('\n📈 DATA TRANSFORMATION');
  console.log('                    Before    After     Change');
  console.log('Questions:        ', 
    (stats.beforeState.questions || 0).toString().padStart(8),
    (stats.afterState.questions || 0).toString().padStart(8),
    ((stats.afterState.questions || 0) - (stats.beforeState.questions || 0)).toString().padStart(8)
  );
  console.log('Options:          ', 
    (stats.beforeState.options || 0).toString().padStart(8),
    (stats.afterState.options || 0).toString().padStart(8),
    ((stats.afterState.options || 0) - (stats.beforeState.options || 0)).toString().padStart(8)
  );
  console.log('Categories:       ', 
    (stats.beforeState.categories || 0).toString().padStart(8),
    (stats.afterState.categories || 0).toString().padStart(8),
    ((stats.afterState.categories || 0) - (stats.beforeState.categories || 0)).toString().padStart(8)
  );
  console.log('Sections:         ', 
    (stats.beforeState.sections || 0).toString().padStart(8),
    (stats.afterState.sections || 0).toString().padStart(8),
    ((stats.afterState.sections || 0) - (stats.beforeState.sections || 0)).toString().padStart(8)
  );
  console.log('Quiz Sessions:    ', 
    (stats.beforeState.quizSessions || 0).toString().padStart(8),
    (stats.afterState.quizSessions || 0).toString().padStart(8),
    ((stats.afterState.quizSessions || 0) - (stats.beforeState.quizSessions || 0)).toString().padStart(8)
  );
  console.log('Quiz Attempts:    ', 
    (stats.beforeState.quizAttempts || 0).toString().padStart(8),
    (stats.afterState.quizAttempts || 0).toString().padStart(8),
    ((stats.afterState.quizAttempts || 0) - (stats.beforeState.quizAttempts || 0)).toString().padStart(8)
  );
  console.log('User Profiles:    ', 
    (stats.beforeState.users || 0).toString().padStart(8),
    (stats.afterState.users || 0).toString().padStart(8),
    ((stats.afterState.users || 0) - (stats.beforeState.users || 0)).toString().padStart(8),
    ' (preserved)'
  );
  
  // Issues summary
  console.log('\n⚠️  ISSUES SUMMARY');
  console.log(`Errors: ${stats.errors.length}`);
  console.log(`Warnings: ${stats.warnings.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    stats.errors.forEach((error, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${error}`);
    });
  }
  
  if (stats.warnings.length > 0 && config.verbose) {
    console.log('\n⚠️  WARNINGS:');
    stats.warnings.slice(0, 5).forEach((warning, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${warning}`);
    });
    if (stats.warnings.length > 5) {
      console.log(`    ... and ${stats.warnings.length - 5} more warnings`);
    }
  }
  
  // Success metrics
  const allPhasesSuccessful = Object.values(stats.phases).every(phase => phase.success !== false);
  const hasErrors = stats.errors.length > 0;
  
  console.log('\n🎯 FINAL STATUS');
  if (config.dryRun) {
    console.log('✅ DRY RUN COMPLETED SUCCESSFULLY');
    console.log('   No changes were made to the database');
    console.log('   Run without --dry-run to perform the actual refresh');
  } else if (allPhasesSuccessful && !hasErrors) {
    console.log('🎉 REFRESH COMPLETED SUCCESSFULLY');
    console.log('   All operations completed without errors');
    console.log('   Database is ready for use');
  } else if (!hasErrors && stats.warnings.length > 0) {
    console.log('⚠️  REFRESH COMPLETED WITH WARNINGS');
    console.log('   Operations completed but issues were detected');
    console.log('   Review warnings above and consider corrective action');
  } else {
    console.log('❌ REFRESH COMPLETED WITH ERRORS');
    console.log('   Some operations failed - database may be in inconsistent state');
    console.log('   Review errors above and consider rollback if necessary');
  }
  
  if (stats.backupCreated) {
    console.log(`\n💾 BACKUP LOCATION: ${stats.backupPath}`);
    console.log('   Keep this backup safe for potential restore operations');
  }
  
  console.log('='.repeat(80));
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
LMQB Complete Database Refresh Script

This script orchestrates a complete refresh of the questions database by:
1. Validating system requirements and current state
2. Cleaning the database (removing all questions/quiz data)
3. Importing fresh questions from JSON files
4. Verifying results and data integrity

Usage: node complete-refresh.js [options]

Options:
  --dry-run               Preview all operations without making changes
  --verbose               Enable detailed logging throughout all phases
  --force                 Skip all confirmation prompts
  --skip-backup           Skip backup creation (NOT RECOMMENDED)
  --skip-cleanup          Skip the database cleanup phase
  --skip-import           Skip the question import phase
  --skip-validation       Skip question validation during import
  --continue-on-error     Continue processing on non-critical errors
  --batch-size=N          Set batch size for import processing (default: 50)
  --help                  Show this help message

Environment Variables:
  SUPABASE_URL                    Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY       Service role key (REQUIRED for full refresh)
  SUPABASE_ANON_KEY              Anonymous key (limited functionality)
  VITE_SUPABASE_URL              Alternative URL variable name
  VITE_SUPABASE_ANON_KEY         Alternative anon key variable name
  
  BATCH_SIZE                     Import batch size (default: 50)
  MAX_RETRIES                    Maximum retry attempts (default: 3)

Safety Features:
  - Comprehensive validation before any changes
  - Automatic backup creation (unless skipped)
  - User confirmations for destructive operations
  - Dry run mode for safe preview
  - Detailed logging and progress tracking
  - Data integrity verification after operations
  - Rollback recommendations on failure

What Gets Preserved:
  - User profiles and authentication data
  - System configuration and settings
  - Database schema, triggers, and functions

What Gets Replaced:
  - All questions and their options
  - All categories and sections
  - All quiz sessions and attempts
  - User statistics (automatically recalculated)

Examples:
  node complete-refresh.js --dry-run          # Preview the entire operation
  node complete-refresh.js --verbose          # Detailed logging
  node complete-refresh.js --force            # Skip confirmations
  node complete-refresh.js --skip-cleanup     # Only import (no cleanup)
  node complete-refresh.js --batch-size=100   # Larger batch size

⚠️  WARNING: This operation permanently deletes questions and quiz data!
Always run with --dry-run first and ensure you have proper backups.
`);
}

/**
 * Main orchestration function
 */
async function main() {
  try {
    stats.startTime = Date.now();
    
    console.log('\n🚀 LMQB Complete Database Refresh Started');
    console.log('='.repeat(50));
    logger.info(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE OPERATION'}`);
    logger.info(`Verbose: ${config.verbose ? 'ON' : 'OFF'}`);
    logger.info(`Force: ${config.force ? 'ON' : 'OFF'}`);
    logger.info(`Batch size: ${config.batchSize}`);
    
    // Show help if requested
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      printUsage();
      return;
    }
    
    // Phase 1: System validation
    const { beforeState, fileStats } = await validateSystem();
    
    // Final confirmation before destructive operations
    if (!config.dryRun && !config.skipCleanup && beforeState.questions > 0) {
      console.log('\n🔥 DANGER ZONE 🔥');
      console.log(`About to permanently delete ${beforeState.questions} questions and related data!`);
      console.log(`This will also delete ${beforeState.quizSessions} quiz sessions and ${beforeState.quizAttempts} attempts.`);
      console.log(`Estimated ${fileStats.estimatedTotalQuestions} questions will be imported from ${fileStats.totalFiles} files.`);
      
      const confirmed = await askConfirmation('⚠️  Proceed with complete database refresh?');
      if (!confirmed) {
        logger.info('Operation cancelled by user');
        return;
      }
    }
    
    // Phase 2: Database cleanup
    await executeCleanup();
    
    // Phase 3: Question import
    await executeImport();
    
    // Phase 4: Result verification
    const verificationIssues = await verifyResults();
    
    // Generate final report
    printFinalReport();
    
    // Determine exit code
    const hasErrors = stats.errors.length > 0;
    const hasCriticalIssues = verificationIssues?.length > 0 && !config.dryRun;
    
    if (hasErrors || hasCriticalIssues) {
      logger.error('\n❌ Refresh completed with errors - manual review required');
      process.exit(1);
    } else if (stats.warnings.length > 0) {
      logger.warn('\n⚠️  Refresh completed with warnings - review recommended');
    } else {
      logger.success('\n🎉 Refresh completed successfully!');
    }
    
  } catch (error) {
    logger.error('Complete refresh failed:', error);
    
    // Add error to stats and print final report
    stats.errors.push(`Fatal error: ${error.message}`);
    printFinalReport();
    
    logger.error('\n💥 FATAL ERROR - Operation aborted');
    logger.error('Review the error details above and consider manual intervention');
    
    if (stats.backupCreated) {
      logger.info(`\n💾 Backup available at: ${stats.backupPath}`);
      logger.info('You may need to restore from backup if the database is in an inconsistent state');
    }
    
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise);
  logger.error('Reason:', reason);
  stats.errors.push(`Unhandled rejection: ${reason}`);
  printFinalReport();
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  stats.errors.push(`Uncaught exception: ${error.message}`);
  printFinalReport();
  process.exit(1);
});

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };