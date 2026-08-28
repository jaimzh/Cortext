@echo off
cd /d "%~dp0backend"
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --ssl-keyfile certs\key.pem --ssl-certfile certs\cert.pem
