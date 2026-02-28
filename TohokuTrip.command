#!/bin/bash

# ==========================================
# 東北櫻花之旅啟動腳本 (Mac 版)
# ==========================================

# 取得腳本所在目錄
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo "=========================================="
echo "🌸 東北櫻花之旅 - Mac 啟動器"
echo "=========================================="

# 檢查 Python 是否安裝
if ! command -v python3 &> /dev/null; then
    echo "❌ 錯誤：找不到 Python3，請先安裝 Python"
    echo "   建議使用: brew install python"
    exit 1
fi

# 檢查 Node.js 是否安裝
if ! command -v node &> /dev/null; then
    echo "❌ 錯誤：找不到 Node.js，請先安裝 Node"
    echo "   建議使用: brew install node"
    exit 1
fi

# 進入後端目錄
cd "$BACKEND_DIR"

# 檢查並安裝 Python 依賴
echo ""
echo "📦 檢查 Python 依賴..."
if [ ! -d "venv" ]; then
    echo "   建立虛擬環境..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q fastapi uvicorn pywebview geopy openpyxl pydantic

# 啟動後端
echo ""
echo "🚀 啟動後端伺服器 (FastAPI)..."
python main.py &
BACKEND_PID=$!

# 等待後端啟動
echo "   等待伺服器啟動..."
sleep 3

# 檢查後端是否正常運行
if ! curl -s http://127.0.0.1:49152/api/itinerary > /dev/null; then
    echo "⚠️  後端啟動較慢，再多等 3 秒..."
    sleep 3
fi

# 啟動瀏覽器
echo ""
echo "🌐 開啟應用程式..."
open "http://127.0.0.1:49152"

echo ""
echo "=========================================="
echo "✅ 東北櫻花之旅已啟動！"
echo "   網址: http://localhost:49152"
echo "=========================================="
echo ""
echo "按 Enter 鍵停止伺服器..."
read

# 清理
echo "🛑 正在關閉伺服器..."
kill $BACKEND_PID 2>/dev/null
echo "👋 再見！"
