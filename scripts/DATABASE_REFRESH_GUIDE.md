# LMQB Database Refresh and Import Guide

This comprehensive guide provides instructions for safely wiping the database clean and importing all questions from JSON files using the enhanced import system.

## 🚀 Quick Start

For a complete database refresh (cleanup + import):

```bash
# Preview the entire operation (RECOMMENDED FIRST STEP)
npm run refresh -- --dry-run --verbose

# Execute the complete refresh
npm run refresh
```

## 📋 Available Scripts

### Core Operations

| Script | Command | Description |
|--------|---------|-------------|
| **Complete Refresh** | `npm run refresh` | Full database cleanup + import (recommended) |
| **Database Cleanup** | `npm run cleanup` | Remove all questions while preserving users |
| **Batch Import** | `npm run import:batch` | Enhanced batch import with better performance |
| **Legacy Import** | `npm run import` | Original import script (for compatibility) |
| **Integrity Validation** | `npm run validate` | Comprehensive data integrity checks |
| **Rollback** | `npm run rollback` | Remove imported questions by various criteria |

### Testing & Development

| Script | Command | Description |
|--------|---------|-------------|
| **Test Import** | `npm run test` | Test import functionality (if available) |

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the `scripts/` directory:

```bash
# Primary configuration (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Alternative variable names (fallback)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Performance tuning (optional)
BATCH_SIZE=50                    # Questions per batch
MAX_RETRIES=3                    # Retry attempts on failure
RETRY_DELAY=1000                 # Delay between retries (ms)
MAX_CONCURRENT_FILES=3           # Concurrent file processing
MEMORY_THRESHOLD=524288000       # Memory threshold (500MB)
```

### Required Permissions

For full functionality, use a **service role key** which provides:
- Full database access for cleanup operations
- Ability to create/modify tables and relationships
- Backup and restore capabilities

## 📁 Source Data Structure

Questions should be stored in `/data/questions/` as JSON files with this naming format:

```
[Category] - [SectionNumber]. [SectionName].json
```

**Examples:**
- `General - 1. Introduction to Lifestyle Medicine.json`
- `Board Review Notes - 5. Nutrition Science Assessment and Prescription Guidelines.json`
- `Study-Tool Based - 10. The Role of Connectedness and Positive Psychology.json`

### Question JSON Format

Each JSON file should contain an array of questions:

```json
[
  {
    "question_text": "Question content here...",
    "options": [
      "A) First option",
      "B) Second option", 
      "C) Third option",
      "D) Fourth option"
    ],
    "correct_answer": "C) Third option",
    "rationale": "Explanation of why this answer is correct...",
    "page_reference": "Page 14",
    "section": "Introduction to Lifestyle Medicine",
    "question_type": "General",
    "question_id": "00001",
    "section_number": "01"
  }
]
```

## 🔧 Detailed Usage

### 1. Complete Database Refresh (Recommended)

The `complete-refresh.js` script orchestrates the entire process:

```bash
# Preview the entire operation (safe)
npm run refresh -- --dry-run --verbose

# Execute with confirmation prompts
npm run refresh --verbose

# Execute without prompts (be careful!)
npm run refresh --force

# Skip backup creation (not recommended)
npm run refresh --skip-backup

# Only cleanup (skip import)
npm run refresh --skip-import

# Only import (skip cleanup)
npm run refresh --skip-cleanup
```

**What it does:**
1. **Validates** system requirements and current state
2. **Creates backup** of existing data (unless skipped)
3. **Cleans database** removes all questions and quiz data
4. **Imports questions** from all JSON files
5. **Verifies results** and checks data integrity

### 2. Database Cleanup Only

For removing all questions while preserving user data:

```bash
# Preview cleanup operations
npm run cleanup -- --dry-run --verbose

# Execute cleanup with confirmations
npm run cleanup --verbose

# Preserve sections and categories
npm run cleanup --preserve-sections --preserve-categories

# Skip backup creation
npm run cleanup --skip-backup
```

**What gets removed:**
- All questions and their options
- All quiz sessions and attempts
- Empty sections and categories (unless preserved)

**What gets preserved:**
- User profiles and authentication data
- System configuration
- Database schema and functions

### 3. Enhanced Batch Import

For importing questions with advanced features:

```bash
# Preview import operations
npm run import:batch -- --dry-run --verbose

# Execute import with detailed logging
npm run import:batch --verbose

# Update existing questions
npm run import:batch --update-existing

# Skip validation for faster processing
npm run import:batch --skip-validation

# Continue processing on errors
npm run import:batch --continue-on-error

# Custom batch size
npm run import:batch --batch-size=100
```

**Features:**
- **Batch processing** for efficient database operations
- **Memory monitoring** and garbage collection
- **Retry logic** with exponential backoff
- **Progress tracking** and detailed statistics
- **Data validation** with comprehensive error reporting
- **Caching** for categories and sections

### 4. Data Integrity Validation

For comprehensive database health checks:

```bash
# Basic validation
npm run validate

# Detailed validation with issue descriptions
npm run validate -- --detailed --verbose

# Attempt to fix issues automatically
npm run validate --fix-issues

# Export detailed report to JSON
npm run validate --export-report
```

**Validation categories:**
- **Schema**: Table structure and accessibility
- **Relationships**: Foreign key integrity
- **Questions**: Content quality and completeness  
- **Options**: Answer choice validation
- **Categories/Sections**: Organizational structure
- **Duplicates**: Duplicate content detection
- **Performance**: Query performance analysis

### 5. Rollback Operations

For removing imported questions:

```bash
# Remove questions imported after a specific date
npm run rollback timestamp 2024-01-15T10:30:00Z

# Remove all questions from a category
npm run rollback category "General"

# Remove questions from a specific section
npm run rollback section "Introduction to Lifestyle Medicine"

# Remove questions with specific IDs
npm run rollback ids "00001,00002,00003"

# Preview rollback operations
npm run rollback category "General" -- --dry-run --verbose
```

## 🛡️ Safety Features

### Automatic Backups

Before any destructive operation, the system automatically creates backups:

```
scripts/backups/backup-2024-01-15T10-30-00-000Z.json
```

Backups contain:
- All questions and options
- Categories and sections
- Quiz sessions and attempts
- Metadata and timestamps

### Dry Run Mode

**Always use `--dry-run` first** to preview operations:

```bash
# Preview complete refresh
npm run refresh -- --dry-run --verbose

# Preview cleanup only
npm run cleanup -- --dry-run

# Preview import operations
npm run import:batch -- --dry-run
```

### Data Validation

The system performs comprehensive validation:

- **File format validation**: JSON syntax and structure
- **Content validation**: Required fields and data types
- **Relationship validation**: Foreign key integrity
- **Duplicate detection**: Prevent duplicate questions
- **Performance monitoring**: Memory and query optimization

### Error Handling

Robust error handling includes:

- **Transaction rollback** on failures
- **Detailed error logging** with stack traces
- **Graceful degradation** on non-critical errors
- **Recovery recommendations** for common issues

## 📊 Monitoring and Reporting

### Progress Tracking

All scripts provide real-time progress updates:

```
[2024-01-15T10:30:00.000Z] [PROGRESS] Processing General - 1. Introduction to Lifestyle Medicine.json (1/25 - 4.0%)
[2024-01-15T10:30:01.000Z] [INFO] Found 50 questions in General - 1. Introduction to Lifestyle Medicine.json
[2024-01-15T10:30:02.000Z] [SUCCESS] Successfully processed: General - 1. Introduction to Lifestyle Medicine.json
```

### Comprehensive Statistics

Final reports include:

- **Processing metrics**: Files, questions, options processed
- **Performance data**: Duration, memory usage, throughput
- **Error summaries**: Counts and details of any issues
- **Data integrity**: Before/after state comparison
- **Recommendations**: Actions to improve data quality

### Health Scoring

The validation script provides a health score (0-100):

- **90-100**: Excellent - Database in great condition
- **70-89**: Good - Minor issues to address  
- **50-69**: Warning - Issues need attention
- **0-49**: Critical - Immediate action required

## ⚡ Performance Optimization

### Batch Processing

Configure batch sizes based on your system:

```bash
# Small batches (safer, slower)
npm run import:batch --batch-size=25

# Medium batches (default)
npm run import:batch --batch-size=50

# Large batches (faster, more memory)
npm run import:batch --batch-size=100
```

### Memory Management

The system automatically monitors memory usage:

- **Garbage collection** when memory exceeds thresholds
- **Batch size adjustment** for large datasets
- **Memory usage reporting** in verbose mode
- **Warnings** when approaching system limits

### Concurrent Processing

Control concurrent operations:

```bash
# Conservative (3 files at once)
MAX_CONCURRENT_FILES=3 npm run import:batch

# Aggressive (6 files at once)
MAX_CONCURRENT_FILES=6 npm run import:batch
```

## 🔍 Troubleshooting

### Common Issues

**1. Permission Errors**
```
Error: Database connection failed: permission denied
```
**Solution**: Use service role key instead of anonymous key

**2. Memory Issues**
```
WARN: High memory usage detected: 600MB
```
**Solution**: Reduce batch size or increase available memory

**3. Connection Timeouts**
```
Error: Connection timeout after 30000ms
```
**Solution**: Check network connection and database availability

**4. Invalid JSON**
```
Error: Invalid JSON in file: Unexpected token at position 1234
```
**Solution**: Validate JSON files using online tools or `jq`

### Recovery Procedures

**If import fails midway:**

1. Check the error logs for specific issues
2. Fix the problematic JSON files
3. Run `npm run refresh --skip-cleanup` to continue from cleanup
4. Or use rollback to remove partial imports

**If database becomes inconsistent:**

1. Run integrity validation: `npm run validate --detailed`
2. Review the health report and recommendations
3. Use `--fix-issues` flag to auto-correct simple problems
4. For complex issues, restore from backup or start fresh

**Emergency rollback:**

```bash
# Remove all questions imported today
npm run rollback timestamp $(date -u -d 'today 00:00:00' +%Y-%m-%dT%H:%M:%SZ)

# Remove entire category
npm run rollback category "Problematic Category"
```

## 📈 Best Practices

### Before Running

1. **Always use dry-run first**: `--dry-run --verbose`
2. **Verify source data**: Check JSON files are valid
3. **Test with subset**: Try with 1-2 files first
4. **Check disk space**: Ensure adequate space for backups
5. **Verify permissions**: Use service role key for full access

### During Execution

1. **Monitor progress**: Watch for errors or warnings
2. **Check memory usage**: Especially with large datasets
3. **Don't interrupt**: Let operations complete naturally
4. **Save logs**: Redirect output to files for analysis

### After Completion

1. **Verify results**: Run integrity validation
2. **Check statistics**: Review final reports
3. **Test application**: Ensure quiz functionality works
4. **Keep backups**: Archive successful backup files
5. **Document changes**: Note any issues or modifications

## 🔗 Integration

### CI/CD Integration

For automated deployments:

```bash
# In your deployment script
npm install
npm run refresh -- --force --skip-backup --continue-on-error
npm run validate --fix-issues
```

### Monitoring Integration

For production monitoring:

```bash
# Generate health reports
npm run validate --export-report

# Parse JSON reports for alerts
node -e "
const report = require('./integrity-report-latest.json');
if (report.summary.criticalIssues > 0) {
  console.error('ALERT: Critical database issues detected');
  process.exit(1);
}
"
```

## 🆘 Support

If you encounter issues:

1. **Check this guide** for common solutions
2. **Run with `--verbose`** for detailed logging
3. **Use `--dry-run`** to safely test operations
4. **Run validation** to check database health
5. **Review backup files** if recovery is needed

The system is designed to be safe and reliable, but always test thoroughly in development before running in production.

---

**⚠️ Important**: Always backup your production database before running these scripts, even though automatic backups are created. The service role key provides full database access, so use it carefully.