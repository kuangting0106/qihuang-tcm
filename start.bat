@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist node_modules (
  echo 正在安装依赖，请稍候...
  call npm install
  if errorlevel 1 goto :error
)

echo.
echo 岐黄图鉴启动中：http://127.0.0.1:5174/
echo 关闭此窗口即可停止。
echo.
call npm run dev -- --open
goto :eof

:error
echo.
echo 依赖安装失败，请确认已安装 Node.js 22 或以上版本。
pause
