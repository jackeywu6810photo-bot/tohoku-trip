-- ==========================================
-- 東北櫻花之旅 - AppleScript 啟動器
-- ==========================================

-- 取得 App 所在路徑
set appPath to POSIX path of ((path to me as text) & "::")
set startScript to appPath & "start.sh"

-- 檢查 start.sh 是否存在
tell application "System Events"
	if not (exists file startScript) then
		display dialog "找不到啟動腳本：" & startScript buttons {"確定"} default button "確定" with icon stop
		return
	end if
end tell

-- 顯示啟動提示
display notification "正在啟動東北櫻花之旅..." with title "東北櫻花之旅"

-- 在 Terminal 中執行
tell application "Terminal"
	if not (exists window 1) then reopen
	activate
	do script "cd " & quoted form of appPath & " && ./start.sh" in window 1
	set custom title of window 1 to "🌸 東北櫻花之旅"
end tell
