@echo off
chcp 65001 >nul
echo ========================================
echo    SmartDigest 开发环境启动脚本
echo ========================================
echo.

echo 正在检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未找到Node.js，请先安装Node.js
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js环境检查通过
echo.

echo 正在检查MySQL服务...
sc query mysql >nul 2>&1
if errorlevel 1 (
    echo ⚠️  警告：未检测到MySQL服务，请确保MySQL已安装并启动
    echo 继续启动可能导致数据库连接失败
    echo.
)

echo 正在启动后端服务...
cd /d "%~dp0backend"
if not exist node_modules (
    echo 首次运行，正在安装后端依赖...
    call npm install
)

if not exist .env (
    echo 正在创建环境配置文件...
    copy .env.example .env
    echo ⚠️  请编辑 backend\.env 文件配置数据库和API密钥
    echo.
)

start cmd /k "title SmartDigest Backend && npm run dev"
echo ✅ 后端服务启动中... (端口: 3000)
echo.

echo 正在启动前端服务...
cd /d "%~dp0frontend\final-project"
if not exist node_modules (
    echo 首次运行，正在安装前端依赖...
    call npm install
)

start cmd /k "title SmartDigest Frontend && npm run dev"
echo ✅ 前端服务启动中... (端口: 5173)
echo.

timeout /t 3 /nobreak >nul

echo ========================================
echo 🚀 SmartDigest 开发环境启动完成！
echo ========================================
echo.
echo 📝 访问地址：
echo    前端：http://localhost:5173
echo    后端：http://localhost:3000
echo    健康检查：http://localhost:3000/health
echo.
echo 📋 下一步操作：
echo 1. 确保MySQL服务正在运行
echo 2. 配置 backend\.env 文件中的数据库和API密钥
echo 3. 访问前端地址开始使用
echo.
echo 🔧 可选配置：
echo    n8n工作流：请参考 N8N_SETUP.md 文件
echo.
echo 按任意键退出...
pause >nul
