@echo off
echo Starting FBA Manager in DEV mode (hot reload on both backend and frontend)...
echo.

start "FBA Backend" cmd /k "cd /d %~dp0backend && python main.py"

timeout /t 2 /nobreak > nul

cd /d "%~dp0frontend"
echo Frontend dev server starting at http://localhost:3000
call npm run dev

pause
