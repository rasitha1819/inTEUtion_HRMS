@echo off
echo ========================================================
echo Starting HRMS Backend (Django) on http://127.0.0.1:8000
echo ========================================================
cd /d "%~dp0backend"
"venv\Scripts\python.exe" manage.py runserver 8000
