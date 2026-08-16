import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 重要：create_hypertable 必须在 PricePoint/AuditLog 已经有数据之前调用，
  // 否则需要先备份再迁移。TimescaleDB 2.x 也支持已存在数据的迁移，但这里
  // 我们部署时一定是空表，直接建。
  console.log("[hypertable] creating PricePoint hypertable (partition by ts)...");
  await prisma.$executeRawUnsafe(`
    SELECT create_hypertable(
      '"PricePoint"',
      'ts',
      if_not_exists => TRUE,
      chunk_time_interval => INTERVAL '7 days'
    );
  `);

  console.log("[hypertable] creating AuditLog hypertable (partition by \"createdAt\")...");
  // AuditLog 的 PK 本身是 (id, createdAt) 复合键，已经包含了 TimescaleDB 要求的
  // partitioning column（createdAt），可以直接 create_hypertable。
  await prisma.$executeRawUnsafe(`
    SELECT create_hypertable(
      '"AuditLog"',
      'createdAt',
      if_not_exists => TRUE,
      chunk_time_interval => INTERVAL '7 days'
    );
  `);

  console.log("[hypertable] enabling compression (7 days)...");
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PricePoint" SET (
      timescaledb.compress,
      timescaledb.compress_segmentby = '"tokenMint"'
    );
  `);
  await prisma.$executeRawUnsafe(`
    SELECT add_compression_policy('"PricePoint"', INTERVAL '7 days', if_not_exists => TRUE);
  `);
  await prisma.$executeRawUnsafe(`
    SELECT add_retention_policy('"PricePoint"', INTERVAL '1 year', if_not_exists => TRUE);
  `);

  console.log("[hypertable] done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
