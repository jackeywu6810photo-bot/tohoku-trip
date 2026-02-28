@echo off
title 東北櫻花之旅啟動腳本

echo ==========================================
echo 正在啟動後端伺服器 (FastAPI)...
echo ==========================================
start "Backend Server" cmd /k "cd backend && python main.py"

echo.
echo ==========================================
echo 正在啟動前端伺服器 (Next.js)...
echo ==========================================
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo 等待伺服器啟動 (5秒後開啟瀏覽器)...
echo ==========================================
timeout /t 5 >nul

start http://localhost:3000

echo.
echo ✅ 系統已啟動！請勿關閉彈出的黑視窗。
echo.
pause