#!/bin/bash

# ==========================================
# 東北櫻花之旅 - Mac 一鍵啟動器
# ==========================================

# 取得腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "🌸 東北櫻花之旅 啟動中..."
echo "======================================"
echo ""

# 檢查相依性
if ! command -v python3 &> /dev/null; then
    echo "❌ 找不到 Python3"
    echo "請執行: brew install python"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ 找不到 Node.js"
    echo "請執行: brew install node"
    exit 1
fi

# 進入後端目錄
cd "$BACKEND_DIR" || exit 1

# 建立虛擬環境（如果沒有）
if [ ! -d "venv" ]; then
    echo "📦 首次啟動，建立 Python 環境..."
    python3 -m venv venv
fi

# 啟動虛擬環境
source venv/bin/activate

# 安裝/更新 Python 套件
echo "📦 檢查 Python 依賴..."
pip install -q fastapi uvicorn pywebview geopy openpyxl pydantic 2>/dev/null

# 啟動後端
echo "🚀 啟動後端伺服器..."
python main.py &
BACKEND_PID=$!

# 等待後端就緒
echo "⏳ 等待伺服器啟動..."
sleep 4

# 檢查後端是否正常運行
if ! curl -s http://127.0.0.1:49152 > /dev/null 2>&1; then
    echo "⏳ 後端啟動較慢，再多等 3 秒..."
    sleep 3
fi

# 開啟瀏覽器
echo "🌐 開啟應用程式..."
open "http://127.0.0.1:49152"

echo ""
echo "======================================"
echo "✅ 東北櫻花之旅已啟動！"
echo "   網址: http://localhost:49152"
echo "======================================"
echo ""
echo "提示:"
echo "- 請勿關閉這個 Terminal 視窗"
echo "- 按 Ctrl+C 或 Enter 鍵停止伺服器"
echo ""

# 等待使用者輸入來停止
read -p "按 Enter 鍵停止伺服器..."

echo ""
echo "🛑 正在關閉伺服器..."
kill $BACKEND_PID 2>/dev/null
wait $BACKEND_PID 2>/dev/null

echo "👋 感謝使用東北櫻花之旅！"
