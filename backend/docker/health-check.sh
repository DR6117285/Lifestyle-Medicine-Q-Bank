#!/bin/bash

# LMQB Supabase Docker Health Check Script
# This script verifies that all Supabase services are running correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
KONG_URL="http://localhost:8000"
STUDIO_URL="http://localhost:3001"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_DB="postgres"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="dev-password-for-local-testing-only"

# Function to print status
print_status() {
    local service=$1
    local status=$2
    local message=$3
    
    if [ "$status" = "SUCCESS" ]; then
        echo -e "${GREEN}✓${NC} $service: $message"
    elif [ "$status" = "WARNING" ]; then
        echo -e "${YELLOW}⚠${NC} $service: $message"
    else
        echo -e "${RED}✗${NC} $service: $message"
    fi
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -e "${BLUE}Checking $name...${NC}"
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
        if [ "$response" -eq "$expected_code" ] || [ "$response" -eq 404 ]; then
            print_status "$name" "SUCCESS" "HTTP $response (Service responding)"
            return 0
        else
            print_status "$name" "ERROR" "HTTP $response (Unexpected response)"
            return 1
        fi
    else
        print_status "$name" "ERROR" "Connection failed"
        return 1
    fi
}

# Function to check PostgreSQL
check_postgres() {
    echo -e "${BLUE}Checking PostgreSQL Database...${NC}"
    
    if command -v psql >/dev/null 2>&1; then
        if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT version();" >/dev/null 2>&1; then
            print_status "PostgreSQL" "SUCCESS" "Database connection successful"
            
            # Check if our tables exist
            if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT COUNT(*) FROM public.categories;" >/dev/null 2>&1; then
                print_status "LMQB Schema" "SUCCESS" "Application tables exist"
            else
                print_status "LMQB Schema" "WARNING" "Application tables may not be created yet"
            fi
        else
            print_status "PostgreSQL" "ERROR" "Database connection failed"
            return 1
        fi
    else
        print_status "PostgreSQL" "WARNING" "psql not available for testing (install postgresql-client)"
    fi
}

# Function to check Docker containers
check_docker_containers() {
    echo -e "${BLUE}Checking Docker containers...${NC}"
    
    if command -v docker >/dev/null 2>&1; then
        # Get container status
        containers=(
            "supabase-db"
            "supabase-auth" 
            "supabase-rest"
            "supabase-realtime"
            "supabase-storage"
            "supabase-studio"
            "supabase-meta"
            "supabase-kong"
            "supabase-imgproxy"
        )
        
        for container in "${containers[@]}"; do
            if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "docker-${container}-1.*Up\|docker_${container}_1.*Up\|${container}.*Up"; then
                print_status "Container: $container" "SUCCESS" "Running"
            else
                print_status "Container: $container" "ERROR" "Not running or not found"
            fi
        done
    else
        print_status "Docker" "ERROR" "Docker command not available"
        return 1
    fi
}

# Main health check
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}    LMQB Supabase Health Check${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # Check Docker containers first
    check_docker_containers
    echo ""
    
    # Wait a moment for services to be ready
    echo -e "${YELLOW}Waiting 5 seconds for services to be ready...${NC}"
    sleep 5
    echo ""
    
    # Check individual services
    check_http_endpoint "Kong Gateway" "$KONG_URL/rest/v1/" 
    check_http_endpoint "PostgREST API" "$KONG_URL/rest/v1/"
    check_http_endpoint "Auth API" "$KONG_URL/auth/v1/health" 404
    check_http_endpoint "Storage API" "$KONG_URL/storage/v1/healthy" 
    check_http_endpoint "Realtime API" "$KONG_URL/realtime/v1/" 
    check_http_endpoint "Supabase Studio" "$STUDIO_URL"
    echo ""
    
    # Check database
    check_postgres
    echo ""
    
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}Health check completed!${NC}"
    echo ""
    echo -e "If all services are running:"
    echo -e "• Supabase API: ${BLUE}$KONG_URL${NC}"
    echo -e "• Supabase Studio: ${BLUE}$STUDIO_URL${NC}"
    echo -e "• PostgreSQL: ${BLUE}localhost:5432${NC}"
    echo ""
    echo -e "Your React frontend should connect to: ${BLUE}$KONG_URL${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Run the health check
main "$@"