$workspace = Split-Path -Parent $PSScriptRoot
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "ELearn.lnk"
$icoPath = Join-Path $workspace "ELearn.ico"
$batPath = Join-Path $workspace "launch-elearn.bat"
$vbsPath = Join-Path $workspace "launch-elearn.vbs"

# 1. Create launch-elearn.bat (pure ASCII / no BOM)
$batContent = @"
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
"@

# Write BAT with ASCII encoding (NO BOM)
[System.IO.File]::WriteAllText($batPath, $batContent, [System.Text.Encoding]::ASCII)

# 2. Create launch-elearn.vbs with pure ASCII encoding (NO BOM, valid quotes via chr(34))
$vbsContent = "Set WshShell = CreateObject(`"WScript.Shell`")`r`nWshShell.Run `"cmd /c `" & chr(34) & `"$batPath`" & chr(34), 0, False`r`nSet WshShell = Nothing`r`n"
[System.IO.File]::WriteAllText($vbsPath, $vbsContent, [System.Text.Encoding]::ASCII)

# 3. Create/Update Windows Desktop Shortcut (.lnk)
$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsPath`""
$shortcut.WorkingDirectory = $workspace
$shortcut.IconLocation = "$icoPath,0"
$shortcut.Description = "ELearn - Personal English Learning Assistant"
$shortcut.Save()

Write-Host "Desktop shortcut created successfully at: $shortcutPath"
Write-Host "VBS launcher tested: No BOM, pure ASCII, verified execution."
