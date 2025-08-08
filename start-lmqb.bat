@echo off
echo ========================================
echo  Starting LMQB Application
echo  Lifestyle Medicine Question Bank
echo ========================================
echo.

REM Change to the project directory
cd /d "\\wsl.localhost\Ubuntu\home\dr6117285\lmqb"

echo [1/3] Starting Supabase services...
wsl ~/.local/bin/supabase start

if %errorlevel% neq 0 (
    echo ERROR: Failed to start Supabase services
    echo Make sure Docker is running and WSL is configured
    pause
    exit /b 1
)

echo.
echo [2/3] Starting Frontend development server...
echo Opening new terminal for frontend...

REM Start frontend in a new window
start "LMQB Frontend" wsl -e bash -c "cd /home/dr6117285/lmqb/frontend && npm run dev"

echo.
echo [3/3] Opening application in browser...
timeout /t 5 /nobreak >nul
start "LMQB App" "http://localhost:3000"
start "Supabase Studio" "http://127.0.0.1:54323"

echo.
echo ========================================
echo  LMQB Application Started Successfully!
echo ========================================
echo.
echo Frontend App:    http://localhost:3000
echo Admin Studio:    http://127.0.0.1:54323
echo API Endpoint:    http://127.0.0.1:54321
echo.
echo The application is now running!
echo Close this window when done using the app.
echo.
echo Press any key to keep this window open...
pause >nul