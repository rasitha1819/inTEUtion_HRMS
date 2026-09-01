@echo off
set "PATH=C:\Users\Cinoj\AppData\Local\Programs\NodeJS;%PATH%"
echo Starting HRMS Frontend (Vite) on http://localhost:5173 ...
cd /d "%~dp0frontend"
"C:\Users\Cinoj\AppData\Local\Programs\NodeJS\npm.cmd" run dev
