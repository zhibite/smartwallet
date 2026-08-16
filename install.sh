#!/bin/bash
#
# smartwallet 一键部署脚本 (Ubuntu 22.04 / Debian 12)
# 使用: curl -fsSL https://raw.githubusercontent.com/zhibite/smartwallet/main/install.sh | sudo bash
#

set -e

# 检查 root
if [ "$EUID" -ne 0 ]; then
  echo "请用 sudo 运行: sudo bash install.sh"
  exit 1
fi

echo "============================================"
echo "  smartwallet 一键部署"
echo "============================================"

# === 1. 系统更新 ===
echo "[1/6] 系统更新..."
apt update && apt upgrade -y
apt install -y curl git ufw ca-certificates gnupg

# === 2. 防火墙 ===
echo "[2/6] 防火墙配置..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# === 3. Docker ===
echo "[3/6] 安装 Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  echo "Docker 安装完成"
else
  echo "Docker 已安装，跳过"
fi

# === 4. Caddy ===
echo "[4/6] 安装 Caddy (自动 HTTPS)..."
if ! command -v caddy &> /dev/null; then
  apt install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/gpg.key" | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt" | tee /etc/apt/sources.list.d/caddy-stable.list
  apt update
  apt install -y caddy
fi

# === 5. 拉代码 ===
echo "[5/6] 拉代码..."
mkdir -p /opt
if [ ! -d /opt/smartwallet ]; then
  git clone https://github.com/zhibite/smartwallet.git /opt/smartwallet
else
  cd /opt/smartwallet && git pull
fi
cd /opt/smartwallet

# 准备 .env
if [ ! -f .env ]; then
  cp .env.example .env
  # 生成 session secret
  SECRET=$(openssl rand -hex 32)
  sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=$SECRET|" .env
  echo ""
  echo "============================================"
  echo "  ⚠️  请编辑 /opt/smartwallet/.env"
  echo "  必填: HELIUS_API_KEY"
  echo "  默认: POSTGRES_PASSWORD (建议改成强密码)"
  echo "============================================"
  echo ""
fi

# === 6. 启动服务 ===
echo "[6/6] 启动服务..."
docker compose up -d --build

# 等待 postgres 启动
echo "等待 postgres 健康..."
sleep 15

# 初始化数据库
echo "初始化数据库..."
docker exec -it smartwallet-web sh -c "
  npx prisma db push --schema=src/prisma/schema.prisma --skip-generate && \
  npx tsx scripts/enable-timescale.ts && \
  npx tsx src/prisma/seed.ts
" 2>&1 | grep -v "^$" || true

# 设置 update.sh 权限
chmod +x /opt/smartwallet/update.sh

# 复制 Caddyfile（如果 /etc/caddy/Caddyfile 不存在）
if [ ! -f /etc/caddy/Caddyfile ]; then
  cp /opt/smartwallet/Caddyfile /etc/caddy/Caddyfile
  systemctl reload caddy
fi

echo ""
echo "============================================"
echo "  ✓ 部署完成"
echo ""
echo "  下一步:"
echo "  1. 编辑 /opt/smartwallet/.env 填 HELIUS_API_KEY"
echo "  2. 若 Caddyfile 已存在, 编辑: nano /etc/caddy/Caddyfile"
echo "  3. 重启 Caddy:  systemctl reload caddy"
echo "  4. 访问:        http://yourdomain.com"
echo ""
echo "  更新代码:"
echo "    cd /opt/smartwallet && ./update.sh"
echo "============================================"
