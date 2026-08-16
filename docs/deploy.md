# 部署文档

## 1. 本地开发

### 1.1 前置依赖

| 工具 | 版本 |
| - | - |
| Node.js | 20+ |
| PostgreSQL / TimescaleDB | 16+ |
| Redis | 7+ |
| Helius API Key | https://helius.dev |

### 1.2 启动

```bash
npm install
cp .env.example .env
# 编辑 .env 填 HELIUS_API_KEY
docker compose up -d postgres redis
npm run db:push
npm run db:seed
npm run dev
```

访问 http://localhost:3001

---

## 2. 生产部署（独立 Linux 服务器）

### 2.1 服务器最低配置

| 资源 | 最低 | 推荐 |
| - | - | - |
| CPU | 2 核 | 4 核 |
| 内存 | 4 GB | 8 GB |
| 磁盘 | 60 GB SSD | 80 GB SSD |
| OS | Ubuntu 22.04 / Debian 12 | 同左 |
| 公网 | 1 IP + 1 域名（DNS 已解析） | 同左 |

不要再装 Portainer / Uptime Kuma 等面板，**纯 Docker Compose + Caddy** 最稳。

### 2.2 一键安装

SSH 到服务器（root）：

```bash
curl -fsSL https://raw.githubusercontent.com/zhibite/smartwallet/main/install.sh | sudo bash
```

这个脚本会：
1. 更新系统 + 装 Docker
2. 装 Caddy（自动 HTTPS）
3. 拉代码到 `/opt/smartwallet`
4. 生成 `.env`（含 `SESSION_SECRET`）
5. 启动 4 个容器（web / worker / postgres / redis）
6. 初始化数据库 schema + hypertable

### 2.3 配环境变量

```bash
nano /opt/smartwallet/.env
```

**必填**：
```
HELIUS_API_KEY=your-helius-key
SESSION_SECRET=（脚本已生成，不用改）
```

**建议改**：
```
POSTGRES_PASSWORD=改成强密码（22 字符以上）
```

改完重启：

```bash
cd /opt/smartwallet && docker compose up -d
```

### 2.4 配 Caddy（自动 HTTPS）

```bash
# 复制项目里的 Caddyfile
cp /opt/smartwallet/Caddyfile /etc/caddy/Caddyfile

# 重启 Caddy
systemctl reload caddy

# 等 30 秒，Let's Encrypt 自动签证书
curl -I https://smartwallet.tokensee.com
```

如果 DNS 还没解析，会用 Caddy 自签证书过渡，**解析好后自动换成 Let's Encrypt**。

### 2.5 验证

```bash
# 看 4 个容器都健康
cd /opt/smartwallet && docker compose ps

# 看 web 日志
docker logs -f smartwallet-web

# 看 worker 日志
docker logs -f smartwallet-worker
```

### 2.6 故障排查

```bash
# 全栈状态
docker compose ps

# 任一服务日志
docker compose logs web
docker compose logs worker
docker compose logs postgres
docker compose logs redis

# 重启某服务
docker compose restart web

# 全部重启
docker compose restart
```

---

## 3. 更新代码

### 方式 A：自动（推荐）

配置 GitHub Actions，一次配置永久生效：

#### 3.1 服务器上生成 deploy key

```bash
sudo -i
ssh-keygen -t ed25519 -C "github-deploy" -f /root/.ssh/gh_deploy -N ""
cat /root/.ssh/gh_deploy.pub >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

# 复制私钥（下面要用）
cat /root/.ssh/gh_deploy
```

#### 3.2 GitHub 仓库配置

1. 进入 https://github.com/zhibite/smartwallet/settings/secrets/actions
2. 点 **New repository secret**
3. 创建 2 个 secret：
   - `SERVER_HOST` = 服务器 IP
   - `SERVER_SSH_KEY` = 上一步的私钥内容

#### 3.3 推送触发部署

```bash
git push origin main
```

GitHub Actions 自动 SSH 到服务器跑 `git pull && docker compose up -d --build`，30 秒内更新完毕。

#### 3.4 手动触发

GitHub 仓库 → Actions → Deploy to production → **Run workflow**。

### 方式 B：手动更新

```bash
ssh root@your-server-ip
cd /opt/smartwallet
./update.sh
```

### 方式 C：本地 rsync

```bash
rsync -avz --exclude 'node_modules' --exclude '.next' \
  ./ root@your-server-ip:/opt/smartwallet/
ssh root@your-server-ip 'cd /opt/smartwallet && docker compose up -d --build'
```

---

## 4. 数据库备份

```bash
# 一次性
docker exec smartwallet-postgres pg_dump -U smart smartwallet | gzip > smart-$(date +%F).sql.gz

# 自动化（每天 03:00 保留 30 天）
crontab -e
# 加这行：
0 3 * * * docker exec smartwallet-postgres pg_dump -U smart smartwallet | gzip > /backups/smart-$(date +\%F).sql.gz && find /backups -mtime +30 -delete
```

恢复：

```bash
gunzip -c smart-2026-08-16.sql.gz | docker exec -i smartwallet-postgres psql -U smart smartwallet
```

---

## 5. 监控（可选）

### 5.1 Uptime Kuma

```bash
docker run -d --restart=always \
  -p 3001:3001 \
  -v uptime-kuma:/app/data \
  --name uptime-kuma \
  louislam/uptime-kuma:1
```

⚠️ **端口冲突**：3001 被 web 占了，Uptime Kuma 改成 `3002:3001` 或其它端口。

访问 `http://server-ip:3002` 配置。

### 5.2 简单 HTTP 探针

```bash
# 服务器上
curl -fsSL https://raw.githubusercontent.com/zhibite/smartwallet/main/healthcheck.sh -o /usr/local/bin/healthcheck.sh
chmod +x /usr/local/bin/healthcheck.sh

# 配 cron 每 5 分钟跑
crontab -e
# 加：
*/5 * * * * /usr/local/bin/healthcheck.sh
```

---

## 6. 迁移旧环境

如果你之前在别的环境（VPS / 共享主机）部署过，想迁移到独立服务器：

```bash
# 1. 旧服务器导出数据库
docker exec old-postgres pg_dump -U smart smartwallet | gzip > smart-backup.sql.gz

# 2. 新服务器导入
docker exec -i smartwallet-postgres psql -U smart -c "CREATE DATABASE smartwallet;"
gunzip -c smart-backup.sql.gz | docker exec -i smartwallet-postgres psql -U smart smartwallet

# 3. 启用 hypertable（如果旧库是普通 Postgres）
docker exec -it smartwallet-web npx tsx scripts/enable-timescale.ts
```

---

## 7. 维护清单

| 周期 | 任务 |
| - | - |
| 每天 | 检查 `docker compose ps`（4 个容器都 healthy） |
| 每周 | 备份文件离线拷贝一份 |
| 每月 | `docker system prune -a` 清理无用镜像 |
| 季度 | `apt update && apt upgrade -y` 系统更新 |
| 季度 | 升级 Node.js 到最新 LTS |
