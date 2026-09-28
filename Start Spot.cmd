@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22.16.0 or newer from nodejs.org, then open this file again.
  pause
  exit /b 1
)
node scripts\start.mjs
if errorlevel 1 pause
