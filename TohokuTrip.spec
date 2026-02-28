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
