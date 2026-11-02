@echo off
chcp 65001 >nul
cd /d "%~dp0"
call npm run build
if errorlevel 1 goto :error
echo.
echo 构建完成：dist\
pause
goto :eof

:error
echo.
echo 构建失败，请查看上面的错误信息。
pause
