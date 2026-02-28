#!/bin/bash

# ==========================================
# 東北櫻花之旅 - Mac 單一執行檔打包腳本
# ==========================================

set -e

echo "🌸 東北櫻花之旅 - 單一執行檔打包器"
echo "======================================"
echo ""

# 路徑設定
APP_DIR="/Volumes/Date/app/TohokuTripApp"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
DIST_DIR="$BACKEND_DIR/dist"

cd "$BACKEND_DIR"

# 檢查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 找不到 Python3"
    exit 1
fi

echo "📦 步驟 1/3: 建立虛擬環境..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

echo "📦 步驟 2/3: 安裝依賴..."
pip install -q --upgrade pip
pip install -q pyinstaller fastapi uvicorn pywebview geopy openpyxl pydantic 2>&1 | grep -v "already satisfied" || true

echo "📦 步驟 3/3: 打包執行檔..."

# 使用 PyInstaller 直接打包（不創建 spec 檔案）
pyinstaller \
    --name="TohokuTrip" \
    --windowed \
    --onefile \
    --add-data="/Volumes/Date/app/TohokuTripApp/frontend/out:frontend/out" \
    --hidden-import=webview \
    --hidden-import=webview.platforms.cocoa \
    --hidden-import=uvicorn \
    --hidden-import=fastapi \
    --hidden-import=pydantic \
    --hidden-import=geopy \
    --hidden-import=openpyxl \
    --hidden-import=starlette \
    --osx-bundle-identifier="com.jkhomeclaw.tohokutrip" \
    --clean \
    --noconfirm \
    main.py

# 複製 db.json
cp db.json "$DIST_DIR/" 2>/dev/null || true

echo ""
echo "======================================"
echo "✅ 打包完成！"
echo "======================================"
echo ""
echo "📁 輸出位置:"
echo "   $DIST_DIR/TohokuTrip.app"
echo ""
echo "🚀 使用方式:"
echo "   open '$DIST_DIR/TohokuTrip.app'"
echo ""

open "$DIST_DIR"
