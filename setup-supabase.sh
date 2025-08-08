#!/bin/bash

# LMQB Supabase Setup Script
# This script sets up the complete Supabase development environment for the LMQB project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPABASE_CLI="$HOME/.local/bin/supabase"

# Function to print status
print_status() {
    local status=$1
    local message=$2
    
    case "$status" in
        "SUCCESS") echo -e "${GREEN}✓${NC} $message" ;;
        "INFO") echo -e "${BLUE}ℹ${NC} $message" ;;
        "WARNING") echo -e "${YELLOW}⚠${NC} $message" ;;
        "ERROR") echo -e "${RED}✗${NC} $message" ;;
        "HEADER") echo -e "${CYAN}$message${NC}" ;;
    esac
}

# Function to print section header
print_header() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    print_status "INFO" "Checking prerequisites..."
    
    # Check if Supabase CLI is installed
    if [ ! -f "$SUPABASE_CLI" ]; then
        print_status "ERROR" "Supabase CLI not found at $SUPABASE_CLI"
        print_status "INFO" "Run the following to install:"
        echo "  curl -L https://github.com/supabase/cli/releases/download/v2.33.9/supabase_linux_amd64.tar.gz | tar -xz"
        echo "  mv supabase ~/.local/bin/supabase"
        echo "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        print_status "ERROR" "Docker is not installed or not in PATH"
        print_status "INFO" "Please install Docker Desktop for Windows and enable WSL2 integration"
        print_status "INFO" "Alternative: Install Docker Engine in WSL2"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_status "ERROR" "Docker daemon is not running"
        print_status "INFO" "Please start Docker Desktop or run: sudo service docker start"
        exit 1
    fi
    
    # Check project structure
    if [ ! -f "supabase/config.toml" ]; then
        print_status "ERROR" "Supabase configuration not found"
        print_status "INFO" "Run '$SUPABASE_CLI init' first"
        exit 1
    fi
    
    print_status "SUCCESS" "All prerequisites met"
}

# Function to start Supabase
start_supabase() {
    print_status "INFO" "Starting Supabase local development environment..."
    
    # Start Supabase services
    print_status "INFO" "This will download and start Docker containers..."
    $SUPABASE_CLI start
    
    if [ $? -eq 0 ]; then
        print_status "SUCCESS" "Supabase services started successfully"
    else
        print_status "ERROR" "Failed to start Supabase services"
        return 1
    fi
}

# Function to check service status
check_services() {
    print_status "INFO" "Checking service status..."
    
    local status_output
    status_output=$($SUPABASE_CLI status 2>&1)
    
    if echo "$status_output" | grep -q "RUNNING"; then
        print_status "SUCCESS" "Services are running"
        echo ""
        echo "$status_output"
    else
        print_status "ERROR" "Some services may not be running"
        echo "$status_output"
        return 1
    fi
}

# Function to apply migrations
apply_migrations() {
    print_status "INFO" "Applying database migrations..."
    
    # Reset the database to apply migrations
    $SUPABASE_CLI db reset --debug
    
    if [ $? -eq 0 ]; then
        print_status "SUCCESS" "Migrations applied successfully"
    else
        print_status "ERROR" "Failed to apply migrations"
        return 1
    fi
}

# Function to import questions data
import_questions() {
    print_status "INFO" "Importing questions data..."
    
    if [ -d "data/questions" ] && [ -f "scripts/import-questions.js" ]; then
        cd scripts
        if command -v node >/dev/null 2>&1; then
            node import-questions.js
            print_status "SUCCESS" "Questions imported successfully"
        else
            print_status "WARNING" "Node.js not found. Skipping questions import."
            print_status "INFO" "Install Node.js and run: cd scripts && node import-questions.js"
        fi
        cd ..
    else
        print_status "WARNING" "Questions data or import script not found"
    fi
}

# Function to show connection information
show_connection_info() {
    echo ""
    print_status "INFO" "Service Connection Information:"
    echo ""
    echo -e "  ${BLUE}Kong Gateway (API):${NC}    http://127.0.0.1:54321"
    echo -e "  ${BLUE}Supabase Studio:${NC}       http://127.0.0.1:54323"
    echo -e "  ${BLUE}PostgreSQL:${NC}            127.0.0.1:54322"
    echo -e "  ${BLUE}Inbucket (Email):${NC}      http://127.0.0.1:54324"
    echo ""
    echo -e "  ${YELLOW}Database:${NC}"
    echo -e "    Host: 127.0.0.1"
    echo -e "    Port: 54322"
    echo -e "    Database: postgres"
    echo -e "    User: postgres"
    echo -e "    Password: postgres"
    echo ""
    echo -e "  ${YELLOW}Frontend Configuration:${NC}"
    echo -e "    REACT_APP_SUPABASE_URL=http://127.0.0.1:54321"
    echo -e "    REACT_APP_SUPABASE_ANON_KEY=<from supabase status>"
    echo ""
}

# Function to get API keys
show_api_keys() {
    print_status "INFO" "API Keys (update your frontend .env):"
    echo ""
    $SUPABASE_CLI status | grep -E "(anon key|service_role key)" || echo "Run 'supabase status' to see the keys"
    echo ""
}

# Function to create frontend environment
create_frontend_env() {
    print_status "INFO" "Creating frontend environment configuration..."
    
    # Get the anon key from supabase status
    local anon_key
    anon_key=$($SUPABASE_CLI status 2>/dev/null | grep "anon key" | awk '{print $NF}' || echo "")
    
    if [ ! -z "$anon_key" ]; then
        cat > frontend/.env.local << EOF
# Supabase Configuration for Local Development
REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
REACT_APP_SUPABASE_ANON_KEY=$anon_key

# Environment
NODE_ENV=development
REACT_APP_ENV=development
EOF
        print_status "SUCCESS" "Frontend environment file created at frontend/.env.local"
    else
        print_status "WARNING" "Could not retrieve anon key. Create frontend/.env.local manually"
    fi
}

# Function to show next steps
show_next_steps() {
    echo ""
    print_header "Next Steps"
    
    echo -e "${GREEN}✓ Supabase Setup Complete!${NC}"
    echo ""
    echo -e "${BLUE}To start developing:${NC}"
    echo "1. Open Supabase Studio: http://127.0.0.1:54323"
    echo "2. Start your React app: cd frontend && npm start"
    echo "3. Your app should connect to the local Supabase instance"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo "• View status: $SUPABASE_CLI status"
    echo "• View logs: $SUPABASE_CLI logs"
    echo "• Stop services: $SUPABASE_CLI stop"
    echo "• Reset database: $SUPABASE_CLI db reset"
    echo ""
    echo -e "${BLUE}Database Access:${NC}"
    echo "• Studio: http://127.0.0.1:54323"
    echo "• Direct connection: psql -h 127.0.0.1 -p 54322 -U postgres postgres"
    echo ""
}

# Main setup function
main() {
    print_header "LMQB Supabase Setup"
    
    check_prerequisites
    echo ""
    
    start_supabase
    echo ""
    
    check_services
    echo ""
    
    apply_migrations
    echo ""
    
    import_questions
    echo ""
    
    show_connection_info
    show_api_keys
    
    create_frontend_env
    
    show_next_steps
}

# Handle script options
case "${1:-}" in
    "start")
        start_supabase
        ;;
    "stop")
        print_status "INFO" "Stopping Supabase services..."
        $SUPABASE_CLI stop
        print_status "SUCCESS" "Services stopped"
        ;;
    "status")
        $SUPABASE_CLI status
        ;;
    "reset")
        print_status "INFO" "Resetting database..."
        $SUPABASE_CLI db reset
        print_status "SUCCESS" "Database reset complete"
        ;;
    "logs")
        $SUPABASE_CLI logs
        ;;
    "migrate")
        apply_migrations
        ;;
    "import")
        import_questions
        ;;
    "help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Run full setup"
        echo "  start      Start Supabase services"
        echo "  stop       Stop Supabase services"
        echo "  status     Show service status"
        echo "  reset      Reset database and apply migrations"
        echo "  logs       Show service logs"
        echo "  migrate    Apply migrations only"
        echo "  import     Import questions data only"
        echo "  help       Show this help"
        ;;
    *)
        main
        ;;
esac