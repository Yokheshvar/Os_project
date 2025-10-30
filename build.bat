@echo off
REM Build script for Paging Simulator (Windows alternative to Makefile)
REM Author: Yokheshvar

echo ========================================
echo   Paging Simulator Build Script
echo ========================================

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="all" goto all
if "%1"=="clean" goto clean
if "%1"=="setup" goto setup
if "%1"=="run-ui" goto run_ui
if "%1"=="test" goto test
if "%1"=="run-example" goto run_example
if "%1"=="check" goto check
goto help

:all
echo [INFO] Building all components...
call :compile_paging
call :compile_generator
call :generate_files
echo [SUCCESS] All components built successfully!
goto end

:setup
echo [INFO] Setting up Paging Simulator...
call :all
echo [SUCCESS] Setup complete! Use 'build.bat run-ui' to start.
goto end

:clean
echo [INFO] Cleaning build artifacts...
if exist paging.o del /Q paging.o
if exist paging.exe del /Q paging.exe
if exist process_generator.exe del /Q process_generator.exe
if exist p1.proc del /Q p1.proc
if exist p2.proc del /Q p2.proc
if exist p3.proc del /Q p3.proc
if exist p1.txt del /Q p1.txt
if exist p2.txt del /Q p2.txt
if exist p3.txt del /Q p3.txt
if exist temp_process_*.proc del /Q temp_process_*.proc
echo [SUCCESS] Clean complete!
goto end

:run_ui
echo [INFO] Starting web interface...
call :setup
echo [INFO] Open your browser and go to: http://localhost:8000
python server.py
goto end

:test
echo [INFO] Running tests...
call :all
python test_ui.py
goto end

:run_example
echo [INFO] Running example simulation...
call :all
paging.exe 4096 12 64 p1.proc p2.proc p3.proc
goto end

:check
echo [INFO] Checking system requirements...
echo Checking GCC...
gcc --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] GCC not found. Please install GCC compiler.
    goto end
)
echo [SUCCESS] GCC found
echo Checking Python...
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.6+
    goto end
)
echo [SUCCESS] Python found
echo [SUCCESS] All requirements satisfied!
goto end

:compile_paging
echo [INFO] Compiling paging simulator...
gcc -Wall -Wextra -std=c99 -pedantic -O2 -lm -c paging.c -o paging.o
gcc paging.o -o paging.exe -lm
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to compile paging simulator
    exit /b 1
)
echo [SUCCESS] Paging simulator compiled
goto :eof

:compile_generator
echo [INFO] Compiling process generator...
gcc -Wall -Wextra -std=c99 -pedantic -O2 -o process_generator.exe process_generator.c
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to compile process generator
    exit /b 1
)
echo [SUCCESS] Process generator compiled
goto :eof

:generate_files
echo [INFO] Generating process files...
if exist process_generator.exe (
    process_generator.exe
    echo [SUCCESS] Process files generated
) else (
    echo [ERROR] Process generator not found
    exit /b 1
)
goto :eof

:help
echo.
echo Paging Simulator Build Script (Windows)
echo =====================================
echo.
echo Usage: build.bat [target]
echo.
echo Available targets:
echo   all         - Build all components
echo   setup       - Complete project setup
echo   run-ui      - Build and start web interface
echo   test        - Run automated tests
echo   run-example - Run example simulation
echo   clean       - Remove build artifacts
echo   check       - Check system requirements
echo   help        - Show this help message
echo.
echo Examples:
echo   build.bat setup         # Complete setup
echo   build.bat run-ui        # Start web interface
echo   build.bat run-example   # Example simulation
echo   build.bat clean         # Clean up
echo.
echo Web Interface: http://localhost:8000
echo Project: OS Paging Memory Management Simulator
echo.

:end
