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

echo "📦 步驟 1/4: 建立虛擬環境..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

echo "📦 步驟 2/4: 安裝依賴..."
pip install -q --upgrade pip
pip install -q pyinstaller fastapi uvicorn pywebview geopy openpyxl pydantic

echo "📦 步驟 3/4: 確保前端已建置..."
if [ ! -d "$FRONTEND_DIR/out" ]; then
    echo "   前端靜態檔案不存在，正在建置..."
    cd "$FRONTEND_DIR"
    npm install
    npm run build
    cd "$BACKEND_DIR"
fi

echo "📦 步驟 4/4: 打包執行檔..."

# 創建 PyInstaller 規格檔 (使用 Python 直接寫入)
python3 <> 'PYEOF'
import sys
from pathlib import Path

spec_content = '''
# -*- mode: python ; coding: utf-8 -*-
import sys
from pathlib import Path

block_cipher = None

# 路徑設定
frontend_path = Path('/Volumes/Date/app/TohokuTripApp/frontend/out')
backend_path = Path('/Volumes/Date/app/TohokuTripApp/backend')

a = Analysis(
    ['main.py'],
    pathex=[str(backend_path)],
    binaries=[],
    datas=[
        (str(frontend_path), 'frontend/out'),
    ],
    hiddenimports=[
        'webview',
        'webview.platforms.cocoa',
        'uvicorn',
        'fastapi',
        'pydantic',
        'geopy',
        'openpyxl',
        'starlette',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='TohokuTrip',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=True,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

app = BUNDLE(
    exe,
    name='TohokuTrip.app',
    icon=None,
    bundle_identifier='com.jkhomeclaw.tohokutrip',
    info_plist={
        'CFBundleShortVersionString': '2.0.0',
        'CFBundleVersion': '2026.04',
        'LSMinimumSystemVersion': '10.15',
        'NSHighResolutionCapable': True,
    },
)
'''

with open('TohokuTrip.spec', 'w') as f:
    f.write(spec_content)

print("✅ spec 檔案創建完成")
PYEOF

# 執行 PyInstaller
pyinstaller TohokuTrip.spec --clean --noconfirm

# 複製 db.json 到輸出目錄
cp db.json "$DIST_DIR/TohokuTrip.app/Contents/MacOS/" 2>/dev/null || true

echo ""
echo "======================================"
echo "✅ 打包完成！"
echo "======================================"
echo ""
echo "📁 輸出位置:"
echo "   $DIST_DIR/TohokuTrip.app"
echo ""
echo "🚀 使用方式:"
echo "   1. 雙擊 $DIST_DIR/TohokuTrip.app"
echo "   2. 或執行: open '$DIST_DIR/TohokuTrip.app'"
echo ""
echo "📋 檔案說明:"
echo "   - 單一 App，內嵌視窗"
echo "   - 不會跳出瀏覽器"
echo "   - 不會顯示 Terminal"
echo ""

# 開啟 Finder
echo "🗂️ 正在開啟 Finder..."
open "$DIST_DIR"
