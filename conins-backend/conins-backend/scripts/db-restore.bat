@echo off
REM ============================================================
REM CONINS - Database Restore Script
REM Restores the conIns database from a SQL backup file
REM Usage: db-restore.bat backup_YYYY-MM-DD_HHMMSS.sql
REM ============================================================

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo ERROR: No backup file specified.
    echo Usage: db-restore.bat ^<backup_file.sql^>
    echo.
    echo Available backups:
    dir /b backup_*.sql 2>nul
    exit /b 1
)

if not exist "%~1" (
    echo ERROR: File not found: %~1
    exit /b 1
)

REM Load .env variables
for /f "tokens=1,* delims==" %%a in (..\.env) do (
    if "%%a"=="DB_HOST" set DB_HOST=%%b
    if "%%a"=="DB_PORT" set DB_PORT=%%b
    if "%%a"=="DB_USER" set DB_USER=%%b
    if "%%a"=="DB_PASSWORD" set DB_PASSWORD=%%b
    if "%%a"=="DB_NAME" set DB_NAME=%%b
)

set DB_HOST=%DB_HOST: =%
set DB_PORT=%DB_PORT: =%
set DB_USER=%DB_USER: =%
set DB_PASSWORD=%DB_PASSWORD: =%
set DB_NAME=%DB_NAME: =%

if not defined DB_HOST set DB_HOST=localhost
if not defined DB_PORT set DB_PORT=3306
if not defined DB_USER set DB_USER=root
if not defined DB_PASSWORD set DB_PASSWORD=root
if not defined DB_NAME set DB_NAME=conIns

echo ============================================================
echo CONINS - Database Restore
echo ============================================================
echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo Backup: %~1
echo ============================================================
echo.
echo WARNING: This will DROP and recreate all tables.
echo All current data will be lost.
echo.
set /p CONFIRM="Continue? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo Restore cancelled.
    exit /b 0
)

echo.
echo Restoring database...

mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < "%~1"

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS: Database restored from %~1
) else (
    echo.
    echo ERROR: Restore failed (exit code: %errorlevel%)
    echo Check your MySQL credentials and backup file.
    exit /b 1
)

endlocal
