#!/usr/bin/env node

/**
 * Test script for the question import functionality
 * Creates test data and validates the import process
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseFilename, parseOptions } from './import-questions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test data
const testQuestions = [
  {
    "question_text": "Test question about lifestyle medicine principles?",
    "options": [
      "A) First option",
      "B) Second option", 
      "C) Third option",
      "D) Fourth option"
    ],
    "correct_answer": "C) Third option",
    "page_reference": "Page 1",
    "rationale": "This is the correct answer because...",
    "section": "Test Section",
    "question_type": "Test",
    "question_id": "TEST001",
    "section_number": "01"
  },
  {
    "question_text": "Another test question for validation?",
    "options": [
      "A. Option with period format",
      "B. Another period option",
      "C. Third period option"
    ],
    "correct_answer": "B. Another period option",
    "page_reference": "Page 2",
    "rationale": "Testing different option formats",
    "section": "Test Section",
    "question_type": "Test",
    "question_id": "TEST002",
    "section_number": "01"
  }
];

const testCases = [
  {
    name: 'parseFilename - Standard format',
    test: () => {
      const result = parseFilename('General - 1. Introduction to Lifestyle Medicine.json');
      const expected = {
        category: 'General',
        sectionNumber: '1',
        sectionName: 'Introduction to Lifestyle Medicine'
      };
      return JSON.stringify(result) === JSON.stringify(expected);
    }
  },
  {
    name: 'parseFilename - Board Review format',
    test: () => {
      const result = parseFilename('From Board Review Notes - 10. The Role of Connectedness.json');
      const expected = {
        category: 'From Board Review Notes',
        sectionNumber: '10', 
        sectionName: 'The Role of Connectedness'
      };
      return JSON.stringify(result) === JSON.stringify(expected);
    }
  },
  {
    name: 'parseFilename - Missing section number',
    test: () => {
      const result = parseFilename('Study-Tool Based -  - 5. Nutrition Guidelines.json');
      const expected = {
        category: 'Study-Tool Based',
        sectionNumber: null,
        sectionName: 'Nutrition Guidelines'
      };
      return JSON.stringify(result) === JSON.stringify(expected);
    }
  },
  {
    name: 'parseOptions - Parentheses format',
    test: () => {
      const options = ["A) First option", "B) Second option", "C) Third option"];
      const result = parseOptions(options);
      const expected = [
        { key: 'A', text: 'First option' },
        { key: 'B', text: 'Second option' },
        { key: 'C', text: 'Third option' }
      ];
      return JSON.stringify(result) === JSON.stringify(expected);
    }
  },
  {
    name: 'parseOptions - Period format',
    test: () => {
      const options = ["A. First option", "B. Second option"];
      const result = parseOptions(options);
      const expected = [
        { key: 'A', text: 'First option' },
        { key: 'B', text: 'Second option' }
      ];
      return JSON.stringify(result) === JSON.stringify(expected);
    }
  },
  {
    name: 'parseOptions - Mixed format handling',
    test: () => {
      const options = ["A) First option", "Invalid format option"];
      const result = parseOptions(options);
      // Should handle invalid format gracefully
      return result.length === 2 && result[0].key === 'A' && result[1].key === 'B';
    }
  }
];

async function runTests() {
  console.log('🧪 Running Import Script Tests\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      const result = testCase.test();
      if (result) {
        console.log(`✅ ${testCase.name}`);
        passed++;
      } else {
        console.log(`❌ ${testCase.name}`);
        failed++;
      }
    } catch (error) {
      console.log(`💥 ${testCase.name} - Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
    
    // Create test data file for manual testing
    await createTestDataFile();
    
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
    process.exit(1);
  }
}

async function createTestDataFile() {
  console.log('\n📝 Creating test data file...');
  
  const testDir = path.join(__dirname, '../data/test-questions');
  const testFile = path.join(testDir, 'Test - 1. Test Section.json');
  
  try {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    
    // Write test data
    await fs.writeFile(testFile, JSON.stringify(testQuestions, null, 2));
    
    console.log(`✅ Created test file: ${testFile}`);
    console.log('📖 You can now run the import script with:');
    console.log('   node import-questions.js --dry-run --verbose');
    console.log('   to test with this data');
    
  } catch (error) {
    console.log(`❌ Failed to create test file: ${error.message}`);
  }
}

// Error handling for filename edge cases
async function testEdgeCases() {
  console.log('\n🔍 Testing edge cases...');
  
  const edgeCases = [
    'Invalid filename format.json',
    'General - Missing section number and name.json',
    'Category - . Empty section name.json'
  ];
  
  for (const filename of edgeCases) {
    try {
      parseFilename(filename);
      console.log(`⚠️ Edge case should have failed: ${filename}`);
    } catch (error) {
      console.log(`✅ Correctly handled edge case: ${filename}`);
    }
  }
}

async function main() {
  await runTests();
  await testEdgeCases();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}