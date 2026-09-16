@echo off
chcp 65001 >nul
title תמלול עברית
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [X] Node.js is not installed.
  echo      Download it from https://nodejs.org and run this file again.
  echo.
  pause
  exit /b 1
)

node server.js
pause
