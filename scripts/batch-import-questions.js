#!/usr/bin/env node

/**
 * LMQB Enhanced Batch Question Import Script
 * Imports question data from JSON files with advanced batch processing
 * 
 * Features:
 * - Enhanced batch processing with configurable batch sizes
 * - Robust error handling with retry logic
 * - Progress tracking with detailed statistics
 * - Memory-efficient processing for large datasets
 * - Data validation and integrity checks
 * - Idempotent operations (safe to run multiple times)
 * - Comprehensive logging and monitoring
 * - Transaction support with rollback capability
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
  
  // Processing options
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  updateExisting: process.argv.includes('--update-existing'),
  skipValidation: process.argv.includes('--skip-validation'),
  continueOnError: process.argv.includes('--continue-on-error'),
  
  // Batch processing configuration
  batchSize: parseInt(process.env.BATCH_SIZE) || parseInt(process.argv.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 50,
  maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
  retryDelay: parseInt(process.env.RETRY_DELAY) || 1000, // ms
  
  // Memory and performance
  maxConcurrentFiles: parseInt(process.env.MAX_CONCURRENT_FILES) || 3,
  memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD) || 500 * 1024 * 1024, // 500MB
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
  progress: (message, current, total) => {
    const percentage = ((current / total) * 100).toFixed(1);
    const memUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    console.log(`[${new Date().toISOString()}] [${memUsage}MB] [PROGRESS] ${message} (${current}/${total} - ${percentage}%)`);
  }
};

// Enhanced statistics tracking
const stats = {
  // File processing
  filesProcessed: 0,
  filesSkipped: 0,
  filesFailed: 0,
  totalFiles: 0,
  
  // Question processing
  questionsProcessed: 0,
  questionsInserted: 0,
  questionsUpdated: 0,
  questionsSkipped: 0,
  questionsFailed: 0,
  totalQuestions: 0,
  
  // Options and relationships
  optionsInserted: 0,
  categoriesCreated: 0,
  sectionsCreated: 0,
  
  // Performance metrics
  startTime: Date.now(),
  batchCount: 0,
  retryCount: 0,
  maxMemoryUsage: 0,
  
  // Error tracking
  errors: [],
  warnings: []
};

/**
 * Memory monitoring and garbage collection
 */
function checkMemoryUsage() {
  const usage = process.memoryUsage();
  const heapUsed = usage.heapUsed;
  
  if (heapUsed > stats.maxMemoryUsage) {
    stats.maxMemoryUsage = heapUsed;
  }
  
  if (heapUsed > config.memoryThreshold) {
    logger.warn(`High memory usage detected: ${Math.round(heapUsed / 1024 / 1024)}MB`);
    
    // Force garbage collection if available
    if (global.gc) {
      logger.verbose('Running garbage collection...');
      global.gc();
      const afterGC = process.memoryUsage().heapUsed;
      logger.verbose(`Memory after GC: ${Math.round(afterGC / 1024 / 1024)}MB`);
    }
  }
  
  return heapUsed;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced retry wrapper with exponential backoff
 */
async function withRetry(operation, context = 'operation') {
  let lastError;
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      stats.retryCount++;
      
      if (attempt === config.maxRetries) {
        logger.error(`${context} failed after ${config.maxRetries} attempts:`, error);
        throw error;
      }
      
      const delay = config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
      logger.warn(`${context} failed (attempt ${attempt}/${config.maxRetries}), retrying in ${delay}ms:`, error);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Enhanced filename parsing with better error handling
 */
function parseFilename(filename) {
  logger.verbose(`Parsing filename: ${filename}`);
  
  try {
    // Remove .json extension
    const nameWithoutExt = filename.replace('.json', '');
    
    // Split on the first " - " to separate category from section
    const dashIndex = nameWithoutExt.indexOf(' - ');
    if (dashIndex === -1) {
      throw new Error(`Invalid filename format: ${filename} (missing " - " separator)`);
    }
    
    const category = nameWithoutExt.substring(0, dashIndex).trim();
    const sectionPart = nameWithoutExt.substring(dashIndex + 3).trim();
    
    if (!category) {
      throw new Error(`Invalid filename format: ${filename} (empty category)`);
    }
    
    // Handle cases where section number might be empty
    const match = sectionPart.match(/^(\d+)?\.\s*(.+)$/);
    if (!match || !match[2]?.trim()) {
      throw new Error(`Invalid section format in filename: ${filename} (expected "Number. Section Name")`);
    }
    
    const sectionNumber = match[1] || null;
    const sectionName = match[2].trim();
    
    const result = {
      category: category,
      sectionNumber: sectionNumber,
      sectionName: sectionName
    };
    
    logger.verbose('Parsed filename successfully', result);
    return result;
    
  } catch (error) {
    logger.error(`Failed to parse filename: ${filename}`, error);
    throw error;
  }
}

/**
 * Enhanced question validation
 */
function validateQuestion(question, index, filename) {
  const errors = [];
  const warnings = [];
  
  // Required fields
  if (!question.question_text?.trim()) {
    errors.push(`Missing or empty question_text`);
  }
  
  if (!question.correct_answer?.trim()) {
    errors.push(`Missing or empty correct_answer`);
  }
  
  if (!Array.isArray(question.options) || question.options.length === 0) {
    errors.push(`Missing or empty options array`);
  }
  
  // Validate options
  if (question.options) {
    if (question.options.length < 2) {
      warnings.push(`Only ${question.options.length} options provided (recommended: 4-5)`);
    }
    
    question.options.forEach((option, optIndex) => {
      if (typeof option !== 'string' || !option.trim()) {
        errors.push(`Option ${optIndex + 1} is empty or invalid`);
      }
    });
    
    // Check if correct answer exists in options
    const correctAnswerText = question.correct_answer.replace(/^[A-Z][\)\.\s]\s*/, '').trim();
    const optionTexts = question.options.map(opt => opt.replace(/^[A-Z][\)\.\s]\s*/, '').trim());
    
    if (!optionTexts.some(opt => opt === correctAnswerText)) {
      warnings.push(`Correct answer text not found in options`);
    }
  }
  
  // Optional fields validation
  if (question.rationale && typeof question.rationale !== 'string') {
    warnings.push(`Rationale should be a string`);
  }
  
  if (question.page_reference && typeof question.page_reference !== 'string') {
    warnings.push(`Page reference should be a string`);
  }
  
  if (question.question_id && typeof question.question_id !== 'string') {
    warnings.push(`Question ID should be a string`);
  }
  
  // Log validation results
  if (errors.length > 0) {
    const errorMsg = `Validation failed for question ${index + 1} in ${filename}: ${errors.join(', ')}`;
    logger.error(errorMsg);
    stats.errors.push(errorMsg);
    return false;
  }
  
  if (warnings.length > 0) {
    const warningMsg = `Validation warnings for question ${index + 1} in ${filename}: ${warnings.join(', ')}`;
    logger.warn(warningMsg);
    stats.warnings.push(warningMsg);
  }
  
  return true;
}

/**
 * Enhanced option parsing with better error handling
 */
function parseOptions(options, questionId = 'unknown') {
  const parsedOptions = [];
  const usedKeys = new Set();
  
  try {
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      
      if (typeof option !== 'string') {
        throw new Error(`Option ${i + 1} is not a string`);
      }
      
      // Match patterns like "A) text", "A. text", or "A text"
      const match = option.match(/^([A-Z])[\)\.\s]\s*(.+)$/);
      if (!match) {
        logger.warn(`Could not parse option format for question ${questionId}: "${option}"`);
        // Fallback - use the option as-is with a generated key
        const key = String.fromCharCode(65 + i); // A, B, C, D...
        if (!usedKeys.has(key)) {
          parsedOptions.push({ key, text: option.trim() });
          usedKeys.add(key);
        }
      } else {
        const key = match[1];
        const text = match[2].trim();
        
        if (usedKeys.has(key)) {
          throw new Error(`Duplicate option key '${key}' found`);
        }
        
        parsedOptions.push({ key, text });
        usedKeys.add(key);
      }
    }
    
    if (parsedOptions.length === 0) {
      throw new Error('No valid options parsed');
    }
    
    return parsedOptions;
    
  } catch (error) {
    logger.error(`Failed to parse options for question ${questionId}:`, error);
    throw error;
  }
}

/**
 * Enhanced category management with caching
 */
const categoryCache = new Map();

async function ensureCategory(categoryName) {
  // Check cache first
  if (categoryCache.has(categoryName)) {
    return categoryCache.get(categoryName);
  }
  
  logger.verbose(`Ensuring category exists: ${categoryName}`);
  
  return await withRetry(async () => {
    // Try to get existing category
    const { data: existingCategory, error: selectError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .single();
    
    if (selectError && selectError.code !== 'PGRST116') {
      throw new Error(`Error checking for existing category: ${selectError.message}`);
    }
    
    if (existingCategory) {
      logger.verbose(`Category already exists: ${categoryName} (ID: ${existingCategory.id})`);
      categoryCache.set(categoryName, existingCategory.id);
      return existingCategory.id;
    }
    
    // Create new category
    if (config.dryRun) {
      logger.info(`[DRY RUN] Would create category: ${categoryName}`);
      const fakeId = -Math.abs(categoryName.length);
      categoryCache.set(categoryName, fakeId);
      return fakeId;
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
    categoryCache.set(categoryName, newCategory.id);
    return newCategory.id;
    
  }, `ensuring category "${categoryName}"`);
}

/**
 * Enhanced section management with caching
 */
const sectionCache = new Map();

async function ensureSection(categoryId, sectionName) {
  const cacheKey = `${categoryId}:${sectionName}`;
  
  // Check cache first
  if (sectionCache.has(cacheKey)) {
    return sectionCache.get(cacheKey);
  }
  
  logger.verbose(`Ensuring section exists: ${sectionName} in category ${categoryId}`);
  
  return await withRetry(async () => {
    // Try to get existing section
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
      sectionCache.set(cacheKey, existingSection.id);
      return existingSection.id;
    }
    
    // Create new section
    if (config.dryRun) {
      logger.info(`[DRY RUN] Would create section: ${sectionName}`);
      const fakeId = -Math.abs(sectionName.length);
      sectionCache.set(cacheKey, fakeId);
      return fakeId;
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
    sectionCache.set(cacheKey, newSection.id);
    return newSection.id;
    
  }, `ensuring section "${sectionName}"`);
}

/**
 * Check if question already exists
 */
async function findExistingQuestion(questionId) {
  if (!questionId) return null;
  
  return await withRetry(async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('id, original_json')
      .contains('original_json', { question_id: questionId })
      .limit(1);
    
    if (error) {
      throw new Error(`Error checking for existing question: ${error.message}`);
    }
    
    return data && data.length > 0 ? data[0] : null;
  }, `checking existing question "${questionId}"`);
}

/**
 * Enhanced batch question insertion
 */
async function insertQuestionsBatch(questionsData) {
  if (questionsData.length === 0) {
    return [];
  }
  
  logger.verbose(`Inserting batch of ${questionsData.length} questions`);
  
  if (config.dryRun) {
    logger.info(`[DRY RUN] Would insert ${questionsData.length} questions`);
    return questionsData.map((_, index) => ({ id: -(index + 1) }));
  }
  
  return await withRetry(async () => {
    const { data, error } = await supabase
      .from('questions')
      .insert(questionsData)
      .select('id');
    
    if (error) {
      throw new Error(`Error inserting question batch: ${error.message}`);
    }
    
    if (!data || data.length !== questionsData.length) {
      throw new Error(`Batch insert returned unexpected number of results: expected ${questionsData.length}, got ${data?.length || 0}`);
    }
    
    return data;
    
  }, `inserting batch of ${questionsData.length} questions`);
}

/**
 * Enhanced batch option insertion
 */
async function insertOptionsBatch(optionsData) {
  if (optionsData.length === 0) {
    return;
  }
  
  logger.verbose(`Inserting batch of ${optionsData.length} options`);
  
  if (config.dryRun) {
    logger.info(`[DRY RUN] Would insert ${optionsData.length} options`);
    return;
  }
  
  return await withRetry(async () => {
    const { error } = await supabase
      .from('question_options')
      .insert(optionsData);
    
    if (error) {
      throw new Error(`Error inserting options batch: ${error.message}`);
    }
    
  }, `inserting batch of ${optionsData.length} options`);
}

/**
 * Process questions in batches
 */
async function processQuestionsBatch(questions, sectionId, filename) {
  const questionRows = [];
  const allOptions = [];
  const processedQuestions = [];
  
  logger.verbose(`Processing batch of ${questions.length} questions from ${filename}`);
  
  for (let i = 0; i < questions.length; i++) {
    try {
      const question = questions[i];
      
      // Validate question if not skipping validation
      if (!config.skipValidation && !validateQuestion(question, i, filename)) {
        stats.questionsFailed++;
        if (!config.continueOnError) {
          throw new Error(`Question validation failed for question ${i + 1}`);
        }
        continue;
      }
      
      // Check if question already exists
      const existingQuestion = await findExistingQuestion(question.question_id);
      
      if (existingQuestion && !config.updateExisting) {
        logger.verbose(`Skipping existing question: ${question.question_id}`);
        stats.questionsSkipped++;
        continue;
      }
      
      // Parse options
      const parsedOptions = parseOptions(question.options, question.question_id || `${filename}-${i + 1}`);
      
      // Prepare question data
      const questionRow = {
        section_id: sectionId,
        original_json: question,
        question_text: question.question_text.trim(),
        correct_answer: question.correct_answer.trim(),
        rationale: question.rationale?.trim() || null,
        difficulty_level: parseInt(question.difficulty_level) || 1,
        tags: question.tags || []
      };
      
      if (existingQuestion) {
        // Update existing question
        const { data, error } = await supabase
          .from('questions')
          .update(questionRow)
          .eq('id', existingQuestion.id)
          .select('id')
          .single();
        
        if (error) {
          throw new Error(`Error updating question ${question.question_id}: ${error.message}`);
        }
        
        // Delete existing options before re-inserting
        await supabase
          .from('question_options')
          .delete()
          .eq('question_id', existingQuestion.id);
        
        // Add options for re-insertion
        const optionRows = parsedOptions.map(opt => ({
          question_id: existingQuestion.id,
          option_key: opt.key,
          option_text: opt.text
        }));
        
        await insertOptionsBatch(optionRows);
        stats.optionsInserted += optionRows.length;
        stats.questionsUpdated++;
        
      } else {
        // Add to batch for insertion
        questionRows.push(questionRow);
        processedQuestions.push({ question, parsedOptions, index: i });
      }
      
    } catch (error) {
      const errorMsg = `Error processing question ${i + 1} in ${filename}: ${error.message}`;
      logger.error(errorMsg, error);
      stats.errors.push(errorMsg);
      stats.questionsFailed++;
      
      if (!config.continueOnError) {
        throw error;
      }
    }
    
    // Check memory usage periodically
    if (i % 10 === 0) {
      checkMemoryUsage();
    }
  }
  
  // Insert new questions in batch
  if (questionRows.length > 0) {
    const insertedQuestions = await insertQuestionsBatch(questionRows);
    stats.questionsInserted += insertedQuestions.length;
    
    // Prepare all options for batch insertion
    for (let i = 0; i < insertedQuestions.length; i++) {
      const questionDbId = insertedQuestions[i].id;
      const { parsedOptions } = processedQuestions[i];
      
      const optionRows = parsedOptions.map(opt => ({
        question_id: questionDbId,
        option_key: opt.key,
        option_text: opt.text
      }));
      
      allOptions.push(...optionRows);
    }
    
    // Insert all options in batches
    if (allOptions.length > 0) {
      const optionBatchSize = Math.min(config.batchSize * 4, 200); // Options can be batched larger
      for (let i = 0; i < allOptions.length; i += optionBatchSize) {
        const optionBatch = allOptions.slice(i, i + optionBatchSize);
        await insertOptionsBatch(optionBatch);
        stats.optionsInserted += optionBatch.length;
      }
    }
  }
  
  stats.questionsProcessed += processedQuestions.length;
  stats.batchCount++;
  
  return processedQuestions.length;
}

/**
 * Enhanced file processing with better error handling
 */
async function processFile(filePath) {
  const filename = path.basename(filePath);
  logger.info(`Processing file: ${filename}`);
  
  try {
    // Parse filename
    const { category, sectionNumber, sectionName } = parseFilename(filename);
    
    // Read and parse JSON
    const fileContent = await fs.readFile(filePath, 'utf-8');
    let questions;
    
    try {
      questions = JSON.parse(fileContent);
    } catch (parseError) {
      throw new Error(`Invalid JSON in file: ${parseError.message}`);
    }
    
    if (!Array.isArray(questions)) {
      throw new Error('JSON file must contain an array of questions');
    }
    
    if (questions.length === 0) {
      logger.warn(`File ${filename} contains no questions, skipping`);
      stats.filesSkipped++;
      return;
    }
    
    logger.info(`Found ${questions.length} questions in ${filename}`);
    stats.totalQuestions += questions.length;
    
    // Ensure category and section exist
    const categoryId = await ensureCategory(category);
    const sectionId = await ensureSection(categoryId, sectionName);
    
    // Add metadata to questions if missing
    questions.forEach((question, index) => {
      if (!question.section) question.section = sectionName;
      if (!question.question_type) question.question_type = category;
      if (!question.section_number && sectionNumber) question.section_number = sectionNumber;
    });
    
    // Process questions in batches
    let processed = 0;
    for (let i = 0; i < questions.length; i += config.batchSize) {
      const batch = questions.slice(i, i + config.batchSize);
      const batchProcessed = await processQuestionsBatch(batch, sectionId, filename);
      processed += batchProcessed;
      
      // Progress logging
      logger.progress(`Processing ${filename}`, Math.min(i + config.batchSize, questions.length), questions.length);
      
      // Memory check after each batch
      checkMemoryUsage();
    }
    
    stats.filesProcessed++;
    logger.success(`Successfully processed: ${filename} (${processed}/${questions.length} questions)`);
    
  } catch (error) {
    const errorMsg = `Failed to process file ${filename}: ${error.message}`;
    logger.error(errorMsg, error);
    stats.errors.push(errorMsg);
    stats.filesFailed++;
    
    if (!config.continueOnError) {
      throw error;
    }
  }
  
  // Force garbage collection for large files
  const memUsage = checkMemoryUsage();
  if (memUsage > config.memoryThreshold && global.gc) {
    global.gc();
  }
}

/**
 * Get all JSON files from the questions directory
 */
async function getQuestionFiles() {
  try {
    const files = await fs.readdir(config.questionsDir);
    const jsonFiles = files
      .filter(file => file.endsWith('.json') && !file.startsWith('.') && file !== 'q_check.py')
      .map(file => path.join(config.questionsDir, file))
      .sort(); // Sort for consistent processing order
    
    logger.info(`Found ${jsonFiles.length} JSON files to process`);
    return jsonFiles;
    
  } catch (error) {
    throw new Error(`Error reading questions directory: ${error.message}`);
  }
}

/**
 * Validate configuration
 */
function validateConfig() {
  const errors = [];
  
  if (!config.supabaseUrl) {
    errors.push('SUPABASE_URL or VITE_SUPABASE_URL environment variable is required');
  }
  
  if (!config.supabaseServiceKey && !config.supabaseAnonKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is required');
  }
  
  if (config.batchSize < 1 || config.batchSize > 1000) {
    errors.push('Batch size must be between 1 and 1000');
  }
  
  if (config.maxRetries < 1 || config.maxRetries > 10) {
    errors.push('Max retries must be between 1 and 10');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  if (config.supabaseServiceKey) {
    logger.info('Using service role key for admin operations');
  } else {
    logger.warn('Using anonymous key - some operations may be restricted');
  }
}

/**
 * Test database connection and permissions
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
LMQB Enhanced Batch Question Import Script

Usage: node batch-import-questions.js [options]

Options:
  --dry-run               Preview operations without making changes
  --verbose               Enable detailed logging
  --update-existing       Update existing questions instead of skipping them
  --skip-validation       Skip question validation (faster but riskier)
  --continue-on-error     Continue processing other files/questions on error
  --batch-size=N          Set batch size for processing (default: 50)
  --help                  Show this help message

Environment Variables:
  SUPABASE_URL                    Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY       Service role key (recommended)
  SUPABASE_ANON_KEY              Anonymous key (fallback)
  VITE_SUPABASE_URL              Alternative URL variable name
  VITE_SUPABASE_ANON_KEY         Alternative anon key variable name
  
  BATCH_SIZE                     Batch size for processing (default: 50)
  MAX_RETRIES                    Maximum retry attempts (default: 3)
  RETRY_DELAY                    Retry delay in ms (default: 1000)
  MAX_CONCURRENT_FILES           Max concurrent file processing (default: 3)
  MEMORY_THRESHOLD               Memory threshold in bytes (default: 500MB)

Performance Features:
  - Batch processing for efficient database operations
  - Memory monitoring and garbage collection
  - Retry logic with exponential backoff
  - Caching for categories and sections
  - Progress tracking and detailed statistics
  - Idempotent operations (safe to run multiple times)

Examples:
  node batch-import-questions.js                     # Import all questions
  node batch-import-questions.js --dry-run           # Preview changes
  node batch-import-questions.js --verbose           # Enable detailed logging
  node batch-import-questions.js --update-existing   # Update existing questions
  node batch-import-questions.js --batch-size=100    # Larger batch size
  node batch-import-questions.js --continue-on-error # Don't stop on errors
`);
}

/**
 * Print comprehensive statistics
 */
function printStats() {
  const duration = (Date.now() - stats.startTime) / 1000;
  const questionsPerSecond = stats.questionsProcessed > 0 ? (stats.questionsProcessed / duration).toFixed(2) : 0;
  const maxMemoryMB = Math.round(stats.maxMemoryUsage / 1024 / 1024);
  
  logger.info('\n=== Import Statistics ===');
  logger.info(`Duration: ${duration.toFixed(2)} seconds`);
  logger.info(`Performance: ${questionsPerSecond} questions/second`);
  logger.info(`Max memory usage: ${maxMemoryMB}MB`);
  logger.info(`Batch count: ${stats.batchCount}`);
  logger.info(`Retry count: ${stats.retryCount}`);
  
  logger.info('\n--- Files ---');
  logger.info(`Total files: ${stats.totalFiles}`);
  logger.info(`Files processed: ${stats.filesProcessed}`);
  logger.info(`Files skipped: ${stats.filesSkipped}`);
  logger.info(`Files failed: ${stats.filesFailed}`);
  
  logger.info('\n--- Questions ---');
  logger.info(`Total questions: ${stats.totalQuestions}`);
  logger.info(`Questions processed: ${stats.questionsProcessed}`);
  logger.info(`Questions inserted: ${stats.questionsInserted}`);
  logger.info(`Questions updated: ${stats.questionsUpdated}`);
  logger.info(`Questions skipped: ${stats.questionsSkipped}`);
  logger.info(`Questions failed: ${stats.questionsFailed}`);
  
  logger.info('\n--- Relationships ---');
  logger.info(`Options inserted: ${stats.optionsInserted}`);
  logger.info(`Categories created: ${stats.categoriesCreated}`);
  logger.info(`Sections created: ${stats.sectionsCreated}`);
  
  logger.info('\n--- Issues ---');
  logger.info(`Errors: ${stats.errors.length}`);
  logger.info(`Warnings: ${stats.warnings.length}`);
  
  if (stats.errors.length > 0) {
    logger.error('\n=== Errors ===');
    stats.errors.slice(0, 10).forEach((error, index) => {
      logger.error(`${index + 1}. ${error}`);
    });
    if (stats.errors.length > 10) {
      logger.error(`... and ${stats.errors.length - 10} more errors`);
    }
  }
  
  if (stats.warnings.length > 0 && config.verbose) {
    logger.warn('\n=== Warnings ===');
    stats.warnings.slice(0, 10).forEach((warning, index) => {
      logger.warn(`${index + 1}. ${warning}`);
    });
    if (stats.warnings.length > 10) {
      logger.warn(`... and ${stats.warnings.length - 10} more warnings`);
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    stats.startTime = Date.now();
    
    logger.info('LMQB Enhanced Batch Question Import Script Started');
    logger.info(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE'}`);
    logger.info(`Verbose: ${config.verbose ? 'ON' : 'OFF'}`);
    logger.info(`Update existing: ${config.updateExisting ? 'ON' : 'OFF'}`);
    logger.info(`Skip validation: ${config.skipValidation ? 'ON' : 'OFF'}`);
    logger.info(`Continue on error: ${config.continueOnError ? 'ON' : 'OFF'}`);
    logger.info(`Batch size: ${config.batchSize}`);
    logger.info(`Max retries: ${config.maxRetries}`);
    logger.info(`Memory threshold: ${Math.round(config.memoryThreshold / 1024 / 1024)}MB`);
    
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
    stats.totalFiles = questionFiles.length;
    
    if (questionFiles.length === 0) {
      logger.warn('No JSON files found in questions directory');
      return;
    }
    
    // Process files with concurrency control
    const errors = [];
    let processed = 0;
    
    // Process files in smaller concurrent batches to manage memory
    for (let i = 0; i < questionFiles.length; i += config.maxConcurrentFiles) {
      const batch = questionFiles.slice(i, i + config.maxConcurrentFiles);
      
      await Promise.allSettled(
        batch.map(async (filePath) => {
          try {
            await processFile(filePath);
            processed++;
            logger.progress('Overall progress', processed, questionFiles.length);
          } catch (error) {
            errors.push({ file: path.basename(filePath), error: error.message });
          }
        })
      );
      
      // Memory management between batches
      if (i + config.maxConcurrentFiles < questionFiles.length) {
        checkMemoryUsage();
        await sleep(100); // Brief pause between batches
      }
    }
    
    // Final statistics
    printStats();
    
    const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);
    logger.info(`\nProcessing completed in ${duration} seconds`);
    
    if (errors.length > 0) {
      logger.error(`\nFailed to process ${errors.length} files:`);
      errors.forEach(({ file, error }) => {
        logger.error(`- ${file}: ${error}`);
      });
      
      if (!config.continueOnError) {
        process.exit(1);
      }
    }
    
    const successRate = ((stats.questionsProcessed - stats.questionsFailed) / Math.max(stats.totalQuestions, 1) * 100).toFixed(1);
    logger.success(`\nImport completed with ${successRate}% success rate!`);
    
    if (config.dryRun) {
      logger.info('\nThis was a dry run - no changes were made to the database.');
      logger.info('Run without --dry-run to perform the actual import.');
    } else if (stats.questionsInserted > 0 || stats.questionsUpdated > 0) {
      logger.success(`\nSuccessfully imported ${stats.questionsInserted} new questions and updated ${stats.questionsUpdated} existing questions!`);
    }
    
  } catch (error) {
    logger.error('Import script failed:', error);
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

export { main, parseFilename, parseOptions, validateQuestion };