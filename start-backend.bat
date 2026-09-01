@echo off
echo Starting HRMS Backend (Django) on http://127.0.0.1:8000 ...
cd /d "%~dp0backend"
"venv\Scripts\python.exe" manage.py runserver 8000
