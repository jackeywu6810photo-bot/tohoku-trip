-- 東北櫻花之旅 Mac App
-- AppleScript 啟動器

set appDir to POSIX path of ((path to me as text) & "::")
set backendDir to appDir & "backend"

-- 檢查 Python
try
	do shell script "which python3"
on error
	display dialog "需要安裝 Python3" buttons {"確定"} default button "確定" with icon stop
	return
end try

-- 啟動後端
tell application "Terminal"
	if not (exists window 1) then reopen
	do script "cd " & quoted form of backendDir & " && source venv/bin/activate 2>/dev/null || python3 -m venv venv && source venv/bin/activate && pip install -q fastapi uvicorn pywebview geopy openpyxl pydantic && python main.py" in window 1
	set custom title of window 1 to "東北櫻花之旅 - 後端伺服器"
end tell

-- 等待伺服器啟動
delay 3

-- 開啟瀏覽器
tell application "Safari"
	activate
	tell window 1
		set current tab to (make new tab with properties {URL:"http://127.0.0.1:49152"})
	end tell
end tell

display notification "東北櫻花之旅已啟動！" with title "TohokuTrip"
