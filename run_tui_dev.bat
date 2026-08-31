@echo off
cd /d "%~dp0backend"
.\venv\Scripts\watchfiles.exe --filter python ".\venv\Scripts\textual.exe run --dev tui\main.py" tui
