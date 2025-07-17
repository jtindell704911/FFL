@echo off
REM Start backend server
start "Backend" cmd /k "cd /d %~dp0server && node index.js"
REM Start frontend (Vite)
start "Frontend" cmd /k "cd /d %~dp0 && npm run dev"
