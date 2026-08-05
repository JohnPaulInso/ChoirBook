@echo off
REM Ultra-quick command: just type "a" to build and open Android Studio
REM (2026-07-13) Update Choir Book Pro build/sync; prev: HydroTrack build/sync
call npm run sync
call npx cap open android

