# 🌸 東北櫻花之旅 - Mac 使用說明

## 快速啟動（推薦）

### 方法 1：雙擊 App 啟動（最簡單）
1. 打開 Finder，進入 `/Volumes/Date/app/TohokuTripApp/`
2. 將 `TohokuTripMac.app` 拖曳到「應用程式」資料夾
3. 雙擊「東北櫻花之旅」App 圖示
4. 首次啟動可能需要到「系統偏好設定 → 安全性與隱私」允許

### 方法 2：使用 Terminal 啟動
```bash
cd /Volumes/Date/app/TohokuTripApp
./TohokuTrip.command
```

### 方法 3：使用 AppleScript
```bash
osascript TohokuTrip.scpt
```

---

## 📋 系統需求

- macOS 11.0 (Big Sur) 或更新版本
- Python 3.9+ (`brew install python`)
- Node.js 18+ (`brew install node`)

---

## 🔧 完整打包成獨立 App

如果你想要一個不需要安裝 Python/Node 的獨立 App：

```bash
cd /Volumes/Date/app/TohokuTripApp
./build_mac_app.sh
```

打包完成後會在 `backend/dist/` 產生獨立的 `TohokuTrip.app`

---

## 📁 檔案說明

| 檔案 | 用途 |
|------|------|
| `TohokuTripMac.app` | Mac App Bundle（推薦使用） |
| `TohokuTrip.command` | Terminal 啟動腳本 |
| `TohokuTrip.scpt` | AppleScript 腳本 |
| `build_mac_app.sh` | 打包成獨立 App 的腳本 |

---

## 🚀 啟動後

1. App 會自動開啟瀏覽器
2. 網址：`http://localhost:49152`
3. 關閉 Terminal 視窗即可停止伺服器

---

## 📝 注意事項

- 首次啟動會自動安裝 Python 依賴（需要網路）
- App 使用 PyWebView 內嵌瀏覽器
- 資料儲存在 `backend/db.json`
