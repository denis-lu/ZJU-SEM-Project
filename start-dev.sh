#!/bin/bash

# SmartDigest 开发环境启动脚本 (Linux/Mac)

echo "========================================"
echo "   SmartDigest 开发环境启动脚本"
echo "========================================"
echo

# 检查Node.js
echo "正在检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到Node.js，请先安装Node.js"
    echo "下载地址：https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js环境检查通过"
echo

# 检查MySQL
echo "正在检查MySQL服务..."
if ! command -v mysql &> /dev/null && ! command -v mysqld &> /dev/null; then
    echo "⚠️  警告：未检测到MySQL，请确保MySQL已安装并启动"
    echo "继续启动可能导致数据库连接失败"
    echo
fi

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 启动后端服务
echo "正在启动后端服务..."
cd "$SCRIPT_DIR/backend"

if [ ! -d "node_modules" ]; then
    echo "首次运行，正在安装后端依赖..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "正在创建环境配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 backend/.env 文件配置数据库和API密钥"
    echo
fi

# 启动后端（后台运行）
gnome-terminal --title="SmartDigest Backend" -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -title "SmartDigest Backend" -e "npm run dev; bash" 2>/dev/null || \
osascript -e 'tell application "Terminal" to do script "cd \"'$SCRIPT_DIR'/backend\" && npm run dev"' 2>/dev/null || \
(npm run dev &)

echo "✅ 后端服务启动中... (端口: 3000)"
echo

# 启动前端服务
echo "正在启动前端服务..."
cd "$SCRIPT_DIR/frontend/final-project"

if [ ! -d "node_modules" ]; then
    echo "首次运行，正在安装前端依赖..."
    npm install
fi

# 启动前端（后台运行）
gnome-terminal --title="SmartDigest Frontend" -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -title "SmartDigest Frontend" -e "npm run dev; bash" 2>/dev/null || \
osascript -e 'tell application "Terminal" to do script "cd \"'$SCRIPT_DIR'/frontend/final-project\" && npm run dev"' 2>/dev/null || \
(npm run dev &)

echo "✅ 前端服务启动中... (端口: 5173)"
echo

# 等待服务启动
sleep 3

echo "========================================"
echo "🚀 SmartDigest 开发环境启动完成！"
echo "========================================"
echo
echo "📝 访问地址："
echo "   前端：http://localhost:5173"
echo "   后端：http://localhost:3000"
echo "   健康检查：http://localhost:3000/health"
echo
echo "📋 下一步操作："
echo "1. 确保MySQL服务正在运行"
echo "2. 配置 backend/.env 文件中的数据库和API密钥"
echo "3. 访问前端地址开始使用"
echo
echo "🔧 可选配置："
echo "   n8n工作流：请参考 N8N_SETUP.md 文件"
echo
echo "按Ctrl+C退出监控..."

# 保持脚本运行状态
while true; do
    sleep 60
done
