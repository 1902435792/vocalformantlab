@echo off
chcp 65001 >nul
title Vocal Formant Lab Launcher
echo ==========================================
echo       Vocal Formant Lab 启动脚本
echo ==========================================
echo.
echo [1/3] 正在启动后台服务...
echo       (服务窗口将最小化运行)
start "Vocal Lab Server" /min cmd /k "npm run dev"

echo [2/3] 等待服务就绪 (约4秒)...
timeout /t 4 /nobreak >nul

echo [3/3] 正在打开浏览器...
start http://localhost:3000

echo.
echo ==========================================
echo             操作完成
echo ==========================================
echo * 网页已在默认浏览器中打开
echo * 请勿关闭任务栏上最小化的 cmd 窗口 (它在运行服务)
echo.
pause
