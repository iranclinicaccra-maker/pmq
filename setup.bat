@echo off
echo ========================================
echo Medical PM Manager - Web Server Setup
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Building client (React frontend)...
cd client
call npm install
if errorlevel 1 (
    echo ERROR: Client npm install failed!
    pause
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo ERROR: Client build failed!
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo SUCCESS! Setup complete.
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Install PostgreSQL (if not already installed)
echo 2. Run database\setup-db.sql in pgAdmin
echo 3. Edit .env file with your DB password
echo 4. Run: npm run migrate
echo 5. Run: npm start
echo.
echo See QUICKSTART.md for details
echo ========================================
pause
