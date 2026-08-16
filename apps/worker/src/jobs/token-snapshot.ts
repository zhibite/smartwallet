import type { Job } from "bullmq";
import { prisma } from "@/lib/db";

/**
 * 5min 价格/市值/流动性快照（演示版：把 trades.usdAmount 滚动聚合代替真实价格）
 *
 * 使用 upsert 而非 create，因为复合主键 (tokenMint, ts) 会在重复 tick 时
 * 触发 unique violation；upsert 保证幂等，反复重跑 cron 不会爆错。
 */
export async function tokenSnapshotHandler(job: Job) {
  const tokens = await prisma.token.findMany({ take: 500 });
  const now = new Date();

  for (const t of tokens) {
    await prisma.pricePoint.upsert({
      where: { tokenMint_ts: { tokenMint: t.mint, ts: now } },
      create: {
        tokenMint: t.mint,
        ts: now,
        priceUsd: t.priceUsd ?? 0,
        mcapUsd: t.mcapUsd ?? null,
        liquidityUsd: t.liquidityUsd ?? null,
        holdersCount: t.holdersCount ?? null,
      },
      update: {
        priceUsd: t.priceUsd ?? 0,
        mcapUsd: t.mcapUsd ?? null,
        liquidityUsd: t.liquidityUsd ?? null,
        holdersCount: t.holdersCount ?? null,
      },
    });
  }
  return { snapshots: tokens.length };
}
