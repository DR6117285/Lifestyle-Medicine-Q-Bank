#!/bin/bash

# LMQB Supabase Docker Startup Script
# This script starts the Supabase development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
ENV_FILE="$SCRIPT_DIR/.env"

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
    
    # Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        print_status "ERROR" "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose >/dev/null 2>&1; then
        print_status "ERROR" "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_status "ERROR" "Docker daemon is not running"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        print_status "ERROR" ".env file not found at $ENV_FILE"
        exit 1
    fi
    
    # Check if docker-compose.yml exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_status "ERROR" "docker-compose.yml not found at $COMPOSE_FILE"
        exit 1
    fi
    
    print_status "SUCCESS" "All prerequisites met"
}

# Function to start services
start_services() {
    print_status "INFO" "Starting Supabase services..."
    
    cd "$SCRIPT_DIR"
    
    # Pull latest images
    print_status "INFO" "Pulling latest Docker images..."
    docker-compose pull
    
    # Start services
    print_status "INFO" "Starting Docker containers..."
    docker-compose up -d
    
    print_status "SUCCESS" "Services started successfully"
}

# Function to wait for services
wait_for_services() {
    print_status "INFO" "Waiting for services to be ready..."
    
    # Wait for database to be ready
    local retries=30
    while [ $retries -gt 0 ]; do
        if docker-compose exec -T supabase-db pg_isready -U postgres -d postgres >/dev/null 2>&1; then
            print_status "SUCCESS" "Database is ready"
            break
        fi
        print_status "INFO" "Waiting for database... ($retries retries left)"
        sleep 2
        retries=$((retries - 1))
    done
    
    if [ $retries -eq 0 ]; then
        print_status "ERROR" "Database failed to start within timeout"
        return 1
    fi
    
    # Wait a bit more for other services
    print_status "INFO" "Waiting for other services to initialize..."
    sleep 10
}

# Function to show service status
show_service_info() {
    echo ""
    print_status "INFO" "Service Information:"
    echo -e "  ${BLUE}Kong Gateway (API):${NC} http://localhost:8000"
    echo -e "  ${BLUE}Supabase Studio:${NC}    http://localhost:3001"
    echo -e "  ${BLUE}PostgreSQL:${NC}         localhost:5432"
    echo ""
    print_status "INFO" "Your React frontend should use: http://localhost:8000"
    echo ""
    print_status "INFO" "To check service health, run: ./health-check.sh"
    print_status "INFO" "To view logs, run: docker-compose logs -f [service-name]"
    print_status "INFO" "To stop services, run: docker-compose down"
}

# Main function
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}    LMQB Supabase Development Setup${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    check_prerequisites
    echo ""
    
    start_services
    echo ""
    
    wait_for_services
    echo ""
    
    show_service_info
    
    echo ""
    echo -e "${GREEN}🚀 Supabase development environment is ready!${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Handle script options
case "${1:-}" in
    "down"|"stop")
        print_status "INFO" "Stopping Supabase services..."
        cd "$SCRIPT_DIR"
        docker-compose down
        print_status "SUCCESS" "Services stopped"
        ;;
    "logs")
        cd "$SCRIPT_DIR"
        if [ -n "${2:-}" ]; then
            docker-compose logs -f "$2"
        else
            docker-compose logs -f
        fi
        ;;
    "restart")
        cd "$SCRIPT_DIR"
        print_status "INFO" "Restarting services..."
        docker-compose down
        sleep 2
        main
        ;;
    "status")
        cd "$SCRIPT_DIR"
        docker-compose ps
        ;;
    *)
        main
        ;;
esac