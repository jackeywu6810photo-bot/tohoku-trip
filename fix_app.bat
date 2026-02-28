@echo off
title 系統自動修復工具
color 0b

echo ==========================================
echo 1. 正在停止所有相關程式...
echo ==========================================
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo ==========================================
echo 2. 清理舊資料庫 (確保格式正確)...
echo ==========================================
if exist "backend\db.json" (
    del "backend\db.json"
    echo ✅ 已刪除舊資料庫，下次啟動會自動重建。
) else (
    echo ℹ️ 資料庫已清除。
)

echo.
echo ==========================================
echo 3. 強制重新安裝後端套件 (修復缺檔)...
echo ==========================================
cd backend
pip install fastapi uvicorn pydantic geopy openpyxl
if %errorlevel% neq 0 (
    color 0c
    echo ❌ 後端套件安裝失敗！請檢查網路或 Python 設定。
    pause
    exit
)
cd ..

echo.
echo ==========================================
echo 4. 強制重新安裝前端套件...
echo ==========================================
cd frontend
call npm install date-fns react-datepicker
cd ..

echo.
echo ==========================================
echo ✅ 修復完成！正在重新啟動系統...
echo ==========================================
timeout /t 3 >nul
start start_app.bat