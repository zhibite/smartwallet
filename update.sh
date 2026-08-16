#!/bin/bash
#
# smartwallet 手动更新脚本
# 用法: ./update.sh
#

set -e

cd "$(dirname "$0")"

echo "[1/3] 拉取最新代码..."
git pull origin main

echo "[2/3] 重建并重启..."
docker compose up -d --build

echo "[3/3] 清理无用镜像..."
docker image prune -f

echo ""
echo "✓ 更新完成 - $(date)"
echo ""
docker compose ps
