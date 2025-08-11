#!/usr/bin/env node

/**
 * LMQB Database Integrity Validation Script
 * Comprehensive validation of database integrity and question data quality
 * 
 * Features:
 * - Database schema validation
 * - Data consistency checks
 * - Question content validation
 * - Relationship integrity verification
 * - Performance analysis
 * - Data quality metrics
 * - Detailed reporting with recommendations
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
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
  
  // Validation options
  verbose: process.argv.includes('--verbose'),
  detailed: process.argv.includes('--detailed'),
  fixIssues: process.argv.includes('--fix-issues'),
  exportReport: process.argv.includes('--export-report'),
  
  // Validation thresholds
  maxDuplicateQuestions: 0,
  minOptionsPerQuestion: 2,
  maxOptionsPerQuestion: 8,
  minQuestionLength: 10,
  maxQuestionLength: 2000,
  minOptionLength: 1,
  maxOptionLength: 500,
  minRationaleLength: 10
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

// Validation results tracking
const validation = {
  startTime: Date.now(),
  checks: {
    schema: { passed: 0, failed: 0, issues: [] },
    relationships: { passed: 0, failed: 0, issues: [] },
    questions: { passed: 0, failed: 0, issues: [] },
    options: { passed: 0, failed: 0, issues: [] },
    categories: { passed: 0, failed: 0, issues: [] },
    sections: { passed: 0, failed: 0, issues: [] },
    performance: { passed: 0, failed: 0, issues: [] },
    duplicates: { passed: 0, failed: 0, issues: [] }
  },
  stats: {
    totalQuestions: 0,
    totalOptions: 0,
    totalCategories: 0,
    totalSections: 0,
    avgOptionsPerQuestion: 0,
    avgQuestionLength: 0,
    avgRationaleLength: 0
  },
  recommendations: [],
  fixedIssues: []
};

/**
 * Add validation issue
 */
function addIssue(category, severity, message, details = null, fixable = false) {
  const issue = {
    severity,
    message,
    details,
    fixable,
    timestamp: new Date().toISOString()
  };
  
  validation.checks[category].issues.push(issue);
  
  if (severity === 'error') {
    validation.checks[category].failed++;
  } else {
    validation.checks[category].passed++;
  }
  
  const logLevel = severity === 'error' ? 'error' : 'warn';
  logger[logLevel](`[${category.toUpperCase()}] ${message}`, details);
}

/**
 * Add recommendation
 */
function addRecommendation(message, action, priority = 'medium') {
  validation.recommendations.push({
    message,
    action,
    priority,
    category: 'general'
  });
}

/**
 * Validate database schema
 */
async function validateSchema() {
  logger.info('Validating database schema...');
  
  try {
    // Check if all required tables exist
    const requiredTables = [
      'categories', 'sections', 'questions', 'question_options',
      'user_profiles', 'quiz_sessions', 'quiz_attempts'
    ];
    
    for (const table of requiredTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          addIssue('schema', 'error', `Table '${table}' is missing or inaccessible`, error.message);
        } else {
          logger.verbose(`Table '${table}' exists and is accessible`);
        }
      } catch (error) {
        addIssue('schema', 'error', `Error checking table '${table}'`, error.message);
      }
    }
    
    // Check materialized views
    try {
      const { data, error } = await supabase
        .from('user_statistics')
        .select('*')
        .limit(1);
      
      if (error) {
        addIssue('schema', 'warning', 'User statistics materialized view is not accessible', error.message);
        addRecommendation(
          'Refresh user statistics materialized view',
          'Run: SELECT refresh_user_statistics();',
          'low'
        );
      } else {
        logger.verbose('User statistics materialized view is accessible');
      }
    } catch (error) {
      addIssue('schema', 'warning', 'Could not check user statistics view', error.message);
    }
    
    logger.success('Schema validation completed');
    
  } catch (error) {
    addIssue('schema', 'error', 'Schema validation failed', error.message);
  }
}

/**
 * Validate data relationships and referential integrity
 */
async function validateRelationships() {
  logger.info('Validating data relationships...');
  
  try {
    // Check for orphaned question options
    const { data: orphanedOptions, error: orphanError } = await supabase
      .rpc('find_orphaned_options')
      .catch(async () => {
        // Fallback query if RPC doesn't exist
        return await supabase
          .from('question_options')
          .select('id, question_id')
          .not('question_id', 'in', 
            supabase.from('questions').select('id')
          );
      });
    
    if (orphanError) {
      addIssue('relationships', 'warning', 'Could not check for orphaned options', orphanError.message);
    } else if (orphanedOptions?.length > 0) {
      addIssue('relationships', 'error', 
        `Found ${orphanedOptions.length} orphaned question options`,
        orphanedOptions.slice(0, 5),
        true
      );
    } else {
      logger.verbose('No orphaned question options found');
    }
    
    // Check for orphaned sections
    const { data: orphanedSections, error: sectionError } = await supabase
      .from('sections')
      .select('id, name, category_id')
      .not('category_id', 'in', 
        supabase.from('categories').select('id')
      );
    
    if (sectionError) {
      addIssue('relationships', 'warning', 'Could not check for orphaned sections', sectionError.message);
    } else if (orphanedSections?.length > 0) {
      addIssue('relationships', 'error',
        `Found ${orphanedSections.length} orphaned sections`,
        orphanedSections.slice(0, 5),
        true
      );
    } else {
      logger.verbose('No orphaned sections found');
    }
    
    // Check for questions without sections
    const { data: questionsWithoutSections, error: qwosError } = await supabase
      .from('questions')
      .select('id, question_text')
      .is('section_id', null)
      .limit(10);
    
    if (qwosError) {
      addIssue('relationships', 'warning', 'Could not check for questions without sections', qwosError.message);
    } else if (questionsWithoutSections?.length > 0) {
      addIssue('relationships', 'warning',
        `Found ${questionsWithoutSections.length} questions without sections`,
        questionsWithoutSections,
        false
      );
    } else {
      logger.verbose('All questions have valid section assignments');
    }
    
    // Check for questions without options
    const { data: questionsWithoutOptions, error: qwoError } = await supabase
      .from('questions')
      .select('id, question_text')
      .not('id', 'in', 
        supabase.from('question_options').select('question_id')
      )
      .limit(10);
    
    if (qwoError) {
      addIssue('relationships', 'warning', 'Could not check for questions without options', qwoError.message);
    } else if (questionsWithoutOptions?.length > 0) {
      addIssue('relationships', 'error',
        `Found ${questionsWithoutOptions.length} questions without options`,
        questionsWithoutOptions,
        false
      );
    } else {
      logger.verbose('All questions have associated options');
    }
    
    logger.success('Relationship validation completed');
    
  } catch (error) {
    addIssue('relationships', 'error', 'Relationship validation failed', error.message);
  }
}

/**
 * Validate question content quality
 */
async function validateQuestions() {
  logger.info('Validating question content...');
  
  try {
    // Get all questions with their options
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        question_text,
        correct_answer,
        rationale,
        original_json,
        question_options (
          option_key,
          option_text
        )
      `);
    
    if (questionsError) {
      addIssue('questions', 'error', 'Could not retrieve questions for validation', questionsError.message);
      return;
    }
    
    validation.stats.totalQuestions = questions?.length || 0;
    
    if (!questions || questions.length === 0) {
      addIssue('questions', 'warning', 'No questions found in database');
      return;
    }
    
    let totalQuestionLength = 0;
    let totalRationaleLength = 0;
    let questionsWithRationale = 0;
    
    for (const question of questions) {
      const questionId = question.original_json?.question_id || question.id;
      
      // Validate question text length
      const questionLength = question.question_text?.length || 0;
      totalQuestionLength += questionLength;
      
      if (questionLength < config.minQuestionLength) {
        addIssue('questions', 'warning',
          `Question text too short (${questionLength} chars)`,
          { id: questionId, text: question.question_text?.substring(0, 50) + '...' }
        );
      } else if (questionLength > config.maxQuestionLength) {
        addIssue('questions', 'warning',
          `Question text too long (${questionLength} chars)`,
          { id: questionId, text: question.question_text?.substring(0, 50) + '...' }
        );
      }
      
      // Validate question text content
      if (!question.question_text || question.question_text.trim().length === 0) {
        addIssue('questions', 'error',
          'Question has empty text',
          { id: questionId },
          false
        );
      }
      
      // Validate correct answer
      if (!question.correct_answer || question.correct_answer.trim().length === 0) {
        addIssue('questions', 'error',
          'Question has empty correct answer',
          { id: questionId },
          false
        );
      }
      
      // Validate rationale
      if (question.rationale) {
        const rationaleLength = question.rationale.length;
        totalRationaleLength += rationaleLength;
        questionsWithRationale++;
        
        if (rationaleLength < config.minRationaleLength) {
          addIssue('questions', 'warning',
            `Rationale too short (${rationaleLength} chars)`,
            { id: questionId }
          );
        }
      } else {
        addIssue('questions', 'info',
          'Question has no rationale',
          { id: questionId }
        );
      }
      
      // Validate options count
      const optionsCount = question.question_options?.length || 0;
      if (optionsCount < config.minOptionsPerQuestion) {
        addIssue('questions', 'error',
          `Question has too few options (${optionsCount})`,
          { id: questionId, expected: `>= ${config.minOptionsPerQuestion}` }
        );
      } else if (optionsCount > config.maxOptionsPerQuestion) {
        addIssue('questions', 'warning',
          `Question has many options (${optionsCount})`,
          { id: questionId, note: 'Consider if this is intended' }
        );
      }
      
      // Validate correct answer matches options
      if (question.correct_answer && question.question_options) {
        const correctAnswerText = question.correct_answer.replace(/^[A-Z][\)\.\s]\s*/, '').trim();
        const optionTexts = question.question_options.map(opt => 
          opt.option_text.replace(/^[A-Z][\)\.\s]\s*/, '').trim()
        );
        
        const hasMatchingOption = optionTexts.some(optText => 
          optText === correctAnswerText || 
          correctAnswerText.includes(optText) || 
          optText.includes(correctAnswerText)
        );
        
        if (!hasMatchingOption) {
          addIssue('questions', 'warning',
            'Correct answer text does not match any option',
            { 
              id: questionId, 
              correctAnswer: correctAnswerText,
              options: optionTexts.slice(0, 2)
            }
          );
        }
      }
    }
    
    // Calculate statistics
    validation.stats.avgQuestionLength = totalQuestionLength / questions.length;
    validation.stats.avgRationaleLength = questionsWithRationale > 0 ? 
      totalRationaleLength / questionsWithRationale : 0;
    
    logger.success(`Question validation completed for ${questions.length} questions`);
    
  } catch (error) {
    addIssue('questions', 'error', 'Question validation failed', error.message);
  }
}

/**
 * Validate question options
 */
async function validateOptions() {
  logger.info('Validating question options...');
  
  try {
    // Get all options
    const { data: options, error: optionsError } = await supabase
      .from('question_options')
      .select('*');
    
    if (optionsError) {
      addIssue('options', 'error', 'Could not retrieve options for validation', optionsError.message);
      return;
    }
    
    validation.stats.totalOptions = options?.length || 0;
    
    if (!options || options.length === 0) {
      addIssue('options', 'warning', 'No question options found in database');
      return;
    }
    
    // Group options by question
    const optionsByQuestion = {};
    
    for (const option of options) {
      if (!optionsByQuestion[option.question_id]) {
        optionsByQuestion[option.question_id] = [];
      }
      optionsByQuestion[option.question_id].push(option);
      
      // Validate option text length
      const optionLength = option.option_text?.length || 0;
      
      if (optionLength < config.minOptionLength) {
        addIssue('options', 'warning',
          `Option text too short (${optionLength} chars)`,
          { questionId: option.question_id, optionKey: option.option_key }
        );
      } else if (optionLength > config.maxOptionLength) {
        addIssue('options', 'warning',
          `Option text too long (${optionLength} chars)`,
          { questionId: option.question_id, optionKey: option.option_key }
        );
      }
      
      // Validate option text content
      if (!option.option_text || option.option_text.trim().length === 0) {
        addIssue('options', 'error',
          'Option has empty text',
          { questionId: option.question_id, optionKey: option.option_key },
          false
        );
      }
      
      // Validate option key format
      if (!option.option_key || !/^[A-Z]$/.test(option.option_key)) {
        addIssue('options', 'warning',
          'Option has invalid key format',
          { questionId: option.question_id, optionKey: option.option_key }
        );
      }
    }
    
    // Check for duplicate option keys within questions
    for (const [questionId, questionOptions] of Object.entries(optionsByQuestion)) {
      const keys = questionOptions.map(opt => opt.option_key);
      const uniqueKeys = new Set(keys);
      
      if (keys.length !== uniqueKeys.size) {
        addIssue('options', 'error',
          'Question has duplicate option keys',
          { questionId, keys },
          true
        );
      }
      
      // Check for sequential keys (A, B, C, etc.)
      const sortedKeys = Array.from(uniqueKeys).sort();
      const expectedKeys = Array.from({ length: sortedKeys.length }, (_, i) => 
        String.fromCharCode(65 + i)
      );
      
      if (JSON.stringify(sortedKeys) !== JSON.stringify(expectedKeys)) {
        addIssue('options', 'info',
          'Question has non-sequential option keys',
          { questionId, actual: sortedKeys, expected: expectedKeys }
        );
      }
    }
    
    // Calculate average options per question
    validation.stats.avgOptionsPerQuestion = validation.stats.totalOptions / 
      Object.keys(optionsByQuestion).length;
    
    logger.success(`Option validation completed for ${options.length} options`);
    
  } catch (error) {
    addIssue('options', 'error', 'Option validation failed', error.message);
  }
}

/**
 * Validate categories and sections
 */
async function validateCategoriesAndSections() {
  logger.info('Validating categories and sections...');
  
  try {
    // Get categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');
    
    if (catError) {
      addIssue('categories', 'error', 'Could not retrieve categories', catError.message);
    } else {
      validation.stats.totalCategories = categories?.length || 0;
      
      // Check for empty categories
      for (const category of categories || []) {
        const { count, error: sectionCountError } = await supabase
          .from('sections')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id);
        
        if (sectionCountError) {
          addIssue('categories', 'warning',
            'Could not count sections for category',
            { categoryId: category.id, name: category.name }
          );
        } else if (count === 0) {
          addIssue('categories', 'warning',
            'Category has no sections',
            { categoryId: category.id, name: category.name },
            true
          );
        }
        
        // Validate category name
        if (!category.name || category.name.trim().length === 0) {
          addIssue('categories', 'error',
            'Category has empty name',
            { categoryId: category.id },
            false
          );
        }
      }
    }
    
    // Get sections
    const { data: sections, error: secError } = await supabase
      .from('sections')
      .select('*');
    
    if (secError) {
      addIssue('sections', 'error', 'Could not retrieve sections', secError.message);
    } else {
      validation.stats.totalSections = sections?.length || 0;
      
      // Check for empty sections
      for (const section of sections || []) {
        const { count, error: questionCountError } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('section_id', section.id);
        
        if (questionCountError) {
          addIssue('sections', 'warning',
            'Could not count questions for section',
            { sectionId: section.id, name: section.name }
          );
        } else if (count === 0) {
          addIssue('sections', 'warning',
            'Section has no questions',
            { sectionId: section.id, name: section.name },
            true
          );
        }
        
        // Validate section name
        if (!section.name || section.name.trim().length === 0) {
          addIssue('sections', 'error',
            'Section has empty name',
            { sectionId: section.id },
            false
          );
        }
      }
    }
    
    logger.success('Categories and sections validation completed');
    
  } catch (error) {
    addIssue('categories', 'error', 'Categories/sections validation failed', error.message);
  }
}

/**
 * Check for duplicate questions
 */
async function checkDuplicates() {
  logger.info('Checking for duplicate questions...');
  
  try {
    // Check for duplicate question texts
    const { data: duplicateTexts, error: dupError } = await supabase
      .rpc('find_duplicate_questions')
      .catch(async () => {
        // Fallback query
        return await supabase
          .from('questions')
          .select('question_text, count(*)')
          .group('question_text')
          .having('count', 'gt', 1);
      });
    
    if (dupError) {
      addIssue('duplicates', 'warning', 'Could not check for duplicate questions', dupError.message);
    } else if (duplicateTexts?.length > 0) {
      addIssue('duplicates', 'warning',
        `Found ${duplicateTexts.length} sets of duplicate question texts`,
        duplicateTexts.slice(0, 3),
        false
      );
    } else {
      logger.verbose('No duplicate question texts found');
    }
    
    // Check for duplicate question IDs in original_json
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, original_json');
    
    if (!questionsError && questions) {
      const questionIds = new Map();
      let duplicateIds = 0;
      
      for (const question of questions) {
        const questionId = question.original_json?.question_id;
        if (questionId) {
          if (questionIds.has(questionId)) {
            duplicateIds++;
            addIssue('duplicates', 'error',
              `Duplicate question ID found: ${questionId}`,
              { dbId1: questionIds.get(questionId), dbId2: question.id },
              false
            );
          } else {
            questionIds.set(questionId, question.id);
          }
        }
      }
      
      if (duplicateIds === 0) {
        logger.verbose('No duplicate question IDs found');
      }
    }
    
    logger.success('Duplicate check completed');
    
  } catch (error) {
    addIssue('duplicates', 'error', 'Duplicate check failed', error.message);
  }
}

/**
 * Perform performance analysis
 */
async function analyzePerformance() {
  logger.info('Analyzing database performance...');
  
  try {
    // Check index usage (basic check)
    const largeQueryStart = Date.now();
    
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        sections!inner(name, categories!inner(name)),
        question_options(*)
      `)
      .limit(100);
    
    const largeQueryTime = Date.now() - largeQueryStart;
    
    if (error) {
      addIssue('performance', 'warning', 'Could not perform performance test query', error.message);
    } else {
      if (largeQueryTime > 5000) { // 5 seconds
        addIssue('performance', 'warning',
          `Large query took ${largeQueryTime}ms (>5000ms threshold)`,
          { queryTime: largeQueryTime, recordsReturned: data?.length }
        );
        addRecommendation(
          'Database performance may be slow',
          'Check indexes and consider database optimization',
          'medium'
        );
      } else {
        logger.verbose(`Performance test query completed in ${largeQueryTime}ms`);
      }
    }
    
    // Check materialized view freshness
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('user_statistics')
        .select('*')
        .limit(1);
      
      if (viewError) {
        addIssue('performance', 'warning', 'User statistics view is not accessible', viewError.message);
      } else {
        logger.verbose('User statistics materialized view is accessible');
      }
    } catch (error) {
      addIssue('performance', 'info', 'Could not check materialized view', error.message);
    }
    
    logger.success('Performance analysis completed');
    
  } catch (error) {
    addIssue('performance', 'error', 'Performance analysis failed', error.message);
  }
}

/**
 * Fix issues where possible
 */
async function fixIssues() {
  if (!config.fixIssues) {
    return;
  }
  
  logger.info('Attempting to fix identified issues...');
  let fixedCount = 0;
  
  // Fix orphaned options
  for (const check of validation.checks.relationships.issues) {
    if (check.fixable && check.message.includes('orphaned question options')) {
      try {
        const { error } = await supabase
          .from('question_options')
          .delete()
          .not('question_id', 'in', 
            supabase.from('questions').select('id')
          );
        
        if (!error) {
          validation.fixedIssues.push('Removed orphaned question options');
          fixedCount++;
        }
      } catch (error) {
        logger.error('Could not fix orphaned options:', error);
      }
    }
  }
  
  // Fix duplicate option keys
  for (const check of validation.checks.options.issues) {
    if (check.fixable && check.message.includes('duplicate option keys')) {
      // This would require more complex logic to properly resequence
      logger.warn('Duplicate option keys require manual intervention');
    }
  }
  
  if (fixedCount > 0) {
    logger.success(`Fixed ${fixedCount} issues automatically`);
  } else {
    logger.info('No issues could be automatically fixed');
  }
}

/**
 * Generate comprehensive report
 */
async function generateReport() {
  const duration = (Date.now() - validation.startTime) / 1000;
  
  console.log('\n' + '='.repeat(80));
  console.log('                    LMQB DATABASE INTEGRITY REPORT                    ');
  console.log('='.repeat(80));
  
  console.log('\n📊 VALIDATION SUMMARY');
  console.log(`Validation Duration: ${duration.toFixed(2)} seconds`);
  console.log(`Database: ${config.supabaseUrl}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  // Statistics
  console.log('\n📈 DATABASE STATISTICS');
  console.log(`Questions: ${validation.stats.totalQuestions}`);
  console.log(`Options: ${validation.stats.totalOptions}`);
  console.log(`Categories: ${validation.stats.totalCategories}`);
  console.log(`Sections: ${validation.stats.totalSections}`);
  console.log(`Avg Options/Question: ${validation.stats.avgOptionsPerQuestion.toFixed(1)}`);
  console.log(`Avg Question Length: ${Math.round(validation.stats.avgQuestionLength)} chars`);
  console.log(`Avg Rationale Length: ${Math.round(validation.stats.avgRationaleLength)} chars`);
  
  // Validation results by category
  console.log('\n🔍 VALIDATION RESULTS BY CATEGORY');
  
  let totalIssues = 0;
  let criticalIssues = 0;
  
  for (const [category, results] of Object.entries(validation.checks)) {
    const total = results.passed + results.failed;
    const issueCount = results.issues.length;
    const errorCount = results.issues.filter(i => i.severity === 'error').length;
    const warningCount = results.issues.filter(i => i.severity === 'warning').length;
    
    totalIssues += issueCount;
    criticalIssues += errorCount;
    
    const status = errorCount > 0 ? '❌' : warningCount > 0 ? '⚠️' : '✅';
    
    console.log(`${status} ${category.padEnd(15)} ${issueCount.toString().padStart(3)} issues (${errorCount} errors, ${warningCount} warnings)`);
    
    if (config.detailed && results.issues.length > 0) {
      results.issues.slice(0, 5).forEach((issue, index) => {
        const icon = issue.severity === 'error' ? '  🔴' : 
                     issue.severity === 'warning' ? '  🟡' : '  🔵';
        console.log(`${icon} ${issue.message}`);
        if (issue.details && config.verbose) {
          console.log(`      Details: ${JSON.stringify(issue.details)}`);
        }
      });
      
      if (results.issues.length > 5) {
        console.log(`      ... and ${results.issues.length - 5} more issues`);
      }
    }
  }
  
  // Overall health score
  console.log('\n💊 DATABASE HEALTH SCORE');
  const maxPossibleScore = validation.stats.totalQuestions * 10; // Rough scoring
  const penaltyScore = criticalIssues * 50 + (totalIssues - criticalIssues) * 10;
  const healthScore = Math.max(0, Math.min(100, 
    ((maxPossibleScore - penaltyScore) / maxPossibleScore * 100)
  ));
  
  const healthIcon = healthScore >= 90 ? '🟢' : healthScore >= 70 ? '🟡' : '🔴';
  console.log(`${healthIcon} Overall Health: ${healthScore.toFixed(1)}/100`);
  
  if (healthScore < 70) {
    console.log('   Status: CRITICAL - Immediate attention required');
  } else if (healthScore < 90) {
    console.log('   Status: WARNING - Issues should be addressed');
  } else {
    console.log('   Status: GOOD - Database is in good condition');
  }
  
  // Recommendations
  if (validation.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS');
    validation.recommendations.forEach((rec, index) => {
      const priority = rec.priority === 'high' ? '🔴' : 
                      rec.priority === 'medium' ? '🟡' : '🔵';
      console.log(`${priority} ${rec.message}`);
      console.log(`   Action: ${rec.action}`);
    });
  }
  
  // Fixed issues
  if (validation.fixedIssues.length > 0) {
    console.log('\n🔧 AUTOMATICALLY FIXED');
    validation.fixedIssues.forEach((fix, index) => {
      console.log(`✅ ${fix}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Export report if requested
  if (config.exportReport) {
    await exportReportToFile();
  }
}

/**
 * Export report to JSON file
 */
async function exportReportToFile() {
  try {
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: (Date.now() - validation.startTime) / 1000,
      database: config.supabaseUrl,
      validation,
      summary: {
        totalIssues: Object.values(validation.checks).reduce((sum, check) => sum + check.issues.length, 0),
        criticalIssues: Object.values(validation.checks).reduce((sum, check) => 
          sum + check.issues.filter(i => i.severity === 'error').length, 0),
        totalQuestions: validation.stats.totalQuestions,
        totalOptions: validation.stats.totalOptions
      }
    };
    
    const reportPath = path.join(__dirname, `integrity-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
    
    logger.success(`Report exported to: ${reportPath}`);
    
  } catch (error) {
    logger.error('Could not export report to file:', error);
  }
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
LMQB Database Integrity Validation Script

Performs comprehensive validation of database integrity and question data quality.

Usage: node validate-integrity.js [options]

Options:
  --verbose               Enable detailed logging
  --detailed              Show detailed issue information
  --fix-issues            Attempt to automatically fix issues where possible
  --export-report         Export detailed report to JSON file
  --help                  Show this help message

Validation Categories:
  - Schema: Table structure and accessibility
  - Relationships: Foreign key integrity and orphaned records
  - Questions: Content quality and completeness
  - Options: Answer choice validation and formatting
  - Categories/Sections: Organizational structure
  - Duplicates: Duplicate content detection
  - Performance: Query performance and optimization

Environment Variables:
  SUPABASE_URL                    Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY       Service role key (recommended)
  SUPABASE_ANON_KEY              Anonymous key (fallback)

Examples:
  node validate-integrity.js                    # Basic validation
  node validate-integrity.js --detailed         # Show issue details
  node validate-integrity.js --verbose          # Detailed logging
  node validate-integrity.js --fix-issues       # Auto-fix issues
  node validate-integrity.js --export-report    # Export JSON report

The script generates a comprehensive health score and actionable recommendations
for improving database integrity and question quality.
`);
}

/**
 * Main validation function
 */
async function main() {
  try {
    logger.info('LMQB Database Integrity Validation Started');
    logger.info(`Verbose mode: ${config.verbose ? 'ON' : 'OFF'}`);
    logger.info(`Detailed mode: ${config.detailed ? 'ON' : 'OFF'}`);
    logger.info(`Fix issues: ${config.fixIssues ? 'ON' : 'OFF'}`);
    
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
    
    // Run all validation checks
    await validateSchema();
    await validateRelationships();
    await validateQuestions();
    await validateOptions();
    await validateCategoriesAndSections();
    await checkDuplicates();
    await analyzePerformance();
    
    // Fix issues if requested
    await fixIssues();
    
    // Generate final report
    await generateReport();
    
    // Determine exit code
    const totalErrors = Object.values(validation.checks).reduce((sum, check) => 
      sum + check.issues.filter(i => i.severity === 'error').length, 0);
    
    if (totalErrors > 0) {
      logger.error(`\nValidation completed with ${totalErrors} critical issues`);
      process.exit(1);
    } else {
      logger.success('\nValidation completed successfully');
    }
    
  } catch (error) {
    logger.error('Validation script failed:', error);
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