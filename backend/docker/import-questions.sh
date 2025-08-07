#!/bin/bash

# LMQB Question Import Script
# This script imports questions from the existing JSON files into the Supabase database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
QUESTIONS_DIR="/home/dr6117285/lmqb/data/questions"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_DB="postgres"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="dev-password-for-local-testing-only"
IMPORT_SCRIPT="/home/dr6117285/lmqb/scripts/import-questions.js"

# Function to print status
print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "SUCCESS" ]; then
        echo -e "${GREEN}✓${NC} $message"
    elif [ "$status" = "INFO" ]; then
        echo -e "${BLUE}ℹ${NC} $message"
    elif [ "$status" = "WARNING" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
    else
        echo -e "${RED}✗${NC} $message"
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "INFO" "Checking prerequisites..."
    
    # Check if questions directory exists
    if [ ! -d "$QUESTIONS_DIR" ]; then
        print_status "ERROR" "Questions directory not found: $QUESTIONS_DIR"
        exit 1
    fi
    
    # Check if there are JSON files
    if [ ! "$(ls -A "$QUESTIONS_DIR"/*.json 2>/dev/null)" ]; then
        print_status "ERROR" "No JSON files found in $QUESTIONS_DIR"
        exit 1
    fi
    
    # Check if database is accessible
    if ! PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" >/dev/null 2>&1; then
        print_status "ERROR" "Cannot connect to database. Is Supabase running?"
        print_status "INFO" "Try running: ./start-supabase.sh"
        exit 1
    fi
    
    # Check if Node.js script exists
    if [ ! -f "$IMPORT_SCRIPT" ]; then
        print_status "ERROR" "Import script not found: $IMPORT_SCRIPT"
        exit 1
    fi
    
    print_status "SUCCESS" "All prerequisites met"
}

# Function to check if Node.js is available
check_node() {
    if ! command -v node >/dev/null 2>&1; then
        print_status "ERROR" "Node.js is not installed or not in PATH"
        exit 1
    fi
    
    # Check if the import script has dependencies installed
    if [ ! -d "/home/dr6117285/lmqb/scripts/node_modules" ]; then
        print_status "INFO" "Installing Node.js dependencies..."
        cd /home/dr6117285/lmqb/scripts
        npm install >/dev/null 2>&1
        cd - >/dev/null
    fi
}

# Function to run the import
run_import() {
    print_status "INFO" "Starting question import..."
    
    # Export database connection for the Node.js script
    export PGHOST="$POSTGRES_HOST"
    export PGPORT="$POSTGRES_PORT"
    export PGDATABASE="$POSTGRES_DB"
    export PGUSER="$POSTGRES_USER"
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    # Run the import script
    cd /home/dr6117285/lmqb/scripts
    if node import-questions.js; then
        print_status "SUCCESS" "Questions imported successfully"
    else
        print_status "ERROR" "Import failed. Check the output above for details."
        exit 1
    fi
}

# Function to show import summary
show_summary() {
    print_status "INFO" "Import Summary:"
    
    # Count questions in database
    local question_count
    question_count=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM public.questions;" 2>/dev/null | tr -d ' ')
    
    if [ "$question_count" -gt 0 ]; then
        print_status "SUCCESS" "$question_count questions now in database"
    else
        print_status "WARNING" "No questions found in database"
    fi
    
    # Show categories
    print_status "INFO" "Available categories:"
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT id, name, (SELECT COUNT(*) FROM sections WHERE category_id = categories.id) as section_count FROM public.categories;" 2>/dev/null
}

# Main function
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}    LMQB Question Import Tool${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    check_prerequisites
    echo ""
    
    check_node
    echo ""
    
    run_import
    echo ""
    
    show_summary
    
    echo ""
    echo -e "${GREEN}🎉 Question import completed!${NC}"
    echo -e "${BLUE}You can now access your questions via:${NC}"
    echo -e "  • Supabase Studio: http://localhost:3001"
    echo -e "  • REST API: http://localhost:8000/rest/v1/questions"
    echo -e "${BLUE}========================================${NC}"
}

# Handle script options
case "${1:-}" in
    "test")
        print_status "INFO" "Testing database connection..."
        check_prerequisites
        print_status "SUCCESS" "Database connection test passed"
        ;;
    "status")
        print_status "INFO" "Checking current database state..."
        check_prerequisites
        show_summary
        ;;
    *)
        main
        ;;
esac