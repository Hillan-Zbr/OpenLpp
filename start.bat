@echo off
echo Demarrage OpenLPP...

start "OpenLPP Backend" cmd /k "cd /d O:\07_Projets\OpenLpp\OpenLppV2\backend && uvicorn main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

start "OpenLPP Frontend" cmd /k "cd /d O:\07_Projets\OpenLpp\OpenLppV2\frontend && npm run dev"

echo Serveurs demarres :
echo   Backend  : http://localhost:8000
echo   Frontend : http://localhost:5173
