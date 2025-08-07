# LMQB Import Scripts

This directory contains scripts for importing question data from JSON files into the Supabase database.

## Files

- `import-questions.js` - Main import script
- `test-import.js` - Test script to validate functionality  
- `package.json` - Node.js dependencies
- `.env.example` - Environment variables template

## Setup

1. **Install dependencies:**
   ```bash
   cd scripts
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Required environment variables:**
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (recommended)
   - OR `SUPABASE_ANON_KEY` - Anonymous key (fallback)

## Usage

### Basic Import
```bash
# Import all questions
node import-questions.js

# Preview changes without making them
node import-questions.js --dry-run

# Enable detailed logging
node import-questions.js --verbose

# Update existing questions instead of skipping
node import-questions.js --update-existing

# Combine options
node import-questions.js --dry-run --verbose --update-existing
```

### Run Tests
```bash
# Test the parsing functions
node test-import.js
```

### Using npm scripts
```bash
# Import questions
npm run import

# With arguments
npm run import -- --dry-run --verbose
```

## Features

### File Processing
- Automatically discovers JSON files in `../data/questions/`
- Parses filenames to extract category and section information
- Supports filename formats:
  - `General - 1. Section Name.json`
  - `From Board Review Notes - 10. Section Name.json`
  - `Study-Tool Based -  - 5. Section Name.json` (missing section number)

### Data Import
- Creates/updates categories and sections automatically
- Preserves complete original JSON in `original_json` field
- Normalizes question data into relational structure
- Parses question options into separate table
- Handles duplicate detection by `question_id`

### Options Handling
- Supports multiple option formats:
  - `A) Option text`
  - `A. Option text`
  - `A Option text`
- Gracefully handles malformed options

### Error Handling
- Comprehensive error logging
- Continues processing after individual question failures
- Transaction-like behavior (file-level rollback on errors)
- Detailed statistics and reporting

### Safety Features
- **Dry run mode** - Preview changes without database modifications
- **Duplicate detection** - Prevents importing same question twice
- **Validation** - Checks required fields before import
- **Rollback capability** - Atomic operations per file

## Database Schema

The script populates these tables:

### `categories`
- `id` (PRIMARY KEY)
- `name` (UNIQUE)
- `description`
- `created_at`

### `sections`
- `id` (PRIMARY KEY)
- `category_id` (FOREIGN KEY)
- `name`
- `description`
- `created_at`

### `questions`
- `id` (PRIMARY KEY)
- `section_id` (FOREIGN KEY)
- `original_json` (JSONB) - Complete original question data
- `question_text`
- `correct_answer`
- `rationale`
- `difficulty_level`
- `tags`
- `created_at`
- `updated_at`

### `question_options`
- `id` (PRIMARY KEY)
- `question_id` (FOREIGN KEY)
- `option_key` (A, B, C, D, etc.)
- `option_text`

## JSON File Format

Expected format for question JSON files:

```json
[
  {
    "question_text": "What is the primary focus of lifestyle medicine?",
    "options": [
      "A) Medication management",
      "B) Lifestyle interventions for chronic disease",
      "C) Surgical procedures",
      "D) Diagnostic imaging"
    ],
    "correct_answer": "B) Lifestyle interventions for chronic disease",
    "page_reference": "Page 14",
    "rationale": "Lifestyle medicine focuses on evidence-based lifestyle interventions...",
    "section": "Introduction to Lifestyle Medicine",
    "question_type": "General",
    "question_id": "00001",
    "section_number": "01"
  }
]
```

### Required Fields
- `question_text` - The question text
- `options` - Array of answer options
- `correct_answer` - The correct answer

### Optional Fields
- `question_id` - Unique identifier (used for duplicate detection)
- `page_reference` - Source page reference
- `rationale` - Explanation of correct answer
- `section` - Section name (auto-extracted from filename if missing)
- `question_type` - Category (auto-extracted from filename if missing)
- `section_number` - Section number (auto-extracted from filename if missing)

## Logging

The script provides detailed logging at multiple levels:

- **INFO** - General operation status
- **VERBOSE** - Detailed processing information (with `--verbose` flag)
- **WARN** - Non-fatal issues
- **ERROR** - Failure conditions
- **SUCCESS** - Successful operations

## Statistics

After processing, the script displays comprehensive statistics:
- Files processed
- Questions inserted/updated/skipped
- Options inserted
- Categories and sections created
- Errors encountered

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check environment variables
   - Verify Supabase project is running
   - Ensure correct URL and key format

2. **Permission Denied**
   - Use `SUPABASE_SERVICE_ROLE_KEY` instead of `SUPABASE_ANON_KEY`
   - Check Row Level Security policies

3. **File Not Found**
   - Ensure JSON files exist in `../data/questions/`
   - Check file permissions

4. **Invalid JSON Format**
   - Validate JSON syntax
   - Ensure array of question objects
   - Check required fields

### Debug Mode

Use `--verbose` flag for detailed logging:

```bash
node import-questions.js --dry-run --verbose
```

This will show:
- Detailed parsing information
- Database queries
- Individual question processing
- Error stack traces

## Development

### Adding New Features

1. Modify `import-questions.js`
2. Add corresponding tests to `test-import.js`
3. Run tests: `node test-import.js`
4. Test with real data: `node import-questions.js --dry-run --verbose`

### Testing

The test script validates:
- Filename parsing
- Option parsing
- Edge case handling
- Error conditions

Run tests before deploying changes:
```bash
node test-import.js
```