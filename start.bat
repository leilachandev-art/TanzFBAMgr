@echo off
echo =============================================
echo  FBA Manager - Starting...
echo =============================================

if not exist "%~dp0frontend\dist\index.html" (
    echo [WARN] Frontend not built. Running install first...
    call "%~dp0install.bat"
)

echo.
echo  Starting FBA Manager...
echo  Access at: http://localhost:8000
echo  Press Ctrl+C to stop
echo.

cd /d "%~dp0backend"
python main.py

pause
