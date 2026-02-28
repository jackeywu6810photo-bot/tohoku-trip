@echo off
echo ==========================================
echo 1. 正在將網頁編譯成 App 檔案... (請稍候)
echo ==========================================
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 編譯失敗！請檢查程式碼。
    pause
    exit /b
)

echo.
echo ==========================================
echo 2. 編譯成功！正在啟動 App...
echo ==========================================
cd ..\backend
python main.py