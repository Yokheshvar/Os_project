@echo off
echo ========================================
echo   Paging Simulator UI Launcher
echo ========================================
echo.

REM Check if paging executable exists
if not exist "paging.exe" (
    echo [ERROR] paging.exe not found!
    echo Compiling the simulator...
    gcc -Wall -lm -o paging paging.c
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Compilation failed!
        pause
        exit /b 1
    )
    echo [SUCCESS] Compilation completed!
    echo.
)

REM Check if Python is available
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found! Please install Python 3.6+
    pause
    exit /b 1
)

REM Start the server
echo [INFO] Starting the web server...
echo [INFO] The server will automatically find an available port (8000-8009)
echo [INFO] Check the server output for the correct URL
echo [INFO] Press Ctrl+C to stop the server
echo.
python server.py

pause
