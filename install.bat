@echo off
cd /d "C:\Users\test\OneDrive\Desktop\Fitness_Community_Website"
echo Installing dependencies...
"C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install
echo Done. Exit code: %ERRORLEVEL%
