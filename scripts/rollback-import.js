#!/usr/bin/env node

/**
 * LMQB Question Import Rollback Script
 * Provides rollback functionality for question imports
 * 
 * Features:
 * - Remove questions imported after a specific timestamp
 * - Remove questions by category or section
 * - Remove questions with specific question_ids
 * - Dry run capability
 * - Comprehensive logging and confirmation prompts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:8000',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  force: process.argv.includes('--force') // Skip confirmation prompts
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

// Logging utility
const logger = {
  info: (message, data = null) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  warn: (message, data = null) => {
    console.warn(`[WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message, error = null) => {
    console.error(`[ERROR] ${message}`, error ? error.message || error : '');
    if (config.verbose && error?.stack) {
      console.error(error.stack);
    }
  },
  verbose: (message, data = null) => {
    if (config.verbose) {
      console.log(`[VERBOSE] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  success: (message, data = null) => {
    console.log(`[SUCCESS] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// Statistics tracking
const stats = {
  questionsDeleted: 0,
  optionsDeleted: 0,
  sectionsDeleted: 0,
  categoriesDeleted: 0,
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
 * Get questions by timestamp
 */
async function getQuestionsByTimestamp(afterDate) {
  logger.verbose(`Finding questions created after: ${afterDate}`);
  
  const { data, error } = await supabase
    .from('questions')
    .select(`
      id, 
      original_json, 
      question_text,
      created_at,
      sections!inner(id, name, categories!inner(id, name))
    `)
    .gt('created_at', afterDate)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error fetching questions by timestamp: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Get questions by category
 */
async function getQuestionsByCategory(categoryName) {
  logger.verbose(`Finding questions in category: ${categoryName}`);
  
  const { data, error } = await supabase
    .from('questions')
    .select(`
      id, 
      original_json, 
      question_text,
      created_at,
      sections!inner(id, name, categories!inner(id, name))
    `)
    .eq('sections.categories.name', categoryName)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error fetching questions by category: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Get questions by section
 */
async function getQuestionsBySection(sectionName, categoryName = null) {
  logger.verbose(`Finding questions in section: ${sectionName}${categoryName ? ` (category: ${categoryName})` : ''}`);
  
  let query = supabase
    .from('questions')
    .select(`
      id, 
      original_json, 
      question_text,
      created_at,
      sections!inner(id, name, categories!inner(id, name))
    `)
    .eq('sections.name', sectionName);
  
  if (categoryName) {
    query = query.eq('sections.categories.name', categoryName);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error fetching questions by section: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Get questions by question IDs
 */
async function getQuestionsByIds(questionIds) {
  logger.verbose(`Finding questions with IDs: ${questionIds.join(', ')}`);
  
  const conditions = questionIds.map(id => `original_json @> '{"question_id": "${id}"}'`);
  const whereClause = conditions.join(' OR ');
  
  const { data, error } = await supabase
    .from('questions')
    .select(`
      id, 
      original_json, 
      question_text,
      created_at,
      sections(id, name, categories(id, name))
    `)
    .or(whereClause)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error fetching questions by IDs: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Delete questions and their options
 */
async function deleteQuestions(questionIds) {
  if (questionIds.length === 0) {
    logger.warn('No questions to delete');
    return;
  }
  
  logger.info(`Deleting ${questionIds.length} questions and their options...`);
  
  if (config.dryRun) {
    logger.info(`[DRY RUN] Would delete ${questionIds.length} questions`);
    stats.questionsDeleted = questionIds.length;
    return;
  }
  
  // Delete options first (due to foreign key constraint)
  const { error: optionsError } = await supabase
    .from('question_options')
    .delete()
    .in('question_id', questionIds);
  
  if (optionsError) {
    throw new Error(`Error deleting question options: ${optionsError.message}`);
  }
  
  // Count deleted options
  const { count: optionsCount, error: optionsCountError } = await supabase
    .from('question_options')
    .select('*', { count: 'exact', head: true })
    .in('question_id', questionIds);
  
  if (optionsCountError) {
    logger.warn('Could not count deleted options:', optionsCountError.message);
  } else {
    stats.optionsDeleted = optionsCount || 0;
  }
  
  // Delete questions
  const { error: questionsError } = await supabase
    .from('questions')
    .delete()
    .in('id', questionIds);
  
  if (questionsError) {
    throw new Error(`Error deleting questions: ${questionsError.message}`);
  }
  
  stats.questionsDeleted = questionIds.length;
  logger.success(`Deleted ${questionIds.length} questions and their options`);
}

/**
 * Clean up empty sections and categories
 */
async function cleanupEmptyEntities() {
  logger.info('Cleaning up empty sections and categories...');
  
  if (config.dryRun) {
    logger.info('[DRY RUN] Would clean up empty sections and categories');
    return;
  }
  
  // Find and delete empty sections
  const { data: emptySections, error: sectionsError } = await supabase
    .from('sections')
    .select('id, name')
    .not('id', 'in', 
      supabase
        .from('questions')
        .select('section_id')
        .not('section_id', 'is', null)
    );
  
  if (sectionsError) {
    logger.warn('Could not find empty sections:', sectionsError.message);
  } else if (emptySections && emptySections.length > 0) {
    const sectionIds = emptySections.map(s => s.id);
    
    const { error: deleteSectionsError } = await supabase
      .from('sections')
      .delete()
      .in('id', sectionIds);
    
    if (deleteSectionsError) {
      logger.warn('Could not delete empty sections:', deleteSectionsError.message);
    } else {
      stats.sectionsDeleted = emptySections.length;
      logger.success(`Deleted ${emptySections.length} empty sections`);
    }
  }
  
  // Find and delete empty categories
  const { data: emptyCategories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name')
    .not('id', 'in', 
      supabase
        .from('sections')
        .select('category_id')
        .not('category_id', 'is', null)
    );
  
  if (categoriesError) {
    logger.warn('Could not find empty categories:', categoriesError.message);
  } else if (emptyCategories && emptyCategories.length > 0) {
    const categoryIds = emptyCategories.map(c => c.id);
    
    const { error: deleteCategoriesError } = await supabase
      .from('categories')
      .delete()
      .in('id', categoryIds);
    
    if (deleteCategoriesError) {
      logger.warn('Could not delete empty categories:', deleteCategoriesError.message);
    } else {
      stats.categoriesDeleted = emptyCategories.length;
      logger.success(`Deleted ${emptyCategories.length} empty categories`);
    }
  }
}

/**
 * Display questions summary
 */
function displayQuestionsSummary(questions) {
  if (questions.length === 0) {
    logger.info('No questions found matching the criteria');
    return;
  }
  
  logger.info(`Found ${questions.length} questions to delete:`);
  
  // Group by category and section
  const grouped = {};
  
  questions.forEach(q => {
    const category = q.sections?.categories?.name || 'Unknown Category';
    const section = q.sections?.name || 'Unknown Section';
    const questionId = q.original_json?.question_id || 'NO_ID';
    
    if (!grouped[category]) {
      grouped[category] = {};
    }
    
    if (!grouped[category][section]) {
      grouped[category][section] = [];
    }
    
    grouped[category][section].push({
      id: q.id,
      questionId,
      text: q.question_text.substring(0, 80) + (q.question_text.length > 80 ? '...' : ''),
      created: q.created_at
    });
  });
  
  // Display grouped summary
  for (const [category, sections] of Object.entries(grouped)) {
    console.log(`\n📂 ${category}`);
    
    for (const [section, questionList] of Object.entries(sections)) {
      console.log(`  📄 ${section} (${questionList.length} questions)`);
      
      if (config.verbose) {
        questionList.forEach(q => {
          console.log(`    - ${q.questionId}: ${q.text}`);
          console.log(`      Created: ${q.created}`);
        });
      }
    }
  }
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Usage: node rollback-import.js <command> [options] [arguments]

Commands:
  timestamp <ISO-date>    Delete questions created after the specified date
                         Example: 2024-01-15T10:30:00Z
  
  category <name>         Delete all questions in the specified category
                         Example: "General"
  
  section <name> [cat]    Delete questions in the specified section
                         Optional category filter
                         Example: "Introduction to Lifestyle Medicine" "General"
  
  ids <id1,id2,id3>      Delete questions with specific question_ids
                         Comma-separated list
                         Example: "00001,00002,00003"

Options:
  --dry-run              Preview deletions without making changes
  --verbose              Enable detailed logging
  --force                Skip confirmation prompts
  --help                 Show this help message

Examples:
  node rollback-import.js timestamp 2024-01-15T10:30:00Z --dry-run
  node rollback-import.js category "General" --verbose
  node rollback-import.js section "Introduction" --force
  node rollback-import.js ids "00001,00002" --dry-run

Environment Variables:
  Same as import-questions.js:
  - SUPABASE_URL / VITE_SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY (recommended)
  - SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY
`);
}

/**
 * Print final statistics
 */
function printStats() {
  logger.info('\n=== Rollback Statistics ===');
  logger.info(`Questions deleted: ${stats.questionsDeleted}`);
  logger.info(`Options deleted: ${stats.optionsDeleted}`);
  logger.info(`Sections deleted: ${stats.sectionsDeleted}`);
  logger.info(`Categories deleted: ${stats.categoriesDeleted}`);
  logger.info(`Errors: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    logger.error('\n=== Errors ===');
    stats.errors.forEach((error, index) => {
      logger.error(`${index + 1}. ${error}`);
    });
  }
}

/**
 * Main function
 */
async function main() {
  const startTime = Date.now();
  
  try {
    logger.info('LMQB Question Import Rollback Script Started');
    logger.info(`Dry run mode: ${config.dryRun ? 'ON' : 'OFF'}`);
    logger.info(`Verbose mode: ${config.verbose ? 'ON' : 'OFF'}`);
    logger.info(`Force mode: ${config.force ? 'ON' : 'OFF'}`);
    
    const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
    
    if (args.length === 0 || args[0] === 'help' || process.argv.includes('--help')) {
      printUsage();
      return;
    }
    
    const command = args[0];
    let questions = [];
    
    // Execute based on command
    switch (command) {
      case 'timestamp':
        if (args.length < 2) {
          throw new Error('Timestamp command requires a date argument');
        }
        const date = new Date(args[1]);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format. Use ISO format like: 2024-01-15T10:30:00Z');
        }
        questions = await getQuestionsByTimestamp(date.toISOString());
        break;
        
      case 'category':
        if (args.length < 2) {
          throw new Error('Category command requires a category name argument');
        }
        questions = await getQuestionsByCategory(args[1]);
        break;
        
      case 'section':
        if (args.length < 2) {
          throw new Error('Section command requires a section name argument');
        }
        const sectionName = args[1];
        const categoryName = args[2] || null;
        questions = await getQuestionsBySection(sectionName, categoryName);
        break;
        
      case 'ids':
        if (args.length < 2) {
          throw new Error('IDs command requires a comma-separated list of question IDs');
        }
        const questionIds = args[1].split(',').map(id => id.trim()).filter(id => id);
        if (questionIds.length === 0) {
          throw new Error('No valid question IDs provided');
        }
        questions = await getQuestionsByIds(questionIds);
        break;
        
      default:
        throw new Error(`Unknown command: ${command}. Use --help for usage information.`);
    }
    
    // Display summary
    displayQuestionsSummary(questions);
    
    if (questions.length === 0) {
      logger.info('No questions to delete. Exiting.');
      return;
    }
    
    // Confirm deletion
    const confirmMessage = config.dryRun 
      ? `Preview deletion of ${questions.length} questions?`
      : `⚠️  PERMANENTLY DELETE ${questions.length} questions?`;
      
    const confirmed = await askConfirmation(confirmMessage);
    
    if (!confirmed) {
      logger.info('Rollback cancelled by user');
      return;
    }
    
    // Perform deletion
    const questionIds = questions.map(q => q.id);
    await deleteQuestions(questionIds);
    
    // Clean up empty entities
    if (!config.dryRun) {
      const cleanupConfirmed = await askConfirmation('Clean up empty sections and categories?');
      if (cleanupConfirmed) {
        await cleanupEmptyEntities();
      }
    }
    
    // Print statistics
    printStats();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`\nRollback completed in ${duration} seconds`);
    
    if (config.dryRun) {
      logger.info('\nThis was a dry run - no changes were made to the database.');
      logger.info('Run without --dry-run to perform the actual rollback.');
    } else if (stats.questionsDeleted > 0) {
      logger.success(`\nSuccessfully deleted ${stats.questionsDeleted} questions!`);
    }
    
  } catch (error) {
    logger.error('Rollback script failed:', error);
    printStats();
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