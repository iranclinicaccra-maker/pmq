@echo off
echo ========================================
echo Starting Medical PM Manager Web Server
echo ========================================
echo.

cd /d "%~dp0"

echo Checking database connection...
npm run migrate
if errorlevel 1 (
    echo.
    echo ERROR: Database migration failed!
    echo.
    echo Please make sure:
    echo 1. PostgreSQL is running
    echo 2. Database 'pmq_database' exists
    echo 3. .env file has correct DB credentials
    echo.
    pause
    exit /b 1
)

echo.
echo Starting server on port 3000...
echo Access at: http://localhost:3000
echo Login: admin / admin
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

npm start
