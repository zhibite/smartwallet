# 部署文档

## 1. 本地开发

### 1.1 前置依赖
- Node.js 20+
- Docker + Docker Compose（用来拉 Postgres / Redis）
- 可选：Helius API Key（[helius.dev](https://helius.dev) 申请）

### 1.2 一键启动
```bash
cp .env.example .env
# 编辑 .env 填入 SESSION_SECRET 和 HELIUS_API_KEY

docker compose up -d postgres redis
npm install
npm run db:generate
npm run db:push
npm run db:hypertable   # 启用 TimescaleDB hypertable（首次）
npm run db:seed         # 创建默认 admin 账号

# 终端 1
npm run dev

# 终端 2
npm run worker:dev
```

默认账号：
- `admin / admin123456`（角色 ADMIN）
- `viewer / viewer123456`（角色 VIEWER）

> 生产环境务必修改默认密码。

---

## 2. 生产部署（Coolify 推荐）

> 自托管自的 50 个聪明钱监控场景，**单台 2C4G 服务器 + Coolify** 是最稳路径。
> 全栈都用 compose 编排，PG/Redis 数据完全本地化，TimescaleDB 也能装。

### 2.1 服务器最低配置

| 资源 | 最低 | 推荐 |
| - | - | - |
| CPU | 2 核 | 4 核 |
| 内存 | 4 GB | 8 GB |
| 磁盘 | 40 GB SSD | 80 GB SSD |
| OS | Ubuntu 22.04 / Debian 12 | 同左 |

### 2.2 在 Coolify 里拉这个仓库

1. **Coolify 控制台** → **+ New** → **Application** → **Private Repository**（或者 GitHub App）
2. Build Pack 选 **Docker Compose**
3. Base Directory 留空（仓库根目录有 `docker-compose.yml`）
4. Branch 选 `main`
5. 保存后会开始首次构建

### 2.3 配置环境变量

在 Coolify 的 **Environment Variables** 面板里填：

```env
# 必填
SESSION_SECRET=<32+ 字符随机串，用 openssl rand -hex 32>
HELIUS_API_KEY=<从 helius.dev 申请>

# 可选但推荐
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# 数据库（默认即可，compose 自动连）
POSTGRES_USER=smart
POSTGRES_PASSWORD=<改成强密码>
POSTGRES_DB=smartwallet
```

> ⚠️ Coolify 的 web/worker 容器需要让它们能解析到 `postgres` 和 `redis` 这两个 hostname。
> 下载仓库后用 **Docker Compose** 部署时，service name 就是 hostname，可以直接连。

### 2.4 启动顺序

Coolify 默认会按 `depends_on` + healthcheck 拉起：

1. `postgres`（TimescaleDB 镜像，首次启动会自动 `/docker-entrypoint-initdb.d`）
2. `redis`
3. `web`（依赖前两者 healthcheck 通过）
4. `worker`（依赖 web 也健康）

### 2.5 首次初始化

部署完成后，进 Coolify 控制台 → `web` 容器 → **Exec**：

```bash
# 1. 推送 schema
npx prisma db push --schema=src/prisma/schema.prisma --skip-generate

# 2. 启用 hypertable（一次性操作）
npx tsx scripts/enable-timescale.ts

# 3. 初始化种子账号
npx tsx src/prisma/seed.ts
```

如果你嫌手动 init 麻烦，可以在我下次发版里加 `init` 服务一次性跑这些。

### 2.6 反向代理 / 域名

Coolify 自动给 `web` 容器创建 Traefik 反代，你只需要：

1. 在 Coolify 的 **Domains** 配置里给 `web` 绑定 `smartwallet.yourdomain.com`
2. 自动签 Let's Encrypt SSL
3. 不要把 `worker` 暴露到公网

如果走 Cloudflare DNS，记得把 Cloudflare 代理关掉（橙色云关掉），否则 Next.js webhook 真实 IP 会被代理。

### 2.7 数据库备份

在 Coolify 的 **Cron Jobs** 里加：

```bash
# 每天 03:00 备份
docker exec smartwallet-postgres pg_dump -U smart smartwallet | gzip > /etc/backups/smart-$(date +\%F).sql.gz

# 保留 30 天
find /etc/backups -mtime +30 -delete
```

更推荐用 Coolify 的 **Backup** 面板直接扫描 `smartwallet-pgdata` 卷。

### 2.8 升级流程

```bash
git pull origin main
# Coolify 控制台 → 你的 app → "Deploy"
```

Coolify 会自动 rebuild `web` + `worker` 两个镜像、保持 postgres/redis 数据不动。

---

## 3. 监控 + 运维

| 路径 | 用途 |
| - | - |
| `/settings/sync` | 看每个 wallet 同步状态、队列堆积 |
| `/settings/users` | 增删管理员、改自己密码 |
| `/smart-money` | 看 50 个钱包的实时 PnL |
| `/signals` | 看共识信号 + 推送历史 |

日志查看：
```bash
docker logs -f smartwallet-web
docker logs -f smartwallet-worker
```

## 4. 故障排查

| 现象 | 检查 |
| - | - |
| web 起不来 | `docker logs smartwallet-web` 看 DATABASE_URL 是否被覆盖 |
| worker 一直 restart | 进 `worker` 容器 `curl http://localhost:3001/health` 看 health 状态 |
| 链上数据没同步 | 进 `/settings/sync`，看每个 wallet `lastSyncedAt` 是否在更新 |
| 推 Telegram 失败 | 看 `worker` 日志 `[worker] telegram push failed:` |
