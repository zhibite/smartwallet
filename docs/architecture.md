# SmartWallet 技术架构文档

> 与 [features.md](./features.md) 配套。描述 SmartWallet 聪明钱辅助工具的技术选型、架构图、数据模型、API 设计、部署方案。

---

## 1. 架构总览

```mermaid
graph LR
  Browser[Browser] -->|HTTP/SSE| Web[Next.js Web]
  Web -->|Prisma| PG[(PostgreSQL + TimescaleDB)]
  Web -->|BullMQ queue ops| Redis[(Redis 7)]
  Redis -->|job consume| Worker[apps/worker]
  Worker -->|Prisma| PG
  Worker -->|HTTP| Helius[Helius RPC + DAS API]
  Worker -->|HTTP| Birdeye[Birdeye / DexScreener]
  Worker -->|outbound| Telegram[Telegram Bot]
  Worker -->|outbound| Webhook[跟单系统 Webhook]
```

要点：
- **全栈单体**：Web 与 Worker 在同一仓库共享 Prisma schema，独立部署为两个 Docker 容器
- **Web** 处理管理后台 UI（TailAdmin）+ REST API（Next.js Route Handlers）
- **Worker** 处理链上同步 / 解析 / 共识检测 / PnL 重算 / 告警推送，长时间 cron 不再拖累 web 响应
- **Helius** 作为 RPC 唯一主源；DexScreener / Birdeye 做价格交叉校验

---

## 2. 仓库结构（monorepo-lite）

```
smartwallet/
├── src/                     // Next.js (web + UI)
│   ├── app/
│   │   ├── (admin)/         // 受角色保护的管理后台路由组
│   │   │   ├── page.tsx                       // 总览看板
│   │   │   ├── smart-money/                   // 3.1 聪明钱管理
│   │   │   │   ├── page.tsx
│   │   │   │   └── [wallet]/page.tsx
│   │   │   ├── tokens/                        // 3.3 / 3.9.3 Token
│   │   │   │   ├── page.tsx
│   │   │   │   └── [mint]/page.tsx
│   │   │   ├── signals/                       // 3.5 / 3.6 信号
│   │   │   ├── queries/                       // 3.7 筛选取数
│   │   │   ├── follow-output/                 // 3.8 跟单输出
│   │   │   ├── reports/                       // 3.10 报告
│   │   │   └── settings/                      // 3.12 系统管理 (admin)
│   │   ├── api/             // Route Handlers
│   │   │   ├── auth/
│   │   │   ├── wallets/...
│   │   │   ├── tokens/...
│   │   │   ├── signals/...
│   │   │   ├── system/...
│   │   │   ├── alerts/...
│   │   │   └── reports/...
│   │   └── signin/page.tsx  // 登录
│   ├── components/
│   │   ├── smart-money/    tokens/    signals/    charts/
│   ├── lib/
│   │   ├── db.ts           // Prisma client 单例
│   │   ├── auth.ts         // session/role helper
│   │   ├── solana/         // Helius client + DEX 解析
│   │   ├── pnl/            // FIFO / 加权平均
│   │   ├── scoring/        // 评分 + 自动标签
│   │   └── signals/        // 共识检测共享算法
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
├── apps/worker/             // 独立进程入口
│   ├── src/
│   │   ├── index.ts         // 启动 workers + scheduler
│   │   ├── scheduler.ts     // node-cron 注册
│   │   ├── queue.ts         // BullMQ queues / connections
│   │   └── jobs/
│   │       ├── tx-sync.ts
│   │       ├── tx-parse.ts
│   │       ├── token-snapshot.ts
│   │       ├── token-meta.ts
│   │       ├── signal-detect.ts
│   │       ├── pnl-recompute.ts
│   │       ├── tag-engine.ts
│   │       ├── alert-dispatch.ts
│   │       └── report-generate.ts
├── docker-compose.yml
├── .env.example
└── docs/
    ├── features.md
    ├── architecture.md      // 本文件
    └── deploy.md
```

---

## 3. 技术选型

| 类别 | 选型 | 备注 |
|---|---|---|
| Web 框架 | Next.js 16.1.6 (App Router) | 保留模板版本 |
| 语言 | TypeScript 5.x | strict 模式 |
| ORM | Prisma | 自建 `users` 表方案 |
| 数据库 | PostgreSQL 16 + **TimescaleDB** | 时序（价格/信号/交易）走 hypertable |
| 队列 | Redis 7 + BullMQ | 50 钱包起步够用 |
| 链上数据 | Helius Enhanced Transactions + DAS | 主源；Solana 公共 RPC 兜底 |
| 价格数据 | DexScreener / Birdeye / Jupiter | 多源交叉校验 |
| UI | TailAdmin 原生组件 | 不引 shadcn |
| 图表 | ECharts (`echarts-for-react`) | K 线 + 共识热力图 |
| 认证 | 自建 `users` 表（bcrypt + cookie session） | Account 路由在 web |
| 角色 | `admin` / `viewer` | Sidebar 后台菜单按 role 过滤 |
| 部署 | Docker Compose 单机 | web/worker/postgres/redis |

---

## 4. 数据模型

只列关键字段，详细 schema 见 [`src/prisma/schema.prisma`](../src/prisma/schema.prisma)。

```mermaid
erDiagram
  User ||--o{ AlertConfig : owns
  User ||--o{ AuditLog : performs
  Wallet ||--o{ Trade : has
  Wallet ||--o{ Holding : has
  Wallet ||--|| SyncStatus : tracks
  Token ||--o{ Trade : involves
  Token ||--o{ Holding : held
  Token ||--o{ PricePoint : snapshots
  Token ||--o{ Signal : triggers
  Signal }o--o{ Wallet : participates
```

### 4.1 核心表

| 模型 | 说明 |
|---|---|
| `User` | 登录账号，`role: ADMIN/VIEWER` |
| `Wallet` | Solana pubkey 作主键，手工标签、启用/禁用、备注 |
| `Trade` | 每笔链上成交；`tx_sig` 唯一；`(wallet_addr, block_time)` 与 `(token_mint, block_time)` 双索引 |
| `Token` | SPL 代币元数据 + 实时价 + 风险字段 |
| `Holding` | 钱包在某个 Token 上的当前持仓 + 成本基础（Upsert by `(wallet, token)`） |
| `PricePoint` | TimescaleDB hypertable，5min 一次的价格/市值/流动性/聪明钱持仓数 |
| `Signal` | 共识信号记录，含 `wallet_addrs[]`、`strength`、`window_start/end` |
| `AlertConfig` | 用户通知渠道（Telegram chat_id / Webhook URL） |
| `SyncStatus` | 每个钱包的同步游标，异常状态记录 |
| `AuditLog` | 操作审计（who/when/what） |
| `SavedQuery` | 3.7 的「筛选工作流」 |

### 4.2 时序策略

- `price_points`、`audit_log`（按时）走 TimescaleDB hypertable
- 7 天一个 chunk，1 天后压缩
- 超 1 年的连续数据用 1h / 1d 降采样视图

---

## 5. 后台路由 & Sidebar

替换 `src/layout/AppSidebar.tsx` 的 `navItems` / `othersItems`：

```
Menu
  Overview                 /
  Smart Money              /smart-money
    List                   /smart-money
    Detail                 /smart-money/[wallet]
  Tokens                   /tokens
    List                   /tokens
    Detail                 /tokens/[mint]
  Signals                  /signals
  Transactions             /transactions
  Reports                  /reports

Others
  Query Builder            /queries           (3.7)
  Follow Output            /follow-output     (3.8)
  Settings                 /settings          (3.12 admin only)
  Profile                  /profile
  Sign Out                 /signin
```

实现要点：
- `AppSidebar.tsx` 通过 `useAuth()` 拿 `role`，过滤非 admin 菜单
- `/settings` 包一层 server component 的 role guard

---

## 6. 页面 ↔ features 映射

| features | 路径 | 主要组件 / 端点 |
|---|---|---|
| 3.1 | `/smart-money` | `SmartMoneyList` + `ImportWalletDialog` + `TagManager` |
| 3.2 | (无独立页面，worker 后台) | `SyncStatusPanel` 在 `/settings` |
| 3.3 + 3.9.3 | `/tokens`, `/tokens/[mint]` | `TokenHeader`、`KlineChart`(ECharts)、`SmartHolderList` |
| 3.4 + 3.9.2 | `/smart-money/[wallet]` | `PnlCurve`、`HoldingPie`、`TradeTimeline`、`TradeTable` |
| 3.5 + 3.6 | `/signals` | `SignalStream` + `SignalTypeFilter` + `SignalDetail` |
| 3.7 | `/queries` | `QueryBuilder` + 保存/加载 |
| 3.8 | `/follow-output` | `WatchlistTable` + 导出 CSV/JSON |
| 3.9.1 | `/` | `OverviewMetrics` + `HotTokensTop10` + `TopPnlWallets` |
| 3.10 | `/reports` | 列表 + 生成按钮（worker job） |
| 3.12 | `/settings` | sync 状态 / 配额 / 任务配置 / 用户管理 (admin) |
| 登录 | `/signin` | 复用 `SignInForm`，接入 `POST /api/auth/signin` |

---

## 7. REST API

集中放在 `src/app/api/`，全部走 Prisma：

```
POST   /api/auth/signin
POST   /api/auth/signout
GET    /api/auth/me

GET    /api/wallets                 // 列表 + 筛选
POST   /api/wallets/import          // 批量导入
PATCH  /api/wallets/[addr]          // 编辑 label/tags/enabled (admin)
DELETE /api/wallets/[addr]          // (admin)
POST   /api/wallets/[addr]/tags     // 加减手工标签
POST   /api/wallets/[addr]/tags/refresh   // 重跑自动标签 (admin)

GET    /api/tokens
GET    /api/tokens/[mint]
GET    /api/tokens/[mint]/holders   // 聪明钱持仓列表
GET    /api/tokens/[mint]/klines?interval=5m|1h|1d&from=&to=

GET    /api/wallets/[addr]/pnl?from=&to=
GET    /api/wallets/[addr]/holdings
GET    /api/wallets/[addr]/trades?cursor=&limit=

GET    /api/signals?type=&from=&to=
GET    /api/signals/[id]

GET    /api/system/sync-status      // (admin)
GET    /api/system/quota            // (admin)
POST   /api/system/jobs/recompute   // (admin)

GET    /api/alerts                  // 当前用户渠道
POST   /api/alerts                  // 新增/更新
DELETE /api/alerts/[id]

POST   /api/reports/generate        // 异步 (admin)

GET    /api/queries                 // 当前用户保存的查询
POST   /api/queries
DELETE /api/queries/[id]
```

权限：所有 admin 路由走 server-side `requireAdmin()` helper；middleware 同步检查 session。

---

## 8. Worker 与任务

`apps/worker/src/index.ts` 启动 BullMQ Workers + node-cron scheduler：

| Job 名 | 触发 | 说明 |
|---|---|---|
| `tx-sync` | cron 每 30s | 按 `SyncStatus.last_synced_signature` 拉新签名 → 写 `trades` raw |
| `tx-parse` | bull queue（由 `tx-sync` emit） | DEX 事件解析 → 清洗 → 写入最终 `Trade` |
| `token-snapshot` | cron 每 5min | 价格/市值/流动性/聪明钱持仓数快照 |
| `token-meta` | 首次见 mint | 拉元数据 + 风险（Helius + Birdeye + GoPlus） |
| `signal-detect` | bull queue（`tx-parse` 完成） | 滑动窗口共识检测 → 写 `signals` |
| `pnl-recompute` | cron 每日 04:00 UTC | 全量重算 PnL（按 FIFO） |
| `tag-engine` | cron 每日 05:00 UTC | 重跑自动标签 |
| `alert-dispatch` | bull queue（`signal-detect` emit） | 推 Telegram / Webhook |
| `report-generate` | cron 周一/月初 06:00 UTC | 生成 HTML/PDF 周月报 |

Job 间依赖通过 `txSyncQueue.on('completed', () => txParseQueue.add(...))` 串接。

---

## 9. 关键业务算法

### 9.1 FIFO PnL（[`src/lib/pnl/fifo.ts`](../src/lib/pnl/fifo.ts)）

- **买入**：按加权建仓，更新 `cost_basis_usd` 平均
- **卖出**：FIFO 出库（最早买入批次优先），差额记为 realized PnL
- **未实现**：(当前价 - 均价) × 持仓量

### 9.2 共识检测（[`apps/worker/src/jobs/signal-detect.ts`](../apps/worker/src/jobs/signal-detect.ts)）

- 滑动窗口 T（默认 1h）
- 同 `token_mint`、`direction=BUY` 的 wallet 数 ≥ K（默认 3）
- 同窗口 BUY 总金额 ≥ M（默认 50k USD）
- `strength = K * M / T`

### 9.3 自动标签规则（[`src/lib/scoring/autoTags.ts`](../src/lib/scoring/autoTags.ts)）

与 [features.md 3.1.2](./features.md#311-标签体系) 对应：

- **短线王**：平均持仓 < 6h 且胜率 > 60%
- **土狗专捡**：买入 Token 中上线 < 24h 的占比 > 70%
- **蓝筹持有者**：平均买入金额 > 100k USD 且持仓数 < 5
- **早期投资者**：买入时间在 Token 首发 24h 内的占比 > 50%
- **KOL / 砸盘型**：行为画像 + 平台偏好综合判定

规则在前端 `/settings/tags` 可视化编辑，存 `AlertConfig` 同结构的 `tag_rules` 表。

---

## 10. 部署与运维

### 10.1 服务清单（`docker-compose.yml`）

| 服务 | 镜像/构建 | 端口 | 说明 |
|---|---|---|---|
| `web` | `Dockerfile` (next build) | 3001 | Next.js standalone |
| `worker` | 同 `Dockerfile`, `cmd: node apps/worker` | - | 后台进程 |
| `postgres` | `timescale/timescaledb:latest-pg16` | 5432 | 时序扩展 |
| `redis` | `redis:7-alpine` | 6379 | 队列 |

### 10.2 环境变量（[`.env.example`](../.env.example)）

```
DATABASE_URL=postgresql://smart:smart@postgres:5432/smartwallet
REDIS_URL=redis://redis:6379
HELIUS_API_KEY=
HELIUS_RPC_URL=https://mainnet.helius-rpc.com
HELUS_DAS_URL=https://mainnet.helius-rpc.com
BIRDEYE_API_KEY=
SESSION_SECRET=change-me-32-bytes
TELEGRAM_BOT_TOKEN=
```

### 10.3 备份

`pg_dump` 每日凌晨执行，保留 30 天。备份脚本见 [`deploy.md`](./deploy.md)。

---

## 11. 实施路径（首版交付物）

按工作块（每块可独立验证）：

1. **脚手架**：清模板示例 UI、建 Prisma 项目、装 worker 进程，跑通 `docker compose up` 显示空 Overview
2. **聪明钱 CRUD + 角色登录**：`/smart-money` 全功能 + 自建登录
3. **Helius worker**：tx-sync + tx-parse 跑通，看到 `Trade` 落库
4. **Token 详情 + K 线**：`/tokens/[mint]` 含 ECharts K 线
5. **PnL + 详情**：`/smart-money/[wallet]` 完整收益视图
6. **共识 + 信号中心 + 告警推送**：`/signals` + Telegram 推送
7. **筛选器 / 跟单输出 / 报表 / 系统管理**：features.md 3.7-3.12 收尾

---

## 12. 不在本轮范围

- 跟单执行系统对接的具体握手（features.md 6 节另外讨论）
- HTML 周报 PDF 渲染细节（先 MVP HTML，PDF 后续引入 puppeteer / @react-pdf）
- 移动端布局（按 TailAdmin 默认响应式，先桌面端为主）

---

## 附录 A：变更记录

| 日期 | 版本 | 说明 |
|---|---|---|
| 2026-08-16 | 0.1 | 初稿，与 features.md 对齐 |
