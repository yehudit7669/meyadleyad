@echo off
echo ===============================================
echo   הפעלת WSL 2 - דורש הרשאות מנהל
echo ===============================================
echo.
echo הסקריפט יבקש הרשאות Administrator...
echo אשרי "Yes" בחלון שייפתח.
echo.
pause

PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& {Start-Process PowerShell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File ""%~dp0setup-wsl-admin.ps1""' -Verb RunAs}"
