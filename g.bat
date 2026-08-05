@echo off
:: =============================================
:: g.bat - Quick GitHub Upload Script
:: Created: 2026-07-07
:: Updated: 2026-07-07 - Added optional custom commit message via %1 argument
:: Usage:
::   .\g                        -> commits with auto-timestamp
::   .\g "your commit message"  -> commits with your custom message
:: Function: Stages all changes, commits, and pushes to main branch on GitHub.
:: Remote: https://github.com/JohnPaulInso/HydroTrack.git
:: =============================================

:: -- Element: commit message builder --
:: (2026-07-13) Format timestamp as Aug 5, 2026 12-hr am/pm; previously date/t time/t
for /f "delims=" %%a in ('powershell -NoProfile -Command "(Get-Date).ToString('MMM d, yyyy, h:mm tt')"') do set "TS=%%a"

:: -- Element: commitMsg - uses %~1 (first argument stripped of quotes) if provided --
:: Falls back to auto-timestamp if no argument was passed
if "%~1"=="" (
    set "commitMsg=Update: %TS%"
) else (
    set "commitMsg=%~1"
)

echo.
echo ============================================
:: (2026-07-13) Update title to Choir Book; prev: Choir Book Pro
echo  Choir Book - GitHub Auto-Upload
echo  %TS%
echo ============================================
echo.
echo  Commit: "%commitMsg%"
echo.

:: (2026-07-13) Set default Choir Book repo remote; prev: Choir Book Pro
if not exist ".git" (
    echo Initializing Git repository...
    git init
    git branch -M main
)
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin https://github.com/JohnPaulInso/ChoirBook.git
)

:: -- Step 1: Stage all changes --
echo [1/3] Staging all changes...
git add .

:: -- Step 2: Commit with chosen message --
echo [2/3] Committing...
git commit -m "%commitMsg%"

:: -- Step 3: Push to GitHub main branch --
echo [3/3] Pushing to GitHub...
git push -u origin main

echo.
echo ============================================
echo  Done! Changes pushed to GitHub.
echo ============================================
echo.
pause

