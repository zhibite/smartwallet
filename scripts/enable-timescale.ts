import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[hypertable] creating PricePoint hypertable...");
  await prisma.$executeRawUnsafe(`
    SELECT create_hypertable(
      '"PricePoint"',
      'ts',
      if_not_exists => TRUE,
      chunk_time_interval => INTERVAL '7 days'
    );
  `);

  console.log("[hypertable] creating AuditLog hypertable...");
  await prisma.$executeRawUnsafe(`
    SELECT create_hypertable(
      '"AuditLog"',
      'created_at',
      if_not_exists => TRUE,
      chunk_time_interval => INTERVAL '7 days'
    );
  `);

  console.log("[hypertable] enabling compression (7 days)...");
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PricePoint" SET (
      timescaledb.compress,
      timescaledb.compress_segmentby = 'token_mint'
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
