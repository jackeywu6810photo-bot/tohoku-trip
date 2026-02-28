#!/bin/bash

# ==========================================
# 東北櫻花之旅 Mac App 打包腳本
# ==========================================

echo "🌸 東北櫻花之旅 - Mac App 打包器"
echo ""

# 檢查必要工具
if ! command -v python3 &> /dev/null; then
    echo "❌ 需要先安裝 Python3"
    exit 1
fi

# 安裝 PyInstaller
echo "📦 安裝打包工具..."
pip3 install -q pyinstaller py2app

cd /Volumes/Date/app/TohokuTripApp/backend

# 啟動虛擬環境
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

# 安裝依賴
pip install -q fastapi uvicorn pywebview geopy openpyxl pydantic pyinstaller

echo ""
echo "🔨 開始打包..."

# 創建 PyInstaller 規格檔
cat > TohokuTrip.spec << 'EOF'
# -*- mode: python ; coding: utf-8 -*-
import sys
from pathlib import Path

block_cipher = None

# 取得 frontend 路徑
frontend_path = Path(__file__).parent.parent / "frontend" / "out"

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[
        (str(frontend_path), 'frontend/out'),
    ],
    hiddenimports=['webview', 'uvicorn', 'fastapi', 'pydantic', 'geopy', 'openpyxl'],
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
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

# Mac App Bundle
app = BUNDLE(
    exe,
    name='TohokuTrip.app',
    icon=None,
    bundle_identifier='com.jkhomeclaw.tohokutrip',
)
EOF

# 執行打包
pyinstaller TohokuTrip.spec --clean --noconfirm

# 複製 db.json 到輸出目錄
cp db.json dist/TohokuTrip.app/Contents/MacOS/ 2>/dev/null || true

echo ""
echo "✅ 打包完成！"
echo ""
echo "📁 App 位置:"
echo "   /Volumes/Date/app/TohokuTripApp/backend/dist/TohokuTrip.app"
echo ""
echo "🚀 你可以將 App 拖曳到「應用程式」資料夾使用"
