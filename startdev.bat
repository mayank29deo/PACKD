@echo off
cd /d "C:\Users\test\OneDrive\Desktop\Fitness_Community_Website"
echo Current dir: %CD%
"C:\Program Files\nodejs\node.exe" node_modules\next\dist\bin\next dev -p 3030
