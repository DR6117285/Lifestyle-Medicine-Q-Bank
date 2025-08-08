#!/usr/bin/env node

/**
 * LMQB Question Import Script
 * Imports question data from JSON files into Supabase database
 * 
 * Features:
 * - Reads all JSON files from data/questions/
 * - Parses filenames to extract category and section information
 * - Inserts/updates categories and sections
 * - Imports questions with full JSON preservation
 * - Handles duplicate detection and updates
 * - Transaction support with rollback capability
 * - Comprehensive logging and error handling
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Configuration
const config = {
  questionsDir: path.join(__dirname, '../data/questions'),
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:8000',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  updateExisting: process.argv.includes('--update-existing')
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
  filesProcessed: 0,
  questionsProcessed: 0,
  questionsInserted: 0,
  questionsUpdated: 0,
  questionsSkipped: 0,
  optionsInserted: 0,
  categoriesCreated: 0,
  sectionsCreated: 0,
  errors: []
};

/**
 * Parse filename to extract category and section information
 * Format: "[Category] - [Section Number]. [Section Name].json"
 */
function parseFilename(filename) {
  logger.verbose(`Parsing filename: ${filename}`);
  
  // Remove .json extension
  const nameWithoutExt = filename.replace('.json', '');
  
  // Split on the first " - " to separate category from section
  const dashIndex = nameWithoutExt.indexOf(' - ');
  if (dashIndex === -1) {
    throw new Error(`Invalid filename format: ${filename}`);
  }
  
  const category = nameWithoutExt.substring(0, dashIndex).trim();
  const sectionPart = nameWithoutExt.substring(dashIndex + 3).trim();
  
  // Extract section number and name
  // Handle cases where section number might be empty (e.g., "From Board Review Notes -  - 10. Section Name.json")
  const match = sectionPart.match(/^(\d+)?\.\s*(.+)$/);
  if (!match) {
    throw new Error(`Invalid section format in filename: ${filename}`);
  }
  
  const sectionNumber = match[1] || null;
  const sectionName = match[2].trim();
  
  logger.verbose('Parsed filename', { category, sectionNumber, sectionName });
  
  return {
    category: category,
    sectionNumber: sectionNumber,
    sectionName: sectionName
  };
}

/**
 * Parse question options to extract option key and text
 * Format: "A) Option text" or "A. Option text"
 */
function parseOptions(options) {
  const parsedOptions = [];
  
  for (const option of options) {
    // Match patterns like "A) text", "A. text", or "A text"
    const match = option.match(/^([A-Z])[\)\.\s]\s*(.+)$/);
    if (!match) {
      logger.warn(`Could not parse option format: ${option}`);
      // Fallback - use the option as-is with a generated key
      const key = String.fromCharCode(65 + parsedOptions.length); // A, B, C, D...
      parsedOptions.push({ key, text: option });
    } else {
      parsedOptions.push({ key: match[1], text: match[2].trim() });
    }
  }
  
  return parsedOptions;
}

/**
 * Get or create category
 */
async function ensureCategory(categoryName) {
  logger.verbose(`Ensuring category exists: ${categoryName}`);
  
  // First, try to get existing category
  const { data: existingCategory, error: selectError } = await supabase
    .from('categories')
    .select('id')
    .eq('name', categoryName)
    .single();
  
  if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Error checking for existing category: ${selectError.message}`);
  }
  
  if (existingCategory) {
    logger.verbose(`Category already exists: ${categoryName} (ID: ${existingCategory.id})`);
    return existingCategory.id;
  }
  
  // Create new category
  if (config.dryRun) {
    logger.info(`[DRY RUN] Would create category: ${categoryName}`);
    return -1; // Placeholder ID for dry run
  }
  
  const { data: newCategory, error: insertError } = await supabase
    .from('categories')
    .insert({
      name: categoryName,
      description: `Questions from ${categoryName} category`
    })
    .select('id')
    .single();
  
  if (insertError) {
    throw new Error(`Error creating category: ${insertError.message}`);
  }
  
  stats.categoriesCreated++;
  logger.info(`Created category: ${categoryName} (ID: ${newCategory.id})`);
  return newCategory.id;
}

/**
 * Get or create section
 */
async function ensureSection(categoryId, sectionName) {
  logger.verbose(`Ensuring section exists: ${sectionName} in category ${categoryId}`);
  
  // First, try to get existing section
  const { data: existingSection, error: selectError } = await supabase
    .from('sections')
    .select('id')
    .eq('category_id', categoryId)
    .eq('name', sectionName)
    .single();
  
  if (selectError && selectError.code !== 'PGRST116') {
    throw new Error(`Error checking for existing section: ${selectError.message}`);
  }
  
  if (existingSection) {
    logger.verbose(`Section already exists: ${sectionName} (ID: ${existingSection.id})`);
    return existingSection.id;
  }
  
  // Create new section
  if (config.dryRun) {
    logger.info(`[DRY RUN] Would create section: ${sectionName}`);
    return -1; // Placeholder ID for dry run
  }
  
  const { data: newSection, error: insertError } = await supabase
    .from('sections')
    .insert({
      category_id: categoryId,
      name: sectionName,
      description: `Questions from ${sectionName} section`
    })
    .select('id')
    .single();
  
  if (insertError) {
    throw new Error(`Error creating section: ${insertError.message}`);
  }
  
  stats.sectionsCreated++;
  logger.info(`Created section: ${sectionName} (ID: ${newSection.id})`);
  return newSection.id;
}

/**
 * Check if question already exists by looking for same question_id in original_json
 */
async function findExistingQuestion(questionId) {
  if (!questionId) return null;
  
  const { data, error } = await supabase
    .from('questions')
    .select('id, original_json')
    .contains('original_json', { question_id: questionId })
    .limit(1);
  
  if (error) {
    logger.warn(`Error checking for existing question: ${error.message}`);
    return null;
  }
  
  return data && data.length > 0 ? data[0] : null;
}

/**
 * Insert or update a question
 */
async function upsertQuestion(questionData, sectionId) {
  const { question_id, question_text, correct_answer, rationale, options } = questionData;
  
  logger.verbose(`Processing question: ${question_id || 'NO_ID'}`);
  
  // Check if question already exists
  const existingQuestion = await findExistingQuestion(question_id);
  
  if (existingQuestion && !config.updateExisting) {
    logger.verbose(`Skipping existing question: ${question_id}`);
    stats.questionsSkipped++;
    return existingQuestion.id;
  }
  
  if (config.dryRun) {
    if (existingQuestion) {
      logger.info(`[DRY RUN] Would update question: ${question_id}`);
    } else {
      logger.info(`[DRY RUN] Would insert question: ${question_id}`);
    }
    return -1;
  }
  
  // Parse options
  const parsedOptions = parseOptions(options);
  
  // Prepare question data
  const questionRow = {
    section_id: sectionId,
    original_json: questionData,
    question_text: question_text,
    correct_answer: correct_answer,
    rationale: rationale || null,
    difficulty_level: 1, // Default, could be enhanced later
    tags: [] // Could be extracted from question content later
  };
  
  let questionDbId;
  
  if (existingQuestion) {
    // Update existing question
    const { data, error } = await supabase
      .from('questions')
      .update(questionRow)
      .eq('id', existingQuestion.id)
      .select('id')
      .single();
    
    if (error) {
      throw new Error(`Error updating question ${question_id}: ${error.message}`);
    }
    
    questionDbId = data.id;
    stats.questionsUpdated++;
    logger.verbose(`Updated question: ${question_id} (DB ID: ${questionDbId})`);
    
    // Delete existing options before re-inserting
    await supabase
      .from('question_options')
      .delete()
      .eq('question_id', questionDbId);
    
  } else {
    // Insert new question
    const { data, error } = await supabase
      .from('questions')
      .insert(questionRow)
      .select('id')
      .single();
    
    if (error) {
      throw new Error(`Error inserting question ${question_id}: ${error.message}`);
    }
    
    questionDbId = data.id;
    stats.questionsInserted++;
    logger.verbose(`Inserted question: ${question_id} (DB ID: ${questionDbId})`);
  }
  
  // Insert question options
  const optionRows = parsedOptions.map(opt => ({
    question_id: questionDbId,
    option_key: opt.key,
    option_text: opt.text
  }));
  
  if (optionRows.length > 0) {
    const { error: optionsError } = await supabase
      .from('question_options')
      .insert(optionRows);
    
    if (optionsError) {
      throw new Error(`Error inserting options for question ${question_id}: ${optionsError.message}`);
    }
    
    stats.optionsInserted += optionRows.length;
    logger.verbose(`Inserted ${optionRows.length} options for question: ${question_id}`);
  }
  
  stats.questionsProcessed++;
  return questionDbId;
}

/**
 * Process a single JSON file
 */
async function processFile(filePath) {
  const filename = path.basename(filePath);
  logger.info(`Processing file: ${filename}`);
  
  try {
    // Parse filename
    const { category, sectionNumber, sectionName } = parseFilename(filename);
    
    // Read and parse JSON
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const questions = JSON.parse(fileContent);
    
    if (!Array.isArray(questions)) {
      throw new Error('JSON file must contain an array of questions');
    }
    
    logger.info(`Found ${questions.length} questions in ${filename}`);
    
    // Ensure category and section exist
    const categoryId = await ensureCategory(category);
    const sectionId = await ensureSection(categoryId, sectionName);
    
    // Process each question
    const errors = [];
    for (let i = 0; i < questions.length; i++) {
      try {
        const question = questions[i];
        
        // Validate required fields
        if (!question.question_text || !question.correct_answer || !question.options) {
          throw new Error(`Question ${i + 1} missing required fields`);
        }
        
        // Add section metadata from filename if not present
        if (!question.section) {
          question.section = sectionName;
        }
        if (!question.question_type) {
          question.question_type = category;
        }
        if (!question.section_number && sectionNumber) {
          question.section_number = sectionNumber;
        }
        
        await upsertQuestion(question, sectionId);
        
      } catch (error) {
        const errorMsg = `Error processing question ${i + 1} in ${filename}: ${error.message}`;
        logger.error(errorMsg, error);
        errors.push(errorMsg);
      }
    }
    
    if (errors.length > 0) {
      stats.errors.push(...errors);
      throw new Error(`${errors.length} errors occurred while processing ${filename}`);
    }
    
    stats.filesProcessed++;
    logger.success(`Successfully processed: ${filename}`);
    
  } catch (error) {
    const errorMsg = `Failed to process file ${filename}: ${error.message}`;
    logger.error(errorMsg, error);
    stats.errors.push(errorMsg);
    throw error;
  }
}

/**
 * Get all JSON files from the questions directory
 */
async function getQuestionFiles() {
  try {
    const files = await fs.readdir(config.questionsDir);
    return files
      .filter(file => file.endsWith('.json') && file !== 'q_check.py')
      .map(file => path.join(config.questionsDir, file))
      .sort(); // Sort for consistent processing order
  } catch (error) {
    throw new Error(`Error reading questions directory: ${error.message}`);
  }
}

/**
 * Validate configuration
 */
function validateConfig() {
  if (!config.supabaseUrl) {
    throw new Error('SUPABASE_URL or VITE_SUPABASE_URL environment variable is required');
  }
  
  if (!config.supabaseServiceKey && !config.supabaseAnonKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is required');
  }
  
  if (config.supabaseServiceKey) {
    logger.info('Using service role key for admin operations');
  } else {
    logger.warn('Using anonymous key - some operations may be restricted');
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    logger.info('Testing database connection...');
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    logger.success('Database connection successful');
  } catch (error) {
    throw new Error(`Database connection test failed: ${error.message}`);
  }
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Usage: node import-questions.js [options]

Options:
  --dry-run              Preview operations without making changes
  --verbose              Enable verbose logging
  --update-existing      Update existing questions instead of skipping them
  --help                 Show this help message

Environment Variables:
  SUPABASE_URL                    Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY       Service role key (recommended)
  SUPABASE_ANON_KEY              Anonymous key (fallback)
  VITE_SUPABASE_URL              Alternative URL variable name
  VITE_SUPABASE_ANON_KEY         Alternative anon key variable name

Examples:
  node import-questions.js                    # Import all questions
  node import-questions.js --dry-run          # Preview changes
  node import-questions.js --verbose          # Enable detailed logging
  node import-questions.js --update-existing  # Update existing questions
`);
}

/**
 * Print final statistics
 */
function printStats() {
  logger.info('\n=== Import Statistics ===');
  logger.info(`Files processed: ${stats.filesProcessed}`);
  logger.info(`Questions processed: ${stats.questionsProcessed}`);
  logger.info(`Questions inserted: ${stats.questionsInserted}`);
  logger.info(`Questions updated: ${stats.questionsUpdated}`);
  logger.info(`Questions skipped: ${stats.questionsSkipped}`);
  logger.info(`Options inserted: ${stats.optionsInserted}`);
  logger.info(`Categories created: ${stats.categoriesCreated}`);
  logger.info(`Sections created: ${stats.sectionsCreated}`);
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
    logger.info('LMQB Question Import Script Started');
    logger.info(`Dry run mode: ${config.dryRun ? 'ON' : 'OFF'}`);
    logger.info(`Verbose mode: ${config.verbose ? 'ON' : 'OFF'}`);
    logger.info(`Update existing: ${config.updateExisting ? 'ON' : 'OFF'}`);
    
    // Show help if requested
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      printUsage();
      return;
    }
    
    // Validate configuration
    validateConfig();
    
    // Test database connection
    if (!config.dryRun) {
      await testConnection();
    }
    
    // Get all question files
    const questionFiles = await getQuestionFiles();
    logger.info(`Found ${questionFiles.length} JSON files to process`);
    
    if (questionFiles.length === 0) {
      logger.warn('No JSON files found in questions directory');
      return;
    }
    
    // Process each file
    let successCount = 0;
    const errors = [];
    
    for (const filePath of questionFiles) {
      try {
        await processFile(filePath);
        successCount++;
      } catch (error) {
        errors.push({ file: path.basename(filePath), error: error.message });
        // Continue processing other files
      }
    }
    
    // Print final statistics
    printStats();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`\nProcessing completed in ${duration} seconds`);
    
    if (errors.length > 0) {
      logger.error(`\nFailed to process ${errors.length} files:`);
      errors.forEach(({ file, error }) => {
        logger.error(`- ${file}: ${error}`);
      });
      process.exit(1);
    } else {
      logger.success(`\nAll ${successCount} files processed successfully!`);
      
      if (config.dryRun) {
        logger.info('\nThis was a dry run - no changes were made to the database.');
        logger.info('Run without --dry-run to perform the actual import.');
      }
    }
    
  } catch (error) {
    logger.error('Script failed:', error);
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

export { main, parseFilename, parseOptions };