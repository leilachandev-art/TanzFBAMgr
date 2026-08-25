@echo off
echo =============================================
echo  FBA Manager - First Time Setup
echo =============================================
echo.

REM Use python -m pip to ensure we install into the SAME Python that will run the app
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.10+ from https://python.org
    pause
    exit /b 1
)
echo Using Python:
python --version

node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
echo Using Node.js:
node --version
echo.

echo [1/4] Installing Python backend dependencies...
cd /d "%~dp0backend"
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Python packages
    pause
    exit /b 1
)

echo.
echo [2/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install npm packages
    pause
    exit /b 1
)

echo.
echo [3/4] Building frontend...
call npm run build
if errorlevel 1 (
    echo [ERROR] Failed to build frontend
    pause
    exit /b 1
)

echo.
echo [4/4] Testing backend import...
cd /d "%~dp0backend"
python -c "import flask, sqlalchemy, jwt, bcrypt, openpyxl; print('All packages OK')"
if errorlevel 1 (
    echo [ERROR] Package import test failed
    pause
    exit /b 1
)

echo.
echo =============================================
echo  Installation Successful!
echo =============================================
echo.
echo  Run start.bat to launch the system
echo  Default login: admin / admin123
echo  URL: http://localhost:8000
echo.
pause
