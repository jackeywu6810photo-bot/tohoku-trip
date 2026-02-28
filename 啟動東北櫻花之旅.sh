#!/bin/bash

# ==========================================
# 東北櫻花之旅 - 一鍵啟動腳本 (Mac)
# ==========================================

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$APP_DIR/backend"

echo "🌸 東北櫻花之旅 啟動中..."
echo ""

# 檢查相依性
if ! command -v python3 &> /dev/null; then
    osascript -e 'display dialog "請先安裝 Python3：brew install python" buttons {"確定"} with icon stop'
    exit 1
fi

# 啟動後端
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    echo "📦 首次啟動，建立環境..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q fastapi uvicorn pywebview geopy openpyxl pydantic

echo "🚀 啟動伺服器..."
python main.py &
echo $! > /tmp/tohoku.pid

# 等待並開啟瀏覽器
sleep 3
open "http://127.0.0.1:49152"

echo "✅ 已開啟瀏覽器"
echo "按 Enter 停止伺服器..."
read

kill $(cat /tmp/tohoku.pid) 2>/dev/null
rm /tmp/tohoku.pid
