@echo off
cd /d "%~dp0web"
if not exist node_modules call npm.cmd install
if errorlevel 1 exit /b 1
call npm.cmd run build
if errorlevel 1 exit /b 1
cd /d "%~dp0backend"
.\venv\Scripts\python.exe scripts\create_dev_cert.py
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --ssl-keyfile certs\key.pem --ssl-certfile certs\cert.pem
