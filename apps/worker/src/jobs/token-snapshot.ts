import type { Job } from "bullmq";
import { prisma } from "@/lib/db";

/**
 * 5min 价格/市值/流动性快照（演示版：把 trades.usdAmount 滚动聚合代替真实价格）
 */
export async function tokenSnapshotHandler(job: Job) {
  const tokens = await prisma.token.findMany({ take: 500 });
  const now = new Date();

  for (const t of tokens) {
    await prisma.pricePoint.create({
      data: {
        tokenMint: t.mint,
        ts: now,
        priceUsd: t.priceUsd ?? 0,
        mcapUsd: t.mcapUsd ?? null,
        liquidityUsd: t.liquidityUsd ?? null,
        holdersCount: t.holdersCount ?? null,
      },
    });
  }
  return { snapshots: tokens.length };
}
