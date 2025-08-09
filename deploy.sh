#!/bin/bash

# LMQB Deployment Orchestration Script
# Usage: ./deploy.sh [start|stop|restart|status|logs]

set -e

PROJECT_ROOT="/home/dr6117285/lmqb"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
SUPABASE_DIR="$PROJECT_ROOT/supabase"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -ti:$port > /dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port safely
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        log "Killing processes on port $port: $pids"
        kill $pids
        sleep 2
        
        # Force kill if still running
        local remaining_pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            warn "Force killing remaining processes on port $port"
            kill -9 $remaining_pids
        fi
    fi
}

# Function to start Supabase
start_supabase() {
    log "Starting Supabase local development environment..."
    cd "$SUPABASE_DIR"
    
    if ! supabase status > /dev/null 2>&1; then
        supabase start
    else
        log "Supabase is already running"
    fi
    
    # Wait for Supabase to be ready
    sleep 3
    supabase status
}

# Function to start frontend
start_frontend() {
    log "Starting frontend development server..."
    cd "$FRONTEND_DIR"
    
    # Kill any existing process on port 3000
    kill_port 3000
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        log "Installing/updating npm dependencies..."
        npm install
    fi
    
    # Start development server in background
    log "Starting Vite development server on port 3000..."
    nohup npm run dev > /tmp/lmqb-frontend.log 2>&1 &
    
    # Wait a moment and check if it started successfully
    sleep 5
    if check_port 3000; then
        log "Frontend server started successfully on http://localhost:3000"
    else
        error "Failed to start frontend server"
        exit 1
    fi
}

# Function to stop services
stop_services() {
    log "Stopping LMQB services..."
    
    # Stop frontend
    kill_port 3000
    
    # Stop Supabase
    cd "$SUPABASE_DIR"
    supabase stop
    
    log "All services stopped"
}

# Function to show status
show_status() {
    log "LMQB Service Status:"
    echo "===================="
    
    # Check Supabase
    cd "$SUPABASE_DIR"
    if supabase status > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Supabase: Running${NC}"
        supabase status | head -10
    else
        echo -e "${RED}✗ Supabase: Stopped${NC}"
    fi
    
    echo ""
    
    # Check Frontend
    if check_port 3000; then
        echo -e "${GREEN}✓ Frontend: Running on port 3000${NC}"
        echo "  URL: http://localhost:3000"
    else
        echo -e "${RED}✗ Frontend: Stopped${NC}"
    fi
    
    echo ""
    echo "Recent frontend logs:"
    echo "--------------------"
    tail -10 /tmp/lmqb-frontend.log 2>/dev/null || echo "No logs available"
}

# Function to show logs
show_logs() {
    log "LMQB Frontend Logs (last 50 lines):"
    echo "===================================="
    tail -50 /tmp/lmqb-frontend.log 2>/dev/null || echo "No logs available"
}

# Function to verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check Supabase API
    if curl -s http://127.0.0.1:54321/rest/v1/ > /dev/null; then
        echo -e "${GREEN}✓ Supabase API: Accessible${NC}"
    else
        echo -e "${RED}✗ Supabase API: Not accessible${NC}"
    fi
    
    # Check Frontend
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✓ Frontend: Accessible${NC}"
    else
        echo -e "${RED}✗ Frontend: Not accessible${NC}"
    fi
    
    # Check environment variables
    cd "$FRONTEND_DIR"
    if [ -f ".env.local" ]; then
        echo -e "${GREEN}✓ Environment: .env.local exists${NC}"
    else
        echo -e "${YELLOW}⚠ Environment: .env.local missing${NC}"
    fi
}

# Main command handling
case "${1:-start}" in
    "start")
        log "Starting LMQB full stack..."
        start_supabase
        start_frontend
        verify_deployment
        show_status
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        log "Restarting LMQB services..."
        stop_services
        sleep 2
        start_supabase
        start_frontend
        verify_deployment
        show_status
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "verify")
        verify_deployment
        ;;
    *)
        echo "Usage: $0 [start|stop|restart|status|logs|verify]"
        echo ""
        echo "Commands:"
        echo "  start   - Start both Supabase and Frontend services"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  status  - Show service status"
        echo "  logs    - Show frontend logs"
        echo "  verify  - Verify deployment health"
        exit 1
        ;;
esac