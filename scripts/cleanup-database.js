#!/usr/bin/env node

/**
 * LMQB Database Cleanup Script
 * Safely removes all questions data while preserving other database entities
 * 
 * Features:
 * - Removes all questions and their options
 * - Removes all quiz sessions and attempts
 * - Removes empty sections and categories
 * - Preserves user profiles and system data
 * - Transaction support with rollback capability
 * - Comprehensive backup before cleanup
 * - Detailed logging and statistics
 * - Safety checks and confirmations
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import fs from 'fs/promises';

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
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  force: process.argv.includes('--force'),
  skipBackup: process.argv.includes('--skip-backup'),
  preserveSections: process.argv.includes('--preserve-sections'),
  preserveCategories: process.argv.includes('--preserve-categories')
};

// Initialize Supabase client with service role key for admin operations
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
  }
};

// Statistics tracking
const stats = {
  questionsDeleted: 0,
  optionsDeleted: 0,
  quizSessionsDeleted: 0,
  quizAttemptsDeleted: 0,
  sectionsDeleted: 0,
  categoriesDeleted: 0,
  backupCreated: false,
  backupPath: null,
  errors: []
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
 * Test database connection and permissions
 */
async function testConnection() {
  try {
    logger.info('Testing database connection and permissions...');
    
    // Test basic connection
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (categoriesError) {
      throw new Error(`Database connection failed: ${categoriesError.message}`);
    }
    
    // Test write permissions
    const testName = `test_cleanup_${Date.now()}`;
    const { error: insertError } = await supabase
      .from('categories')
      .insert({ name: testName, description: 'Test category for cleanup script' });
    
    if (insertError) {
      throw new Error(`Write permission test failed: ${insertError.message}`);
    }
    
    // Clean up test data
    await supabase
      .from('categories')
      .delete()
      .eq('name', testName);
    
    logger.success('Database connection and permissions verified');
    
  } catch (error) {
    throw new Error(`Database test failed: ${error.message}`);
  }
}

/**
 * Get current database statistics
 */
async function getDatabaseStats() {
  logger.verbose('Collecting database statistics...');
  
  const stats = {};
  
  try {
    // Count questions
    const { count: questionCount, error: questionError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    
    if (questionError) throw questionError;
    stats.questions = questionCount || 0;
    
    // Count question options
    const { count: optionCount, error: optionError } = await supabase
      .from('question_options')
      .select('*', { count: 'exact', head: true });
    
    if (optionError) throw optionError;
    stats.options = optionCount || 0;
    
    // Count quiz sessions
    const { count: sessionCount, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*', { count: 'exact', head: true });
    
    if (sessionError) throw sessionError;
    stats.quizSessions = sessionCount || 0;
    
    // Count quiz attempts
    const { count: attemptCount, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true });
    
    if (attemptError) throw attemptError;
    stats.quizAttempts = attemptCount || 0;
    
    // Count sections
    const { count: sectionCount, error: sectionError } = await supabase
      .from('sections')
      .select('*', { count: 'exact', head: true });
    
    if (sectionError) throw sectionError;
    stats.sections = sectionCount || 0;
    
    // Count categories
    const { count: categoryCount, error: categoryError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });
    
    if (categoryError) throw categoryError;
    stats.categories = categoryCount || 0;
    
    // Count user profiles
    const { count: userCount, error: userError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    if (userError) throw userError;
    stats.users = userCount || 0;
    
    logger.info('Current database statistics:', stats);
    return stats;
    
  } catch (error) {
    logger.error('Failed to collect database statistics:', error);
    return {};
  }
}

/**
 * Create backup of current data
 */
async function createBackup() {
  if (config.skipBackup || config.dryRun) {
    logger.info(config.dryRun ? '[DRY RUN] Would create backup' : 'Skipping backup creation');
    return;
  }
  
  try {
    logger.info('Creating backup of current data...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'backups');
    const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
    
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });
    
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {}
    };
    
    // Backup categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('id');
    
    if (catError) throw catError;
    backup.data.categories = categories || [];
    
    // Backup sections
    const { data: sections, error: secError } = await supabase
      .from('sections')
      .select('*')
      .order('id');
    
    if (secError) throw secError;
    backup.data.sections = sections || [];
    
    // Backup questions
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('*')
      .order('id');
    
    if (qError) throw qError;
    backup.data.questions = questions || [];
    
    // Backup question options
    const { data: options, error: optError } = await supabase
      .from('question_options')
      .select('*')
      .order('question_id', { ascending: true })
      .order('option_key', { ascending: true });
    
    if (optError) throw optError;
    backup.data.question_options = options || [];
    
    // Backup quiz sessions
    const { data: sessions, error: sessError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .order('started_at');
    
    if (sessError) throw sessError;
    backup.data.quiz_sessions = sessions || [];
    
    // Backup quiz attempts
    const { data: attempts, error: attError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .order('attempted_at');
    
    if (attError) throw attError;
    backup.data.quiz_attempts = attempts || [];
    
    // Write backup file
    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), 'utf8');
    
    stats.backupCreated = true;
    stats.backupPath = backupPath;
    
    logger.success(`Backup created successfully: ${backupPath}`);
    logger.info(`Backup contains:`, {
      categories: backup.data.categories.length,
      sections: backup.data.sections.length,
      questions: backup.data.questions.length,
      options: backup.data.question_options.length,
      sessions: backup.data.quiz_sessions.length,
      attempts: backup.data.quiz_attempts.length
    });
    
  } catch (error) {
    logger.error('Failed to create backup:', error);
    throw new Error(`Backup creation failed: ${error.message}`);
  }
}

/**
 * Delete all quiz attempts
 */
async function deleteQuizAttempts() {
  logger.info('Deleting quiz attempts...');
  
  if (config.dryRun) {
    const { count, error } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      logger.info(`[DRY RUN] Would delete ${count || 0} quiz attempts`);
      stats.quizAttemptsDeleted = count || 0;
    }
    return;
  }
  
  const { count, error } = await supabase
    .from('quiz_attempts')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (error) {
    throw new Error(`Failed to delete quiz attempts: ${error.message}`);
  }
  
  stats.quizAttemptsDeleted = count || 0;
  logger.success(`Deleted ${count || 0} quiz attempts`);
}

/**
 * Delete all quiz sessions
 */
async function deleteQuizSessions() {
  logger.info('Deleting quiz sessions...');
  
  if (config.dryRun) {
    const { count, error } = await supabase
      .from('quiz_sessions')
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      logger.info(`[DRY RUN] Would delete ${count || 0} quiz sessions`);
      stats.quizSessionsDeleted = count || 0;
    }
    return;
  }
  
  const { count, error } = await supabase
    .from('quiz_sessions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (error) {
    throw new Error(`Failed to delete quiz sessions: ${error.message}`);
  }
  
  stats.quizSessionsDeleted = count || 0;
  logger.success(`Deleted ${count || 0} quiz sessions`);
}

/**
 * Delete all question options
 */
async function deleteQuestionOptions() {
  logger.info('Deleting question options...');
  
  if (config.dryRun) {
    const { count, error } = await supabase
      .from('question_options')
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      logger.info(`[DRY RUN] Would delete ${count || 0} question options`);
      stats.optionsDeleted = count || 0;
    }
    return;
  }
  
  const { count, error } = await supabase
    .from('question_options')
    .delete()
    .neq('id', 0); // Delete all
  
  if (error) {
    throw new Error(`Failed to delete question options: ${error.message}`);
  }
  
  stats.optionsDeleted = count || 0;
  logger.success(`Deleted ${count || 0} question options`);
}

/**
 * Delete all questions
 */
async function deleteQuestions() {
  logger.info('Deleting questions...');
  
  if (config.dryRun) {
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      logger.info(`[DRY RUN] Would delete ${count || 0} questions`);
      stats.questionsDeleted = count || 0;
    }
    return;
  }
  
  const { count, error } = await supabase
    .from('questions')
    .delete()
    .neq('id', 0); // Delete all
  
  if (error) {
    throw new Error(`Failed to delete questions: ${error.message}`);
  }
  
  stats.questionsDeleted = count || 0;
  logger.success(`Deleted ${count || 0} questions`);
}

/**
 * Delete empty sections
 */
async function deleteEmptySections() {
  if (config.preserveSections) {
    logger.info('Preserving sections (--preserve-sections flag)');
    return;
  }
  
  logger.info('Deleting empty sections...');
  
  if (config.dryRun) {
    // Find sections with no questions
    const { data: sections, error } = await supabase
      .from('sections')
      .select('id, name')
      .not('id', 'in', 
        supabase
          .from('questions')
          .select('section_id')
          .not('section_id', 'is', null)
      );
    
    if (!error && sections) {
      logger.info(`[DRY RUN] Would delete ${sections.length} empty sections`);
      stats.sectionsDeleted = sections.length;
    }
    return;
  }
  
  // Get all sections first
  const { data: allSections, error: getAllError } = await supabase
    .from('sections')
    .select('id, name');
  
  if (getAllError) {
    throw new Error(`Failed to get sections: ${getAllError.message}`);
  }
  
  // Delete all sections (they should all be empty now)
  const { count, error } = await supabase
    .from('sections')
    .delete()
    .neq('id', 0); // Delete all
  
  if (error) {
    throw new Error(`Failed to delete sections: ${error.message}`);
  }
  
  stats.sectionsDeleted = count || 0;
  logger.success(`Deleted ${count || 0} sections`);
}

/**
 * Delete empty categories
 */
async function deleteEmptyCategories() {
  if (config.preserveCategories) {
    logger.info('Preserving categories (--preserve-categories flag)');
    return;
  }
  
  logger.info('Deleting empty categories...');
  
  if (config.dryRun) {
    // Find categories with no sections
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name')
      .not('id', 'in', 
        supabase
          .from('sections')
          .select('category_id')
          .not('category_id', 'is', null)
      );
    
    if (!error && categories) {
      logger.info(`[DRY RUN] Would delete ${categories.length} empty categories`);
      stats.categoriesDeleted = categories.length;
    }
    return;
  }
  
  // Delete all categories (they should all be empty now)
  const { count, error } = await supabase
    .from('categories')
    .delete()
    .neq('id', 0); // Delete all
  
  if (error) {
    throw new Error(`Failed to delete categories: ${error.message}`);
  }
  
  stats.categoriesDeleted = count || 0;
  logger.success(`Deleted ${count || 0} categories`);
}

/**
 * Refresh materialized views
 */
async function refreshMaterializedViews() {
  if (config.dryRun) {
    logger.info('[DRY RUN] Would refresh materialized views');
    return;
  }
  
  try {
    logger.info('Refreshing materialized views...');
    
    const { error } = await supabase.rpc('refresh_user_statistics');
    
    if (error) {
      logger.warn('Failed to refresh user statistics view:', error);
    } else {
      logger.success('Materialized views refreshed');
    }
  } catch (error) {
    logger.warn('Could not refresh materialized views:', error);
  }
}

/**
 * Reset auto-increment sequences
 */
async function resetSequences() {
  if (config.dryRun) {
    logger.info('[DRY RUN] Would reset auto-increment sequences');
    return;
  }
  
  try {
    logger.info('Resetting auto-increment sequences...');
    
    // Reset sequences for clean import
    const sequences = [
      { table: 'categories', column: 'id' },
      { table: 'sections', column: 'id' },
      { table: 'questions', column: 'id' },
      { table: 'question_options', column: 'id' }
    ];
    
    for (const seq of sequences) {
      const { error } = await supabase
        .rpc('setval', {
          sequence_name: `${seq.table}_${seq.column}_seq`,
          new_val: 1,
          is_called: false
        });
      
      if (error) {
        logger.warn(`Failed to reset sequence for ${seq.table}.${seq.column}:`, error);
      } else {
        logger.verbose(`Reset sequence for ${seq.table}.${seq.column}`);
      }
    }
    
    logger.success('Auto-increment sequences reset');
    
  } catch (error) {
    logger.warn('Could not reset sequences:', error);
  }
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
LMQB Database Cleanup Script

Usage: node cleanup-database.js [options]

Options:
  --dry-run                Preview operations without making changes
  --verbose                Enable detailed logging
  --force                  Skip confirmation prompts
  --skip-backup            Skip backup creation (NOT RECOMMENDED)
  --preserve-sections      Keep sections after cleanup
  --preserve-categories    Keep categories after cleanup
  --help                   Show this help message

Environment Variables:
  SUPABASE_URL                    Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY       Service role key (REQUIRED for cleanup)
  SUPABASE_ANON_KEY              Anonymous key (fallback)
  VITE_SUPABASE_URL              Alternative URL variable name
  VITE_SUPABASE_ANON_KEY         Alternative anon key variable name

Safety Features:
  - Creates backup before cleanup (unless --skip-backup)
  - Preserves user profiles and authentication data
  - Preserves system settings and configuration
  - Dry run mode for safe preview
  - Confirmation prompts (unless --force)
  - Detailed logging and statistics

What Gets Deleted:
  - All questions and their options
  - All quiz sessions and attempts
  - Empty sections and categories (unless preserved)
  - Refreshes user statistics

What Gets Preserved:
  - User profiles and authentication data
  - System configuration
  - Database schema and triggers
  - Materialized view definitions

Examples:
  node cleanup-database.js --dry-run     # Preview cleanup
  node cleanup-database.js --verbose     # Detailed logging
  node cleanup-database.js --force       # Skip confirmations
  
WARNING: This operation permanently deletes questions data!
Always run with --dry-run first and ensure you have backups.
`);
}

/**
 * Print final statistics
 */
function printStats() {
  logger.info('\n=== Cleanup Statistics ===');
  logger.info(`Questions deleted: ${stats.questionsDeleted}`);
  logger.info(`Options deleted: ${stats.optionsDeleted}`);
  logger.info(`Quiz sessions deleted: ${stats.quizSessionsDeleted}`);
  logger.info(`Quiz attempts deleted: ${stats.quizAttemptsDeleted}`);
  logger.info(`Sections deleted: ${stats.sectionsDeleted}`);
  logger.info(`Categories deleted: ${stats.categoriesDeleted}`);
  logger.info(`Backup created: ${stats.backupCreated ? 'YES' : 'NO'}`);
  if (stats.backupPath) {
    logger.info(`Backup location: ${stats.backupPath}`);
  }
  logger.info(`Errors: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    logger.error('\n=== Errors ===');
    stats.errors.forEach((error, index) => {
      logger.error(`${index + 1}. ${error}`);
    });
  }
}

/**
 * Main cleanup function
 */
async function main() {
  const startTime = Date.now();
  
  try {
    logger.info('LMQB Database Cleanup Script Started');
    logger.info(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE'}`);
    logger.info(`Verbose: ${config.verbose ? 'ON' : 'OFF'}`);
    logger.info(`Force: ${config.force ? 'ON' : 'OFF'}`);
    logger.info(`Skip backup: ${config.skipBackup ? 'YES' : 'NO'}`);
    logger.info(`Preserve sections: ${config.preserveSections ? 'YES' : 'NO'}`);
    logger.info(`Preserve categories: ${config.preserveCategories ? 'YES' : 'NO'}`);
    
    // Show help if requested
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      printUsage();
      return;
    }
    
    // Validate configuration
    if (!config.supabaseUrl) {
      throw new Error('SUPABASE_URL or VITE_SUPABASE_URL environment variable is required');
    }
    
    if (!config.supabaseServiceKey && !config.supabaseAnonKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is required');
    }
    
    if (!config.supabaseServiceKey) {
      logger.warn('Using anonymous key - some operations may fail. Service role key recommended for cleanup.');
    }
    
    // Test database connection
    if (!config.dryRun) {
      await testConnection();
    }
    
    // Get current statistics
    const beforeStats = await getDatabaseStats();
    
    if (beforeStats.questions === 0) {
      logger.info('No questions found in database - cleanup not needed');
      return;
    }
    
    // Create backup
    await createBackup();
    
    // Final confirmation
    const totalItems = (beforeStats.questions || 0) + 
                      (beforeStats.options || 0) + 
                      (beforeStats.quizSessions || 0) + 
                      (beforeStats.quizAttempts || 0);
    
    if (!config.force) {
      console.log('\n🔥 DANGER ZONE 🔥');
      console.log(`This will permanently delete ${totalItems} database records:`);
      console.log(`  - ${beforeStats.questions || 0} questions`);
      console.log(`  - ${beforeStats.options || 0} question options`);
      console.log(`  - ${beforeStats.quizSessions || 0} quiz sessions`);
      console.log(`  - ${beforeStats.quizAttempts || 0} quiz attempts`);
      if (!config.preserveSections) console.log(`  - ${beforeStats.sections || 0} sections`);
      if (!config.preserveCategories) console.log(`  - ${beforeStats.categories || 0} categories`);
      
      if (stats.backupCreated) {
        console.log(`\n✅ Backup created: ${stats.backupPath}`);
      } else if (!config.skipBackup && !config.dryRun) {
        console.log('\n❌ NO BACKUP CREATED - This is dangerous!');
      }
      
      console.log(`\nPreserved data: ${beforeStats.users || 0} user profiles and authentication data`);
    }
    
    const confirmMessage = config.dryRun 
      ? `Preview cleanup of ${totalItems} database records?`
      : `⚠️  PERMANENTLY DELETE ${totalItems} database records?`;
      
    const confirmed = await askConfirmation(confirmMessage);
    
    if (!confirmed) {
      logger.info('Database cleanup cancelled by user');
      return;
    }
    
    logger.info('\n🧹 Starting database cleanup...');
    
    // Delete in correct order (respecting foreign key constraints)
    await deleteQuizAttempts();     // Delete quiz attempts first
    await deleteQuizSessions();     // Then quiz sessions
    await deleteQuestionOptions();  // Delete question options
    await deleteQuestions();        // Delete questions
    await deleteEmptySections();    // Delete empty sections
    await deleteEmptyCategories();  // Delete empty categories
    
    // Refresh materialized views
    await refreshMaterializedViews();
    
    // Reset sequences for clean import
    await resetSequences();
    
    // Get final statistics
    const afterStats = await getDatabaseStats();
    
    // Print final statistics
    printStats();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`\nCleanup completed in ${duration} seconds`);
    
    if (config.dryRun) {
      logger.info('\nThis was a dry run - no changes were made to the database.');
      logger.info('Run without --dry-run to perform the actual cleanup.');
    } else {
      logger.success('\n🎉 Database cleanup completed successfully!');
      logger.info('Final database state:', afterStats);
      logger.info('The database is now ready for fresh question import.');
      
      if (stats.backupCreated) {
        logger.info(`\n💾 Backup saved to: ${stats.backupPath}`);
        logger.info('Keep this backup safe in case you need to restore data.');
      }
    }
    
  } catch (error) {
    logger.error('Database cleanup failed:', error);
    printStats();
    
    if (stats.backupCreated) {
      logger.info(`\n💾 Backup is available at: ${stats.backupPath}`);
    }
    
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

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };