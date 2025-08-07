#!/bin/bash

# LMQB Setup Script
# Sets up the development environment for the Lifestyle Medicine Question Bank

set -e

echo "🚀 Setting up LMQB (Lifestyle Medicine Question Bank)"

# Check if required tools are installed
check_dependencies() {
    echo "📋 Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose."
        exit 1
    fi
    
    echo "✅ All dependencies are installed"
}

# Setup frontend
setup_frontend() {
    echo "📦 Setting up frontend..."
    cd frontend
    
    if [ ! -f "package.json" ]; then
        echo "❌ Frontend package.json not found"
        exit 1
    fi
    
    echo "Installing frontend dependencies..."
    npm install
    
    echo "✅ Frontend setup complete"
    cd ..
}

# Setup backend
setup_backend() {
    echo "🐳 Setting up backend..."
    cd backend/docker
    
    if [ ! -f ".env" ]; then
        echo "📝 Creating .env file from example..."
        cp .env.example .env
        echo "⚠️  Please edit backend/docker/.env with your configuration"
    fi
    
    echo "✅ Backend setup complete"
    cd ../..
}

# Create data directories
setup_data() {
    echo "📁 Setting up data directories..."
    
    mkdir -p data/questions/general
    mkdir -p data/questions/board-review
    mkdir -p data/questions/study-tool
    mkdir -p data/backups
    
    echo "✅ Data directories created"
}

# Generate JWT secret
generate_jwt_secret() {
    if command -v openssl &> /dev/null; then
        echo "🔐 Generating JWT secret..."
        JWT_SECRET=$(openssl rand -hex 32)
        echo "Generated JWT_SECRET: $JWT_SECRET"
        echo "Please update your .env file with this JWT secret"
    else
        echo "⚠️  OpenSSL not found. Please manually generate a 64-character JWT secret"
    fi
}

# Main setup
main() {
    echo "Starting LMQB setup..."
    
    check_dependencies
    setup_frontend
    setup_backend
    setup_data
    generate_jwt_secret
    
    echo ""
    echo "🎉 LMQB setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Edit backend/docker/.env with your configuration"
    echo "2. Run 'cd backend/docker && docker-compose up -d' to start Supabase"
    echo "3. Run 'cd frontend && npm run dev' to start the frontend"
    echo "4. Import your question data using the import script"
    echo ""
    echo "📚 Check docs/DEVELOPMENT.md for detailed setup instructions"
}

# Run main function
main "$@"