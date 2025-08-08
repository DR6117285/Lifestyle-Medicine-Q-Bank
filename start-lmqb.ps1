# LMQB Application Startup Script
# Lifestyle Medicine Question Bank - One-Click Launcher

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Starting LMQB Application" -ForegroundColor Yellow
Write-Host " Lifestyle Medicine Question Bank" -ForegroundColor Yellow  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if WSL is available
try {
    wsl --version | Out-Null
    Write-Host "✓ WSL is available" -ForegroundColor Green
} catch {
    Write-Host "✗ WSL is not available. Please install WSL first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Navigate to project directory
$projectPath = "\\wsl.localhost\Ubuntu\home\dr6117285\lmqb"
if (-not (Test-Path $projectPath)) {
    Write-Host "✗ Project directory not found: $projectPath" -ForegroundColor Red
    Write-Host "Make sure the LMQB project is cloned and available in WSL" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Project directory found" -ForegroundColor Green
Write-Host ""

# Step 1: Start Supabase services
Write-Host "[1/3] Starting Supabase services..." -ForegroundColor Yellow
try {
    wsl -e bash -c "cd /home/dr6117285/lmqb && ~/.local/bin/supabase start"
    Write-Host "✓ Supabase services started" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to start Supabase services" -ForegroundColor Red
    Write-Host "Make sure Docker is running in WSL" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 2: Start Frontend
Write-Host "[2/3] Starting Frontend development server..." -ForegroundColor Yellow
try {
    # Start frontend in background
    Start-Process -WindowStyle Minimized -FilePath "wsl" -ArgumentList "-e", "bash", "-c", "cd /home/dr6117285/lmqb/frontend && npm run dev"
    Write-Host "✓ Frontend server starting..." -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to start frontend server" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 3: Open browsers
Write-Host "[3/3] Opening application in browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

try {
    Start-Process "http://localhost:3000"
    Start-Process "http://127.0.0.1:54323"
    Write-Host "✓ Browsers opened" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to open browsers" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " LMQB Application Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Frontend App:    http://localhost:3000" -ForegroundColor White
Write-Host "🎛️  Admin Studio:    http://127.0.0.1:54323" -ForegroundColor White  
Write-Host "🔗 API Endpoint:    http://127.0.0.1:54321" -ForegroundColor White
Write-Host ""
Write-Host "📚 Ready for 777+ Lifestyle Medicine Questions!" -ForegroundColor Yellow
Write-Host ""
Write-Host "The application is now running!" -ForegroundColor Green
Write-Host "You can close this window - the services will continue running." -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to close this launcher"