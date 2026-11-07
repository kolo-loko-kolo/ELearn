@echo off
cd /d "%~dp0"

:: 1. Check if server is already running on port 3000
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% equ 0 goto open_app

:: 2. If not running, start Next.js dev server minimized with cmd /k to stay alive
start "ELearn Dev Server" /min cmd /k "npm run dev"

:: 3. Wait for port 3000 to be ready
set count=0
:wait_loop
ping 127.0.0.1 -n 2 >nul
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% equ 0 goto open_app

set /a count+=1
if %count% geq 20 goto open_app
goto wait_loop

:open_app
:: 4. Open in Native App Mode via Edge or Chrome
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
    exit
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
    exit
)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000
    exit
)
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000
    exit
)

start http://localhost:3000
exit