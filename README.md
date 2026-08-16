# SmartWallet

> 监控 50 个 Solana 链上聪明钱地址，并基于此生成可投资信号的 SaaS 平台。

## 特性

- **监控 50 个聪明钱**：可手动或自动导入
- **链上解析**：Helius Enhanced Transaction → DEX / 钱包 / token 转账
- **智能持仓**：FIFO 算法计算未实现/已实现盈亏
- **共识信号**：1h 滑窗内多钱包买入同一 token → 推送 Telegram / Webhook
- **风险评估**：honeypot / 抛售风险 / 流动性 / 持仓分布
- **可定制告警**：按 strength / 类型 / 时间窗灵活过滤
- **查询构建器**：保存 wallet / token 维度过滤条件
- **数据导出**：watchlist CSV / JSON / Webhook 推送
- **周月报**：自动生成与存档

## 技术栈

| 层 | 技术 |
| - | - |
| 前端 | Next.js 16 (App Router) + TailAdmin |
| 数据库 | PostgreSQL + TimescaleDB hypertable |
| 队列 | Redis + BullMQ |
| ORM | Prisma 6 |
| 链上 | Helius SDK |
| 认证 | JWT cookie + bcryptjs |
| Worker | Node.js + tsx（独立进程） |
| 部署 | Docker Compose |

## 项目结构

```
.
├── apps/worker/                  # 独立 worker 进程
│   └── src/
│       ├── index.ts              # 入口
│       ├── queue.ts              # BullMQ queues
│       ├── scheduler.ts          # cron 定时
│       ├── workers.ts            # 注册 9 个 worker
│       └── jobs/                 # tx-sync / tx-parse / signal-detect ...
├── src/
│   ├── app/
│   │   ├── (admin)/              # 需登录的 admin 路由组
│   │   │   ├── smart-money/
│   │   │   ├── tokens/
│   │   │   ├── signals/
│   │   │   ├── transactions/
│   │   │   ├── reports/
│   │   │   ├── queries/
│   │   │   ├── follow-output/
│   │   │   └── settings/
│   │   ├── (full-width-pages)/   # 登录页
│   │   └── api/                  # 后端 API
│   ├── components/               # UI 业务组件
│   ├── layout/                   # AdminShell / Sidebar / Header
│   ├── context/                  # Auth / Theme / Sidebar context
│   └── lib/                      # 认证 / DB / Helius / 信号 / PnL / 标签
├── scripts/enable-timescale.ts   # 启用 hypertable / 压缩策略
├── docker-compose.yml            # postgres/redis/web/worker 一键起
├── Dockerfile.web / Dockerfile.worker
├── docs/
│   ├── architecture.md           # 架构设计
│   ├── deploy.md                 # 部署文档
│   └── features.md               # 功能清单（产品视角）
└── .env.example
```

## 快速启动

```bash
# 1. 拉起数据库与 Redis
docker compose up -d postgres redis

# 2. 配置环境变量
cp .env.example .env
# 修改 SESSION_SECRET 与 HELIUS_API_KEY

# 3. 安装依赖 + 初始化数据
npm install
npm run db:generate
npm run db:push
npm run db:seed

# 4. 启动 web（端口 3000）
npm run dev

# 5. 启动 worker（另一终端）
npm run worker:dev
```

默认账号：

| 用户名 | 密码 | 角色 |
| - | - | - |
| admin | admin123456 | ADMIN |
| viewer | viewer123456 | VIEWER |

> ⚠️ 生产部署前务必修改默认密码

## 部署

详见 [docs/deploy.md](./docs/deploy.md)。生产环境使用 `docker compose up -d --build`。

## 架构图

详见 [docs/architecture.md](./docs/architecture.md)。

## License

Private / Internal