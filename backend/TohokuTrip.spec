# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[('/Volumes/Date/app/TohokuTripApp/frontend/out', 'frontend/out'), ('/Volumes/Date/app/TohokuTripApp/backend/db.json', '.')],
    hiddenimports=['webview', 'webview.platforms.cocoa', 'uvicorn', 'fastapi', 'pydantic', 'geopy', 'openpyxl', 'starlette'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='TohokuTrip',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='TohokuTrip',
)
app = BUNDLE(
    coll,
    name='TohokuTrip.app',
    icon=None,
    bundle_identifier='com.jkhomeclaw.tohokutrip',
)
