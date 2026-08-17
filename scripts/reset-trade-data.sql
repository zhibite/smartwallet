-- 清空错误的旧数据，重新触发解析
TRUNCATE "Trade" RESTART IDENTITY CASCADE;
TRUNCATE "Holding" RESTART IDENTITY CASCADE;
-- 关键：把 schema.prisma 改成 Decimal(38, 12) 后，需要 prisma db push
-- ALTER TABLE 不会丢数据，但 truncate 是为了清掉 toFixed(0) 产生的脏数据
-- 然后 worker 重启后会重新解析所有 sig
-- Token 表保留（只是元数据），但清掉 price snapshot 因为与之相关
UPDATE "Wallet" SET "lastSyncedSlot" = NULL;
UPDATE "Wallet" SET "lastSyncedAt" = NULL;
UPDATE "Wallet" SET "syncCursor" = NULL;
DELETE FROM "SyncStatus";