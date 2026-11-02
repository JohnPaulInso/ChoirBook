@echo off
rem (2026-07-13) integrate build & sync for Choir Book Pro; prev: pikol build
echo [1/3] Building web assets and PWA bundle...
call npm.cmd run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Asset build failed.
    exit /b %ERRORLEVEL%
)

echo [2/3] Syncing Android project...
if not exist "%~dp0android\local.properties" (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        powershell -NoProfile -Command "[System.IO.File]::WriteAllText('android\local.properties', 'sdk.dir=' + ($env:LOCALAPPDATA -replace '\\', '/') + '/Android/Sdk')"
    )
)
call npx.cmd cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Capacitor sync failed.
    exit /b %ERRORLEVEL%
)

echo [3/3] Assembling Debug APK...
if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
    set "PATH=C:\Program Files\Android\Android Studio\jbr\bin;%PATH%"
)
cd /d "%~dp0android"
call .\gradlew.bat assembleDebug
set "GRADLE_EXIT=%ERRORLEVEL%"
cd /d "%~dp0"

if %GRADLE_EXIT% NEQ 0 (
    echo [ERROR] Gradle build failed with exit code %GRADLE_EXIT%.
    exit /b %GRADLE_EXIT%
)

echo.
echo ============================================
echo  Build complete!
echo ============================================

set "APK_PATH=%~dp0android\app\build\outputs\apk\debug\app-debug.apk"
if exist "%APK_PATH%" (
    echo APK generated at: %APK_PATH%
    copy /Y "%APK_PATH%" "%~dp0choir-book-debug.apk" >nul 2>&1
    copy /Y "%APK_PATH%" "%~dp0android\app\build\outputs\apk\debug\choir-book-debug.apk" >nul 2>&1
    explorer.exe /select,"%APK_PATH%"
) else (
    echo Note: Check android\app\build\outputs\apk\debug\ for generated APK.
)
rem (2026-07-13) Return 0 exit code on successful APK build; was unhandled code
exit /b 0

