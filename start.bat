@echo off
title SignSpeak - PSL ⇄ Urdu Communication Assistant
echo ===================================================
echo Starting SignSpeak (Two-Way PSL Translator)...
echo ===================================================

echo Starting Backend API on http://127.0.0.1:8000 ...
start "SignSpeak Backend (FastAPI)" cmd /k "cd backend && (if exist venv\Scripts\activate.bat call venv\Scripts\activate.bat) && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Frontend Web App on http://localhost:3000 ...
start "SignSpeak Frontend (Next.js)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo Both servers are launching!
echo Frontend: http://localhost:3000
echo Backend API Docs: http://127.0.0.1:8000/docs
echo ===================================================
echo.
pause

