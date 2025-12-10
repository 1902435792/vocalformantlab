@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Vocal Formant Lab Launcher

echo ==========================================
echo       Vocal Formant Lab 启动助手
echo ==========================================
echo.

:: 1. Check Node.js
echo [1/4] 检查环境 (Node.js)...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] 未检测到 Node.js！
    echo 请先安装 Node.js (v18+)，然后重试。
    echo 下载地址: https://nodejs.org/
    echo.
    pause
    exit /b
)
echo       - Node.js 已安装。

:: 2. Check and Install Dependencies
echo [2/4] 检查依赖...
if not exist "node_modules" (
    echo       - 首次运行，正在自动安装依赖 (需要几分钟)...
    call npm install
    if !errorlevel! neq 0 (
        echo.
        echo [ERROR] 依赖安装失败！请检查网络连接。
        pause
        exit /b
    )
    echo       - 依赖安装完成！
) else (
    echo       - 依赖已就绪。
)

:: 3. Check Configuration (.env.local)
echo [3/4] 检查配置...
if not exist ".env.local" (
    echo       - 未检测到配置文件。
    if exist ".env.local.example" (
        copy ".env.local.example" ".env.local" >nul
        echo       - 已自动生成 .env.local 文件。
        echo.
        echo [配置向导]
        echo 请打开项目目录下的 .env.local 文件。
        echo 将里面的 GEMINI_API_KEY 替换为您自己的 Key。
        echo.
        echo (如果没有 Key，程序可能无法正常分析音频)
        echo.
        set /p "dummy=修改完成后，请按任意键继续启动..."
    ) else (
        echo       - [WARN] 缺少 .env.local.example 模板，跳过自动创建。
    )
) else (
    echo       - 配置文件已就绪。
)

:: 4. Start Server
echo.
echo [4/4] 正在启动服务...
echo       (服务窗口将最小化运行，请勿关闭)
start "Vocal Lab Server" /min cmd /k "npm run dev"

echo.
echo ==========================================
echo             正在打开浏览器...
echo ==========================================
:: Wait a bit for server to spin up
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo * 提示: 如果浏览器显示“无法访问”，请稍等几秒刷新页面。
echo * 服务器窗口已最小化到任务栏。
echo.
pause
