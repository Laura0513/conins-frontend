@echo off
REM ============================================================
REM CONINS - Database Backup Script
REM Generates a timestamped SQL dump of the conIns database
REM Usage: db-backup.bat
REM ============================================================

setlocal enabledelayedexpansion

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

REM Generate timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "MN=%dt:~10,2%"
set "SS=%dt:~12,2%"

set BACKUP_FILE=backup_%YYYY%-%MM%-%DD%_%HH%%MN%%SS%.sql

echo ============================================================
echo CONINS - Database Backup
echo ============================================================
echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo Output: %BACKUP_FILE%
echo ============================================================

mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% ^
    --routines --triggers --events ^
    --single-transaction --quick ^
    --result-file="%BACKUP_FILE%" ^
    %DB_NAME%

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS: Backup created: %BACKUP_FILE%
    for %%A in ("%BACKUP_FILE%") do echo Size: %%~zA bytes
) else (
    echo.
    echo ERROR: Backup failed (exit code: %errorlevel%)
    echo Check your MySQL credentials and connection.
    exit /b 1
)

endlocal
