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

## 2. 生产部署（Coolify 自托管）

> 跟 1.bquant 多项目共存，单端口 mapping + Traefik 反代。
> 这个 compose 文件 4 个服务都在同一个 project 里，**不需要 Coolify 单独管它们**。

### 2.1 服务器最低配置

| 资源 | 最低 | 推荐 |
| - | - | - |
| CPU | 2 核 | 4 核 |
| 内存 | 4 GB | 8 GB |
| 磁盘 | 40 GB SSD | 80 GB SSD |
| OS | Ubuntu 22.04 / Debian 12 | 同左 |

### 2.2 部署步骤

```bash
# 服务器上
cd /opt
git clone https://github.com/zhibite/smartwallet.git
cd smartwallet
cp .env.example .env
# 编辑 .env 填 SESSION_SECRET 和 HELIUS_API_KEY
nano .env
```

### 2.3 启动

```bash
docker compose up -d --build
```

docker compose 会按依赖顺序启动：
1. `postgres`（TimescaleDB 镜像）
2. `redis`
3. `web`（绑定宿主端口 3001）
4. `worker`（后台 BullMQ 进程，**不暴露端口**）

### 2.4 首次初始化

```bash
# 1. 推送 schema
docker exec -it smartwallet-web npx prisma db push --schema=src/prisma/schema.prisma --skip-generate

# 2. 启用 hypertable
docker exec -it smartwallet-web npx tsx scripts/enable-timescale.ts

# 3. 初始化种子账号
docker exec -it smartwallet-web npx tsx src/prisma/seed.ts
```

或者一次性跑：

```bash
docker exec -it smartwallet-web sh -c \
  "npx prisma db push --schema=src/prisma/schema.prisma --skip-generate && \
   npx tsx scripts/enable-timescale.ts && \
   npx tsx src/prisma/seed.ts"
```

### 2.5 反向代理 + 域名

你服务器上 Coolify 跑 Traefik，docker-compose 这边只负责监听端口，Traefik 单独配置域名。或者更简单：

```bash
# 通过 Traefik labels（如果你想用 docker-compose 直接配域名）
# 在 web 服务里加：
#   labels:
#     - "traefik.enable=true"
#     - "traefik.http.routers.smartwallet-web.rule=Host(\`smartwallet.yourdomain.com\`)"
#     - "traefik.http.routers.smartwallet-web.tls.certresolver=letsencrypt"
#     - "traefik.http.services.smartwallet-web.loadbalancer.server.port=3001"
```

如果走 Cloudflare 代理，记得把 Cloudflare 隧道或代理关掉（橙色云关掉）再走 Traefik，否则 Next.js 拿到的是 CDN IP。

### 2.6 数据库备份

```bash
# 每天 03:00 备份
0 3 * * * docker exec smartwallet-postgres pg_dump -U smart smartwallet | gzip > /etc/backups/smart-$(date +\%F).sql.gz

# 保留 30 天
find /etc/backups -mtime +30 -delete
```

### 2.7 升级流程

```bash
cd /opt/smartwallet
git pull origin main
docker compose up -d --build web worker
```

`postgres` / `redis` 容器数据不动，只重建 web/worker 镜像。

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
