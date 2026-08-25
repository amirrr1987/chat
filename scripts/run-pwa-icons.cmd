@echo off
cd /d "%~dp0\.."
node scripts\generate-pwa-icons.mjs > scripts\pwa-icons-out.txt 2>&1
echo EXIT:%ERRORLEVEL% >> scripts\pwa-icons-out.txt
dir apps\web\public >> scripts\pwa-icons-out.txt 2>&1
